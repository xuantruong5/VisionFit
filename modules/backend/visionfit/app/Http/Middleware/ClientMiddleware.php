<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ClientMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user   = Auth::guard('client')->user() ?: Auth::guard('sanctum')->user();
        if($user && $user instanceof \App\Models\Client && $user->tinh_trang == 1) {
            return $next($request);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Bạn cần đăng nhập để thực hiện chức năng này'
            ]);
        }
    }
}
