<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Traines\StoreRequest;
use Illuminate\Support\Facades\Hash;
use App\Models\Trainer;
class TrainerController extends Controller
{
    public function checkMaPT(Request $request)
    {
        $trainer = Trainer::where('ma_gioi_thieu', $request->ma_gioi_thieu)
            ->first();

        if (!$trainer) {
            return response()->json([
                'status' => false,
                'message' => 'Mã PT không tồn tại',
            ]);
        }
        if ($trainer->tinh_trang != Trainer::DANGHOATDONG) {
            return response()->json([
                'status' => false,
                'message' => 'Mã PT hiện không hoạt động',
            ]);
        }
        if ($trainer->is_block == Trainer::DAKHOA) {
            return response()->json([
                'status' => false,
                'message' => 'Mã PT hiện đang bị khóa',
            ]);
        }
        return response()->json([
            'status' => true,
            'message' => 'Mã PT hợp lệ',
        ]);
    }

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
    public function checkTokenTrainer()
    {
        $trainer = Auth::guard('sanctum')->user();
        if ($trainer && $trainer instanceof \App\Models\Trainer) {
            if ($trainer->tinh_trang == Trainer::DANGHI) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản của bạn hiện không hoạt động!',
                ]);
            }
            if ($trainer->is_block == Trainer::DAKHOA) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản của bạn đã bị khóa!',
                ]);
            }
            return response()->json([
                'status' => true,
                'message' => 'Token hợp lệ',
                'ho_ten' => $trainer->ho_ten,
                'email' => $trainer->email,
                'hinh_anh' => $trainer->hinh_anh,
            ]);

        } else {
            return response()->json([
                'status' => false,
                'message' => 'Bạn cần đăng nhập hệ thống!',
            ], 401);
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
    public function dangKy(StoreRequest $request)
    {
        // 1. Lấy dữ liệu đã validate
        $data = $request->validated();
        // 2. Kiểm tra mã giới thiệu
        $trainerGioiThieu = null;

        if (!empty($data['ma_gioi_thieu'])) {
            $trainerGioiThieu = Trainer::where( 'ma_gioi_thieu',  $data['ma_gioi_thieu'] )
                ->where('is_active', Trainer::DAKICHHOAT)
                ->where('is_verified', 1)
                ->where('is_block', Trainer::KHONGKHOA)
                ->where('tinh_trang', Trainer::DANGHOATDONG)
                ->first();

            if (!$trainerGioiThieu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã giới thiệu không hợp lệ hoặc Trainer giới thiệu không còn hoạt động.',
                ], 422);
            }
        }

        $cv = $request->file('cv')->store('cv-trainers', 'public');

        // 3. Tạo tài khoản ứng tuyển Trainer
        $trainer = Trainer::create([
            'ho_ten' => $data['ho_ten'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'so_dien_thoai' => $data['so_dien_thoai'] ?? null,
            'ngay_sinh' => $data['ngay_sinh'] ?? null,
            'gioi_tinh' => $data['gioi_tinh'] ?? 0,
            // Thông tin người giới thiệu
            'id_trainer_gioi_thieu' => $trainerGioiThieu ? $trainerGioiThieu->id : null,

            'cv' => $cv,

            // Chưa được cấp mã giới thiệu
            'ma_gioi_thieu' => null,
            // Trạng thái tuyển dụng
            'trang_thai_tuyen_dung' => Trainer::CHOLIENHE,
            'ngay_phong_van' => null,
            // Trạng thái xác minh và tài khoản
            'is_verified' => 0,
            'is_active' => Trainer::CHUAKICHHOAT_TK,
            'is_block' => Trainer::KHONGKHOA,
            // Trạng thái làm việc
            'tinh_trang' => Trainer::CHUAKICHHOAT,
        ]);

        // 4. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Đăng ký ứng tuyển Trainer thành công. Vui lòng chờ Admin liên hệ.',
            'data' => [
                'id' => $trainer->id,
                'ho_ten' => $trainer->ho_ten,
                'email' => $trainer->email,
                'so_dien_thoai' => $trainer->so_dien_thoai,
                'cv' => $trainer->cv,
                'id_trainer_gioi_thieu' => $trainer->id_trainer_gioi_thieu,
                'trang_thai_tuyen_dung' => $trainer->trang_thai_tuyen_dung,
                'ngay_phong_van' => $trainer->ngay_phong_van,
                'is_verified' => $trainer->is_verified,
                'is_active' => $trainer->is_active,
                'tinh_trang' => $trainer->tinh_trang,
            ],
        ], 201);
    }


}
