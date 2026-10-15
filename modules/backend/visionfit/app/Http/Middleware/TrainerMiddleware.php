<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Trainer;
class TrainerMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Thử lấy user từ token trước
        $user = null;
        if ($request->bearerToken()) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
            if ($accessToken && $accessToken->tokenable_type === \App\Models\Trainer::class) {
                $user = $accessToken->tokenable;
            }
        }

        //  Nếu chưa có user từ token, thử lấy từ session guard (nếu có)
        if (!$user && Auth::check()) {
            $user = Auth::user();
        }

        // Nếu tìm thấy nhân viên hợp lệ
        if ($user && $user instanceof \App\Models\Trainer && $user->tinh_trang == 1) {
            $request->merge(['trainer' => $user]); 
            return $next($request);
        }

        return response()->json([
            'status' => false,
            'message' => 'Bạn cần đăng nhập để thực hiện chức năng này.',
        ]);
    }
}
