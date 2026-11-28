<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tìm kiếm ngữ nghĩa trên kho kiến thức VisionFit bằng Gemini Embeddings.
 *
 * Chỉ mục KHÔNG nằm trong database (tránh làm nặng DB): lưu thành MỘT file nhị phân trong
 * storage/app/assistant/ (vector float32, mặc định 768 chiều ≈ 0.7 MB cho ~230 tài liệu).
 *
 * Tự vận hành, không cần chạy lệnh:
 *  - Lần hỏi kiến thức đầu tiên: tự lập chỉ mục.
 *  - Sau đó mỗi `knowledge_auto_refresh_seconds` (mặc định 10 phút): tự phát hiện món ăn / bài tập
 *    được thêm, sửa, xóa và chỉ embed lại đúng những tài liệu thay đổi (so SHA-256).
 *  - Lệnh `php artisan assistant:index-knowledge` vẫn dùng được để lập trước (không bắt buộc).
 */
class KnowledgeEmbeddingService
{
    private const FORMAT_VERSION = 1;

    /** Việc lập chỉ mục còn dang dở thì sau chừng này giây tự làm tiếp. */
    private const RESUME_AFTER_SECONDS = 60;

    /** Cache trong tiến trình: tránh đọc + giải nén file ở mỗi lượt tìm kiếm. */
    private static array $memo = [];

    public function __construct(
        private readonly EmbeddingClientInterface $embeddingClient,
        private readonly FitnessDataService $dataService,
    ) {
    }

    // ───────────────────────────── Lưu trữ chỉ mục (file) ─────────────────────────────

    public function indexPath(): string
    {
        return (string) config('assistant.knowledge_index_path', storage_path('app/assistant/knowledge_index.bin'));
    }

    /** Model + số chiều: đổi một trong hai thì vector cũ không còn dùng được -> lập lại. */
    public function indexSignature(): string
    {
        return $this->embeddingClient->modelName() . '#' . (int) config('assistant.embedding_dimensions', 768);
    }

    /**
     * @return array{version:int, signature:string, checked_at:int, docs:array<string, array<string, mixed>>}
     */
    private function loadIndex(): array
    {
        $path = $this->indexPath();
        $empty = ['version' => self::FORMAT_VERSION, 'signature' => '', 'checked_at' => 0, 'docs' => []];

        clearstatcache(true, $path);
        if (!is_file($path)) {
            return $empty;
        }
        $stamp = filemtime($path) . ':' . filesize($path);
        if (isset(self::$memo[$path]) && self::$memo[$path]['stamp'] === $stamp) {
            return self::$memo[$path]['index'];
        }

        $raw = @file_get_contents($path);
        $index = $raw === false ? false : @unserialize($raw, ['allowed_classes' => false]);
        if (!is_array($index) || ($index['version'] ?? null) !== self::FORMAT_VERSION || !is_array($index['docs'] ?? null)) {
            return $empty; // File hỏng / định dạng cũ -> coi như chưa có, sẽ tự lập lại
        }

        self::$memo[$path] = ['stamp' => $stamp, 'index' => $index];
        return $index;
    }

