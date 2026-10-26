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
                    'phan_tram_hoan_thanh' => (float) $tienDo->phan_tram_hoan_thanh,
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
        $thongKe = $this->capNhatPhanTramTichLuy( $buoiTap, $tienDo);

        return response()->json([
            'success' => true,
            'message' => 'Hoàn thành bài tập thành công',
            'data' => [
                'id_buoi_tap' => $buoiTap->id,
                'id_tien_do_bai_tap' => $tienDo->id,
                'id_bai_tap' => $tienDo->id_bai_tap,
                'phan_tram_bai_tap' => (float) $tienDo->phan_tram_hoan_thanh,
                'tong_so_bai_tap' => $thongKe['tong_so_bai_tap'],
                'so_bai_hoan_thanh' => $thongKe['so_bai_hoan_thanh'],
                'phan_tram_hoan_thanh' =>  $thongKe['phan_tram_hoan_thanh'],
                'tinh_trang' => $tienDo->tinh_trang,
            ],
        ], 200);
    }

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
        $tongThoiGian = max( 0, $batDau->diffInSeconds($now));

        
        // 7. Tìm chương trình bài tập hiện tại.
        $chuongTrinhBaiTap = ChuongTrinhBaiTap::find( $buoiTap->id_chuong_trinh_bai_tap);
        if (!$chuongTrinhBaiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương trình bài tập',
            ], 404);
        }

        // 8. Tìm đăng ký chương trình của hội viên.
        $dangKy = DKChuongTrinh::where( 'id_hoi_vien', $user->id)
            ->where( 'id_chuong_trinh', $chuongTrinhBaiTap->id_chuong_trinh)
            ->where('tinh_trang', 1)
            ->first();
        if (!$dangKy) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đăng ký chương trình',
            ], 404);
        }

        // 9. Lấy TOÀN BỘ tiến độ tích lũy của chương trình.
        // Không lọc theo id_buoi_tap vì các bản ghi tiến độ
        // được dùng chung qua nhiều buổi tập.
        $tienDos = TienDoBaiTap::where( 'id_dang_ky_chuong_trinh', $dangKy->id)
            ->where( 'id_chuong_trinh_bai_tap', $buoiTap->id_chuong_trinh_bai_tap)
            ->get();
        $tongSoBai = $tienDos->count();
        $tongSoLanLap = (int) $tienDos->sum( 'so_rep_thuc_te');
        $soBaiHoanThanh = $tienDos
            ->where('tinh_trang', 2)
            ->count();

        // 10. Tính phần trăm tích lũy từ tiến độ đã lưu.
        $tongPhanTram = (float) $tienDos->sum( 'phan_tram_hoan_thanh');

        $phanTram = $tongSoBai > 0 ? round($tongPhanTram / $tongSoBai, 2) : 0;

        // 11. Xác định trạng thái kết thúc buổi tập.
        // 2 = tất cả bài tập hoàn thành.
        // 3 = kết thúc nhưng còn bài chưa hoàn thành.
        $tinhTrang = ( $tongSoBai > 0 && $soBaiHoanThanh === $tongSoBai ) ? 2 : 3;

        // 12. Lưu thông tin kết thúc buổi tập.
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

        // 13. Trả danh sách tiến độ tích lũy.
        $chiTietTienDo = $tienDos->map(function ($item) {
            return [
                'id_tien_do_bai_tap' => $item->id,
                'id_bai_tap' => $item->id_bai_tap,
                'phan_tram_hoan_thanh' => (float) $item->phan_tram_hoan_thanh,
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
            ],
        ], 200);

    }

}
