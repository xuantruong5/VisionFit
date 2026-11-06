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
use App\Models\LichSuHiepTap;
use App\Models\DangKyChuongTrinhBaiTap;
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
                // ->where('tinh_trang', '1')
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
            // 4. Lấy trạng thái từ bảng đăng ký chương trình bài tập
            $dangKyBaiTap = DangKyChuongTrinhBaiTap::where('id_dang_ky_chuong_trinh', $dangKy->id )
                ->where('id_chuong_trinh_bai_tap', $chuongTrinhBaiTap->id)
                ->first();

            if (!$dangKyBaiTap) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đăng ký chương trình bài tập',
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
                    'phan_tram_hoan_thanh' => (float) $tienDo->phan_tram_hoan_thanh,
                    'tinh_trang' => $dangKyBaiTap->tinh_trang,
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

    private function tinhPhanTramBaiTap(TienDoBaiTap $tienDo): float
    {
        $baiTap = DB::table('bai_tap')
            ->where('id', $tienDo->id_bai_tap)
            ->first();

        if (!$baiTap) {
            return 0;
        }
        // Bài đã được đánh dấu hoàn thành
        if ((int) $tienDo->tinh_trang === 2) {
            return 100;
        }
        $mucTieu = 0;
        $thucTe = 0;

        // Ưu tiên tính theo số set
        if ((float) ($baiTap->set_yeu_cau ?? 0) > 0) {
            $mucTieu = (float) $baiTap->set_yeu_cau;
            $thucTe = max(0, (float) ($tienDo->so_set_thuc_te ?? 0));
        }
        // Tính theo số phút
        elseif ((float) ($baiTap->thoi_gian_phut ?? 0) > 0) {
            $mucTieu = (float) $baiTap->thoi_gian_phut;

            $thucTe = $tienDo->so_phut_thuc_te !== null
                ? max(0, (float) $tienDo->so_phut_thuc_te)
                : max(
                    0,
                    (float) ($tienDo->thoi_gian_thuc_te_giay ?? 0) / 60
                );
        }
        // Tính theo số giây
        elseif ((float) ($baiTap->giay_yeu_cau ?? 0) > 0) {
            $mucTieu = (float) $baiTap->giay_yeu_cau;
            $thucTe = $tienDo->thoi_gian_thuc_te_giay !== null
                ? max(0, (float) $tienDo->thoi_gian_thuc_te_giay) : max( 0,  (float) ($tienDo->so_phut_thuc_te ?? 0) * 60);
        }
        if ($mucTieu <= 0) {
            return 0;
        }
        return round( min(100, ($thucTe / $mucTieu) * 100), 2);
    }
    
    private function capNhatPhanTramTichLuy( BuoiTap $buoiTap, TienDoBaiTap $tienDo): array 
    {
        $tienDos = TienDoBaiTap::where( 'id_dang_ky_chuong_trinh', $tienDo->id_dang_ky_chuong_trinh)
            ->where( 'id_chuong_trinh_bai_tap', $buoiTap->id_chuong_trinh_bai_tap)
            ->get();
        $tongSoBai = $tienDos->count();
        $tongPhanTram = (float) $tienDos->sum( 'phan_tram_hoan_thanh');
        $soBaiHoanThanh = $tienDos
            ->where('tinh_trang', 2)
            ->count();
        $phanTram = $tongSoBai > 0  ? round($tongPhanTram / $tongSoBai, 2) : 0;
        $buoiTap->phan_tram_hoan_thanh = $phanTram;
        $buoiTap->save();
        return [
            'tong_so_bai_tap' => $tongSoBai,
            'so_bai_hoan_thanh' => $soBaiHoanThanh,
            'phan_tram_hoan_thanh' => $phanTram,
        ];
    }

    
    private function tinhTienDoChuongTrinh( int $idDangKy, int $idChuongTrinhBaiTap): array 
    {
        $tienDos = TienDoBaiTap::where( 'id_dang_ky_chuong_trinh', $idDangKy )
            ->where( 'id_chuong_trinh_bai_tap', $idChuongTrinhBaiTap )
            ->get();

        $tongSoBai = $tienDos->count();
        $soBaiHoanThanh = $tienDos
            ->where('tinh_trang', 2)
            ->count();

        $tongPhanTram = $tienDos->sum( fn ($item) => (float) $item->phan_tram_hoan_thanh);

        $phanTram = $tongSoBai > 0 ? round($tongPhanTram / $tongSoBai, 2) : 0;

        return [
            'tong_so_bai_tap' => $tongSoBai,
            'so_bai_hoan_thanh' => $soBaiHoanThanh,
            'phan_tram_hoan_thanh' => $phanTram,
        ];
    }

    
    public function capNhatTienDo( CapNhatTienDoRequest $request, $id, $idTienDo) 
    {
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

        // 1. Kiểm tra buổi tập thuộc hội viên.
        $buoiTap = BuoiTap::where('id', $id)
            ->where('id_hoi_vien', $user->id)
            ->first();

        if (!$buoiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tập',
            ], 404);
        }

        if ((int) $buoiTap->tinh_trang !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Buổi tập không ở trạng thái đang tập',
            ], 422);
        }

        // 2. Tìm tiến độ của hội viên trong đúng chương trình.
        // Không ràng buộc id_buoi_tap vì tiến độ dùng chung
        // qua nhiều buổi tập của cùng lần đăng ký.
        $tienDo = TienDoBaiTap::where('id', $idTienDo)
            ->where('id_chuong_trinh_bai_tap', $buoiTap->id_chuong_trinh_bai_tap )
            ->whereHas('dangKyChuongTrinh', function ($query) use ($user) {
                $query->where('id_hoi_vien', $user->id)
                    ->where('tinh_trang', 1);
            })
            ->first();

        if (!$tienDo) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tiến độ bài tập trong chương trình',
            ], 404);
        }

        // 3. Không cho sửa bài đã hoàn thành.
        if ((int) $tienDo->tinh_trang === 2) {
            return response()->json([
                'success' => false,
                'message' => 'Bài tập này đã hoàn thành',
            ], 422);
        }

        // 4. Cập nhật dữ liệu tập luyện thực tế.
        $tienDo->fill($data);
        $tienDo->phan_tram_hoan_thanh =
            $this->tinhPhanTramBaiTap($tienDo);
        $tienDo->tinh_trang = 1;
        $tienDo->save();

        // 5. Tính lại tiến độ tích lũy của toàn chương trình.
        $thongKe = $this->capNhatPhanTramTichLuy(  $buoiTap, $tienDo);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật tiến độ bài tập thành công',
            'data' => [
                'id_buoi_tap' => $buoiTap->id,
                'id_tien_do_bai_tap' => $tienDo->id,
                'id_bai_tap' => $tienDo->id_bai_tap,
                'phan_tram_bai_tap' => (float) $tienDo->phan_tram_hoan_thanh,
                'phan_tram_hoan_thanh' => $thongKe['phan_tram_hoan_thanh'],
                'tong_so_bai_tap' => $thongKe['tong_so_bai_tap'],
                'so_bai_hoan_thanh' => $thongKe['so_bai_hoan_thanh'],
                'tinh_trang' => $tienDo->tinh_trang,
            ],
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

        // 1. Kiểm tra buổi tập thuộc hội viên.
        $buoiTap = BuoiTap::where('id', $id)
            ->where('id_hoi_vien', $user->id)
            ->first();

        if (!$buoiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tập',
            ], 404);
        }

        if ((int) $buoiTap->tinh_trang !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Buổi tập không ở trạng thái đang tập',
            ], 422);
        }

        // 2. Tìm tiến độ theo chương trình và hội viên.
        // Không bắt buộc id_buoi_tap phải là buổi hiện tại.
        $tienDo = TienDoBaiTap::where('id', $idTienDo)
            ->where( 'id_chuong_trinh_bai_tap', $buoiTap->id_chuong_trinh_bai_tap)
            ->whereHas('dangKyChuongTrinh', function ($query) use ($user) {
                $query->where('id_hoi_vien', $user->id)
                    ->where('tinh_trang', 1);
            })
            ->first();

        if (!$tienDo) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tiến độ bài tập trong chương trình',
            ], 404);
        }

        // 3. Nếu đã hoàn thành thì không ghi đè.
        if ((int) $tienDo->tinh_trang === 2) {
            return response()->json([
                'success'           => false,
                'message'           => 'Bài tập này đã hoàn thành trước đó',
                'data'              => ['id_tien_do_bai_tap' => $tienDo->id,
                'phan_tram_bai_tap' => (float) $tienDo->phan_tram_hoan_thanh,
                ],
            ], 422);
        }

        // 4. Đánh dấu hoàn thành bài tập.
        $tienDo->phan_tram_hoan_thanh = 100;
        $tienDo->tinh_trang = 2;
        $tienDo->save();
        // 5. Tính lại phần trăm tích lũy của toàn chương trình.
        
        // Lấy toàn bộ tiến độ bài tập trong ngày tập hiện tại
        $tienDos = TienDoBaiTap::where('id_dang_ky_chuong_trinh', $tienDo->id_dang_ky_chuong_trinh )
            ->where( 'id_chuong_trinh_bai_tap', $buoiTap->id_chuong_trinh_bai_tap)
            ->get();

        $tongSoBai = $tienDos->count();
        $soBaiHoanThanh = $tienDos
            ->where('tinh_trang', 2)
            ->count();

        // Kiểm tra đã hoàn thành tất cả bài tập chưa
        $laBaiCuoi = $tongSoBai > 0 && $soBaiHoanThanh === $tongSoBai;

        // Cập nhật phần trăm hoàn thành
        $thongKe = $this->capNhatPhanTramTichLuy(  $buoiTap, $tienDo );

        return response()->json([
            'success' => true,
            'message' => $laBaiCuoi
                ? 'Đây là bài tập cuối cùng rồi. Bạn có muốn kết thúc buổi tập không?'
                : 'Hoàn thành bài tập thành công',
            'data' => [
                'id_buoi_tap' => $buoiTap->id,
                'id_tien_do_bai_tap' => $tienDo->id,
                'id_bai_tap' => $tienDo->id_bai_tap,
                'phan_tram_bai_tap' => 100,
                'tong_so_bai_tap' => $tongSoBai,
                'so_bai_hoan_thanh' => $soBaiHoanThanh,
                'phan_tram_hoan_thanh' => $thongKe['phan_tram_hoan_thanh'],
                'tinh_trang' => $tienDo->tinh_trang,
                'la_bai_cuoi' => $laBaiCuoi,
            ],
        ], 200);
    }

    // public function ketThuc(KetThucBuoiTapRequest $request, $id)
    // {
    //     // 1. Kiểm tra người dùng đăng nhập
    //     $user = Auth::guard('sanctum')->user();
    //     if (!$user) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Chưa đăng nhập',
    //         ], 401);
    //     }

    //     // 2. Lấy dữ liệu Request đã kiểm tra
    //     $data = $request->validated();
    //     // 3. Tìm buổi tập thuộc hội viên đang đăng nhập
    //     $buoiTap = BuoiTap::where('id', $id)
    //         ->where('id_hoi_vien', $user->id)
    //         ->first();

    //     if (!$buoiTap) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Không tìm thấy buổi tập',
    //         ], 404);
    //     }

    //     // 4. Kiểm tra trạng thái buổi tập
    //     if ($buoiTap->tinh_trang != 1) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Buổi tập không ở trạng thái đang tập',
    //         ], 422);
    //     }

    //     // 5. Kiểm tra thời gian bắt đầu
    //     if (!$buoiTap->thoi_gian_bat_dau) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Buổi tập chưa có thời gian bắt đầu',
    //         ], 422);
    //     }

    //     // 6. Tính tổng thời gian buổi tập
    //     $now = now();
    //     $batDau = Carbon::parse($buoiTap->thoi_gian_bat_dau);
    //     $tongThoiGian = max( 0, $batDau->diffInSeconds($now));

        
    //     // 7. Tìm chương trình bài tập hiện tại.
    //     $chuongTrinhBaiTap = ChuongTrinhBaiTap::find( $buoiTap->id_chuong_trinh_bai_tap);
    //     if (!$chuongTrinhBaiTap) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Không tìm thấy chương trình bài tập',
    //         ], 404);
    //     }

    //     // 8. Tìm đăng ký chương trình của hội viên.
    //     $dangKy = DKChuongTrinh::where( 'id_hoi_vien', $user->id)
    //         ->where( 'id_chuong_trinh', $chuongTrinhBaiTap->id_chuong_trinh)
    //         ->where('tinh_trang', 1)
    //         ->first();
    //     if (!$dangKy) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Không tìm thấy đăng ký chương trình',
    //         ], 404);
    //     }

    //     // 9. Lấy TOÀN BỘ tiến độ tích lũy của chương trình.
    //     // Không lọc theo id_buoi_tap vì các bản ghi tiến độ
    //     // được dùng chung qua nhiều buổi tập.
    //     $tienDos = TienDoBaiTap::where( 'id_dang_ky_chuong_trinh', $dangKy->id)
    //         ->where( 'id_chuong_trinh_bai_tap', $buoiTap->id_chuong_trinh_bai_tap)
    //         ->get();
    //     $tongSoBai = $tienDos->count();
    //     $tongSoLanLap = (int) $tienDos->sum( 'so_rep_thuc_te');
    //     $soBaiHoanThanh = $tienDos
    //         ->where('tinh_trang', 2)
    //         ->count();

    //     // 10. Tính phần trăm tích lũy từ tiến độ đã lưu.
    //     $tongPhanTram = (float) $tienDos->sum( 'phan_tram_hoan_thanh');

    //     $phanTram = $tongSoBai > 0 ? round($tongPhanTram / $tongSoBai, 2) : 0;

    //     // 11. Xác định trạng thái kết thúc buổi tập.
    //     // 2 = tất cả bài tập hoàn thành.
    //     // 3 = kết thúc nhưng còn bài chưa hoàn thành.
    //     $tinhTrang = ( $tongSoBai > 0 && $soBaiHoanThanh === $tongSoBai ) ? 2 : 3;

    //     // 12. Lưu thông tin kết thúc buổi tập.
    //     $buoiTap->thoi_gian_ket_thuc = $now;
    //     $buoiTap->tong_thoi_gian_giay = $tongThoiGian;

    //     if (array_key_exists('tong_thoi_gian_nghi', $data)) {
    //         $buoiTap->tong_thoi_gian_nghi =
    //             $data['tong_thoi_gian_nghi'];
    //     }

    //     $buoiTap->tong_so_lan_lap = $tongSoLanLap;
    //     $buoiTap->phan_tram_hoan_thanh = $phanTram;
    //     $buoiTap->tinh_trang = $tinhTrang;
    //     $buoiTap->save();

    //     // 13. Trả danh sách tiến độ tích lũy.
    //     $chiTietTienDo = $tienDos->map(function ($item) {
    //         return [
    //             'id_tien_do_bai_tap' => $item->id,
    //             'id_bai_tap' => $item->id_bai_tap,
    //             'phan_tram_hoan_thanh' => (float) $item->phan_tram_hoan_thanh,
    //             'tinh_trang' => $item->tinh_trang,
    //         ];
    //     })->values();
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
    //             'chi_tiet_tien_do' => $chiTietTienDo,
    //         ],
    //     ], 200);

    // }


    
    public function ketThuc(KetThucBuoiTapRequest $request, $id)
    {
        // 1. Kiểm tra đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }

        $data = $request->validated();

        // 2. Tìm buổi tập của hội viên
        $buoiTap = BuoiTap::where('id', $id)
            ->where('id_hoi_vien', $user->id)
            ->first();

        if (!$buoiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tập',
            ], 404);
        }

        if ((int) $buoiTap->tinh_trang !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Buổi tập không ở trạng thái đang tập',
            ], 422);
        }

        if (!$buoiTap->thoi_gian_bat_dau) {
            return response()->json([
                'success' => false,
                'message' => 'Buổi tập chưa có thời gian bắt đầu',
            ], 422);
        }

        // 3. Tính thời gian tập
        $now = now();
        $batDau = Carbon::parse($buoiTap->thoi_gian_bat_dau);
        $tongThoiGian = max(0, $batDau->diffInSeconds($now));

        // 4. Tìm chương trình bài tập hiện tại
        $chuongTrinhBaiTap = ChuongTrinhBaiTap::find(
            $buoiTap->id_chuong_trinh_bai_tap
        );

        if (!$chuongTrinhBaiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương trình bài tập',
            ], 404);
        }

        // 5. Tìm đăng ký chương trình của hội viên
        $dangKy = DKChuongTrinh::where('id_hoi_vien', $user->id)
            ->where('id_chuong_trinh', $chuongTrinhBaiTap->id_chuong_trinh)
            ->where('tinh_trang', 1)
            ->first();

        if (!$dangKy) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đăng ký chương trình',
            ], 404);
        }

        // 6. Lấy tiến độ của tất cả bài tập trong ngày hiện tại
        $tienDos = TienDoBaiTap::where(
            'id_dang_ky_chuong_trinh',
            $dangKy->id
        )
            ->where(
                'id_chuong_trinh_bai_tap',
                $buoiTap->id_chuong_trinh_bai_tap
            )
            ->get();

        $tongSoBai = $tienDos->count();

        $tongSoLanLap = (int) $tienDos->sum('so_rep_thuc_te');

        $soBaiHoanThanh = $tienDos
            ->where('tinh_trang', 2)
            ->count();

        $tongPhanTram = (float) $tienDos->sum(
            'phan_tram_hoan_thanh'
        );

        $phanTram = $tongSoBai > 0
            ? round($tongPhanTram / $tongSoBai, 2)
            : 0;

        // 7. Xác định trạng thái kết thúc buổi tập
        // 2 = tất cả bài tập hoàn thành
        // 3 = còn bài tập chưa hoàn thành
        $tinhTrang = (
            $tongSoBai > 0
            && $soBaiHoanThanh === $tongSoBai
        ) ? 2 : 3;

        // 8. Lưu kết quả buổi tập
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

        // 9. Nếu hoàn thành tất cả bài tập, mở ngày tập tiếp theo
        $ngayTiepTheo = null;
        if ($tinhTrang === 2) {
            $ngayTiepTheo = ChuongTrinhBaiTap::where( 'id_chuong_trinh', $chuongTrinhBaiTap->id_chuong_trinh )
                ->where('ngay_thu', '>', $chuongTrinhBaiTap->ngay_thu)
                ->orderBy('ngay_thu')
                ->first();
            if ($ngayTiepTheo) {
                DangKyChuongTrinhBaiTap::where( 'id_dang_ky_chuong_trinh', $dangKy->id )
                    ->where( 'id_chuong_trinh_bai_tap', $ngayTiepTheo->id )
                    ->update(['tinh_trang' => 1, ]);
            }
        }

        // 10. Chi tiết tiến độ
        $chiTietTienDo = $tienDos->map(function ($item) {
            return [
                'id_tien_do_bai_tap' => $item->id,
                'id_bai_tap' => $item->id_bai_tap,
                'phan_tram_hoan_thanh' =>
                    (float) $item->phan_tram_hoan_thanh,
                'tinh_trang' => $item->tinh_trang,
            ];
        })->values();

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

                // Thông tin ngày tập tiếp theo
                'da_mo_ngay_tiep_theo' => $ngayTiepTheo !== null,
                'ngay_tiep_theo' => $ngayTiepTheo ? [
                    'id' => $ngayTiepTheo->id,
                    'ngay_thu' => $ngayTiepTheo->ngay_thu,
                    'tinh_trang' => $ngayTiepTheo->tinh_trang,
                ] : null,
            ],
        ], 200);
    }



    
    
   


    public function getLatestProgress(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Không xác định được hội viên đăng nhập',
            ], 401);
        }

        $idLichTap = $request->id_lich_tap;
        $idChuongTrinhBaiTap = $request->id_chuong_trinh_bai_tap;
        
        $buoiTap = BuoiTap::where('id_hoi_vien', $user->id)
            ->where('id_lich_tap', $idLichTap)
            ->where('id_chuong_trinh_bai_tap', $idChuongTrinhBaiTap)
            ->orderByDesc('thoi_gian_bat_dau')
            ->orderByDesc('id')
            ->first();

        if (!$buoiTap) {
            return response()->json([
                'success' => true,
                'message' => 'Chưa có dữ liệu tập luyện',
                'data' => [
                    'phan_tram_hoan_thanh' => 0,
                    'id_buoi_tap' => null,
                    'tong_so_bai' => 0,
                    'so_bai_hoan_thanh' => 0,
                    'danh_sach_bai_tap' => [],
                ],
            ]);
        }

        $tongSoBai = TienDoBaiTap::where( 'id_chuong_trinh_bai_tap', $idChuongTrinhBaiTap)
            ->select('id_bai_tap')
            ->distinct()
            ->count('id_bai_tap');

        $soBaiHoanThanh = TienDoBaiTap::where('id_chuong_trinh_bai_tap', $idChuongTrinhBaiTap)
            ->where('phan_tram_hoan_thanh', '>=', 100)
            ->select('id_bai_tap')
            ->distinct()
            ->count('id_bai_tap');

        $idTienDoMoiNhat = TienDoBaiTap::where('id_chuong_trinh_bai_tap', $idChuongTrinhBaiTap)
            ->selectRaw('MAX(id) as id')
            ->groupBy('id_bai_tap')
            ->pluck('id');

        $danhSachBaiTap = TienDoBaiTap::whereIn('id', $idTienDoMoiNhat)
            ->select('id_bai_tap', 'phan_tram_hoan_thanh', 'tinh_trang')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy tiến độ tập luyện thành công',
            'data' => ['phan_tram_hoan_thanh' => (float) $buoiTap->phan_tram_hoan_thanh,
                'id_buoi_tap' => $buoiTap->id,
                'tong_so_bai' => $tongSoBai,
                'so_bai_hoan_thanh' => $soBaiHoanThanh,
                'danh_sach_bai_tap' => $danhSachBaiTap,
            ],
        ]);
    }

    public function getProgressPercent(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }

        $ids = $request->query('ids', []);

        $data = BuoiTap::where('id_hoi_vien', $user->id)
            ->whereIn('id_chuong_trinh_bai_tap', $ids)
            ->select(
                'id_lich_tap',
                'id_chuong_trinh_bai_tap',
                'phan_tram_hoan_thanh'
            )
            ->orderByDesc('id')
            ->get()
            ->unique('id_chuong_trinh_bai_tap')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }










   public function getHuanLuyenTiepTheo()
    {
        // 1. Lấy hội viên đang đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }

        // 2. Lấy chương trình hội viên đang đăng ký
        $dangKy = DKChuongTrinh::where('id_hoi_vien', $user->id)
            ->whereIn('tinh_trang', [0, 1, 3])
            ->latest('id')
            ->first();

        if (!$dangKy) {
            return response()->json([
                'success' => true,
                'message' => 'Bạn chưa đăng ký chương trình tập',
                'data' => [
                    'tong_ngay_da_hoan_thanh' => 0,
                    'tong_ngay_tap' => 0,
                    'huan_luyen_tiep_theo' => [],
                ],
            ]);
        }

        // 3. Lấy toàn bộ ngày tập của chương trình
        $ngayTap = ChuongTrinhBaiTap::where(
            'id_chuong_trinh',
            $dangKy->id_chuong_trinh
        )
            ->orderBy('id', 'asc')
            ->get();

        // 4. Lấy ID những ngày đã hoàn thành
        $idNgayDaHoanThanh = BuoiTap::where(
            'id_hoi_vien',
            $user->id
        )
            ->whereIn(
                'id_chuong_trinh_bai_tap',
                $ngayTap->pluck('id')->toArray()
            )
            ->where('tinh_trang', 2)
            ->select('id_chuong_trinh_bai_tap')
            ->distinct()
            ->pluck('id_chuong_trinh_bai_tap')
            ->toArray();

        // 5. Đếm tổng ngày tập đã hoàn thành
        $tongNgayDaHoanThanh = count($idNgayDaHoanThanh);

        // 6. Lấy 3 ngày chưa hoàn thành tiếp theo
        $tiepTheo = ChuongTrinhBaiTap::where(
            'id_chuong_trinh',
            $dangKy->id_chuong_trinh
        )
            ->whereNotIn('id', $idNgayDaHoanThanh)
            ->orderBy('id', 'asc')
            ->limit(3)
            ->get();

        // 7. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Lấy tiến độ thành công',
            'data' => [
                'tong_ngay_da_hoan_thanh' => $tongNgayDaHoanThanh,
                'tong_ngay_tap' => $ngayTap->count(),
                'huan_luyen_tiep_theo' => $tiepTheo,
            ],
        ]);
    }


    // check quyền tập

    
    public function checkQuyenTap(Request $request)
    {
        // 1. Lấy hội viên đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để thực hiện chức năng này',
            ], 401);
        }
        // 2. Validate
        $request->validate([
            'id_dang_ky_chuong_trinh' => 'required|integer',
            'id_chuong_trinh_bai_tap' => 'required|integer',
        ]);

        // 3. Lấy thông tin đăng ký chương trình
        $dangKy = DB::table('dang_ky_chuong_trinh as dk')
            ->join('chuong_trinh_tap as ct', 'dk.id_chuong_trinh', '=', 'ct.id')
            ->where('dk.id', $request->id_dang_ky_chuong_trinh)
            ->where('dk.id_hoi_vien', $user->id)
            ->whereIn('dk.tinh_trang', [0, 1])
            ->select(
                'dk.id',
                'dk.id_chuong_trinh',
                'dk.ngay_bat_dau',
                'dk.ngay_du_kien_ket_thuc',
                'dk.tinh_trang',
                'ct.so_ngay',
                'ct.so_buoi_moi_tuan'
            )
            ->first();

        if (!$dangKy) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương trình đăng ký hoặc chương trình không còn hoạt động',
            ], 404);
        }

        // 4. Kiểm tra ngày bắt đầu
        if (!$dangKy->ngay_bat_dau) {
            return response()->json([
                'success' => false,
                'message' => 'Chương trình chưa có ngày bắt đầu',
            ], 400);
        }

        $ngayHienTai = now()->toDateString();

        if ($ngayHienTai < $dangKy->ngay_bat_dau) {
            return response()->json([
                'success' => false,
                'message' => 'Chương trình chưa đến ngày bắt đầu',
            ], 403);
        }

        // 5. Kiểm tra ngày tập thuộc chương trình
        $chuongTrinhBaiTap = DB::table('chuong_trinh_bai_tap as ctbt')
            ->join( 'dang_ky_chuong_trinh_bai_tap as dkbt','ctbt.id','=','dkbt.id_chuong_trinh_bai_tap')
            ->where('ctbt.id', $request->id_chuong_trinh_bai_tap)
            ->where('ctbt.id_chuong_trinh', $dangKy->id_chuong_trinh)
            ->where('dkbt.id_dang_ky_chuong_trinh', $dangKy->id)
            ->select(
                'ctbt.id',
                'ctbt.ngay_thu',
                'ctbt.ten_ngay_tap',
                'dkbt.tinh_trang',
                'dkbt.cho_phep_bo_qua'
            )
            ->first();

        if (!$chuongTrinhBaiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Ngày tập không thuộc chương trình đăng ký.',
            ], 404);
        }

        // Kiểm tra trạng thái riêng của hội viên
        if ((int) $chuongTrinhBaiTap->tinh_trang !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Ngày tập chưa được mở khóa.',
            ], 403);
        }

        // 6. Lấy ngày tập cuối cùng trong lịch đã sinh
        $ngayHetLich = DB::table('lich_tap')
            ->where('id_dang_ky_chuong_trinh', $dangKy->id)
            ->where('id_hoi_vien', $user->id)
            ->max('ngay_tap');

        if (!$ngayHetLich) {
            return response()->json([
                'success' => false,
                'message' => 'Chương trình chưa có lịch tập',
            ], 404);
        }

        // Không cho tập vượt quá ngày cuối cùng trong lịch
        if ($ngayHienTai > $ngayHetLich) {
            return response()->json([
                'success' => false,
                'message' => 'Chương trình đã vượt quá lịch tập. Vui lòng đăng ký chương trình mới',
            ], 403);
        }

        // 7. Kiểm tra số buổi đã hoàn thành
        $soBuoiDaTap = DB::table('buoi_tap as bt')
            ->join('lich_tap as lt', 'bt.id_lich_tap', '=', 'lt.id')
            ->where('bt.id_hoi_vien', $user->id)
            ->where('lt.id_dang_ky_chuong_trinh', $dangKy->id)
            ->whereNotNull('bt.thoi_gian_ket_thuc')
            ->where('bt.phan_tram_hoan_thanh', '>=', 100)
            ->distinct()
            ->count('bt.id_lich_tap');

        // 8. Kiểm tra gói tập còn hạn
        $goiConHan = DB::table('dang_ky_goi as dkg')
            ->join(
                'chi_tiet_dang_ky_goi as ct',
                'dkg.id',
                '=',
                'ct.id_dang_ky_goi'
            )
            ->where('dkg.id_hoi_vien', $user->id)
            ->where('dkg.tinh_trang', 1)
            ->where('dkg.is_thanh_toan', 1)
            ->where('ct.tinh_trang', 1)
            ->whereDate('ct.ngay_bat_dau', '<=', $ngayHienTai)
            ->whereDate('ct.ngay_ket_thuc', '>=', $ngayHienTai)
            ->exists();

        // 9. Có gói còn hạn thì được tập các chương trình
        if ($goiConHan) {
            return response()->json([
                'success' => true,
                'message' => 'Bạn có gói tập còn hạn, được phép tiếp tục',
                'data' => [
                    'duoc_phep_tap' => true,
                    'mien_phi' => false,
                    'so_buoi_mien_phi' => 3,
                    'so_buoi_da_su_dung' => $soBuoiDaTap,
                    'so_buoi_con_lai' => 0,
                    'ngay_thu' => $chuongTrinhBaiTap->ngay_thu,
                    'can_dang_ky_goi' => false,
                    'goi_con_han' => true,
                ],
            ]);
        }

        // 10. Kiểm tra 3 buổi miễn phí đầu tiên
        $soBuoiMienPhi = 3;

        if ($chuongTrinhBaiTap->ngay_thu <= $soBuoiMienPhi) {
            return response()->json([
                'success' => true,
                'message' => 'Bạn đang được tập luyện miễn phí',
                'data' => [
                    'duoc_phep_tap' => true,
                    'mien_phi' => true,
                    'so_buoi_mien_phi' => $soBuoiMienPhi,
                    'so_buoi_da_su_dung' => $soBuoiDaTap,
                    'so_buoi_con_lai' => max(
                        0,
                        $soBuoiMienPhi - $soBuoiDaTap
                    ),
                    'ngay_thu' => $chuongTrinhBaiTap->ngay_thu,
                    'can_dang_ky_goi' => false,
                    'goi_con_han' => false,
                ],
            ]);
        }

        // 11. Kiểm tra gói đã mua và chương trình được chọn
        // Chỉ cho phép tiếp tục nếu:
        // - Đã thanh toán.
        // - Đăng ký gói cho đúng chương trình hiện tại.
        // - Gói được đăng ký tại nhà (id_noi_tap = 1).

        $goiDuocTiepTuc = DB::table('dang_ky_goi as dkg')
            ->join(
                'chi_tiet_dang_ky_goi as ct',
                'dkg.id',
                '=',
                'ct.id_dang_ky_goi'
            )
            ->where('dkg.id_hoi_vien', $user->id)
            ->where('dkg.is_thanh_toan', 1)
            ->where('ct.id_chuong_trinh_tap', $dangKy->id_chuong_trinh)
            ->where('ct.id_noi_tap', 1)
            ->whereNotNull('ct.ngay_bat_dau')
            ->whereNotNull('ct.ngay_ket_thuc')
            ->orderByDesc('ct.ngay_ket_thuc')
            ->first();

        // 12. Nếu đã hết hạn gói nhưng chương trình được chọn
        // là chương trình tập tại nhà thì vẫn được hoàn thành lịch.

        if ($goiDuocTiepTuc) {
            return response()->json([
                'success' => true,
                'message' => 'Gói tập đã hết hạn nhưng bạn được phép hoàn thành chương trình tại nhà đã đăng ký',
                'data' => [
                    'duoc_phep_tap' => true,
                    'mien_phi' => false,
                    'so_buoi_mien_phi' => $soBuoiMienPhi,
                    'so_buoi_da_su_dung' => $soBuoiDaTap,
                    'so_buoi_con_lai' => 0,
                    'ngay_thu' => $chuongTrinhBaiTap->ngay_thu,
                    'ngay_bat_dau' => $dangKy->ngay_bat_dau,
                    'ngay_het_lich' => $ngayHetLich,
                    'goi_con_han' => false,
                    'duoc_tiep_tuc_hoan_thanh' => true,
                    'can_dang_ky_goi' => false,
                ],
            ]);
        }

        // 13. Không có gói hợp lệ hoặc không thuộc chương trình được chọn
        return response()->json([
            'success' => true,
            'message' => 'Bạn đã hết hạn tập thử miễn phí 3 ngày, hoặc hết hạn gói tập hoặc chương trình này không thuộc gói đã đăng ký . Vui lòng đăng ký hoặc gia hạn gói tập để tiếp tục',
            'data' => [
                'duoc_phep_tap' => false,
                'mien_phi' => false,
                'so_buoi_mien_phi' => $soBuoiMienPhi,
                'so_buoi_da_su_dung' => $soBuoiDaTap,
                'so_buoi_con_lai' => 0,
                'ngay_thu' => $chuongTrinhBaiTap->ngay_thu,
                'ngay_bat_dau' => $dangKy->ngay_bat_dau,
                'ngay_het_lich' => $ngayHetLich,
                'goi_con_han' => false,
                'duoc_tiep_tuc_hoan_thanh' => false,
                'can_dang_ky_goi' => true,
            ],
        ]);
    }








    public function luuLichSuHiep(Request $request, $id, $idTienDo)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }

        $request->validate([
            'loai_ghi_nhan' => 'required|in:phut,rep,giay',
            'so_rep_thuc_te' => 'nullable|integer|min:0',
            'so_phut_thuc_te' => 'nullable|integer|min:0',
            'thoi_gian_thuc_te_giay' => 'nullable|integer|min:0',
            'trong_luong_ta_thuc_te' => 'nullable|numeric|min:0',
            'ghi_chu' => 'nullable|string',
        ]);

        // 1. Kiểm tra buổi tập
        $buoiTap = BuoiTap::where('id', $id)
            ->where('id_hoi_vien', $user->id)
            ->where('tinh_trang', 1)
            ->first();

        if (!$buoiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tập đang thực hiện',
            ], 404);
        }

        // 2. Kiểm tra tiến độ bằng JOIN
        $tienDo = DB::table('tien_do_bai_taps')
            ->join('dang_ky_chuong_trinh','tien_do_bai_taps.id_dang_ky_chuong_trinh','=','dang_ky_chuong_trinh.id')
            ->where('tien_do_bai_taps.id', $idTienDo)
            ->where('tien_do_bai_taps.id_chuong_trinh_bai_tap', $buoiTap->id_chuong_trinh_bai_tap )
            ->where('dang_ky_chuong_trinh.id_hoi_vien', $user->id)
            ->select('tien_do_bai_taps.id')
            ->first();

        if (!$tienDo) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tiến độ bài tập',
            ], 404);
        }

        // 3. Xác định loại ghi nhận
        $loai = $request->loai_ghi_nhan;
        // 4. Nếu là bài tập tính phút thì không có hiệp
        $soHiep = null;
        if ($loai != 'phut') {
            $soHiep = LichSuHiepTap::where('id_tien_do_bai_tap', $idTienDo )
                ->where('id_buoi_tap', $buoiTap->id)
                ->where('loai_ghi_nhan', $loai)
                ->count() + 1;
        }

        // 5. Lưu lịch sử
        $lichSu = LichSuHiepTap::create([
            'id_tien_do_bai_tap' => $idTienDo,
            'id_buoi_tap' => $buoiTap->id,
            'loai_ghi_nhan' => $loai,
            'so_hiep' => $soHiep,
            'so_rep_thuc_te' => $loai == 'rep' ? $request->so_rep_thuc_te : null,
            'so_phut_thuc_te' => $loai == 'phut' ? $request->so_phut_thuc_te : null,
            'thoi_gian_thuc_te_giay' => $loai == 'giay'? $request->thoi_gian_thuc_te_giay : null,
            'trong_luong_ta_thuc_te' => $request->trong_luong_ta_thuc_te,
            'ghi_chu' => $request->ghi_chu,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lưu lịch sử tập luyện thành công',
            'data' => $lichSu,
        ], 201);
    }


    public function getLichSuHiep($idTienDo)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }
        // Kiểm tra tiến độ thuộc hội viên
        $tienDo = DB::table('tien_do_bai_taps')
            ->join('dang_ky_chuong_trinh', 'tien_do_bai_taps.id_dang_ky_chuong_trinh','=', 'dang_ky_chuong_trinh.id' )
            ->where('tien_do_bai_taps.id', $idTienDo)
            ->where('dang_ky_chuong_trinh.id_hoi_vien', $user->id)
            ->select('tien_do_bai_taps.id')
            ->first();

        if (!$tienDo) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tiến độ',
            ], 404);
        }

        // Lấy lịch sử và thông tin ngày tập
        $lichSu = DB::table('lich_su_hiep_taps')
            ->join('buoi_tap', 'lich_su_hiep_taps.id_buoi_tap', '=', 'buoi_tap.id')
            ->where('lich_su_hiep_taps.id_tien_do_bai_tap', $idTienDo)
            ->select(
                'lich_su_hiep_taps.*',
                'buoi_tap.ngay_tap',
                DB::raw("
                    CASE DAYOFWEEK(buoi_tap.ngay_tap)
                        WHEN 1 THEN 'Chủ nhật'
                        WHEN 2 THEN 'Thứ 2'
                        WHEN 3 THEN 'Thứ 3'
                        WHEN 4 THEN 'Thứ 4'
                        WHEN 5 THEN 'Thứ 5'
                        WHEN 6 THEN 'Thứ 6'
                        WHEN 7 THEN 'Thứ 7'
                    END AS thu_tap
                "),
                DB::raw("DATE_FORMAT(buoi_tap.ngay_tap, '%d/%m/%Y') AS ngay_thang_nam"),
                DB::raw("DATE_FORMAT(lich_su_hiep_taps.created_at, '%H:%i:%s') AS gio_tao")
            )
            ->orderByDesc('buoi_tap.ngay_tap')
            ->orderByDesc('lich_su_hiep_taps.created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $lichSu,
        ]);
    }


    // báo cáo 
   

    public function baoCaoBuoiTap($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập',
            ], 401);
        }
        // 1. Lấy thông tin buổi tập
        $buoiTap = DB::table('buoi_tap') 
            ->where('id', $id) 
            ->where('id_hoi_vien', $user->id)
            ->first();
        if (!$buoiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tập không có quyền xem',
            ], 404);
        }
        // 2. Lấy chương trình bài tập và chương trình tập
        $chuongTrinh = DB::table('chuong_trinh_bai_tap as ctbt')
            ->join( 'chuong_trinh_tap as ct', 'ctbt.id_chuong_trinh', '=', 'ct.id' )
            ->where('ctbt.id', $buoiTap->id_chuong_trinh_bai_tap)
            ->select( 'ctbt.id', 'ctbt.ten_ngay_tap','ctbt.ngay_thu', 'ct.id as id_chuong_trinh', 'ct.id_cap_do', 'ct.id_noi_tap' )
            ->first();
        if (!$chuongTrinh) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương trình bài tập',
            ], 404);
        }
        // 3. Chuyển JSON nơi tập thành mảng ID
        $noiTap = json_decode($chuongTrinh->id_noi_tap, true);
        $idNoiTap = collect($noiTap)
            ->pluck('id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
        if (empty($idNoiTap)) {
            return response()->json([
                'success' => false,
                'message' => 'Chương trình chưa có nơi tập hợp lệ',
            ], 400);
        }

        // 4. Lấy danh sách bài tập yêu cầu
        $baiTaps = DB::table('chuong_trinh_bai_tap_chi_tiet as ctbtct')
            ->join('bai_tap as bt', 'ctbtct.id_bai_tap', '=', 'bt.id')
            ->join('bai_tap_phan_loai as btpl', 'bt.id', '=', 'btpl.id_bai_tap')
            ->where('ctbtct.id_chuong_trinh_bai_tap', $chuongTrinh->id)
            ->where('btpl.id_cap_do', $chuongTrinh->id_cap_do)
            ->whereIn('btpl.id_noi_tap', $idNoiTap)
            ->select(
                'bt.id',
                'bt.ten_bai_tap',
                'bt.rep_yeu_cau',
                'bt.set_yeu_cau',
                'bt.giay_yeu_cau',
                'bt.thoi_gian_phut',
                'bt.muc_ta_toi_thieu'
            )
            ->distinct()
            ->get();

        // 5. Tính tổng yêu cầu

        // Tổng rep yêu cầu
        $tongRepYeuCau = $baiTaps->sum(function ($item) { return ($item->rep_yeu_cau ?? 0) * ($item->set_yeu_cau ?? 0); });

        // Tổng tạ tối thiểu = kg * số hiệp
        $tongTaYeuCau = $baiTaps->sum(function ($item) {
            if (empty($item->muc_ta_toi_thieu)) {
                return 0;
            }
            $ta = 0;
            if (preg_match('/([\d.]+)\s*kg/i', $item->muc_ta_toi_thieu, $match)) {
                $ta = (float) $match[1];
            }
            return $ta * ($item->set_yeu_cau ?? 1);
        });
        // Tổng giây yêu cầu
        $tongGiayYeuCau = $baiTaps->sum('giay_yeu_cau');
        // Tổng phút yêu cầu
        $tongThoiGianPhut = $baiTaps->sum('thoi_gian_phut');
        // 6. Lấy lịch sử hiệp tập của buổi tập
        $lichSuHiepTaps = DB::table('lich_su_hiep_taps as ls')
            ->join( 'tien_do_bai_taps as td', 'ls.id_tien_do_bai_tap', '=', 'td.id' )
            ->join( 'bai_tap as bt', 'td.id_bai_tap','=', 'bt.id')
            ->where('ls.id_buoi_tap', $buoiTap->id)
            ->select(
                'ls.id',
                'ls.id_tien_do_bai_tap',
                'ls.id_buoi_tap',
                'ls.so_hiep',
                'ls.so_rep_thuc_te',
                'ls.so_phut_thuc_te',
                'ls.thoi_gian_thuc_te_giay',
                'ls.trong_luong_ta_thuc_te',
                'ls.ghi_chu',
                'td.id_bai_tap',
                'bt.ten_bai_tap',
                'bt.anh_dai_dien'
            )
            ->orderBy('ls.id_tien_do_bai_tap')
            ->orderBy('ls.so_hiep')
            ->get();


        // 7. Gom các lịch sử hiệp theo từng bài tập
        $baiTapThucTe = $lichSuHiepTaps
            ->groupBy('id_tien_do_bai_tap')
            ->map(function ($hieps) {
                $baiTap = $hieps->first();
                return [
                    'id_tien_do_bai_tap' => $baiTap->id_tien_do_bai_tap,
                    'id_bai_tap' => $baiTap->id_bai_tap,
                    'ten_bai_tap' => $baiTap->ten_bai_tap,
                    'anh_dai_dien' => $baiTap->anh_dai_dien,

                    // Tổng thực tế của bài tập
                    'tong_so_hiep' => $hieps->count(),
                    'tong_rep_thuc_te' => $hieps->sum('so_rep_thuc_te'),
                    'tong_phut_thuc_te' => $hieps->sum('so_phut_thuc_te'),
                    'tong_giay_thuc_te' => $hieps->sum('thoi_gian_thuc_te_giay'),
                    'tong_ta_thuc_te' => $hieps->sum('trong_luong_ta_thuc_te'),
                    // Chi tiết từng hiệp
                    'lich_su_hiep_tap' => $hieps->map(function ($hiep) {
                        return [
                            'id' => $hiep->id,
                            'so_hiep' => $hiep->so_hiep,
                            'so_rep_thuc_te' => $hiep->so_rep_thuc_te,
                            'so_phut_thuc_te' => $hiep->so_phut_thuc_te,
                            'thoi_gian_thuc_te_giay' => $hiep->thoi_gian_thuc_te_giay,
                            'trong_luong_ta_thuc_te' => $hiep->trong_luong_ta_thuc_te,
                            'ghi_chu' => $hiep->ghi_chu,
                        ];
                    })->values(),
                ];
            })
            ->values();

        // 8. Tính tổng thực tế từ lịch sử hiệp tập
        $tongSoHiepThucTe = $lichSuHiepTaps->count();
        $tongRepThucTe = $lichSuHiepTaps->sum('so_rep_thuc_te');
        $tongPhutThucTe = $lichSuHiepTaps->sum('so_phut_thuc_te');
        $tongGiayThucTe = $lichSuHiepTaps->sum('thoi_gian_thuc_te_giay');
        $tongTaThucTe = $lichSuHiepTaps->sum('trong_luong_ta_thuc_te');
        // 9. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết buổi tập thành công',
            'data' => [
                // Thông tin buổi tập
                'id_buoi_tap' => $buoiTap->id,
                'ngay_tap' => \Carbon\Carbon::parse($buoiTap->ngay_tap)->locale('vi')->translatedFormat('j \t\h\á\n\g n \nă\m Y'),
                'id_chuong_trinh' => $chuongTrinh->id_chuong_trinh,
                'id_chuong_trinh_bai_tap' => $chuongTrinh->id,
                'ten_ngay_tap' => $chuongTrinh->ten_ngay_tap,
                'ngay_thu' => $chuongTrinh->ngay_thu,
                'id_cap_do' => $chuongTrinh->id_cap_do,
                'id_noi_tap' => $idNoiTap,

                // Thông tin thực tế buổi tập
                'phan_tram_hoan_thanh' => $buoiTap->phan_tram_hoan_thanh,
                'tong_thoi_gian_giay' => $buoiTap->tong_thoi_gian_giay,
                'tong_thoi_gian_nghi' => $buoiTap->tong_thoi_gian_nghi,
                'calo_tieu_thu' => $buoiTap->calo_tieu_thu,

                // Tổng yêu cầu
                'tong_so_bai_tap_yeu_cau' => $baiTaps->count(),
                'tong_rep_yeu_cau' => $tongRepYeuCau,
                'tong_ta_yeu_cau' => $tongTaYeuCau,
                'tong_giay_yeu_cau' => $tongGiayYeuCau,
                'tong_thoi_gian_phut_yeu_cau' => $tongThoiGianPhut,

                // Tổng thực tế lấy từ lịch sử hiệp tập
                // 'tong_so_bai_tap_thuc_te' => $baiTapThucTe->count(),
                // 'tong_so_hiep_thuc_te' => $tongSoHiepThucTe,
                'tong_rep_thuc_te' => $tongRepThucTe,
                'tong_phut_thuc_te' => $tongPhutThucTe,
                'tong_giay_thuc_te' => $tongGiayThucTe,
                'tong_ta_thuc_te' => $tongTaThucTe,

                // Danh sách bài tập đã thực sự tập
                'bai_tap_thuc_te' => $baiTapThucTe,
            ],
        ]);
    }





}
