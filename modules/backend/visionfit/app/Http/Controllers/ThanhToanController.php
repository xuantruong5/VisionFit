<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\DangKyGoi\StoreRequest;
use App\Models\DangKyGoi;
use App\Models\ChiTietDangKyGoi;
use App\Models\GoiTap;

class ThanhToanController extends Controller
{
    public function store(StoreRequest $request)
    {
        // 1. Lấy hội viên đang đăng nhập
        $hoiVien = auth('sanctum')->user();
        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.'
            ], 401);
        }
        // 2. Lấy thông tin gói tập
        $goiTap = GoiTap::find($request->id_goi_tap);
        if (!$goiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Gói tập không tồn tại.'
            ], 404);
        }

        // 3. Tính tiền
        $donGia = (float) $goiTap->gia;
        $tienGiamKhuyenMai = (float) ($request->tien_giam_khuyen_mai ?? 0);
        $tienGiamGioiThieu = (float) ($request->tien_giam_gioi_thieu ?? 0);
        $tongGiam = $tienGiamKhuyenMai + $tienGiamGioiThieu;

        if ($tongGiam > $donGia) {
            return response()->json([
                'success' => false,
                'message' => 'Tổng tiền giảm không hợp lệ.'
            ], 422);
        }

        $thanhTien = $donGia - $tongGiam;
        // 4. Tạo đăng ký gói
        $dangKyGoi = DangKyGoi::create([
            'id_hoi_vien' => $hoiVien->id,
            'ngay_dang_ky' => now(),
            'tinh_trang' => 0,
            'phuong_thuc_thanh_toan' => $request->phuong_thuc_thanh_toan,
            'is_thanh_toan' => 0,
            'tong_tien' => $thanhTien,
        ]);

        // 5. Tạo chi tiết đăng ký
        $chiTiet = ChiTietDangKyGoi::create([
            'id_dang_ky_goi' => $dangKyGoi->id,
            'id_goi_tap' => $goiTap->id,
            'id_chuong_trinh_tap' => $request->id_chuong_trinh_tap,
            'id_noi_tap' => $request->id_noi_tap,
            'id_trainer' => $request->id_trainer,
            'so_buoi' => $goiTap->so_buoi ?? 0,
            'so_buoi_pt' => $goiTap->so_buoi_pt ?? 0,
            'don_gia' => $donGia,
            'tien_giam_khuyen_mai' => $tienGiamKhuyenMai,
            'tien_giam_gioi_thieu' => $tienGiamGioiThieu,
            'giam_gia' => $tongGiam,
            'ma_khuyen_mai' => $request->ma_khuyen_mai,
            'ma_gioi_thieu' => $request->ma_gioi_thieu,
            'ten_khuyen_mai' => null,
            'lan_dang_ky' => $request->lan_dang_ky ?? 1,
            'phan_tram_giam' => $request->phan_tram_giam ?? 0,
            'thanh_tien' => $thanhTien,
            'ngay_bat_dau' => null, // sau khi thanh toán thành công sẽ update 
            'ngay_ket_thuc' => null, // sau khi thanh toán thành công sẽ update 
            'tinh_trang' => 0,
        ]);
        // 6. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Tạo đăng ký gói thành công. Vui lòng thanh toán.',
            'data' => [
                'id_dang_ky_goi' => $dangKyGoi->id,
                'id_chi_tiet_dang_ky' => $chiTiet->id,
                'tong_tien' => $thanhTien,
                'is_thanh_toan' => 0,
                'tinh_trang' => 0,
            ]
        ], 201);
    }
}
