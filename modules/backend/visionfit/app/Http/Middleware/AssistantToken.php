<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Trainer;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/** Bearer-token-only boundary: never invokes the local ClientMiddleware fallback. */
class AssistantToken
{
    /**
     * Explicit non-identity query parameter whitelist per assistant read route.
     * Any selector such as user_id, client_id, id_nguoi_dung, gym_id, or role is always rejected (422).
     */
    private const ALLOWED_QUERY_KEYS = [
        'api/assistant/me' => [],
        'api/assistant/context' => [],
        'api/assistant/schedule' => ['date_preset', 'date_from', 'date_to', 'limit'],
        'api/assistant/packages' => ['include_expired'],
        'api/assistant/progress' => ['period'],
        'api/assistant/body-metrics' => [],
        'api/assistant/meal-plan' => ['date_preset', 'date', 'meal_type', 'diet_preference'],
        'api/assistant/summary' => [],
    ];

    public function handle(Request $request, Closure $next)
    {
        $plainToken = $request->bearerToken();
        $token = $plainToken ? PersonalAccessToken::findToken($plainToken) : null;
        $expiration = config('sanctum.expiration');
        if (!$token || ($token->expires_at && $token->expires_at->isPast())
            || ($expiration && $token->created_at->lte(now()->subMinutes((int) $expiration)))) {
            return response()->json(['message' => 'Token không hợp lệ hoặc đã hết hạn.'], 401);
        }

        $user = $token->tokenable;
        $role = match (true) {
            $user instanceof Client => 'member',
            $user instanceof Trainer => 'trainer',
            $user instanceof Admin => 'admin',
            default => null,
        };
        if (!$role || (int) $user->tinh_trang !== 1 || (int) ($user->is_block ?? 0) === 1
            || ($role === 'trainer' && (int) $user->is_active !== 1)) {
            return response()->json(['message' => 'Tài khoản không có quyền sử dụng trợ lý.'], 403);
        }
        if (!$token->can('*') && !$token->can('assistant:read')) {
            return response()->json(['message' => 'Token không có quyền assistant:read.'], 403);
        }

        // Admin schema has no gym ownership. Explicit server-side mapping is required.
        $gymId = $role === 'admin'
            ? config('assistant.admin_gyms.'.(string) $user->getKey())
            : $user->id_phong_tap;
        if (!is_scalar($gymId) || !ctype_digit((string) $gymId) || (int) $gymId <= 0) {
            return response()->json(['message' => 'Tài khoản chưa được gán phạm vi phòng tập cho trợ lý.'], 403);
        }

        // Enforce strict per-route query whitelist: never accept user/gym/role selectors.
        $routePath = ltrim($request->path(), '/');
        $allowedKeys = self::ALLOWED_QUERY_KEYS[$routePath] ?? [];
        foreach (array_keys($request->query()) as $qKey) {
            if (!in_array((string) $qKey, $allowedKeys, true)) {
                return response()->json(['message' => 'API trợ lý không nhận tham số chọn người dùng hoặc phòng.'], 422);
            }
        }
        $request->attributes->set('assistant_user', $user);
        $request->attributes->set('assistant_identity', [
            'id' => (string) $user->getKey(), 'gym_id' => (string) $gymId,
            'role' => $role, 'name' => $user->ho_ten,
        ]);

        return $next($request);
    }
}
