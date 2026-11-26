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

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => (int) config('assistant.embedding_timeout_seconds', 10),
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
            throw new LlmProviderException('EMBEDDING_TIMEOUT', 'Không kết nối được dịch vụ embedding Gemini.', 503, true);
        }

        if ($httpCode === 429) {
            throw new LlmProviderException('AI_QUOTA_EXCEEDED', 'Dịch vụ embedding Gemini tạm hết hạn mức.', 503, true);
        }

        if ($httpCode !== 200) {
            throw new LlmProviderException('EMBEDDING_ERROR', "Dịch vụ embedding Gemini trả mã lỗi HTTP {$httpCode}.", 503, $httpCode >= 500);
        }

        $decoded = json_decode((string) $raw, true);
        $values = $decoded['embedding']['values'] ?? null;
        if (!is_array($values) || empty($values)) {
            throw new LlmProviderException('EMBEDDING_MALFORMED', 'Phản hồi embedding từ Gemini không hợp lệ.', 503, true);
        }

        return array_map('floatval', $values);
    }
}

