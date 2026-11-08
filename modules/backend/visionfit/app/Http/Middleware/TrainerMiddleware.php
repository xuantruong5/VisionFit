<?php

namespace App\Http\Middleware;

use App\Models\Trainer;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class TrainerMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainTextToken = $request->bearerToken();
        $accessToken = $plainTextToken
            ? PersonalAccessToken::findToken($plainTextToken)
            : null;

        $trainer = $accessToken?->tokenable;

        if (!$accessToken || !($trainer instanceof Trainer)) {
            return response()->json([
                'status' => false,
                'message' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
            ], 401);
        }

        if ((int) $trainer->is_active !== Trainer::DAKICHHOAT) {
            return response()->json([
                'status' => false,
                'message' => 'Tài khoản Trainer chưa được kích hoạt.',
            ], 403);
        }

        if ((int) $trainer->is_block === Trainer::DAKHOA) {
            return response()->json([
                'status' => false,
                'message' => 'Tài khoản Trainer đã bị khóa.',
            ], 403);
        }

        if ((int) $trainer->tinh_trang !== Trainer::DANGHOATDONG) {
            return response()->json([
                'status' => false,
                'message' => 'Tài khoản Trainer chưa ở trạng thái hoạt động.',
            ], 403);
        }

        // Existing controllers read the trainer from request('trainer').
        $request->merge(['trainer' => $trainer]);
        return $next($request);
    }
}
