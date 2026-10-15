<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function loginAdmin(Request $request)
    {
        $check = Auth::guard('admin')->attempt([
            'email'     => $request->email,
            'password'  => $request->password
        ]);
        if ($check) {
            $admin = Auth::guard('admin')->user();
            return response()->json([
                'status'    => true,
                'message'   => "Đã đăng nhập thành công!",
                'token'     => $admin->createToken('token_admin')->plainTextToken,
            ]);
        } else {
            return response()->json([
                'status'    => false,
                'message'   => "Tài khoản hoặc mật khẩu không đúng!",
            ]);
        }
    }
    public function logoutAdmin()
    {
        $user = Auth::guard('sanctum')->user();
        if ($user && $user->currentAccessToken()) {
            DB::table('personal_access_tokens')
                ->where('id', $user->currentAccessToken()->id)
                ->delete();
            return response()->json([
                'status'  => true,
                'message' => "Đăng xuất thành công",
            ]);
        } else {
            return response()->json([
                'status'  => false,
                'message' => "Có lỗi xảy ra",
            ]);
        }
    }
}
