<?php

namespace App\Services\Assistant;

/**
 * Contract for executing strictly allowlisted read-only internal API endpoints
 * through Laravel's real HTTP router and middleware stack.
 */
interface InternalApiClientInterface
{
    /**
     * Execute an allowlisted internal GET endpoint with the user's verified Bearer token.
     *
     * @param array<string, scalar|null> $query
     * @return array{
     *   ok: bool,
     *   http_status: int,
     *   method: string,
     *   endpoint: string,
     *   body: ?array<string, mixed>,
     *   error_code: ?string,
     *   error_message: ?string
     * }
     */
    public function get(string $uri, array $query = [], ?string $bearerToken = null): array;
}

