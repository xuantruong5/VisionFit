<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Semantic knowledge search backed by persistent Gemini Embeddings (assistant_knowledge_embeddings).
 * Pre-indexes allowed VisionFit knowledge tables incrementally using SHA-256 content hashes;
 * never re-embeds unchanged records on every query.
 */
class KnowledgeEmbeddingService
{
    private const INDEX_TABLE = 'assistant_knowledge_embeddings';

    public function __construct(
        private readonly EmbeddingClientInterface $embeddingClient,
        private readonly FitnessDataService $dataService,
    ) {
    }

    /**
     * Incrementally sync embeddings for all allowed knowledge tables.
     * Only calls embedding API when a document is new, changed (content_hash differs), or model changed.
     *
     * @return array{indexed: int, updated: int, skipped: int, removed: int, total_documents: int, model: string}
     */
    public function syncIndex(bool $force = false): array
    {
        if (!Schema::hasTable(self::INDEX_TABLE)) {
            throw new LlmProviderException(
                'EMBEDDING_INDEX_MISSING',
                'Bảng chỉ mục assistant_knowledge_embeddings chưa được migrate.',
                503,
                false
            );
        }

        $documents = $this->collectKnowledgeDocuments();
        $model = $this->embeddingClient->modelName();

        $existing = DB::table(self::INDEX_TABLE)
            ->get(['id', 'source_table', 'source_id', 'content_hash', 'embedding_model'])
            ->keyBy(fn ($r) => $r->source_table . ':' . $r->source_id);

        $seenKeys = [];
        $indexed = 0;
        $updated = 0;
        $skipped = 0;
        $now = now();

        foreach ($documents as $doc) {
            $key = $doc['source_table'] . ':' . $doc['source_id'];
            $seenKeys[$key] = true;
            $hash = hash('sha256', $doc['title'] . "\n" . $doc['content_text'] . "\n" . json_encode($doc['metadata'], JSON_UNESCAPED_UNICODE));

            $prev = $existing->get($key);
            if (!$force && $prev && $prev->content_hash === $hash && $prev->embedding_model === $model) {
                $skipped++;
                continue;
            }

            $vector = $this->embeddingClient->embed($doc['title'] . "\n" . $doc['content_text'], 'RETRIEVAL_DOCUMENT');

            $row = [
                'source_table' => $doc['source_table'],
                'source_id' => $doc['source_id'],
                'category' => $doc['category'],
                'title' => mb_substr($doc['title'], 0, 255, 'UTF-8'),
                'content_text' => $doc['content_text'],
                'metadata_json' => json_encode($doc['metadata'], JSON_UNESCAPED_UNICODE),
                'content_hash' => $hash,
                'embedding_model' => $model,
                'embedding_json' => json_encode($vector),
                'updated_at' => $now,
            ];

            if ($prev) {
                DB::table(self::INDEX_TABLE)->where('id', $prev->id)->update($row);
                $updated++;
            } else {
                $row['created_at'] = $now;
                DB::table(self::INDEX_TABLE)->insert($row);
                $indexed++;
            }
        }

        $removed = 0;
        foreach ($existing as $key => $prev) {
            if (!isset($seenKeys[$key])) {
                DB::table(self::INDEX_TABLE)->where('id', $prev->id)->delete();
                $removed++;
            }
        }

        return [
            'indexed' => $indexed,
            'updated' => $updated,
            'skipped' => $skipped,
            'removed' => $removed,
            'total_documents' => count($documents),
            'model' => $model,
        ];
    }