    private function saveIndex(array $index): void
    {
        $path = $this->indexPath();
        $dir = dirname($path);
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new LlmProviderException('KNOWLEDGE_INDEX_NOT_WRITABLE', "Không ghi được thư mục chỉ mục: {$dir}", 503, false);
        }
        // Ghi file tạm rồi đổi tên: request khác không bao giờ đọc phải file ghi dở
        $tmp = $path . '.' . getmypid() . '.tmp';
        if (@file_put_contents($tmp, serialize($index)) === false || !@rename($tmp, $path)) {
            @unlink($tmp);
            throw new LlmProviderException('KNOWLEDGE_INDEX_NOT_WRITABLE', "Không ghi được file chỉ mục: {$path}", 503, false);
        }
        clearstatcache(true, $path);
        self::$memo[$path] = ['stamp' => filemtime($path) . ':' . filesize($path), 'index' => $index];
    }

    /**
     * Ghi trực tiếp tài liệu đã có vector vào chỉ mục (dùng cho kiểm thử / nạp sẵn).
     *
     * @param array<int, array{source_table:string, source_id:int, category:string, title:string, content_text?:string, metadata?:array, vector:array<int,float>}> $documents
     */
    public function writeIndex(array $documents, ?int $checkedAt = null): void
    {
        $docs = [];
        foreach ($documents as $d) {
            $docs[$d['source_table'] . ':' . $d['source_id']] = [
                'source_table' => $d['source_table'],
                'source_id' => (int) $d['source_id'],
                'category' => $d['category'],
                'title' => $d['title'],
                'content_text' => $d['content_text'] ?? $d['title'],
                'metadata' => $d['metadata'] ?? [],
                'hash' => $d['hash'] ?? hash('sha256', $d['title']),
                'vec' => pack('g*', ...array_map('floatval', $d['vector'])),
            ];
        }
        $this->saveIndex([
            'version' => self::FORMAT_VERSION,
            'signature' => $this->indexSignature(),
            'checked_at' => $checkedAt ?? now()->getTimestamp(),
            'docs' => $docs,
        ]);
    }

    /** @return int Số tài liệu đang có trong chỉ mục (đúng model + số chiều hiện tại). */
    public function indexedCount(): int
    {
        $index = $this->loadIndex();
        return $index['signature'] === $this->indexSignature() ? count($index['docs']) : 0;
    }

    /**
     * Dấu vân tay nội dung kho kiến thức: đổi khi có tài liệu thêm / sửa / xóa.
     * Dùng làm một phần khóa cache câu trả lời để câu trả lời cũ tự hết hiệu lực khi kho thay đổi.
     * Trả '' nếu chỉ mục chưa sẵn sàng.
     */
    public function contentVersion(): string
    {
        $index = $this->loadIndex();
        if ($index['signature'] !== $this->indexSignature() || empty($index['docs'])) {
            return '';
        }
        $hashes = array_map(fn ($d) => $d['source_table'] . ':' . $d['source_id'] . ':' . $d['hash'], $index['docs']);
        sort($hashes);
        return substr(hash('sha256', $index['signature'] . "\n" . implode("\n", $hashes)), 0, 16);
    }

    // ───────────────────────────── Đồng bộ chỉ mục ─────────────────────────────

    /**
     * Đồng bộ tăng dần: chỉ gọi embedding cho tài liệu mới / đã sửa / khi đổi model hoặc số chiều.
     * Nếu Gemini báo lỗi giữa chừng, phần đã embed vẫn được lưu để lần sau làm tiếp.
     * `$maxEmbeds` giới hạn số tài liệu embed trong một lần (dưới hạn mức/phút của Gemini miễn phí):
     * phần còn lại được hoãn và tự làm tiếp sau ~1 phút.
     *
     * @return array{indexed: int, updated: int, skipped: int, removed: int, deferred: int, total_documents: int, model: string, storage: string}
     */
    public function syncIndex(bool $force = false, ?int $maxEmbeds = null): array
    {
        $index = $this->loadIndex();
        $signature = $this->indexSignature();
        if ($index['signature'] !== $signature) {
            $index['docs'] = []; // Vector khác model / số chiều -> không so sánh được, lập lại toàn bộ
        }
        $index['signature'] = $signature;

        $documents = $this->collectKnowledgeDocuments();
        $existing = $index['docs'];
        $nextDocs = [];
        $pending = [];
        $skipped = 0;

        foreach ($documents as $doc) {
            $key = $doc['source_table'] . ':' . $doc['source_id'];
            $hash = hash('sha256', $doc['title'] . "\n" . $doc['content_text'] . "\n" . json_encode($doc['metadata'], JSON_UNESCAPED_UNICODE));
            $prev = $existing[$key] ?? null;

            if (!$force && $prev && $prev['hash'] === $hash) {
                $nextDocs[$key] = $prev;
                $skipped++;
                continue;
            }
            $pending[] = ['key' => $key, 'doc' => $doc, 'hash' => $hash, 'is_update' => $prev !== null];
        }

        $removed = count(array_diff_key($existing, array_flip(array_map(
            fn ($d) => $d['source_table'] . ':' . $d['source_id'],
            $documents
        ))));

        // Giới hạn khối lượng mỗi lần: tài liệu bị hoãn nếu là bản cũ thì vẫn giữ để tìm được, lần sau cập nhật
        $deferred = 0;
        if ($maxEmbeds !== null && count($pending) > $maxEmbeds) {
            foreach (array_slice($pending, max(0, $maxEmbeds)) as $p) {
                $deferred++;
                if ($p['is_update'] && isset($existing[$p['key']])) {
                    $nextDocs[$p['key']] = $existing[$p['key']];
                }
            }
            $pending = array_slice($pending, 0, max(0, $maxEmbeds));
        }

        $indexed = 0;
        $updated = 0;
        $completed = false;
        $canBatch = method_exists($this->embeddingClient, 'embedBatch');
        $chunks = $canBatch ? array_chunk($pending, 25) : array_map(fn ($item) => [$item], $pending);

        try {
            foreach ($chunks as $chunk) {
                $texts = array_map(fn ($p) => $p['doc']['title'] . "\n" . $p['doc']['content_text'], $chunk);
                $vectors = $canBatch
                    ? $this->embeddingClient->embedBatch($texts, 'RETRIEVAL_DOCUMENT')
                    : [$this->embeddingClient->embed($texts[0], 'RETRIEVAL_DOCUMENT')];

                foreach ($chunk as $i => $p) {
                    $doc = $p['doc'];
                    $nextDocs[$p['key']] = [
                        'source_table' => $doc['source_table'],
                        'source_id' => (int) $doc['source_id'],
                        'category' => $doc['category'],
                        'title' => $doc['title'],
                        'content_text' => $doc['content_text'],
                        'metadata' => $doc['metadata'],
                        'hash' => $p['hash'],
                        'vec' => pack('g*', ...array_map('floatval', $vectors[$i])),
                    ];
                    $p['is_update'] ? $updated++ : $indexed++;
                }
            }
            $completed = true;
        } finally {
            // Luôn lưu tiến độ (kể cả khi Gemini lỗi giữa chừng) để lần sau chỉ làm phần còn thiếu
            $index['docs'] = $nextDocs;
            $now = now()->getTimestamp();
            // Còn việc dang dở (bị hoãn / lỗi quota) -> làm tiếp sau ~60 giây thay vì đợi hết chu kỳ làm mới
            $index['checked_at'] = ($completed && $deferred === 0)
                ? $now
                : $now - $this->refreshInterval() + self::RESUME_AFTER_SECONDS;
            $this->saveIndex($index);
        }

        return [
            'indexed' => $indexed,
            'updated' => $updated,
            'skipped' => $skipped,
            'removed' => $removed,
            'deferred' => $deferred,
            'total_documents' => count($documents),
            'model' => $signature,
            'storage' => $this->indexPath(),
        ];
    }

    /**
     * Tự lập / tự làm mới chỉ mục khi cần — thay cho việc phải chạy lệnh artisan.
     * Có khóa file để nhiều request cùng lúc không embed trùng.
     *
     * @return array<string, mixed>|null Mảng lỗi trả cho LLM nếu chưa thể tìm kiếm; null nếu dùng được.
     */
    private function ensureIndexReady(): ?array
    {
        $index = $this->loadIndex();
        $isEmpty = $index['signature'] !== $this->indexSignature() || empty($index['docs']);
        $isStale = (now()->getTimestamp() - (int) $index['checked_at']) >= $this->refreshInterval();

        if (!$isEmpty && !$isStale) {
            return null;
        }

        // Đã có chỉ mục (kể cả mới lập một phần): tìm ngay trên bản hiện có, việc lập tiếp / cập nhật
        // chạy SAU KHI đã gửi câu trả lời (php-fpm) -> người dùng không phải chờ embed.
        // Chạy dòng lệnh (artisan, kiểm thử) thì làm đồng bộ luôn cho dễ kiểm soát.
        if (!$isEmpty && !app()->runningInConsole()) {
            if (!self::$refreshScheduled) {
                self::$refreshScheduled = true;
                app()->terminating(function () {
                    try {
                        $this->runLockedSync();
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::warning('[KnowledgeEmbedding] Background index refresh failed', ['error' => $e->getMessage()]);
                    } finally {
                        self::$refreshScheduled = false;
                    }
                });
            }
            return null;
        }

        return $this->runLockedSync($isEmpty);
    }

    /** Request hiện tại đã hẹn làm mới chỉ mục sau khi trả lời chưa (tránh hẹn trùng khi gọi tool nhiều lần). */
    private static bool $refreshScheduled = false;

    /**
     * Lập / cập nhật chỉ mục có khóa file (nhiều request cùng lúc không embed trùng).
     *
     * @return array<string, mixed>|null Lỗi trả cho LLM nếu chỉ mục vẫn trống; null nếu tìm được.
     */
    private function runLockedSync(bool $isEmpty = false): ?array
    {
        $dir = dirname($this->indexPath());
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        $lock = @fopen($this->indexPath() . '.lock', 'c');
        if ($lock === false) {
            return $isEmpty ? $this->notReady('Không tạo được file khóa chỉ mục kho kiến thức.') : null;
        }

        try {
            if (!flock($lock, LOCK_EX | LOCK_NB)) {
                // Request khác đang lập chỉ mục: dùng tạm bản hiện có, hoặc báo đang khởi tạo
                return $isEmpty ? $this->notReady('Kho kiến thức đang được khởi tạo, vui lòng thử lại sau ít giây.') : null;
            }
            try {
                $this->syncIndex(false, max(1, (int) config('assistant.knowledge_max_embeds_per_request', 80)));
            } catch (LlmProviderException $e) {
                if ($this->indexedCount() === 0) {
                    return [
                        'status' => 'embedding_unavailable',
                        'error_code' => $e->errorCode,
                        'quota_scope' => $e->quotaScope,
                        'retryable' => $e->retryable,
                        'results' => [],
                        'message' => $e->getMessage(),
                    ];
                }
                // Làm mới thất bại nhưng đã có chỉ mục cũ -> vẫn tìm được, thử lại ở chu kỳ sau
            }
            return null;
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    private function refreshInterval(): int
    {
        return max(60, (int) config('assistant.knowledge_auto_refresh_seconds', 600));
    }

    private function notReady(string $message): array
    {
        return ['status' => 'index_not_ready', 'results' => [], 'message' => $message];
    }

    // ───────────────────────────── Tìm kiếm ─────────────────────────────

    /**
     * Semantic search over the knowledge index using cosine similarity.
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

        $notReady = $this->ensureIndexReady();
        if ($notReady !== null) {
            return $notReady;
        }

        $signature = $this->indexSignature();
        $queryVector = null;
        $usedQueryCache = false;
        $cacheTtl = max(0, (int) config('assistant.embedding_query_cache_ttl', 86400));
        $cacheKey = self::queryVectorCacheKey($signature, $cleanQuery);
        // Cache vector câu hỏi bằng FILE (không ghi vào bảng cache của DB)
        $cache = Cache::store((string) config('assistant.embedding_query_cache_store', 'file'));

        if ($cacheTtl > 0) {
            $cached = $cache->get($cacheKey);
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
                $cache->put($cacheKey, $queryVector, $cacheTtl);
            }
        }

        $requestedCat = strtolower(trim((string) $category));
        if ($requestedCat === '') {
            $requestedCat = 'all';
        }
        $limit = max(1, min(6, $limit));
        $minSimilarity = (float) config('assistant.knowledge_min_similarity', 0.70);

        $top = $this->rankMatchingRows($requestedCat, $queryVector, $minSimilarity, $limit, $actor);
        $effectiveCat = $requestedCat;
        $broadenedFrom = null;

        // Nếu LLM tự suy đoán category hẹp (không phải người dùng giới hạn cứng) mà không có kết quả đạt ngưỡng,
        // mở rộng tìm trên toàn bộ danh mục kiến thức được phép với CÙNG ngưỡng similarity & cùng lọc dị ứng.
        if (empty($top) && $requestedCat !== 'all' && !$strictCategory) {
            $broadenedTop = $this->rankMatchingRows('all', $queryVector, $minSimilarity, $limit, $actor);
            if (!empty($broadenedTop)) {
                $top = $broadenedTop;
                $effectiveCat = 'all';
                $broadenedFrom = $requestedCat;
            }
        }

        return [
            'status' => !empty($top) ? 'ok' : 'empty',
            'retrieval_method' => 'semantic_embeddings',
            'embedding_model' => $signature,
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

    public static function queryVectorCacheKey(string $signature, string $query): string
    {
        $normalized = preg_replace('/\s+/u', ' ', mb_strtolower(trim($query), 'UTF-8'));
        return 'assistant:emb:q:' . hash('sha256', trim($signature) . "\n" . (string) $normalized);
    }

    /**
     * Rank indexed documents in a given category (or all) above `$minSimilarity`,
     * preserving member allergy warnings on food items.
     *
     * @param array<int, float> $queryVector
     * @return array<int, array<string, mixed>>
     */
    private function rankMatchingRows(
        string $category,
        array $queryVector,
        float $minSimilarity,
        int $limit,
        ?AssistantAuthContext $actor
    ): array {
        $index = $this->loadIndex();
        if ($index['signature'] !== $this->indexSignature() || empty($index['docs'])) {
            return [];
        }

        $scored = [];
        foreach ($index['docs'] as $row) {
            if ($category !== '' && $category !== 'all' && $row['category'] !== $category) {
                continue;
            }
            $vec = array_values(unpack('g*', (string) $row['vec']) ?: []);
            if (empty($vec)) {
                continue;
            }
            $score = $this->cosineSimilarity($queryVector, $vec);
            if ($score < $minSimilarity) {
                continue;
            }
            $meta = is_array($row['metadata'] ?? null) ? $row['metadata'] : [];

            $item = [
                'category' => $row['category'],
                'title' => $row['title'],
                'summary' => mb_substr((string) $row['content_text'], 0, 320, 'UTF-8'),
                'metadata' => $meta,
                'similarity_score' => round($score, 4),
                '_ref' => ['table' => (string) $row['source_table'], 'id' => (int) $row['source_id']],
            ];

            if ($row['category'] === 'food' && $actor && $actor->authenticated && $actor->role === 'member' && $actor->user) {
                $allergens = $this->dataService->detectAllergenMatches(
                    (string) $row['title'],
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

