<?php

namespace App\Services\Assistant;

/**
 * Official Gemini Native Function Calling REST client (:generateContent).
 * Preserves full model content parts (including thoughtSignature / thought metadata)
 * across multi-turn tool execution rounds per https://ai.google.dev/gemini-api/docs/function-calling
 */
class GeminiFunctionCallingClient implements LlmClientInterface
{
    public function __construct(
        private readonly ?string $apiKey = null,
        private readonly ?string $baseUrl = null,
    ) {
    }

    public function generateTurn(
        string $model,
        string $systemPrompt,
        array $contents,
        array $toolDeclarations,
        int $timeoutSeconds = 12
    ): array {
        $apiKey = $this->apiKey ?? config('assistant.gemini_api_key');
        if (!is_string($apiKey) || trim($apiKey) === '') {
            throw new LlmProviderException(
                'AI_KEY_MISSING',
                'Dịch vụ trợ lý AI chưa được cấu hình khóa API.',
                503,
                false
            );
        }

        $cleanModel = ltrim(trim($model), '/');
        if (str_starts_with($cleanModel, 'models/')) {
            $cleanModel = substr($cleanModel, 7);
        }

        $base = rtrim((string) ($this->baseUrl ?? config('assistant.gemini_base_url', 'https://generativelanguage.googleapis.com/v1beta')), '/');
        $url = "{$base}/models/{$cleanModel}:generateContent";

        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemPrompt],
                ],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.2,
                'maxOutputTokens' => 1024,
            ],
        ];

        if (!empty($toolDeclarations)) {
            $payload['tools'] = [
                [
                    'functionDeclarations' => array_values($toolDeclarations),
                ],
            ];
            $payload['toolConfig'] = [
                'functionCallingConfig' => [
                    'mode' => 'AUTO',
                ],
            ];
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_CONNECTTIMEOUT => min(4, max(1, $timeoutSeconds)),
            CURLOPT_TIMEOUT => max(2, $timeoutSeconds),
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
            throw new LlmProviderException('AI_TIMEOUT', 'Kết nối tới Gemini quá thời gian cho phép.', 503, true);
        }

        if ($httpCode === 429) {
            throw new LlmProviderException('AI_QUOTA_EXCEEDED', 'Dịch vụ Gemini tạm thời hết hạn mức (429).', 503, true);
        }

        if ($httpCode === 401 || $httpCode === 403) {
            throw new LlmProviderException('AI_AUTH_ERROR', 'Khóa API Gemini không hợp lệ hoặc không có quyền truy cập.', 503, false);
        }

        if ($httpCode !== 200) {
            throw new LlmProviderException(
                'AI_PROVIDER_ERROR',
                "Gemini API trả về mã lỗi HTTP {$httpCode}.",
                503,
                $httpCode >= 500 || $httpCode === 404
            );
        }

        $decoded = json_decode((string) $raw, true);
        if (!is_array($decoded) || empty($decoded['candidates'][0]['content']['parts'])) {
            throw new LlmProviderException('AI_MALFORMED_RESPONSE', 'Phản hồi từ Gemini không đúng định dạng.', 503, true);
        }

        $candidate = $decoded['candidates'][0];
        $content = $candidate['content'];
        $parts = is_array($content['parts']) ? $content['parts'] : [];

        $textParts = [];
        $functionCalls = [];

        foreach ($parts as $part) {
            if (!is_array($part)) {
                continue;
            }
            // Bỏ qua phần thought nội bộ khi ghép câu trả lời cho user, nhưng GIỮ NGUYÊN trong raw_model_content!
            if (isset($part['text']) && is_string($part['text']) && empty($part['thought'])) {
                $textParts[] = $part['text'];
            }
            if (isset($part['functionCall']) && is_array($part['functionCall'])) {
                $fc = $part['functionCall'];
                $fcName = is_string($fc['name'] ?? null) ? trim($fc['name']) : '';
                $fcArgs = is_array($fc['args'] ?? null) ? $fc['args'] : [];
                if ($fcName !== '') {
                    $functionCalls[] = [
                        'id' => isset($fc['id']) && is_string($fc['id']) ? $fc['id'] : null,
                        'name' => $fcName,
                        'args' => $fcArgs,
                        'raw_part' => $part,
                    ];
                }
            }
        }

        $usageMeta = $decoded['usageMetadata'] ?? null;
        $usage = is_array($usageMeta) ? [
            'prompt_tokens' => (int) ($usageMeta['promptTokenCount'] ?? 0),
            'completion_tokens' => (int) ($usageMeta['candidatesTokenCount'] ?? 0),
            'total_tokens' => (int) ($usageMeta['totalTokenCount'] ?? 0),
        ] : null;

        return [
            'text' => !empty($textParts) ? trim(implode("\n", $textParts)) : null,
            'function_calls' => $functionCalls,
            'raw_model_content' => [
                'role' => $content['role'] ?? 'model',
                'parts' => $parts,
            ],
            'finish_reason' => is_string($candidate['finishReason'] ?? null) ? $candidate['finishReason'] : null,
            'model' => $cleanModel,
            'provider' => 'gemini_fc',
            'usage' => $usage,
        ];
    }
}