    /**
     * Semantic search over pre-indexed knowledge embeddings using cosine similarity.
     */
    public function search(
        string $query,
        ?string $category = 'all',
        int $limit = 4,
        ?AssistantAuthContext $actor = null
    ): array {
        $cleanQuery = trim($query);
        if ($cleanQuery === '') {
            return [
                'status' => 'invalid_query',
                'results' => [],
                'message' => 'Từ khóa tìm kiếm không được để trống.',
            ];
        }

        if (!Schema::hasTable(self::INDEX_TABLE)) {
            return [
                'status' => 'index_not_ready',
                'results' => [],
                'message' => 'Chỉ mục tìm kiếm ngữ nghĩa chưa được khởi tạo.',
            ];
        }

        $model = $this->embeddingClient->modelName();
        $indexedCount = DB::table(self::INDEX_TABLE)->where('embedding_model', $model)->count();

        // Lập chỉ mục lần đầu nếu kho chỉ mục đang rỗng (sau đó chỉ cập nhật theo hash khi nội dung thay đổi)
        if ($indexedCount === 0) {
            try {
                $this->syncIndex(false);
            } catch (LlmProviderException $e) {
                return [
                    'status' => 'embedding_unavailable',
                    'error_code' => $e->errorCode,
                    'results' => [],
                    'message' => $e->getMessage(),
                ];
            }
        }

        try {
            $queryVector = $this->embeddingClient->embed($cleanQuery, 'RETRIEVAL_QUERY');
        } catch (LlmProviderException $e) {
            return [
                'status' => 'embedding_unavailable',
                'error_code' => $e->errorCode,
                'results' => [],
                'message' => $e->getMessage(),
            ];
        }

        $q = DB::table(self::INDEX_TABLE)->where('embedding_model', $model);
        $cat = strtolower(trim((string) $category));
        if ($cat !== '' && $cat !== 'all') {
            $q->where('category', $cat);
        }

        $rows = $q->get(['source_table', 'source_id', 'category', 'title', 'content_text', 'metadata_json', 'embedding_json']);
        if ($rows->isEmpty()) {
            return [
                'status' => 'empty',
                'embedding_model' => $model,
                'results' => [],
                'message' => 'Không có dữ liệu tri thức phù hợp trong danh mục đã chọn.',
            ];
        }

        $scored = [];
        foreach ($rows as $row) {
            $vec = json_decode((string) $row->embedding_json, true);
            if (!is_array($vec) || empty($vec)) {
                continue;
            }
            $score = $this->cosineSimilarity($queryVector, $vec);
            $meta = json_decode((string) $row->metadata_json, true) ?: [];

            $item = [
                'category' => $row->category,
                'title' => $row->title,
                'summary' => mb_substr($row->content_text, 0, 320, 'UTF-8'),
                'metadata' => $meta,
                'similarity_score' => round($score, 4),
            ];

            if ($row->category === 'food' && $actor && $actor->authenticated && $actor->role === 'member' && $actor->user) {
                $allergens = $this->dataService->detectAllergenMatches(
                    (string) $row->title,
                    (string) ($meta['ingredients'] ?? ''),
                    $actor->user->di_ung ?? null
                );
                if (!empty($allergens)) {
                    $item['allergy_warning'] = 'Món ăn chứa thành phần nằm trong danh sách dị ứng của hội viên: ' . implode(', ', $allergens);
                    $item['matched_allergens'] = $allergens;
                }
            }

            $scored[] = $item;
        }

        usort($scored, fn ($a, $b) => $b['similarity_score'] <=> $a['similarity_score']);
        $limit = max(1, min(6, $limit));
        $top = array_slice($scored, 0, $limit);

        return [
            'status' => !empty($top) ? 'ok' : 'empty',
            'retrieval_method' => 'semantic_embeddings',
            'embedding_model' => $model,
            'query' => $cleanQuery,
            'category' => $cat ?: 'all',
            'results' => $top,
        ];
    }

