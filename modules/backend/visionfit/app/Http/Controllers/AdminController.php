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
            if ($admin->tinh_trang == 0) {
                return response()->json([
                    'status'    => false,
                    'message'   => "Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt!",
                ]);
            }

            return response()->json([
                'status'    => true,
                'message'   => "Đã đăng nhập thành công!",
                'token'     => $admin->createToken('token_admin')->plainTextToken,
                'ho_ten'    => $admin->ho_ten,
                'email'     => $admin->email,
                'hinh_anh'  => $admin->hinh_anh,
                'is_master' => $admin->is_master,
            ]);
        } else {
            return response()->json([
                'status'    => false,
                'message'   => "Tài khoản hoặc mật khẩu không đúng!",
            ]);
        }
    }

    public function checkTokenAdmin()
    {
        $user = Auth::guard('sanctum')->user();
        if ($user && $user instanceof \App\Models\Admin) {
            if ($user->tinh_trang == 0) {
                return response()->json([
                    'status'    => false,
                    'message'   => "Tài khoản của bạn đã bị khóa!",
                ]);
            }

            return response()->json([
                'status'    => true,
                'ho_ten'    => $user->ho_ten,
                'email'     => $user->email,
                'hinh_anh'  => $user->hinh_anh,
                'is_master' => $user->is_master,
            ]);
        } else {
            return response()->json([
                'status'  => false,
                'message' => 'Bạn cần đăng nhập hệ thống!',
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
