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
        // 1. Lấy danh sách ngày hoàn thành buổi tập
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
        // 2. Lấy các mốc phần thưởng đang hoạt động từ database
        $mocPhanThuong = DB::table('moc_phan_thuong_chuoi_tap')
            ->where('trang_thai', 1)
            ->orderBy('so_ngay')
            ->get();
        // 3. Tính chuỗi ngày tập
        $chuoiHienTai = 0;
        $chuoiDaiNhat = 0;
        $ngayTruoc = null;
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
            // Kiểm tra ngày đạt từng mốc
            foreach ($mocPhanThuong as $moc) {
                if (
                    $chuoiHienTai == $moc->so_ngay &&
                    !isset($ngayDatMoc[$moc->id])
                ) {
                    $ngayDatMoc[$moc->id] = $ngayHienTai->toDateTimeString();
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
            // Tập hôm nay hoặc hôm qua vẫn duy trì chuỗi
            if ($khoangCach <= 1) {
                $chuoiDangDuyTri = $chuoiHienTai;
            }
        }
        // 5. Lấy phần thưởng đã đạt trước đó
        $phanThuongCu = DB::table('phan_thuong_chuoi_tap')
            ->where('id_hoi_vien', $idHoiVien)
            ->where('id_dang_ky_chuong_trinh', $idDangKy)
            ->get();
        $phanThuongMoi = [];
        // 6. Kiểm tra và thêm phần thưởng khi đạt mốc
        foreach ($mocPhanThuong as $moc) {
            // Kiểm tra phần thưởng đã tồn tại theo ID mốc
            $kiemTra = $phanThuongCu->firstWhere(
                'id_moc_phan_thuong',
                $moc->id
            );
            // Hỗ trợ cả dữ liệu phần thưởng cũ chưa có id_moc_phan_thuong
            if (!$kiemTra) {
                $kiemTra = $phanThuongCu->first(function ($item) use ($moc) {
                    return $item->id_moc_phan_thuong == null
                        && $item->so_ngay == $moc->so_ngay;
                });
            }
            // Chỉ tạo phần thưởng nếu đạt mốc và chưa có phần thưởng
            if (
                isset($ngayDatMoc[$moc->id]) &&
                !$kiemTra
            ) {

                $idMoi = DB::table('phan_thuong_chuoi_tap')->insertGetId([
                    'id_hoi_vien' => $idHoiVien,
                    'id_dang_ky_chuong_trinh' => $idDangKy,
                    'id_moc_phan_thuong' => $moc->id,
                    'so_ngay' => $moc->so_ngay,
                    'ten_phan_thuong' => $moc->ten_phan_thuong,
                    'tinh_trang' => 0,
                    'ngay_dat_moc' => $ngayDatMoc[$moc->id],
                    'ngay_nhan' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $phanThuongMoi[] = [
                    'id' => $idMoi,
                    'id_moc_phan_thuong' => $moc->id,
                    'so_ngay' => $moc->so_ngay,
                    'ten_phan_thuong' => $moc->ten_phan_thuong,
                ];

                // Tạo thông báo khi đạt mốc mới
                DB::table('thong_bao')->insert([
                    'id_nguoi_nhan' => $idHoiVien,
                    'vai_tro' => 'hoi_vien',
                    'loai' => 'success',
                    'tieu_de' => 'Chúc mừng bạn!',
                    'noi_dung' => "Bạn đã hoàn thành chuỗi {$moc->so_ngay} ngày tập liên tiếp và đạt được {$moc->ten_phan_thuong}!",
                    'da_doc' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        // 7. Lấy lại danh sách phần thưởng sau khi cập nhật
        $phanThuong = DB::table('phan_thuong_chuoi_tap')
            ->where('id_hoi_vien', $idHoiVien)
            ->where('id_dang_ky_chuong_trinh', $idDangKy)
            ->orderBy('so_ngay')
            ->get();

        // 8. Tạo trạng thái cho từng mốc phần thưởng
        $cacMocPhanThuong = [];
        foreach ($mocPhanThuong as $moc) {

            $daDat = $phanThuong->first(function ($item) use ($moc) {
                return $item->id_moc_phan_thuong == $moc->id
                    || (
                        $item->id_moc_phan_thuong == null
                        && $item->so_ngay == $moc->so_ngay
                    );
            });

            if ($daDat) {
                $trangThai = 'da_dat';
            } else {
                $trangThai = 'chua_mo';
            }

            $cacMocPhanThuong[] = [
                'id_moc_phan_thuong' => $moc->id,
                'so_ngay' => $moc->so_ngay,
                'ten_phan_thuong' => $moc->ten_phan_thuong,
                'mo_ta' => $moc->mo_ta,
                'hinh_anh' => $moc->hinh_anh,
                'trang_thai' => $trangThai,
                'id_phan_thuong' => $daDat->id ?? null,
                'da_nhan' => $daDat ? (int) $daDat->tinh_trang : null,
                'ngay_dat_moc' => $daDat->ngay_dat_moc ?? null,
                'ngay_nhan' => $daDat->ngay_nhan ?? null,
            ];
        }

        // 9. Xác định mốc tiếp theo chưa đạt
        $mocTiepTheo = null;

        foreach ($cacMocPhanThuong as $moc) {

            if ($moc['trang_thai'] == 'chua_mo') {

                $mocTiepTheo = $moc['so_ngay'];

                // Đánh dấu mốc này đang chinh phục
                $moc['trang_thai'] = 'dang_chinh_phuc';

                break;
            }
        }

        // Cập nhật trạng thái mốc đang chinh phục trong danh sách
        if ($mocTiepTheo !== null) {

            foreach ($cacMocPhanThuong as &$moc) {

                if ($moc['so_ngay'] == $mocTiepTheo) {
                    $moc['trang_thai'] = 'dang_chinh_phuc';
                    $moc['so_ngay_con_lai'] = max(
                        0,
                        $mocTiepTheo - $chuoiDangDuyTri
                    );
                } else {
                    $moc['so_ngay_con_lai'] = 0;
                }
            }

            unset($moc);

        } else {

            foreach ($cacMocPhanThuong as &$moc) {
                $moc['so_ngay_con_lai'] = 0;
            }

            unset($moc);
        }

        // 10. Tính phần trăm tiến độ mốc tiếp theo
        $tienDoMoc = $mocTiepTheo
            ? min(100, round(($chuoiDangDuyTri / $mocTiepTheo) * 100))
            : 100;

        // 11. Thống kê tần suất tập trong tuần
        $batDauTuan = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $ketThucTuan = Carbon::now()->endOfWeek(Carbon::SUNDAY);

        $buoiTapTrongTuan = DB::table('lich_tap as lt')
            ->join('buoi_tap as bt', 'lt.id', '=', 'bt.id_lich_tap')
            ->where('lt.id_dang_ky_chuong_trinh', $idDangKy)
            ->where('bt.id_hoi_vien', $idHoiVien)
            ->where('bt.tinh_trang', 3)
            ->whereNotNull('bt.thoi_gian_ket_thuc')
            ->whereBetween('bt.thoi_gian_ket_thuc', [
                $batDauTuan,
                $ketThucTuan
            ])
            ->selectRaw('DATE(bt.thoi_gian_ket_thuc) as ngay_tap')
            ->selectRaw('COUNT(bt.id) as so_buoi')
            ->groupByRaw('DATE(bt.thoi_gian_ket_thuc)')
            ->get();

        // Khởi tạo đủ 7 ngày
        $thongKeTheoNgay = [];

        $tenThu = [
            1 => 'Thứ 2',
            2 => 'Thứ 3',
            3 => 'Thứ 4',
            4 => 'Thứ 5',
            5 => 'Thứ 6',
            6 => 'Thứ 7',
            7 => 'Chủ nhật',
        ];

        for ($i = 0; $i < 7; $i++) {

            $ngay = $batDauTuan->copy()->addDays($i);

            $thongKeTheoNgay[] = [
                'thu' => $ngay->dayOfWeekIso,
                'ten_thu' => $tenThu[$ngay->dayOfWeekIso],
                'ngay' => $ngay->toDateString(),
                'so_buoi' => 0,
                'la_hom_nay' => $ngay->isToday(),
            ];
        }

        // Gán số buổi tập từng ngày
        foreach ($buoiTapTrongTuan as $buoi) {

            $ngay = Carbon::parse($buoi->ngay_tap);
            $viTri = $ngay->dayOfWeekIso - 1;

            $thongKeTheoNgay[$viTri]['so_buoi'] = (int) $buoi->so_buoi;
        }

        $tongBuoiTapTuan = $buoiTapTrongTuan->sum('so_buoi');
        $soNgayDaTapTuan = $buoiTapTrongTuan->count();

        // 12. Trả dữ liệu về frontend
        return response()->json([
            'success' => true,

            'chuoi_tap' => [
                'so_ngay_da_tap' => $ngayTap->count(),
                'chuoi_dang_duy_tri' => $chuoiDangDuyTri,
                'chuoi_dai_nhat' => $chuoiDaiNhat,
                'moc_tiep_theo' => $mocTiepTheo,
                'so_ngay_con_lai' => $mocTiepTheo
                    ? max(0, $mocTiepTheo - $chuoiDangDuyTri)
                    : 0,
                'tien_do_moc' => $tienDoMoc,
            ],

            'cac_moc_phan_thuong' => $cacMocPhanThuong,

            'phan_thuong' => $phanThuong,

            'phan_thuong_moi' => $phanThuongMoi,

            'tan_suat_tuan' => [
                'tong_buoi_tap' => (int) $tongBuoiTapTuan,
                'so_ngay_da_tap' => $soNgayDaTapTuan,
                'muc_tieu_buoi_moi_ngay' => 1,
                'chi_tiet_theo_ngay' => $thongKeTheoNgay,
            ],
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
