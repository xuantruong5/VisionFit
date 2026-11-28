<?php

namespace App\Services\Assistant;

use RuntimeException;

class LlmProviderException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $httpStatus = 503,
        public readonly bool $retryable = true,
        public readonly ?string $quotaScope = null,
        public readonly ?int $retryAfterSeconds = null,
    ) {
        parent::__construct($message, $httpStatus);
    }
}