    /**
     * Collects ONLY authorized public/catalog fitness knowledge tables (never personal user tables!).
     */
    private function collectKnowledgeDocuments(): array
    {
        $docs = [];

        if (Schema::hasTable('bai_tap')) {
            $q = DB::table('bai_tap')->where('bai_tap.tinh_trang', 1);
            if (Schema::hasTable('chi_tiet_bai_tap')) {
                $q->leftJoin('chi_tiet_bai_tap', 'bai_tap.id', '=', 'chi_tiet_bai_tap.id_bai_tap')
                    ->select('bai_tap.id', 'bai_tap.ten_bai_tap', 'bai_tap.mo_ta', 'bai_tap.set_yeu_cau', 'bai_tap.rep_yeu_cau', 'bai_tap.thiet_bi', 'chi_tiet_bai_tap.canh_bao', 'chi_tiet_bai_tap.huong_dan');
            } else {
                $q->select('bai_tap.id', 'bai_tap.ten_bai_tap', 'bai_tap.mo_ta', 'bai_tap.set_yeu_cau', 'bai_tap.rep_yeu_cau', 'bai_tap.thiet_bi');
            }
            foreach ($q->get() as $row) {
                $parts = array_filter([
                    'Bài tập: ' . $row->ten_bai_tap,
                    !empty($row->mo_ta) ? 'Mô tả kỹ thuật: ' . strip_tags((string) $row->mo_ta) : null,
                    !empty($row->huong_dan) ? 'Hướng dẫn: ' . strip_tags((string) $row->huong_dan) : null,
                    !empty($row->canh_bao) ? 'Cảnh báo an toàn: ' . strip_tags((string) $row->canh_bao) : null,
                    !empty($row->thiet_bi) ? 'Thiết bị: ' . $row->thiet_bi : 'Thiết bị: Tự do / Bodyweight',
                ]);
                $docs[] = [
                    'source_table' => 'bai_tap',
                    'source_id' => (int) $row->id,
                    'category' => 'exercise',
                    'title' => (string) $row->ten_bai_tap,
                    'content_text' => implode('. ', $parts),
                    'metadata' => [
                        'sets' => (int) ($row->set_yeu_cau ?? 3),
                        'reps' => (int) ($row->rep_yeu_cau ?? 12),
                        'equipment' => $row->thiet_bi ?: 'Tự do / Bodyweight',
                        'warning' => $row->canh_bao ?? null,
                    ],
                ];
            }
        }

        if (Schema::hasTable('mon_an')) {
            foreach (DB::table('mon_an')->where('tinh_trang', 1)->get(['id', 'ten_mon_an', 'loai_bua', 'the_loai', 'calo', 'protein', 'carb', 'fat', 'khoi_luong_gram', 'nguyen_lieu']) as $row) {
                $mealType = $this->dataService->formatMealType($row->loai_bua ?? null);
                $parts = array_filter([
                    'Món ăn dinh dưỡng: ' . $row->ten_mon_an,
                    "Bữa: {$mealType}",
                    !empty($row->the_loai) ? 'Chế độ: ' . $row->the_loai : null,
                    "Năng lượng: {$row->calo} kcal, Đạm: {$row->protein}g, Carb: {$row->carb}g, Fat: {$row->fat}g",
                    !empty($row->nguyen_lieu) ? 'Nguyên liệu: ' . $row->nguyen_lieu : null,
                ]);
                $docs[] = [
                    'source_table' => 'mon_an',
                    'source_id' => (int) $row->id,
                    'category' => 'food',
                    'title' => (string) $row->ten_mon_an,
                    'content_text' => implode('. ', $parts),
                    'metadata' => [
                        'meal_type' => $mealType,
                        'diet_type' => $row->the_loai,
                        'calories' => (float) ($row->calo ?? 0),
                        'protein_g' => (float) ($row->protein ?? 0),
                        'carb_g' => (float) ($row->carb ?? 0),
                        'fat_g' => (float) ($row->fat ?? 0),
                        'serving_g' => (int) ($row->khoi_luong_gram ?? 100),
                        'ingredients' => $row->nguyen_lieu,
                    ],
                ];
            }
        }

        if (Schema::hasTable('dinh_duong_the_thao')) {
            foreach (DB::table('dinh_duong_the_thao')->where('tinh_trang', 1)->get(['id', 'ten_san_pham', 'danh_muc_ten', 'mo_ta_ngan', 'noi_dung_chi_tiet']) as $row) {
                $summary = strip_tags((string) ($row->mo_ta_ngan ?: $row->noi_dung_chi_tiet));
                $docs[] = [
                    'source_table' => 'dinh_duong_the_thao',
                    'source_id' => (int) $row->id,
                    'category' => 'sports_nutrition',
                    'title' => (string) $row->ten_san_pham,
                    'content_text' => "Dinh dưỡng thể thao ({$row->danh_muc_ten}): {$row->ten_san_pham}. {$summary}",
                    'metadata' => ['category_label' => $row->danh_muc_ten],
                ];
            }
        }

        if (Schema::hasTable('bach_khoa_toan_thu')) {
            foreach (DB::table('bach_khoa_toan_thu')->where('tinh_trang', 1)->get(['id', 'tieu_de', 'chu_de', 'tom_tat', 'noi_dung']) as $row) {
                $summary = strip_tags((string) ($row->tom_tat ?: $row->noi_dung));
                $docs[] = [
                    'source_table' => 'bach_khoa_toan_thu',
                    'source_id' => (int) $row->id,
                    'category' => 'encyclopedia',
                    'title' => (string) $row->tieu_de,
                    'content_text' => "Bách khoa thể hình ({$row->chu_de}): {$row->tieu_de}. {$summary}",
                    'metadata' => ['topic' => $row->chu_de],
                ];
            }
        }

        if (Schema::hasTable('chuong_trinh_tap')) {
            $cols = ['id', 'ten_chuong_trinh', 'so_buoi_moi_tuan'];
            if (Schema::hasColumn('chuong_trinh_tap', 'muc_tieu')) {
                $cols[] = 'muc_tieu';
            }
            if (Schema::hasColumn('chuong_trinh_tap', 'mo_ta')) {
                $cols[] = 'mo_ta';
            }
            foreach (DB::table('chuong_trinh_tap')->where('tinh_trang', 1)->get($cols) as $row) {
                $goal = $row->muc_tieu ?? 'Rèn luyện sức khỏe';
                $desc = strip_tags((string) ($row->mo_ta ?? ''));
                $docs[] = [
                    'source_table' => 'chuong_trinh_tap',
                    'source_id' => (int) $row->id,
                    'category' => 'program',
                    'title' => (string) $row->ten_chuong_trinh,
                    'content_text' => "Chương trình tập: {$row->ten_chuong_trinh}. Mục tiêu: {$goal}. Tần suất: " . ($row->so_buoi_moi_tuan ?? 3) . " buổi/tuần. {$desc}",
                    'metadata' => ['goal' => $goal, 'sessions_per_week' => (int) ($row->so_buoi_moi_tuan ?? 3)],
                ];
            }
        }

        return $docs;
    }

    private function cosineSimilarity(array $a, array $b): float
    {
        $len = min(count($a), count($b));
        if ($len === 0) {
            return 0.0;
        }
        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;
        for ($i = 0; $i < $len; $i++) {
            $va = (float) $a[$i];
            $vb = (float) $b[$i];
            $dot += $va * $vb;
            $normA += $va * $va;
            $normB += $vb * $vb;
        }
        $denom = sqrt($normA) * sqrt($normB);
        return $denom > 0.0 ? ($dot / $denom) : 0.0;
    }
}

