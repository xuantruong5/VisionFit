<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\GoiTap;
use App\Models\GioiThieu;
use App\Models\Client;
use App\Models\KhuyenMai;
use App\Models\DangKyGoi;
use App\Models\Trainer;
use App\Models\DKChuongTrinh;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GoiTapController extends Controller
{
    public function getAll()
    {
        $data = GoiTap::where('tinh_trang', 1)
            ->orderBy('gia', 'asc')
            ->get();

        foreach ($data as $goi) {
            $goi->mo_ta = array_values(array_filter(
                array_map('trim', preg_split('/[.!?]+/', $goi->mo_ta ?? ''))
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách gói tập thành công',
            'data' => $data
        ], 200);
    }
    
    public function searchTrainer(Request $request)
    {
        $noi_dung_tim_kiem = $request->noi_dung_tim_kiem;
        $data = Trainer::where('is_active', 1)
            ->where('is_block', 0)
            ->where('tinh_trang', 1)
            ->whereRaw('(ho_ten LIKE ? OR chuyen_mon LIKE ?)', [
                '%' . $noi_dung_tim_kiem . '%',
                '%' . $noi_dung_tim_kiem . '%'
            ])
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy dữ liệu huấn luyện viên thành công',
            'data' => $data
        ]);
    }
    public function getTrainer()
    {
        $data = Trainer::where('is_active', 1)
            ->where('is_block', 0)
            ->where('tinh_trang', 1)
            ->select(
                'id',
                'ho_ten',
                'hinh_anh',
                'chuc_danh',
                'so_nam_kinh_nghiem',
                'chuyen_mon',
                'mo_ta',
                'kinh_nghiem_lam_viec',
                'qua_trinh_dao_tao',
                'chung_chi',
                'thanh_tuu',
                'tinh_trang',
                'id_phong_tap'
            )
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách huấn luyện viên thành công',
            'data' => $data
        ]);
    }

    public function getRegistrationPreview(Request $request)
    {
        $request->validate([
            'id_goi_tap' => 'required|integer',
            'id_trainer' => 'nullable|integer',
        ]);
        // 1. Lấy hội viên đang đăng nhập
        $hoiVien = Auth::guard('sanctum')->user();
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
                'message' => 'Không tìm thấy gói tập.'
            ], 404);
        }
        // 3. Lấy thông tin PT đã chọn
        $trainer = null;
        if ($request->filled('id_trainer')) {
            $trainer = Trainer::find($request->id_trainer);

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy huấn luyện viên.'
                ], 404);
            }
        }
        // 4. Kiểm tra gói tập có yêu cầu PT không
        // if ($goiTap->so_buoi_pt > 0 && !$trainer) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Gói tập này yêu cầu chọn huấn luyện viên.'
        //     ], 422);
        // }

       // 5. Lấy chương trình tập hiện tại của hội viên
        $chuongTrinh = DB::table('dang_ky_chuong_trinh as dkct')
            ->join('chuong_trinh_tap as ct', 'dkct.id_chuong_trinh', '=', 'ct.id')
            ->leftJoin('cap_do as cd', 'ct.id_cap_do', '=', 'cd.id')
            ->leftJoin('noi_tap as nt', 'dkct.id_noi_tap', '=', 'nt.id')
            ->where('dkct.id_hoi_vien', $hoiVien->id)
            ->where('dkct.tinh_trang', 1)
            ->select(
                'ct.id',
                'ct.ten_chuong_trinh',
                'ct.so_ngay',
                'ct.so_buoi_moi_tuan',
                'ct.anh_dai_dien',
                'cd.id as id_cap_do',
                'cd.ten_cap_do',
                'nt.id as id_noi_tap',
                'nt.ten_noi_tap'
            )
            ->latest('dkct.id')
            ->first();
        // 6. Trả dữ liệu
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin đăng ký thành công.',
            'data' => [
                'hoi_vien' => $hoiVien,
                'goi_tap' => $goiTap,
                'trainer' => $trainer,
                'chuong_trinh_tap' => $chuongTrinh,
                'tong_tien' => $goiTap->gia,
            ]
        ]);
    }


    public function tinhKhuyenMai(Request $request)
    {
        $request->validate([
            'id_goi_tap' => 'required|integer',
            'ma_khuyen_mai' => 'nullable|string',
        ]);

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
                'message' => 'Không tìm thấy gói tập.'
            ], 404);
        }

        $giaGoc = (float) $goiTap->gia;

        // 3. Đếm số lần đăng ký đã thanh toán thành công
        $soLanDaDangKy = DangKyGoi::where('id_hoi_vien', $hoiVien->id)
            ->where('is_thanh_toan', 1)
            ->count();

       // Lần đăng ký hiện tại
        $lanDangKy = $soLanDaDangKy + 1;

        $phanTramGiam = 0;
        $tienGiamKhuyenMai = 0;
        $tienGiamGioiThieu = 0;
        $tenKhuyenMai = null;
        $maKhuyenMai = $request->ma_khuyen_mai;

        // 4. Xử lý khuyến mãi theo số lần đăng ký
        if ($lanDangKy == 2) {
            $phanTramGiam = 5;
        } elseif ($lanDangKy >= 3) {
            $phanTramGiam = 10;
        }

        // 5. Xử lý mã khuyến mãi
        if ($maKhuyenMai) {

            // Chỉ lần đăng ký đầu tiên mới được sử dụng mã
            if ($lanDangKy > 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã khuyến mãi chỉ áp dụng cho lần đăng ký đầu tiên.',
                ], 422);
            }

            $khuyenMai = KhuyenMai::where('ma_khuyen_mai', $maKhuyenMai)
                ->where('tinh_trang', 1)
                ->first();
            if (!$khuyenMai) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã khuyến mãi không tồn tại hoặc đã ngừng hoạt động.',
                ], 422);
            }

            // Kiểm tra thời gian
            $homNay = Carbon::today();

            if (
                ($khuyenMai->ngay_bat_dau && $homNay->lt(Carbon::parse($khuyenMai->ngay_bat_dau)->startOfDay())) ||
                ($khuyenMai->ngay_ket_thuc && $homNay->gt(Carbon::parse($khuyenMai->ngay_ket_thuc)->endOfDay()))
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã khuyến mãi chưa đến ngày áp dụng hoặc đã hết hạn.',
                ], 422);
            }

            // Kiểm tra gói tập được áp dụng
            if (
                $khuyenMai->id_goi_tap &&
                $khuyenMai->id_goi_tap != $goiTap->id
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã khuyến mãi không áp dụng cho gói tập này.',
                ], 422);
            }

            // Kiểm tra số lần đăng ký được áp dụng
            if (
                ($khuyenMai->lan_dang_ky_tu !== null &&
                    $lanDangKy < $khuyenMai->lan_dang_ky_tu) ||
                ($khuyenMai->lan_dang_ky_den !== null &&
                    $lanDangKy > $khuyenMai->lan_dang_ky_den)
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã khuyến mãi không áp dụng cho lần đăng ký này.',
                ], 422);
            }

            // Tính tiền giảm theo loại khuyến mãi
            if ($khuyenMai->loai_giam == 'phan_tram') {
                $phanTramGiam = (float) $khuyenMai->gia_tri_giam;
                $tienGiamKhuyenMai = $giaGoc * $phanTramGiam / 100;
            } elseif ($khuyenMai->loai_giam == 'tien_mat') {
                $tienGiamKhuyenMai = (float) $khuyenMai->gia_tri_giam;
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Loại giảm giá không hợp lệ.',
                ], 422);
            }

            $tenKhuyenMai = $khuyenMai->ten_khuyen_mai;

        } else {
            // Không nhập mã: tính giảm theo số lần đăng ký
            $tienGiamKhuyenMai = $giaGoc * $phanTramGiam / 100;
        }




        // 6. Kiểm tra ưu đãi giới thiệu
        // Chỉ áp dụng từ lần đăng ký thứ 2 trở đi
        // if ($lanDangKy >= 2) {
        //     $gioiThieu = GioiThieu::where('id_hoi_vien_duoc_gioi_thieu', $hoiVien->id)
        //         ->where('tinh_trang', 1)
        //         ->first();
        //     if ($gioiThieu) {
        //         // Số tiền B được giảm khi đăng ký
        //         $tienGiamGioiThieu = (float) $gioiThieu->thuong_nguoi_duoc_gioi_thieu;
        //     }
        // }


        // 6. Kiểm tra tiền thưởng giới thiệu của A kể cả đăng ký lần đầu 
        $tienGiamGioiThieu = 0;

        $gioiThieu = GioiThieu::where('id_nguoi_gioi_thieu', $hoiVien->id)
            ->where('tinh_trang', 1)
            ->where('thuong_nguoi_gioi_thieu', '>', 0)
            ->first();

        if ($gioiThieu) {
            $tienGiamGioiThieu = (float) $gioiThieu->thuong_nguoi_gioi_thieu;
        }







        // 7. Tổng tiền giảm
        $tongTienGiam = $tienGiamKhuyenMai + $tienGiamGioiThieu;

        // Không cho giảm vượt quá giá gói tập
        $tongTienGiam = min($giaGoc, $tongTienGiam);

        // 8. Tổng tiền phải thanh toán
        $tongTien = $giaGoc - $tongTienGiam;

        return response()->json([
            'success' => true,
            'message' => 'Tính khuyến mãi thành công.',
            'data' => [
                'id_hoi_vien' => $hoiVien->id,
                'id_goi_tap' => $goiTap->id,
                'lan_dang_ky' => $lanDangKy,

                'gia_goc' => round($giaGoc),
                'ten_khuyen_mai' => $tenKhuyenMai,
                'ma_khuyen_mai' => $maKhuyenMai,

                'phan_tram_giam' => $phanTramGiam,
                'tien_giam_khuyen_mai' => round($tienGiamKhuyenMai),
                'tien_giam_gioi_thieu' => round($tienGiamGioiThieu),

                'tong_tien_giam' => round($tongTienGiam),
                'tong_tien' => round($tongTien),
            ],
        ]);
    }


    public function luuMaGioiThieu(Request $request)
    {
        $request->validate([
            'ma_gioi_thieu' => 'required|string',
            'id_goi_tap' => 'required|integer',
        ]);

        // 1. Lấy hội viên B đang đăng nhập
        $hoiVien = auth('sanctum')->user();

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.'
            ], 401);
        }

        // 2. Chuẩn hóa mã giới thiệu
        $maGioiThieu = strtoupper(trim($request->ma_gioi_thieu));

        // 3. Tìm gói tập
        $goiTap = GoiTap::find($request->id_goi_tap);

        if (!$goiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy gói tập.'
            ], 404);
        }

        // 4. Tìm người giới thiệu
        $nguoiGioiThieu = Client::where(
            'ma_gioi_thieu',
            $maGioiThieu
        )->first();

        if (!$nguoiGioiThieu) {
            return response()->json([
                'success' => false,
                'message' => 'Mã giới thiệu không tồn tại.'
            ], 422);
        }

        // 5. Không cho tự nhập mã của mình
        if ($nguoiGioiThieu->id == $hoiVien->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể nhập mã giới thiệu của chính mình.'
            ], 422);
        }

        // 6. Tìm bản ghi giới thiệu cũ
        $gioiThieuCu = GioiThieu::where(
            'id_hoi_vien_duoc_gioi_thieu',
            $hoiVien->id
        )->first();

        // 7. Nếu đã thanh toán thành công thì không cho đổi
        if ($gioiThieuCu && $gioiThieuCu->tinh_trang == 1) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đã thanh toán thành công, không thể thay đổi mã giới thiệu.'
            ], 422);
        }

        // 8. Tính tiền thưởng theo gói tập
        $tienThuong = match ((int) $goiTap->id) {
            1 => 10000,
            2 => 15000,
            3 => 30000,
            4 => 50000,
            default => 0,
        };

        // 9. Nếu đã có bản ghi thì cập nhật
        if ($gioiThieuCu) {

            $gioiThieuCu->update([
                'id_nguoi_gioi_thieu' => $nguoiGioiThieu->id,
                'ma_gioi_thieu' => $maGioiThieu,
                'tinh_trang' => 0,
                'thuong_nguoi_gioi_thieu' => $tienThuong,
                'thuong_nguoi_duoc_gioi_thieu' => 0,
            ]);

            $gioiThieu = $gioiThieuCu->fresh();

        } else {

            // Chưa có thì tạo mới
            $gioiThieu = GioiThieu::create([
                'id_nguoi_gioi_thieu' => $nguoiGioiThieu->id,
                'id_hoi_vien_duoc_gioi_thieu' => $hoiVien->id,
                'ma_gioi_thieu' => $maGioiThieu,
                'tinh_trang' => 0,
                'thuong_nguoi_gioi_thieu' => $tienThuong,
                'thuong_nguoi_duoc_gioi_thieu' => 0,
            ]);
        }

        // 10. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Lưu mã giới thiệu thành công. Đang chờ thanh toán.',
            'data' => [
                'id_gioi_thieu' => $gioiThieu->id,
                'id_goi_tap' => $goiTap->id,
                'ten_goi_tap' => $goiTap->ten_goi_tap,
                'ma_gioi_thieu' => $maGioiThieu,
                'thuong_nguoi_gioi_thieu' => $tienThuong,
                'thuong_nguoi_duoc_gioi_thieu' => 0,
                'tinh_trang' => $gioiThieu->tinh_trang,
                'ten_nguoi_gioi_thieu' => $nguoiGioiThieu->ho_ten,
            ],
        ]);
    }

    public function thongTinGioiThieu()
    {
        $hoiVien = auth('sanctum')->user();
        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.'
            ], 401);
        }
        $gioiThieu = GioiThieu::where( 'id_hoi_vien_duoc_gioi_thieu', $hoiVien->id)
            ->where('tinh_trang', 0)
            ->latest('id')
            ->first();
        if (!$gioiThieu) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }
        $nguoiGioiThieu = Client::find($gioiThieu->id_nguoi_gioi_thieu);
        return response()->json([
            'success' => true,
            'data' => [
                'ma_gioi_thieu' => $gioiThieu->ma_gioi_thieu,
                'ten_nguoi_gioi_thieu' => $nguoiGioiThieu->ho_ten ?? '',
            ],
        ]);
    }



}
