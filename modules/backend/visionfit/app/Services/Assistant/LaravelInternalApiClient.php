<?php

namespace App\Services\Assistant;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Dispatches strictly allowlisted internal read-only GET API endpoints
 * through Laravel's real HTTP Kernel, Router, and Middleware stack (e.g. AssistantToken).
 *
 * Security invariants:
 * - Only verified read-only GET paths in ALLOWED_READ_ENDPOINTS may be invoked.
 * - Never allows arbitrary external URLs, mutating GET routes (e.g. auto-thanh-toan-goi),
 *   or recursive calls to POST /api/assistant/chat.
 * - Preserves the real Bearer token from the incoming request; never bypasses middleware.
 */
class LaravelInternalApiClient implements InternalApiClientInterface
{
    /**
     * Verified read-only GET endpoints registered in routes/api.php & routes/assistant.php.
     */
    public const ALLOWED_READ_ENDPOINTS = [
        '/api/assistant/schedule',
        '/api/assistant/packages',
        '/api/assistant/progress',
        '/api/assistant/body-metrics',
        '/api/assistant/meal-plan',
        '/api/assistant/summary',
        '/api/assistant/knowledge/search',
        // Pure read-only catalog endpoints verified in routes/api.php (no write side effects)
        '/api/so-tay/thuc-pham',
        '/api/dinh-duong-the-thao',
        '/api/bach-khoa-toan-thu',
        '/api/bai-tap',
    ];

    public function __construct(
        private readonly Application $app,
    ) {
    }

    public function get(string $uri, array $query = [], ?string $bearerToken = null): array
    {
        $cleanUri = '/' . ltrim(trim($uri), '/');
        if (!in_array($cleanUri, self::ALLOWED_READ_ENDPOINTS, true)) {
            Log::warning('[LaravelInternalApiClient] Blocked disallowed internal endpoint', [
                'attempted_uri' => mb_substr($uri, 0, 120, 'UTF-8'),
            ]);
            return [
                'ok' => false,
                'http_status' => 403,
                'method' => 'GET',
                'endpoint' => $cleanUri,
                'body' => null,
                'error_code' => 'ENDPOINT_NOT_ALLOWED',
                'error_message' => 'Endpoint không nằm trong danh sách API đọc được phép của trợ lý.',
            ];
        }

        // Loại bỏ tham số null để query string gọn và sạch
        $filteredQuery = [];
        foreach ($query as $k => $v) {
            if ($v === null || $v === '') {
                continue;
            }
            if (is_bool($v)) {
                $filteredQuery[(string) $k] = $v ? '1' : '0';
            } elseif (is_scalar($v)) {
                $filteredQuery[(string) $k] = (string) $v;
            }
        }

        $server = [
            'HTTP_ACCEPT' => 'application/json',
            'CONTENT_TYPE' => 'application/json',
            'REMOTE_ADDR' => '127.0.0.1',
        ];
        if (is_string($bearerToken) && trim($bearerToken) !== '') {
            $server['HTTP_AUTHORIZATION'] = 'Bearer ' . trim($bearerToken);
        }

        $subRequest = Request::create($cleanUri, 'GET', $filteredQuery, [], [], $server);

        $previousRequest = $this->app->bound('request') ? $this->app->make('request') : null;
        /** @var Kernel $kernel */
        $kernel = $this->app->make(Kernel::class);

        // Xóa trạng thái Auth guard trước khi chạy sub-request để tránh rò rỉ danh tính giữa các user
        if ($this->app->bound('auth')) {
            $this->app->make('auth')->forgetGuards();
        }

        try {
            $response = $kernel->handle($subRequest);
            $status = $response->getStatusCode();
            $rawContent = (string) $response->getContent();
            $decoded = json_decode($rawContent, true);
            $body = is_array($decoded) ? $decoded : null;

            if ($status >= 200 && $status < 300) {
                return [
                    'ok' => true,
                    'http_status' => $status,
                    'method' => 'GET',
                    'endpoint' => $cleanUri,
                    'body' => $body,
                    'error_code' => null,
                    'error_message' => null,
                ];
            }

            $apiMessage = is_string($body['message'] ?? null) ? $body['message'] : null;

            if ($status === 401) {
                return [
                    'ok' => false,
                    'http_status' => 401,
                    'method' => 'GET',
                    'endpoint' => $cleanUri,
                    'body' => $body,
                    'error_code' => 'UNAUTHENTICATED',
                    'error_message' => $apiMessage ?: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
                ];
            }

            if ($status === 403) {
                return [
                    'ok' => false,
                    'http_status' => 403,
                    'method' => 'GET',
                    'endpoint' => $cleanUri,
                    'body' => $body,
                    'error_code' => 'FORBIDDEN',
                    'error_message' => $apiMessage ?: 'Tài khoản hiện tại không có quyền truy cập dữ liệu này.',
                ];
            }

            if ($status === 422) {
                return [
                    'ok' => false,
                    'http_status' => 422,
                    'method' => 'GET',
                    'endpoint' => $cleanUri,
                    'body' => $body,
                    'error_code' => 'INVALID_ARGUMENTS',
                    'error_message' => $apiMessage ?: 'Tham số truy vấn API không hợp lệ.',
                ];
            }

            return [
                'ok' => false,
                'http_status' => $status,
                'method' => 'GET',
                'endpoint' => $cleanUri,
                'body' => $body,
                'error_code' => $status === 408 || $status === 504 ? 'API_TIMEOUT' : 'INTERNAL_API_ERROR',
                'error_message' => 'Máy chủ tạm thời không thể truy xuất dữ liệu lúc này.',
            ];
        } catch (\Throwable $e) {
            Log::error('[LaravelInternalApiClient] Sub-request execution failed', [
                'endpoint' => $cleanUri,
                'error' => $e->getMessage(),
            ]);
            return [
                'ok' => false,
                'http_status' => 500,
                'method' => 'GET',
                'endpoint' => $cleanUri,
                'body' => null,
                'error_code' => 'INTERNAL_API_ERROR',
                'error_message' => 'Không thể kết nối tới API nội bộ lúc này.',
            ];
        } finally {
            $subRequest->attributes->remove('assistant_user');
            $subRequest->attributes->remove('assistant_identity');
            if ($this->app->bound('auth')) {
                $this->app->make('auth')->forgetGuards();
            }
            if ($previousRequest !== null) {
                $this->app->instance('request', $previousRequest);
            }
        }
    }
}
