<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
class TrainerController extends Controller
{
    public function loginTrainer(Request $request)
    {
        $check = Auth::guard('trainer')->attempt([
            'email' => $request->email,
            'password' => $request->password
        ]);
        if($check){
            $nhanVien = Auth::guard('trainer')->user();
            if($nhanVien->is_active == 0){
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoạn',
                ]);
            }
           
            return response()->json([
                'status' => true,
                'message' => 'Đăng nhập thành công',
                'token' => $nhanVien->createToken('token_trainer')->plainTextToken,

            ]);
        }else {
            return response()->json([
                'status' => false,
                'message' => 'Tài khoản hoặc mật khẩu không đúng'
            ]);
        }
    }
    public function logoutTrainer()
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
        }
        else {
            return response()->json([
                'status'  => false,
                'message' => "Có lỗi xảy ra",
            ]);
        }
    }
}
