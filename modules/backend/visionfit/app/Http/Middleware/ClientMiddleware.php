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
        $user = Auth::guard("client")->user() ?: Auth::guard("sanctum")->user();
        if ($user && $user instanceof \App\Models\Client && $user->tinh_trang == 1) {
            return $next($request);
        }

        // H? tr? môi tru?ng local/dev khi test tr?c ti?p các màn hình không qua Login
        if (app()->environment("local")) {
            $defaultClient = \App\Models\Client::where("tinh_trang", 1)->first();
            if ($defaultClient) {
                Auth::guard("client")->setUser($defaultClient);
                return $next($request);
            }
        }

        return response()->json([
            "status" => false,
            "message" => "B?n c?n dang nh?p d? th?c hi?n ch?c nang này"
        ], 401);
    }
}

