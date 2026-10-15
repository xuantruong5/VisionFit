<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user   = Auth::guard('admin')->user() ?: Auth::guard('sanctum')->user();
        if($user && $user instanceof \App\Models\Admin && $user->tinh_trang == 1) {
            return $next($request);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Bạn cần đăng nhập để thực hiện chức năng này'
            ]);
        }
    }
}
