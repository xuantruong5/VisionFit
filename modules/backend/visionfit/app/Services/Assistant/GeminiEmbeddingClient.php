<?php

namespace App\Services\Assistant;

/**
 * Official Gemini Embeddings REST client (models/gemini-embedding-001:embedContent).
 * Ref: https://ai.google.dev/gemini-api/docs/embeddings
 */
class GeminiEmbeddingClient implements EmbeddingClientInterface
{
    public function __construct(
        private readonly ?string $apiKey = null,
        private readonly ?string $model = null,
        private readonly ?string $baseUrl = null,
    ) {
    }

    public function modelName(): string
    {
        return $this->model ?: (string) config('assistant.gemini_embedding_model', 'gemini-embedding-001');
    }

    public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array
    {
        $apiKey = $this->apiKey ?? config('assistant.gemini_api_key');
        if (!is_string($apiKey) || trim($apiKey) === '') {
            throw new LlmProviderException(
                'AI_KEY_MISSING',
                'Thiếu GEMINI_API_KEY cho dịch vụ tìm kiếm ngữ nghĩa.',
                503,
                false
            );
        }

        $model = ltrim($this->modelName(), '/');
        if (str_starts_with($model, 'models/')) {
            $model = substr($model, 7);
        }

        $base = rtrim((string) ($this->baseUrl ?? config('assistant.gemini_base_url', 'https://generativelanguage.googleapis.com/v1beta')), '/');
        $url = "{$base}/models/{$model}:embedContent";

        $payload = [
            'model' => "models/{$model}",
            'content' => [
                'parts' => [
                    ['text' => mb_substr(trim($text), 0, 2000, 'UTF-8')],
                ],
            ],
            'taskType' => $taskType,
        ];
        $dims = (int) config('assistant.embedding_dimensions', 768);
        if ($dims > 0) {
            // Rút gọn vector (Matryoshka) do Gemini hỗ trợ sẵn: 768 chiều nhỏ hơn 4 lần, chất lượng gần như giữ nguyên
            $payload['outputDimensionality'] = $dims;
        }

        $decoded = $this->executeJsonPostWithBoundedRetry(
            $url,
            $apiKey,
            $payload,
            4,
            (int) config('assistant.embedding_timeout_seconds', 10),
            'embedding'
        );

        $values = $decoded['embedding']['values'] ?? null;
        if (!is_array($values) || empty($values)) {
            throw new LlmProviderException('EMBEDDING_MALFORMED', 'Phản hồi embedding từ Gemini không hợp lệ.', 503, true);
        }

        return array_map('floatval', $values);
    }

    /**
     * Batch-embed up to 100 documents per HTTP request via official `:batchEmbedContents`.
     * Dramatically reduces RPM usage and latency when indexing full knowledge tables.
     *
     * @param array<int, string> $texts
     * @return array<int, array<int, float>>
     * @throws LlmProviderException
     */
    public function embedBatch(array $texts, string $taskType = 'RETRIEVAL_DOCUMENT'): array
    {
        if (empty($texts)) {
            return [];
        }

        $apiKey = $this->apiKey ?? config('assistant.gemini_api_key');
        if (!is_string($apiKey) || trim($apiKey) === '') {
            throw new LlmProviderException(
                'AI_KEY_MISSING',
                'Thiếu GEMINI_API_KEY cho dịch vụ tìm kiếm ngữ nghĩa.',
                503,
                false
            );
        }

        $model = ltrim($this->modelName(), '/');
        if (str_starts_with($model, 'models/')) {
            $model = substr($model, 7);
        }

        $base = rtrim((string) ($this->baseUrl ?? config('assistant.gemini_base_url', 'https://generativelanguage.googleapis.com/v1beta')), '/');
        $url = "{$base}/models/{$model}:batchEmbedContents";

        $dims = (int) config('assistant.embedding_dimensions', 768);
        $requests = [];
        foreach ($texts as $t) {
            $requests[] = [
                'model' => "models/{$model}",
                'content' => [
                    'parts' => [
                        ['text' => mb_substr(trim((string) $t), 0, 2000, 'UTF-8')],
                    ],
                ],
                'taskType' => $taskType,
            ] + ($dims > 0 ? ['outputDimensionality' => $dims] : []);
        }

        $decoded = $this->executeJsonPostWithBoundedRetry(
            $url,
            $apiKey,
            ['requests' => $requests],
            6,
            max(20, (int) config('assistant.embedding_timeout_seconds', 10) * 2),
            'batch embedding'
        );

        $embeddings = $decoded['embeddings'] ?? null;
        if (!is_array($embeddings) || count($embeddings) !== count($texts)) {
            throw new LlmProviderException('EMBEDDING_MALFORMED', 'Phản hồi batch embedding từ Gemini không khớp số lượng tài liệu.', 503, true);
        }

        $vectors = [];
        foreach ($embeddings as $item) {
            $vals = $item['values'] ?? null;
            if (!is_array($vals) || empty($vals)) {
                throw new LlmProviderException('EMBEDDING_MALFORMED', 'Vector embedding rỗng trong phản hồi batch.', 503, true);
            }
            $vectors[] = array_map('floatval', $vals);
        }

        return $vectors;
    }

