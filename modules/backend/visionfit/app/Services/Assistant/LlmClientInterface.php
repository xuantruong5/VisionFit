<?php

namespace App\Services\Assistant;

/**
 * Contract for LLM providers supporting native structured Function Calling.
 */
interface LlmClientInterface
{
    /**
     * Send one turn of conversation + tool declarations to the provider.
     *
     * @param string $model Verified model ID
     * @param string $systemPrompt System instruction
     * @param array<int, array<string, mixed>> $contents Provider-neutral or Gemini-native turn list
     * @param array<int, array<string, mixed>> $toolDeclarations Gemini-style functionDeclarations
     * @param int $timeoutSeconds HTTP timeout for this single call
     * @return array{
     *   text: ?string,
     *   function_calls: array<int, array{id: ?string, name: string, args: array<string, mixed>, raw_part: array<string, mixed>}>,
     *   raw_model_content: array<string, mixed>,
     *   finish_reason: ?string,
     *   model: string,
     *   provider: string,
     *   usage: ?array<string, int>
     * }
     * @throws LlmProviderException
     */
    public function generateTurn(
        string $model,
        string $systemPrompt,
        array $contents,
        array $toolDeclarations,
        int $timeoutSeconds = 12
    ): array;
}

