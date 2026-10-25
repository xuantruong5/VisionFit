<?php

namespace App\Http\Controllers;
use App\Http\Requests\TienDo\BatDauBuoiTapRequest;
use App\Http\Requests\TienDo\CapNhatTienDoRequest;
use App\Http\Requests\TienDo\KetThucBuoiTapRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\BuoiTap;
use App\Models\ChuongTrinhBaiTap;
use App\Models\ChuongTrinhBaiTapChiTiet;
use App\Models\DKChuongTrinh;
use App\Models\TienDoBaiTap;
use App\Models\BaiTapPhanLoai;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

class BuoiTapController extends Controller
{

    public function batDau(BatDauBuoiTapRequest $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }
        $idHoiVien = $user->id;

        $data = $request->validated();
        $now = now();
        $buoiTap = BuoiTap::create([
            'id_hoi_vien' => $idHoiVien,
            'id_lich_tap' => $data['id_lich_tap'],
            'id_chuong_trinh_bai_tap' => $data['id_chuong_trinh_bai_tap'],
            'ngay_tap' => $now->toDateString(),
            'thoi_gian_bat_dau' => $now,
            'tong_thoi_gian_nghi' => 0,
            'tong_so_lan_lap' => 0,
            'phan_tram_hoan_thanh' => 0,
            'tinh_trang' => '1',
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Bắt đầu buổi tập thành công',
            'data' => [
                'buoi_tap' => $buoiTap,
                'id_buoi_tap' => $buoiTap->id,
            ],
        ], 201);
    }
    
    


    public function khoiTaoTienDo($id)
    {
        $idHoiVien = Auth::guard('sanctum')->id();
        if (!$idHoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }
            // 1. Tìm buổi tập thuộc hội viên
            $buoiTap = BuoiTap::where('id', $id)
                ->where('id_hoi_vien', $idHoiVien)
                ->first();
            if (!$buoiTap) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy buổi tập',
                ], 404);
            }
            if ($buoiTap->tinh_trang != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Buổi tập không ở trạng thái đang tập',
                ], 422);
            }

            // 2. Lấy chương trình bài tập đã được sinh trước đó
            $chuongTrinhBaiTap = ChuongTrinhBaiTap::where('id', $buoiTap->id_chuong_trinh_bai_tap)
                ->where('tinh_trang', '1')
                ->first();
            if (!$chuongTrinhBaiTap) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy chương trình bài tập đang hoạt động',
                ], 404);
            }

            // 3. Tìm đăng ký chương trình của hội viên
            $dangKy = DKChuongTrinh::where('id_hoi_vien', $idHoiVien)
                ->where('id_chuong_trinh', $chuongTrinhBaiTap->id_chuong_trinh)
                ->where('tinh_trang', 1)
                ->first();

            if (!$dangKy) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hội viên chưa đăng ký chương trình này',
                ], 404);
            }

            $idCapDo = $dangKy->id_cap_do;
            $idNoiTap = $dangKy->id_noi_tap;
            if (!$idCapDo || !$idNoiTap) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chưa xác định cấp độ hoặc nơi tập đã chọn',
                ], 422);
            }

            // 5. Lọc bài tập theo cấp độ và nơi tập
            $baiTapHopLe = BaiTapPhanLoai::where('id_cap_do', $idCapDo)
                ->where('id_noi_tap', $idNoiTap)
                ->pluck('id_bai_tap');

            // Chỉ lấy bài tập chi tiết thuộc chương trình đã sinh
            // và có phân loại phù hợp với lựa chọn của hội viên
            $baiTapChiTiets = ChuongTrinhBaiTapChiTiet::where('id_chuong_trinh_bai_tap', $chuongTrinhBaiTap->id)
                ->whereNotNull('id_bai_tap')
                ->whereIn('id_bai_tap', $baiTapHopLe)
                ->orderBy('thu_tu')
                ->get();

            if ($baiTapChiTiets->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có bài tập phù hợp với cấp độ và nơi tập đã chọn',
                ], 404);
            }

            // 6. Tạo tiến độ cho từng bài tập, không tạo trùng
            $danhSachTienDo = [];
            foreach ($baiTapChiTiets->values() as $index => $chiTiet) {
                $tienDo = TienDoBaiTap::firstOrCreate(
                    [
                        'id_dang_ky_chuong_trinh' => $dangKy->id,
                        'id_chuong_trinh_bai_tap' => $chuongTrinhBaiTap->id,
                        'id_bai_tap' => $chiTiet->id_bai_tap,
                    ],
                    [
                        'id_buoi_tap' => $buoiTap->id,
                        'so_set_thuc_te' => 0,
                        'so_phut_thuc_te' => 0,
                        'so_rep_thuc_te' => 0,
                        'thoi_gian_thuc_te_giay' => 0,
                        'trong_luong_ta_thuc_te' => 0,
                        'tinh_trang' => 0,
                    ]
                );

                $danhSachTienDo[] = [
                    'id_tien_do_bai_tap' => $tienDo->id,
                    'id_bai_tap' => $chiTiet->id_bai_tap,
                    'thu_tu' => $chiTiet->thu_tu,
                    'tinh_trang' => $tienDo->tinh_trang,
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Khởi tạo tiến độ bài tập thành công',
                'data' => [
                    'id_buoi_tap' => $buoiTap->id,
                    'id_dang_ky_chuong_trinh' => $dangKy->id,
                    'id_cap_do' => $idCapDo,
                    'id_noi_tap' => $idNoiTap,
                    'tong_so_bai_tap' => count($danhSachTienDo),
                    'danh_sach_tien_do' => $danhSachTienDo,
                ],
            ]);
    }
    
    public function capNhatTienDo( CapNhatTienDoRequest $request, $id, $idTienDo) {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }

        $data = $request->validated();

        if (empty($data)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn chưa gửi dữ liệu cần cập nhật',
            ], 422);
        }

        // Kiểm tra buổi tập thuộc hội viên đang đăng nhập.
        $buoiTap = BuoiTap::where('id', $id)
            ->where('id_hoi_vien', $user->id)
            ->first();

        if (!$buoiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tập',
            ], 404);
        }

        // Chỉ cập nhật khi buổi tập đang diễn ra.
        if ((int) $buoiTap->tinh_trang !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Buổi tập không ở trạng thái đang tập',
            ], 422);
        }

        // Tìm tiến độ theo ID và chương trình/ngày tập,
        // không ràng buộc id_buoi_tap vì tiến độ được giữ qua nhiều buổi.
        $tienDo = TienDoBaiTap::where('id', $idTienDo)
            ->where('id_chuong_trinh_bai_tap', $buoiTap->id_chuong_trinh_bai_tap)
            ->whereHas('dangKyChuongTrinh', function ($query) use ($user) {
                $query->where('id_hoi_vien', $user->id);
            })
            ->first();

        if (!$tienDo) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tiến độ của bài tập trong chương trình này',
            ], 404);
        }

        // Không ghi đè bài tập đã hoàn thành.
        if ((int) $tienDo->tinh_trang === 2) {
            return response()->json([
                'success' => false,
                'message' => 'Bài tập này đã hoàn thành',
            ], 422);
        }

        // Cập nhật tiến độ.
        $tienDo->fill($data);
        $tienDo->tinh_trang = 1;
        $tienDo->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật tiến độ bài tập thành công',
            'data' => $tienDo,
        ], 200);
    }

    
    public function hoanThanhBaiTap($id, $idTienDo)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }

        // 1. Kiểm tra buổi tập thuộc hội viên
        $buoiTap = BuoiTap::where('id', $id)
            ->where('id_hoi_vien', $user->id)
            ->first();

        if (!$buoiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tập',
            ], 404);
        }

        if ($buoiTap->tinh_trang != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Buổi tập không ở trạng thái đang tập',
            ], 422);
        }

        // 2. Tìm tiến độ thuộc buổi tập
        $tienDo = TienDoBaiTap::where('id', $idTienDo)
            ->whereHas('dangKyChuongTrinh', function ($query) use ($user) {
                $query->where('id_hoi_vien', $user->id);
            })
            ->first();

        if (!$tienDo) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tiến độ bài tập',
            ], 404);
        }

        // 3. Đánh dấu bài tập hoàn thành
        $tienDo->tinh_trang = 2;
        $tienDo->save();

        // 4. Đếm tổng số bài tập trong buổi
        $tongSoBai = TienDoBaiTap::where(
            'id_buoi_tap',
            $buoiTap->id
        )->count();

        // 5. Đếm số bài tập đã hoàn thành
        $soBaiHoanThanh = TienDoBaiTap::where(
            'id_buoi_tap',
            $buoiTap->id
        )
            ->where('tinh_trang', 2)
            ->count();

        // 6. Tính phần trăm hoàn thành
        $phanTram = $tongSoBai > 0
            ? round($soBaiHoanThanh / $tongSoBai * 100, 2)
            : 0;

        // 7. Cập nhật phần trăm vào buổi tập
        $buoiTap->phan_tram_hoan_thanh = $phanTram;
        $buoiTap->save();

        // 8. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Hoàn thành bài tập thành công',
            'data' => [
                'id_buoi_tap' => $buoiTap->id,
                'id_tien_do_bai_tap' => $tienDo->id,
                'tinh_trang_bai_tap' => $tienDo->tinh_trang,
                'so_bai_hoan_thanh' => $soBaiHoanThanh,
                'tong_so_bai_tap' => $tongSoBai,
                'phan_tram_hoan_thanh' => $phanTram,
            ],
        ], 200);
    }

    // public function ketThuc(KetThucBuoiTapRequest $request, $id)
    // {
        // 1. Kiểm tra người dùng đăng nhập
        // $user = Auth::guard('sanctum')->user();

        // if (!$user) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Chưa đăng nhập',
        //     ], 401);
        // }

        // 2. Lấy dữ liệu đã được Request kiểm tra
        // $data = $request->validated();

        // 3. Tìm buổi tập thuộc hội viên đang đăng nhập
        // $buoiTap = BuoiTap::where('id', $id)
        //     ->where('id_hoi_vien', $user->id)
        //     ->first();

        // if (!$buoiTap) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Không tìm thấy buổi tập',
        //     ], 404);
        // }

        // 4. Kiểm tra trạng thái buổi tập
        // if ($buoiTap->tinh_trang != 1) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Buổi tập không ở trạng thái đang tập',
        //     ], 422);
        // }

        // 5. Kiểm tra thời gian bắt đầu
        // if (!$buoiTap->thoi_gian_bat_dau) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Buổi tập chưa có thời gian bắt đầu',
        //     ], 422);
        // }

        // 6. Tính thời gian tập từ lúc bắt đầu đến lúc kết thúc
        // $now = now();

        // $batDau = Carbon::parse($buoiTap->thoi_gian_bat_dau);

        // $tongThoiGian = max(
        //     0,
        //     $batDau->diffInSeconds($now)
        // );

        // 7. Tính tổng số rep thực tế của các bài tập
        // $tongSoLanLap = TienDoBaiTap::where(
        //     'id_buoi_tap',
        //     $buoiTap->id
        // )->sum('so_rep_thuc_te');

        // 8. Đếm tổng số bài tập trong buổi
        // $tongSoBai = TienDoBaiTap::where(
        //     'id_buoi_tap',
        //     $buoiTap->id
        // )->count();

        // 9. Đếm số bài tập đã hoàn thành
        // $soBaiHoanThanh = TienDoBaiTap::where(
        //     'id_buoi_tap',
        //     $buoiTap->id
        // )
        //     ->where('tinh_trang', 2)
        //     ->count();

        // 10. Tính phần trăm hoàn thành
        // $phanTram = $tongSoBai > 0
        //     ? round($soBaiHoanThanh / $tongSoBai * 100, 2)
        //     : 0;

        // 11. Xác định trạng thái buổi tập
        // 2 = hoàn thành tất cả bài tập
        // 3 = kết thúc nhưng chưa hoàn thành tất cả bài tập
        // $tinhTrang = ($tongSoBai > 0 && $soBaiHoanThanh == $tongSoBai)
        //     ? 2
        //     : 3;

        // 12. Cập nhật thông tin kết thúc buổi tập
        // $buoiTap->thoi_gian_ket_thuc = $now;
        // $buoiTap->tong_thoi_gian_giay = $tongThoiGian;

        // if (array_key_exists('tong_thoi_gian_nghi', $data)) {
        //     $buoiTap->tong_thoi_gian_nghi = $data['tong_thoi_gian_nghi'];
        // }

        // $buoiTap->tong_so_lan_lap = $tongSoLanLap;
        // $buoiTap->phan_tram_hoan_thanh = $phanTram;
        // $buoiTap->tinh_trang = $tinhTrang;

        // $buoiTap->save();

        // 13. Trả kết quả
    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Kết thúc buổi tập thành công',
    //         'data' => [
    //             'id_buoi_tap' => $buoiTap->id,
    //             'thoi_gian_bat_dau' => $buoiTap->thoi_gian_bat_dau,
    //             'thoi_gian_ket_thuc' => $buoiTap->thoi_gian_ket_thuc,
    //             'tong_thoi_gian_giay' => $tongThoiGian,
    //             'tong_thoi_gian_nghi' => $buoiTap->tong_thoi_gian_nghi,
    //             'tong_so_lan_lap' => $tongSoLanLap,
    //             'phan_tram_hoan_thanh' => $phanTram,
    //             'tong_so_bai_tap' => $tongSoBai,
    //             'so_bai_hoan_thanh' => $soBaiHoanThanh,
    //             'tinh_trang' => $tinhTrang,
    //         ],
    //     ], 200);
    // }



    public function ketThuc(KetThucBuoiTapRequest $request, $id)
    {
        // 1. Kiểm tra người dùng đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }

        // 2. Lấy dữ liệu Request đã kiểm tra
        $data = $request->validated();

        // 3. Tìm buổi tập thuộc hội viên đang đăng nhập
        $buoiTap = BuoiTap::where('id', $id)
            ->where('id_hoi_vien', $user->id)
            ->first();

        if (!$buoiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tập',
            ], 404);
        }

        // 4. Kiểm tra trạng thái buổi tập
        if ($buoiTap->tinh_trang != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Buổi tập không ở trạng thái đang tập',
            ], 422);
        }

        // 5. Kiểm tra thời gian bắt đầu
        if (!$buoiTap->thoi_gian_bat_dau) {
            return response()->json([
                'success' => false,
                'message' => 'Buổi tập chưa có thời gian bắt đầu',
            ], 422);
        }

        // 6. Tính tổng thời gian buổi tập
        $now = now();

        $batDau = Carbon::parse($buoiTap->thoi_gian_bat_dau);

        $tongThoiGian = max(
            0,
            $batDau->diffInSeconds($now)
        );

        // 7. Lấy tiến độ bài tập và JOIN bảng bai_tap
        $tienDos = TienDoBaiTap::query()
            ->leftJoin(
                'bai_tap',
                'tien_do_bai_taps.id_bai_tap',
                '=',
                'bai_tap.id'
            )
            ->where('tien_do_bai_taps.id_buoi_tap', $buoiTap->id)
            ->select(
                'tien_do_bai_taps.*',
                'bai_tap.ten_bai_tap',
                'bai_tap.set_yeu_cau',
                'bai_tap.thoi_gian_phut',
                'bai_tap.giay_yeu_cau'
            )
            ->get();

        // 8. Khởi tạo số liệu tổng hợp
        $tongSoLanLap = $tienDos->sum('so_rep_thuc_te');
        $tongSoBai = $tienDos->count();

        $tongPhanTram = 0;
        $soBaiCoMucTieu = 0;
        $soBaiHoanThanh = 0;

        $chiTietTienDo = [];

        // 9. Tính tiến độ từng bài
        foreach ($tienDos as $item) {
            $mucTieu = null;
            $thucTe = null;
            $donVi = null;
            $phanTramBai = null;

            // Ưu tiên tính theo số hiệp
            if (
                $item->set_yeu_cau !== null &&
                $item->set_yeu_cau > 0
            ) {
                $mucTieu = (float) $item->set_yeu_cau;
                $thucTe = max(
                    0,
                    (float) ($item->so_set_thuc_te ?? 0)
                );

                $donVi = 'set';
            }

            // Nếu không có mục tiêu hiệp, tính theo phút
            elseif (
                $item->thoi_gian_phut !== null &&
                $item->thoi_gian_phut > 0
            ) {
                $mucTieu = (float) $item->thoi_gian_phut;

                // Ưu tiên số phút thực tế.
                // Nếu không có thì đổi giây sang phút.
                $thucTe = $item->so_phut_thuc_te !== null
                    ? max(0, (float) $item->so_phut_thuc_te)
                    : max(
                        0,
                        (float) ($item->thoi_gian_thuc_te_giay ?? 0) / 60
                    );

                $donVi = 'phut';
            }

            // Nếu không có mục tiêu phút, tính theo giây
            elseif (
                $item->giay_yeu_cau !== null &&
                $item->giay_yeu_cau > 0
            ) {
                $mucTieu = (float) $item->giay_yeu_cau;

                // Ưu tiên số giây thực tế.
                // Nếu không có thì đổi phút sang giây.
                $thucTe = $item->thoi_gian_thuc_te_giay !== null
                    ? max(0, (float) $item->thoi_gian_thuc_te_giay)
                    : max(
                        0,
                        (float) ($item->so_phut_thuc_te ?? 0) * 60
                    );

                $donVi = 'giay';
            }

            // 10. Tính phần trăm của bài có mục tiêu
            if ($mucTieu !== null && $mucTieu > 0) {
                $phanTramBai = round(
                    min(100, $thucTe / $mucTieu * 100),
                    2
                );

                $tongPhanTram += $phanTramBai;
                $soBaiCoMucTieu++;

                if ($phanTramBai >= 100) {
                    $soBaiHoanThanh++;
                }
            }

            // Bài không có mục tiêu set/phút/giây:
            // dùng trạng thái hoàn thành hiện tại
            elseif ((int) $item->tinh_trang === 2) {
                $soBaiHoanThanh++;
            }

            // 11. Lưu chi tiết tiến độ để trả về FE
            $chiTietTienDo[] = [
                'id_bai_tap' => $item->id_bai_tap,
                'ten_bai_tap' => $item->ten_bai_tap,
                'muc_tieu' => $mucTieu,
                'thuc_te' => $thucTe,
                'don_vi' => $donVi,
                'phan_tram_hoan_thanh' => $phanTramBai,
                'tinh_trang' => $item->tinh_trang,
            ];
        }

        // 12. Tính phần trăm chung của buổi tập
        $phanTram = $soBaiCoMucTieu > 0
            ? round($tongPhanTram / $soBaiCoMucTieu, 2)
            : 0;

        // 13. Xác định trạng thái buổi tập
        // 2 = tất cả bài đã hoàn thành
        // 3 = kết thúc nhưng còn bài chưa hoàn thành
        $tinhTrang = (
            $tongSoBai > 0 &&
            $soBaiHoanThanh === $tongSoBai
        ) ? 2 : 3;

        // 14. Cập nhật thông tin kết thúc buổi tập
        $buoiTap->thoi_gian_ket_thuc = $now;
        $buoiTap->tong_thoi_gian_giay = $tongThoiGian;

        if (array_key_exists('tong_thoi_gian_nghi', $data)) {
            $buoiTap->tong_thoi_gian_nghi =
                $data['tong_thoi_gian_nghi'];
        }

        $buoiTap->tong_so_lan_lap = $tongSoLanLap;
        $buoiTap->phan_tram_hoan_thanh = $phanTram;
        $buoiTap->tinh_trang = $tinhTrang;

        $buoiTap->save();

        // 15. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Kết thúc buổi tập thành công',
            'data' => [
                'id_buoi_tap' => $buoiTap->id,
                'thoi_gian_bat_dau' => $buoiTap->thoi_gian_bat_dau,
                'thoi_gian_ket_thuc' => $buoiTap->thoi_gian_ket_thuc,
                'tong_thoi_gian_giay' => $tongThoiGian,
                'tong_thoi_gian_nghi' => $buoiTap->tong_thoi_gian_nghi,
                'tong_so_lan_lap' => $tongSoLanLap,
                'phan_tram_hoan_thanh' => $phanTram,
                'tong_so_bai_tap' => $tongSoBai,
                'so_bai_hoan_thanh' => $soBaiHoanThanh,
                'tinh_trang' => $tinhTrang,
                'chi_tiet_tien_do' => $chiTietTienDo,
            ],
        ], 200);
    }










}
