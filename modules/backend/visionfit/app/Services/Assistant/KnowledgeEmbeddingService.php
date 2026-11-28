<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\Cache;
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

        $pending = [];
        foreach ($documents as $doc) {
            $key = $doc['source_table'] . ':' . $doc['source_id'];
            $seenKeys[$key] = true;
            $hash = hash('sha256', $doc['title'] . "\n" . $doc['content_text'] . "\n" . json_encode($doc['metadata'], JSON_UNESCAPED_UNICODE));

            $prev = $existing->get($key);
            if (!$force && $prev && $prev->content_hash === $hash && $prev->embedding_model === $model) {
                $skipped++;
                continue;
            }

            $pending[] = [
                'doc' => $doc,
                'hash' => $hash,
                'prev' => $prev,
                'embed_text' => $doc['title'] . "\n" . $doc['content_text'],
            ];
        }

        $canBatch = method_exists($this->embeddingClient, 'embedBatch');
        $chunks = $canBatch ? array_chunk($pending, 25) : array_map(fn ($item) => [$item], $pending);

        foreach ($chunks as $chunk) {
            $vectors = $canBatch
                ? $this->embeddingClient->embedBatch(array_column($chunk, 'embed_text'), 'RETRIEVAL_DOCUMENT')
                : [$this->embeddingClient->embed($chunk[0]['embed_text'], 'RETRIEVAL_DOCUMENT')];

            foreach ($chunk as $idx => $item) {
                $doc = $item['doc'];
                $prev = $item['prev'];
                $row = [
                    'source_table' => $doc['source_table'],
                    'source_id' => $doc['source_id'],
                    'category' => $doc['category'],
                    'title' => mb_substr($doc['title'], 0, 255, 'UTF-8'),
                    'content_text' => $doc['content_text'],
                    'metadata_json' => json_encode($doc['metadata'], JSON_UNESCAPED_UNICODE),
                    'content_hash' => $item['hash'],
                    'embedding_model' => $model,
                    'embedding_json' => json_encode($vectors[$idx]),
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
     *
     * When `$category` is narrowed by the LLM (`$strictCategory === false`) and returns no results
     * above `knowledge_min_similarity`, automatically broadens retrieval across all authorized
     * knowledge categories (`all`) using the exact same similarity threshold and allergy checks.
     * When `$strictCategory === true` (user explicitly restricted category), never broadens.
     */
    public function search(
        string $query,
        ?string $category = 'all',
        int $limit = 4,
        ?AssistantAuthContext $actor = null,
        bool $strictCategory = false
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
                    'quota_scope' => $e->quotaScope,
                    'retryable' => $e->retryable,
                    'results' => [],
                    'message' => $e->getMessage(),
                ];
            }
        }

        $queryVector = null;
        $usedQueryCache = false;
        $cacheTtl = max(0, (int) config('assistant.embedding_query_cache_ttl', 86400));
        $cacheKey = self::queryVectorCacheKey($model, $cleanQuery);

        if ($cacheTtl > 0) {
            $cached = Cache::get($cacheKey);
            if (is_array($cached) && !empty($cached)) {
                $queryVector = $cached;
                $usedQueryCache = true;
            }
        }

        if ($queryVector === null) {
            try {
                $queryVector = $this->embeddingClient->embed($cleanQuery, 'RETRIEVAL_QUERY');
            } catch (LlmProviderException $e) {
                return [
                    'status' => 'embedding_unavailable',
                    'error_code' => $e->errorCode,
                    'quota_scope' => $e->quotaScope,
                    'retryable' => $e->retryable,
                    'results' => [],
                    'message' => $e->getMessage(),
                ];
            }

            if ($cacheTtl > 0 && !empty($queryVector)) {
                Cache::put($cacheKey, $queryVector, $cacheTtl);
            }
        }

        $requestedCat = strtolower(trim((string) $category));
        if ($requestedCat === '') {
            $requestedCat = 'all';
        }
        $limit = max(1, min(6, $limit));
        $minSimilarity = (float) config('assistant.knowledge_min_similarity', 0.70);

        $top = $this->rankMatchingRows($model, $requestedCat, $queryVector, $minSimilarity, $limit, $actor);
        $effectiveCat = $requestedCat;
        $broadenedFrom = null;

        // Nếu LLM tự suy đoán category hẹp (không phải người dùng giới hạn cứng) mà không có kết quả đạt ngưỡng,
        // mở rộng tìm trên toàn bộ danh mục kiến thức được phép với CÙNG ngưỡng similarity & cùng lọc dị ứng.
        if (empty($top) && $requestedCat !== 'all' && !$strictCategory) {
            $broadenedTop = $this->rankMatchingRows($model, 'all', $queryVector, $minSimilarity, $limit, $actor);
            if (!empty($broadenedTop)) {
                $top = $broadenedTop;
                $effectiveCat = 'all';
                $broadenedFrom = $requestedCat;
            }
        }

        return [
            'status' => !empty($top) ? 'ok' : 'empty',
            'retrieval_method' => 'semantic_embeddings',
            'embedding_model' => $model,
            'query_embedding_cached' => $usedQueryCache,
            'query' => $cleanQuery,
            'category' => $effectiveCat,
            'requested_category' => $requestedCat,
            'strict_category' => $strictCategory,
            'broadened_from_category' => $broadenedFrom,
            'results' => $top,
            'message' => empty($top) ? 'Không tìm thấy nội dung phù hợp trong kho kiến thức VisionFit.' : null,
        ];
    }

    public static function queryVectorCacheKey(string $model, string $query): string
    {
        $normalized = preg_replace('/\s+/u', ' ', mb_strtolower(trim($query), 'UTF-8'));
        return 'assistant:emb:q:' . hash('sha256', trim($model) . "\n" . (string) $normalized);
    }

    /**
     * Rank indexed documents in a given category (or all) above `$minSimilarity`,
     * preserving member allergy warnings on food items.
     *
     * @param array<int, float> $queryVector
     * @return array<int, array<string, mixed>>
     */
    private function rankMatchingRows(
        string $model,
        string $category,
        array $queryVector,
        float $minSimilarity,
        int $limit,
        ?AssistantAuthContext $actor
    ): array {
        $q = DB::table(self::INDEX_TABLE)->where('embedding_model', $model);
        if ($category !== '' && $category !== 'all') {
            $q->where('category', $category);
        }

        $rows = $q->get(['source_table', 'source_id', 'category', 'title', 'content_text', 'metadata_json', 'embedding_json']);
        if ($rows->isEmpty()) {
            return [];
        }

        $scored = [];
        foreach ($rows as $row) {
            $vec = json_decode((string) $row->embedding_json, true);
            if (!is_array($vec) || empty($vec)) {
                continue;
            }
            $score = $this->cosineSimilarity($queryVector, $vec);
            if ($score < $minSimilarity) {
                continue;
            }
            $meta = json_decode((string) $row->metadata_json, true) ?: [];

            $item = [
                'category' => $row->category,
                'title' => $row->title,
                'summary' => mb_substr($row->content_text, 0, 320, 'UTF-8'),
                'metadata' => $meta,
                'similarity_score' => round($score, 4),
                '_ref' => ['table' => (string) $row->source_table, 'id' => (int) $row->source_id],
            ];

            if ($row->category === 'food' && $actor && $actor->authenticated && $actor->role === 'member' && $actor->user) {
                $allergens = $this->dataService->detectAllergenMatches(
                    (string) $row->title,
                    (string) ($meta['ingredients'] ?? ''),
                    $this->dataService->rawAllergyOf($actor->user)
                );
                if (!empty($allergens)) {
                    $item['allergy_warning'] = 'Món ăn chứa thành phần nằm trong danh sách dị ứng của hội viên: ' . implode(', ', $allergens);
                    $item['matched_allergens'] = $allergens;
                }
            }

            $scored[] = $item;
        }

        usort($scored, fn ($a, $b) => $b['similarity_score'] <=> $a['similarity_score']);
        $top = array_slice($scored, 0, $limit);

        // Chỉ bổ sung chi tiết cho các kết quả được chọn (ít truy vấn), đọc trực tiếp từ bảng gốc
        // nên luôn là dữ liệu mới nhất và KHÔNG cần re-embed (không tốn quota Gemini).
        return array_map(function (array $item) {
            $ref = $item['_ref'] ?? null;
            unset($item['_ref']);
            if (!$ref) {
                return $item;
            }
            $details = match ($ref['table']) {
                'bai_tap' => $this->exerciseDetails($ref['id']),
                'mon_an' => $this->foodDetails($ref['id']),
                default => [],
            };
            return empty($details) ? $item : array_merge($item, ['details' => $details]);
        }, $top);
    }

    /**
     * Chi tiết bài tập: ảnh, ảnh động minh họa đúng/sai, nhóm cơ tác động (%), hướng dẫn, lưu ý, lỗi thường gặp.
     * Mọi cột đều được kiểm tra tồn tại để chạy được cả trên DB cũ của các thành viên.
     */
    private function exerciseDetails(int $id): array
    {
        if (!Schema::hasTable('bai_tap')) {
            return [];
        }
        $cols = array_values(array_filter(
            ['ten_bai_tap', 'anh_dai_dien', 'loi_thuong_gap', 'thiet_bi', 'set_yeu_cau', 'rep_yeu_cau', 'thoi_gian_phut', 'muc_ta_toi_thieu'],
            fn ($c) => Schema::hasColumn('bai_tap', $c)
        ));
        $bt = DB::table('bai_tap')->where('id', $id)->first($cols);
        if (!$bt) {
            return [];
        }

        $ct = null;
        if (Schema::hasTable('chi_tiet_bai_tap')) {
            $ctCols = array_values(array_filter(
                ['video_huong_dan', 'video_sai', 'huong_dan', 'canh_bao', 'mo_ta'],
                fn ($c) => Schema::hasColumn('chi_tiet_bai_tap', $c)
            ));
            $ct = $ctCols ? DB::table('chi_tiet_bai_tap')->where('id_bai_tap', $id)->first($ctCols) : null;
        }

        $muscles = [];
        if (Schema::hasTable('bai_tap_nhom_co')) {
            $muscles = DB::table('bai_tap_nhom_co')->where('id_bai_tap', $id)
                ->orderByDesc('ty_le_tac_dong')->get(['ten_nhom_co', 'ty_le_tac_dong'])
                ->map(fn ($m) => ['muscle' => $m->ten_nhom_co, 'percent' => (float) $m->ty_le_tac_dong])
                ->all();
        }

        return array_filter([
            'image_url' => $this->absoluteUrl($bt->anh_dai_dien ?? null),
            'demo_gif_url' => $this->absoluteUrl($ct->video_huong_dan ?? null),
            'wrong_form_gif_url' => $this->absoluteUrl($ct->video_sai ?? null),
            'muscle_groups' => $muscles,
            'instructions' => $this->clip($ct->huong_dan ?? null),
            'safety_notes' => $this->clip($ct->canh_bao ?? null),
            'common_mistakes' => $this->clip($bt->loi_thuong_gap ?? null),
            'equipment' => $bt->thiet_bi ?? null,
            'sets' => isset($bt->set_yeu_cau) ? (int) $bt->set_yeu_cau : null,
            'reps' => isset($bt->rep_yeu_cau) ? (int) $bt->rep_yeu_cau : null,
            'min_weight' => $bt->muc_ta_toi_thieu ?? null,
        ], fn ($v) => $v !== null && $v !== '' && $v !== []);
    }

    /** Chi tiết món ăn: ảnh, mô tả, nguyên liệu, gia vị, cách nấu, thời gian nấu, khẩu phần. */
    private function foodDetails(int $id): array
    {
        if (!Schema::hasTable('mon_an')) {
            return [];
        }
        $cols = array_values(array_filter(
            ['anh_dai_dien', 'mo_ta', 'nguyen_lieu', 'gia_vi', 'huong_dan_nau', 'thoi_gian_nau', 'khoi_luong_gram'],
            fn ($c) => Schema::hasColumn('mon_an', $c)
        ));
        $m = DB::table('mon_an')->where('id', $id)->first($cols);
        if (!$m) {
            return [];
        }

        return array_filter([
            'image_url' => $this->absoluteUrl($m->anh_dai_dien ?? null),
            'description' => $this->clip($m->mo_ta ?? null),
            'ingredients' => $this->clip($m->nguyen_lieu ?? null),
            'spices' => $this->clip($m->gia_vi ?? null),
            'cooking_steps' => $this->clip($m->huong_dan_nau ?? null),
            'cooking_time' => $m->thoi_gian_nau ?? null,
            'serving_g' => isset($m->khoi_luong_gram) ? (int) $m->khoi_luong_gram : null,
        ], fn ($v) => $v !== null && $v !== '');
    }

    /** Ảnh lưu đường dẫn tương đối (upload) -> ghép APP_URL; link http(s) giữ nguyên. */
    private function absoluteUrl(?string $path): ?string
    {
        $path = trim((string) $path);
        if ($path === '') {
            return null;
        }
        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }
        return rtrim((string) config('app.url'), '/') . '/' . ltrim($path, '/');
    }

    private function clip(?string $text, int $max = 700): ?string
    {
        $text = trim(str_replace(['\\n', "\r"], ["\n", ''], strip_tags((string) $text)));
        if ($text === '') {
            return null;
        }
        return mb_strlen($text, 'UTF-8') > $max ? mb_substr($text, 0, $max, 'UTF-8') . '…' : $text;
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

