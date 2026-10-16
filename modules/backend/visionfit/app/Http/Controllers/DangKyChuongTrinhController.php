<?php

namespace App\Http\Controllers;
use App\Http\Requests\DangKyChuongTrinh\StoreDKChuongTrinhRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DKChuongTrinh;
use App\Models\ChuongTrinhTap;
use App\Models\Client;
use App\Models\CapDo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DangKyChuongTrinhController extends Controller
{
    public function store(StoreDKChuongTrinhRequest $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Token không hợp lệ hoặc không xác định được hội viên.',
            ], 401);
        }
        $idHoiVien = $user->id;
        $data = $request->validated();
        $idChuongTrinh = $data['id_chuong_trinh'];
        $idCapDo = $data['id_cap_do'];
        $idNoiTap = $data['id_noi_tap'];
        // 1. Kiểm tra chương trình.
       $chuongTrinh = ChuongTrinhTap::where('id', $idChuongTrinh)
            ->where('tinh_trang', 1)
            ->first();

        if (!$chuongTrinh) {
            return response()->json([
                'success' => false,
                'message' => 'Chương trình không tồn tại hoặc không hoạt động.',
            ], 404);
        }

        $daDangKy = DKChuongTrinh::where('id_hoi_vien', $idHoiVien)
            ->where('id_chuong_trinh', $idChuongTrinh)
            ->whereIn('tinh_trang', [0, 1, 3])
            ->exists();
        if ($daDangKy) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đã đăng ký chương trình này và chưa kết thúc.',
            ], 409);
        }
        $capDo = CapDo::where('id', $idCapDo)->first();

        if (!$capDo) {
            return response()->json([
                'success' => false,
                'message' => 'Cấp độ không tồn tại.',
            ], 404);
        }
        $ngayBatDau = Carbon::today();
        $ngayKetThuc = $ngayBatDau->copy()->addDays($chuongTrinh->so_ngay);
        $dangKy = DKChuongTrinh::create([
            'id_hoi_vien' => $idHoiVien,
            'id_chuong_trinh' => $idChuongTrinh,
            'id_cap_do' => $idCapDo,
            'id_noi_tap' => $idNoiTap,
            'ngay_bat_dau' => $ngayBatDau,
            'ngay_du_kien_ket_thuc' =>$ngayKetThuc,
            'phan_tram_hoan_thanh' => 0,
            'tinh_trang' => '0',
        ]);
        return response()->json([
            'status' => true,
            'message' => 'Đăng ký chương trình thành công.',
            'data' => $dangKy,
        ], 201);
    
    }

    public function getMyPrograms(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập'
            ], 401);
        }
        $idHoiVien = $user->id;

        $chuongTrinh = DKChuongTrinh::where('id_hoi_vien', $idHoiVien)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $chuongTrinh
        ]);
    }
    
    public function getListPrograms()
    {
        // 1. Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }

        // 2. Lấy ID hội viên
        $idHoiVien = $user->id;

        // 3. Lấy danh sách chương trình hội viên đã đăng ký
        $data = DKChuongTrinh::where( 'dang_ky_chuong_trinh.id_hoi_vien', $idHoiVien )
            ->join( 'chuong_trinh_tap as ct', 'dang_ky_chuong_trinh.id_chuong_trinh',
                '=',
                'ct.id'
            )
            ->leftJoin(
                'cap_do as cd',
                'dang_ky_chuong_trinh.id_cap_do',
                '=',
                'cd.id'
            )
            ->select(
                'dang_ky_chuong_trinh.id',
                'dang_ky_chuong_trinh.id_chuong_trinh',
                'dang_ky_chuong_trinh.id_cap_do',
                'dang_ky_chuong_trinh.ngay_bat_dau',
                'dang_ky_chuong_trinh.ngay_du_kien_ket_thuc',
                'dang_ky_chuong_trinh.phan_tram_hoan_thanh',
                'dang_ky_chuong_trinh.tinh_trang',
                'ct.ten_chuong_trinh',
                'ct.anh_dai_dien',
                'ct.noi_tap',
                'ct.so_sao',
                'ct.so_ngay',
                'ct.so_buoi_moi_tuan',
                'cd.ten_cap_do'
            )
            ->orderByDesc('dang_ky_chuong_trinh.id')
            ->get();

        // 4. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách chương trình thành công',
            'data' => $data,
        ], 200);
    }
}
