<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TanSuatThuongController extends Controller
{
    public function thongKeChuoiNgayTap(Request $request)
    {
       $hoiVien = Auth::guard('sanctum')->user();
        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }
        $request->validate([
            'id_dang_ky_chuong_trinh' => 'required|integer',
        ]);

        $idHoiVien = $hoiVien->id;
        $idDangKy = $request->id_dang_ky_chuong_trinh;

        // 1. Lấy danh sách ngày hội viên hoàn thành buổi tập
        $ngayTap = DB::table('lich_tap as lt')
            ->join('buoi_tap as bt', 'lt.id', '=', 'bt.id_lich_tap')
            ->where('lt.id_dang_ky_chuong_trinh', $idDangKy)
            ->where('bt.id_hoi_vien', $idHoiVien)
            ->where('bt.tinh_trang', 3)
            ->whereNotNull('bt.thoi_gian_ket_thuc')
            ->selectRaw('DATE(bt.thoi_gian_ket_thuc) as ngay_tap')
            ->distinct()
            ->orderBy('ngay_tap')
            ->pluck('ngay_tap');
        // 2. Khai báo các mốc phần thưởng
        $mocPhanThuong = [
            1 => 'Phần thưởng Test 1 ngày',
            3 => 'Huy hiệu Khởi động',
            7 => 'Huy hiệu Kiên trì',
            14 => 'Huy hiệu Chăm chỉ',
            21 => 'Huy hiệu Bền bỉ',
            30 => 'Huy hiệu Kỷ luật',
        ];
        // 3. Tính chuỗi ngày tập
        $chuoiHienTai = 0;
        $chuoiDaiNhat = 0;
        $ngayTruoc = null;
        // Lưu ngày đạt từng mốc
        $ngayDatMoc = [];
        foreach ($ngayTap as $ngay) {
            $ngayHienTai = Carbon::parse($ngay)->startOfDay();
            if ($ngayTruoc == null) {
                $chuoiHienTai = 1;
            } else {
                $khoangCach = $ngayTruoc->diffInDays($ngayHienTai);
                if ($khoangCach == 1) {
                    $chuoiHienTai++;
                } else {
                    $chuoiHienTai = 1;
                }
            }
            $chuoiDaiNhat = max($chuoiDaiNhat, $chuoiHienTai);
            // Kiểm tra ngày đạt mốc phần thưởng
            foreach ($mocPhanThuong as $soNgay => $ten) {
                if (
                    $chuoiHienTai == $soNgay &&
                    !isset($ngayDatMoc[$soNgay])
                ) {
                    $ngayDatMoc[$soNgay] = $ngayHienTai->toDateTimeString();
                }
            }
            $ngayTruoc = $ngayHienTai;
        }
        // 4. Tính chuỗi ngày tập hiện tại
        $chuoiDangDuyTri = 0;
        if ($ngayTap->count() > 0) {
            $ngayCuoi = Carbon::parse($ngayTap->last())->startOfDay();
            $homNay = Carbon::today();
            $khoangCach = $ngayCuoi->diffInDays($homNay);
            // Nếu tập hôm nay hoặc hôm qua thì vẫn duy trì chuỗi
            if ($khoangCach <= 1) {
                $chuoiDangDuyTri = $chuoiHienTai;
            }
        }
        // 5. Kiểm tra và thêm phần thưởng nếu đạt mốc
        $phanThuongMoi = [];

        foreach ($mocPhanThuong as $soNgay => $tenPhanThuong) {
            if (isset($ngayDatMoc[$soNgay])) {

                $kiemTra = DB::table('phan_thuong_chuoi_tap')
                    ->where('id_hoi_vien', $idHoiVien)
                    ->where('id_dang_ky_chuong_trinh', $idDangKy)
                    ->where('so_ngay', $soNgay)
                    ->first();

                if (!$kiemTra) {
                    $idMoi = DB::table('phan_thuong_chuoi_tap')->insertGetId([
                        'id_hoi_vien' => $idHoiVien,
                        'id_dang_ky_chuong_trinh' => $idDangKy,
                        'so_ngay' => $soNgay,
                        'ten_phan_thuong' => $tenPhanThuong,
                        'tinh_trang' => 0,
                        'ngay_dat_moc' => $ngayDatMoc[$soNgay],
                        'ngay_nhan' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $phanThuongMoi[] = [
                        'id' => $idMoi,
                        'so_ngay' => $soNgay,
                        'ten_phan_thuong' => $tenPhanThuong,
                    ];
                    DB::table('thong_bao')->insert([
                        'id_nguoi_nhan' => $idHoiVien,
                        'vai_tro' => 'hoi_vien',
                        'loai' => 'success',
                        'tieu_de' => 'Chúc mừng bạn!',
                        'noi_dung' => "Bạn đã hoàn thành chuỗi {$soNgay} ngày tập liên tiếp và đạt được {$tenPhanThuong}!",
                        'da_doc' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // 6. Lấy danh sách phần thưởng
        $phanThuong = DB::table('phan_thuong_chuoi_tap')
            ->where('id_hoi_vien', $idHoiVien)
            ->where('id_dang_ky_chuong_trinh', $idDangKy)
            ->orderBy('so_ngay')
            ->get();

        // 7. Xác định mốc tiếp theo
        $mocTiepTheo = null;

        foreach (array_keys($mocPhanThuong) as $moc) {

            if ($moc > $chuoiDangDuyTri) {
                $mocTiepTheo = $moc;
                break;
            }
        }

        return response()->json([
            'so_ngay_da_tap' => $ngayTap->count(),
            'chuoi_dang_duy_tri' => $chuoiDangDuyTri,
            'chuoi_dai_nhat' => $chuoiDaiNhat,
            'moc_tiep_theo' => $mocTiepTheo,
            'so_ngay_con_lai' => $mocTiepTheo? $mocTiepTheo - $chuoiDangDuyTri : 0,
            'phan_thuong' => $phanThuong,
            'phan_thuong_moi' => $phanThuongMoi,
        ]);
    }

    public function nhanPhanThuong(Request $request)
    {
        $hoiVien = Auth::guard('sanctum')->user();
        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }
        $request->validate([
            'id' => 'required|integer',
        ]);
        $idHoiVien = $hoiVien->id;
        $idPhanThuong = $request->id;

        $phanThuong = DB::table('phan_thuong_chuoi_tap')
            ->where('id', $idPhanThuong)
            ->where('id_hoi_vien', $idHoiVien)
            ->where('tinh_trang', 0)
            ->first();

        if (!$phanThuong) {
            return response()->json([
                'message' => 'Phần thưởng không tồn tại hoặc đã nhận!'
            ], 404);
        }

        DB::table('phan_thuong_chuoi_tap')
            ->where('id', $idPhanThuong)
            ->update([
                'tinh_trang' => 1,
                'ngay_nhan' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Nhận phần thưởng thành công!'
        ]);
    }
}
