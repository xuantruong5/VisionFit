<?php

namespace App\Http\Controllers;
use App\Http\Requests\ChuongTrinhBaiTap\ChangeSkipRequest;
use App\Models\DKChuongTrinh;
use App\Models\ChuongTrinhBaiTap;
use App\Models\DangKyChuongTrinhBaiTap;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChuongTrinhBaiTapController extends Controller
{
    public function changeSkip(ChangeSkipRequest $request, $id)
    {
        // 1. Lấy hội viên đăng nhập
        $hoiVien = Auth::guard('sanctum')->user();
        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        // 2. Tìm ngày tập mẫu
        $baiTap = ChuongTrinhBaiTap::find($id);
        if (!$baiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương trình bài tập.',
            ], 404);
        }

        // 3. Tìm lượt đăng ký đang hoạt động của hội viên
        $dangKy = DKChuongTrinh::where('id_hoi_vien', $hoiVien->id)
            ->where('id_chuong_trinh', $baiTap->id_chuong_trinh)
            ->where('tinh_trang', 1)
            ->first();

        if (!$dangKy) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn chưa đăng ký chương trình này.',
            ], 404);
        }

        // 4. Lấy trạng thái ngày tập riêng của hội viên
        $trangThai = DangKyChuongTrinhBaiTap::where( 'id_dang_ky_chuong_trinh', $dangKy->id )
            ->where('id_chuong_trinh_bai_tap', $baiTap->id)
            ->first();

        if (!$trangThai) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy trạng thái ngày tập.',
            ], 404);
        }

        // 5. Kiểm tra ngày tập đã mở khóa
        if ($trangThai->tinh_trang != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Ngày tập chưa được mở khóa.',
            ], 403);
        }

        if ($trangThai->cho_phep_bo_qua == 1) {
            return response()->json([
                'success' => false,
                'message' => 'Ngày tập đã được bỏ qua.',
            ], 400);
        }

        // 6. Cho phép bỏ qua ngày tập
        $trangThai->cho_phep_bo_qua = 1;
        $trangThai->save();

        // 7. Tìm ngày tập tiếp theo
        $ngayTiepTheo = ChuongTrinhBaiTap::where( 'id_chuong_trinh', $baiTap->id_chuong_trinh)
            ->where('ngay_thu', '>', $baiTap->ngay_thu)
            ->orderBy('ngay_thu')
            ->first();

        // 8. Mở khóa ngày tiếp theo cho riêng hội viên
        if ($ngayTiepTheo) {
            DangKyChuongTrinhBaiTap::where( 'id_dang_ky_chuong_trinh', $dangKy->id )
                ->where('id_chuong_trinh_bai_tap', $ngayTiepTheo->id)
                ->update([ 'tinh_trang' => 1, ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bỏ qua ngày tập thành công.',
            'data' => [
                'id_dang_ky_chuong_trinh' => $dangKy->id,
                'id_chuong_trinh_bai_tap' => $baiTap->id,
                'cho_phep_bo_qua' => 1,
                'ngay_tiep_theo' => $ngayTiepTheo,
            ],
        ], 200);
    }
}
