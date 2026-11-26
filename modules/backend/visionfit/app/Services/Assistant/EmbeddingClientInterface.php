<?php

namespace App\Services\Assistant;

interface EmbeddingClientInterface
{
    /**
     * Generate a dense semantic vector for text.
     *
     * @param string $text Input text
     * @param string $taskType RETRIEVAL_DOCUMENT | RETRIEVAL_QUERY
     * @return array<int, float>
     * @throws LlmProviderException
     */
    public function embed(string $text, string $taskType = 'RETRIEVAL_QUERY'): array;

    public function modelName(): string;
}

