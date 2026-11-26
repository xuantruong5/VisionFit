<?php

namespace App\Services\Assistant;

/**
 * Optional Tier-2 Backup Provider supporting OpenAI-compatible Tool/Function Calling
 * (e.g., OpenAI, Groq, OpenRouter, or secondary Gemini OpenAI-compat endpoint).
 * Translates Gemini-style contents & declarations into standard `tools` + `tool_calls` format.
 */
class OpenAiCompatibleToolClient implements LlmClientInterface
{
    public function __construct(
        private readonly string $url,
        private readonly string $apiKey,
    ) {
    }

    public function generateTurn(
        string $model,
        string $systemPrompt,
        array $contents,
        array $toolDeclarations,
        int $timeoutSeconds = 12
    ): array {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        $callCounter = 0;
        foreach ($contents as $turn) {
            $role = $turn['role'] ?? 'user';
            $parts = is_array($turn['parts'] ?? null) ? $turn['parts'] : [];

            if ($role === 'model') {
                $text = [];
                $toolCalls = [];
                foreach ($parts as $part) {
                    if (isset($part['text']) && empty($part['thought'])) {
                        $text[] = (string) $part['text'];
                    }
                    if (isset($part['functionCall'])) {
                        $fc = $part['functionCall'];
                        $callId = $fc['id'] ?? ('call_' . (++$callCounter));
                        $toolCalls[] = [
                            'id' => $callId,
                            'type' => 'function',
                            'function' => [
                                'name' => (string) ($fc['name'] ?? ''),
                                'arguments' => json_encode($fc['args'] ?? new \stdClass(), JSON_UNESCAPED_UNICODE),
                            ],
                        ];
                    }
                }
                $msg = ['role' => 'assistant'];
                $msg['content'] = !empty($text) ? implode("\n", $text) : null;
                if (!empty($toolCalls)) {
                    $msg['tool_calls'] = $toolCalls;
                }
                $messages[] = $msg;
            } else {
                $userTexts = [];
                foreach ($parts as $part) {
                    if (isset($part['functionResponse'])) {
                        $fr = $part['functionResponse'];
                        $messages[] = [
                            'role' => 'tool',
                            'tool_call_id' => (string) ($fr['id'] ?? ('call_' . $callCounter)),
                            'name' => (string) ($fr['name'] ?? ''),
                            'content' => json_encode($fr['response'] ?? [], JSON_UNESCAPED_UNICODE),
                        ];
                    } elseif (isset($part['text'])) {
                        $userTexts[] = (string) $part['text'];
                    }
                }
                if (!empty($userTexts)) {
                    $messages[] = ['role' => 'user', 'content' => implode("\n", $userTexts)];
                }
            }
        }

        $tools = array_map(fn ($decl) => [
            'type' => 'function',
            'function' => [
                'name' => $decl['name'],
                'description' => $decl['description'],
                'parameters' => $this->toLowerJsonSchema($decl['parameters'] ?? ['type' => 'OBJECT', 'properties' => new \stdClass()]),
            ],
        ], $toolDeclarations);

        $payload = [
            'model' => $model,
            'temperature' => 0.2,
            'max_completion_tokens' => 1024,
            'messages' => $messages,
        ];
        if (!empty($tools)) {
            $payload['tools'] = $tools;
            $payload['tool_choice'] = 'auto';
        }

        $ch = curl_init($this->url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_CONNECTTIMEOUT => min(4, max(1, $timeoutSeconds)),
            CURLOPT_TIMEOUT => max(2, $timeoutSeconds),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_SSL_VERIFYPEER => (bool) config('assistant.ssl_verify', true),
        ]);

        $raw = curl_exec($ch);
        $curlErr = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false || $curlErr !== '') {
            throw new LlmProviderException('AI_TIMEOUT', 'Kết nối tới nhà cung cấp AI dự phòng quá thời gian.', 503, true);
        }
        if ($httpCode === 429) {
            throw new LlmProviderException('AI_QUOTA_EXCEEDED', 'Nhà cung cấp AI dự phòng hết hạn mức (429).', 503, true);
        }
        if ($httpCode !== 200) {
            throw new LlmProviderException('AI_PROVIDER_ERROR', "Nhà cung cấp AI dự phòng trả HTTP {$httpCode}.", 503, $httpCode >= 500);
        }

        $decoded = json_decode((string) $raw, true);
        $msg = $decoded['choices'][0]['message'] ?? null;
        if (!is_array($msg)) {
            throw new LlmProviderException('AI_MALFORMED_RESPONSE', 'Phản hồi từ nhà cung cấp AI dự phòng không hợp lệ.', 503, true);
        }

        $rawParts = [];
        $functionCalls = [];
        $text = is_string($msg['content'] ?? null) && trim($msg['content']) !== '' ? trim($msg['content']) : null;
        if ($text !== null) {
            $rawParts[] = ['text' => $text];
        }

        foreach (($msg['tool_calls'] ?? []) as $tc) {
            $fnName = is_string($tc['function']['name'] ?? null) ? trim($tc['function']['name']) : '';
            $rawArgs = $tc['function']['arguments'] ?? '{}';
            $args = is_string($rawArgs) ? (json_decode($rawArgs, true) ?: []) : (is_array($rawArgs) ? $rawArgs : []);
            $callId = is_string($tc['id'] ?? null) ? $tc['id'] : null;
            if ($fnName !== '') {
                $part = [
                    'functionCall' => array_filter([
                        'id' => $callId,
                        'name' => $fnName,
                        'args' => $args,
                    ], fn ($v) => $v !== null),
                ];
                $rawParts[] = $part;
                $functionCalls[] = [
                    'id' => $callId,
                    'name' => $fnName,
                    'args' => $args,
                    'raw_part' => $part,
                ];
            }
        }

        return [
            'text' => $text,
            'function_calls' => $functionCalls,
            'raw_model_content' => ['role' => 'model', 'parts' => $rawParts],
            'finish_reason' => is_string($decoded['choices'][0]['finish_reason'] ?? null) ? $decoded['choices'][0]['finish_reason'] : null,
            'model' => $model,
            'provider' => 'backup_fc',
            'usage' => isset($decoded['usage']) ? [
                'prompt_tokens' => (int) ($decoded['usage']['prompt_tokens'] ?? 0),
                'completion_tokens' => (int) ($decoded['usage']['completion_tokens'] ?? 0),
                'total_tokens' => (int) ($decoded['usage']['total_tokens'] ?? 0),
            ] : null,
        ];
    }

    private function toLowerJsonSchema(array $schema): array
    {
        $out = [];
        foreach ($schema as $k => $v) {
            if ($k === 'type' && is_string($v)) {
                $out[$k] = strtolower($v);
            } elseif (is_array($v)) {
                $out[$k] = $this->toLowerJsonSchema($v);
            } else {
                $out[$k] = $v;
            }
        }
        return $out;
    }
}