    /**
     * Execute HTTP POST with strict bounded retries:
     * - Distinguishes per-minute vs per-day Gemini 429 quota failures.
     * - Never retries per-day quota exhaustion (fails fast, retryable=false).
     * - Only retries transient 5xx/timeout or short per-minute quota backoff (<= 3s), max 2 attempts.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function executeJsonPostWithBoundedRetry(
        string $url,
        string $apiKey,
        array $payload,
        int $connectTimeout,
        int $timeout,
        string $label
    ): array {
        $maxRetries = max(0, min(2, (int) config('assistant.embedding_max_retries', 1)));
        $attempt = 0;

        while (true) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_CONNECTTIMEOUT => $connectTimeout,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'x-goog-api-key: ' . $apiKey,
                ],
                CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
                CURLOPT_SSL_VERIFYPEER => (bool) config('assistant.ssl_verify', true),
            ]);

            $raw = curl_exec($ch);
            $curlErr = curl_error($ch);
            $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($raw === false || $curlErr !== '') {
                if ($attempt < $maxRetries) {
                    $attempt++;
                    usleep(300_000);
                    continue;
                }
                throw new LlmProviderException('EMBEDDING_TIMEOUT', "Không kết nối được dịch vụ {$label} Gemini.", 503, true);
            }

            if ($httpCode === 429) {
                $quota = self::parseQuotaFailure((string) $raw);
                $scope = $quota['scope'];
                $retryDelay = $quota['retry_after_seconds'];

                // Chỉ retry có giới hạn khi là hạn mức phút với độ trễ ngắn (<= 3 giây); tuyệt đối không lặp vô hạn hay retry hạn mức ngày
                if ($scope === 'minute' && $attempt < $maxRetries && $retryDelay !== null && $retryDelay <= 3) {
                    $attempt++;
                    usleep(max(1, $retryDelay) * 1_000_000);
                    continue;
                }

                $msg = match ($scope) {
                    'day' => "Dịch vụ {$label} Gemini đã hết hạn mức ngày (RPD). Vui lòng thử lại sau khi hạn mức được cấp lại.",
                    'minute' => "Dịch vụ {$label} Gemini đang tạm chạm giới hạn tốc độ theo phút (RPM). Vui lòng đợi một lát rồi thử lại.",
                    default => "Dịch vụ {$label} Gemini tạm hết hạn mức.",
                };

                throw new LlmProviderException(
                    'AI_QUOTA_EXCEEDED',
                    $msg,
                    503,
                    $scope !== 'day',
                    $scope,
                    $retryDelay
                );
            }

            if ($httpCode >= 500 && $attempt < $maxRetries) {
                $attempt++;
                usleep(400_000);
                continue;
            }

            if ($httpCode !== 200) {
                throw new LlmProviderException(
                    'EMBEDDING_ERROR',
                    "Dịch vụ {$label} Gemini trả mã lỗi HTTP {$httpCode}.",
                    503,
                    $httpCode >= 500
                );
            }

            $decoded = json_decode((string) $raw, true);
            if (!is_array($decoded)) {
                throw new LlmProviderException('EMBEDDING_MALFORMED', "Phản hồi JSON {$label} từ Gemini không hợp lệ.", 503, true);
            }

            return $decoded;
        }
    }

    /**
     * Classify Gemini HTTP 429 error payload into minute vs day vs unknown quota scope and optional retryDelay.
     *
     * @return array{scope: 'minute'|'day'|'unknown', retry_after_seconds: ?int}
     */
    public static function parseQuotaFailure(string $rawBody): array
    {
        $decoded = json_decode($rawBody, true);
        $haystack = strtolower($rawBody);
        $retryAfter = null;

        if (is_array($decoded)) {
            $details = $decoded['error']['details'] ?? [];
            if (is_array($details)) {
                foreach ($details as $detail) {
                    if (!is_array($detail)) {
                        continue;
                    }
                    if (!empty($detail['retryDelay']) && is_string($detail['retryDelay'])) {
                        if (preg_match('/(\d+(?:\.\d+)?)s/i', $detail['retryDelay'], $m)) {
                            $retryAfter = max(1, (int) ceil((float) $m[1]));
                        }
                    }
                }
            }
        }

        if (preg_match('/perday|per_day|requestsperday|\brpd\b|daily/i', $haystack)) {
            return ['scope' => 'day', 'retry_after_seconds' => $retryAfter];
        }
        if (preg_match('/perminute|per_minute|requestsperminute|\brpm\b|per_min/i', $haystack)) {
            return ['scope' => 'minute', 'retry_after_seconds' => $retryAfter];
        }

        return ['scope' => 'unknown', 'retry_after_seconds' => $retryAfter];
    }
}

