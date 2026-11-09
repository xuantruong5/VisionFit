<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Http\Requests\DangKyGoi\StoreRequest;
use App\Models\DangKyGoi;
use App\Models\ChiTietDangKyGoi;
use App\Models\GoiTap;
use App\Models\Client;
use App\Jobs\SendMailJob;
use Carbon\Carbon;



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
            'id_gioi_thieu' => $request->id_gioi_thieu,
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

    public function autoThanhToanGoi($id)
    {
        $hoiVien = auth('sanctum')->user();

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn chưa đăng nhập.',
            ], 401);
        }

        $dangKyGoi = DangKyGoi::where('id', $id)
            ->where('id_hoi_vien', $hoiVien->id)
            ->first();

        if (!$dangKyGoi) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn đăng ký.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'is_thanh_toan' => (int) $dangKyGoi->is_thanh_toan,
            'message' => (int) $dangKyGoi->is_thanh_toan === 1
                ? 'Thanh toán thành công.'
                : 'Đang chờ thanh toán.',
        ]);
    }

    public function testGuiMail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $data = [
            'ho_ten' => 'Nguyễn Văn A',
            'so_tien' => 500000,
            'ten_goi_tap' => 'Gói tập thử nghiệm',
            'ngay_bat_dau' => now()->format('d/m/Y'),
            'ngay_ket_thuc' => now()->addDays(30)->format('d/m/Y'),
        ];

        SendMailJob::dispatch(
            $data,
            'thanh_toan_goi_tap',
            'Thông báo thanh toán thành công',
            $request->email
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã đưa email vào hàng đợi gửi.',
        ]);
    }

    public function danhSachGoiTapCuaToi()
    {
        // 1. Lấy hội viên đăng nhập
        $hoiVien = Auth::guard('sanctum')->user();
        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }
        // 2. Lấy danh sách đăng ký và thông tin gói tập, PT
        $danhSach = DB::table('dang_ky_goi as dk')
            ->leftJoin('chi_tiet_dang_ky_goi as ct', 'dk.id', '=', 'ct.id_dang_ky_goi')
            ->leftJoin('goi_tap as gt', 'ct.id_goi_tap', '=', 'gt.id')
            ->leftJoin('trainers as tr', 'ct.id_trainer', '=', 'tr.id')
            ->where('dk.id_hoi_vien', $hoiVien->id)
            ->select(
                'dk.id',
                'dk.ngay_dang_ky',
                'dk.tinh_trang',
                'dk.is_thanh_toan',
                'dk.phuong_thuc_thanh_toan',
                'dk.tong_tien',

                'gt.id as id_goi_tap',
                'gt.ten_goi_tap as ten_goi',
                'gt.gia',
                'gt.thoi_han_ngay as thoi_han',

                'ct.so_buoi',
                'ct.so_buoi_pt',

                'tr.id as id_trainer',
                'tr.ho_ten'
            )
            ->orderByDesc('dk.ngay_dang_ky')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách gói tập thành công.',
            'data' => $danhSach,
        ], 200);
    }

    public function chiTietGoiTapCuaToi($id)
    {
        // 1. Lấy hội viên đăng nhập
        $hoiVien = Auth::guard('sanctum')->user();

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        // 2. Lấy thông tin đăng ký
        $dangKy = DB::table('dang_ky_goi as dk')
            ->leftJoin('chi_tiet_dang_ky_goi as ct', 'dk.id', '=', 'ct.id_dang_ky_goi')
            ->leftJoin('goi_tap as gt', 'ct.id_goi_tap', '=', 'gt.id')
            ->leftJoin('trainers as tr', 'ct.id_trainer', '=', 'tr.id')
            ->where('dk.id', $id)
            ->where('dk.id_hoi_vien', $hoiVien->id)
            ->select(
                'dk.id',
                'dk.ngay_dang_ky',
                'dk.tinh_trang',
                'dk.is_thanh_toan',
                'dk.phuong_thuc_thanh_toan',
                'dk.tong_tien',

                'gt.id as id_goi_tap',
                'gt.ten_goi_tap as ten_goi',
                'gt.mo_ta',
                'gt.co_ai',
                'gt.co_trainer_review',
                'gt.gia',
                'gt.thoi_han_ngay as thoi_han',

                'ct.so_buoi',
                'ct.so_buoi_pt',
                'ct.don_gia',
                'ct.tien_giam_khuyen_mai',
                'ct.tien_giam_gioi_thieu',
                'ct.giam_gia',
                'ct.thanh_tien',
                'ct.ngay_bat_dau',
                'ct.ngay_ket_thuc',

                'tr.id as id_trainer',
                'tr.ho_ten',
                'tr.chuyen_mon'
            )
            ->first();

        if (!$dangKy) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đăng ký gói tập.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đăng ký thành công.',
            'data' => $dangKy,
        ], 200);
    }









}
