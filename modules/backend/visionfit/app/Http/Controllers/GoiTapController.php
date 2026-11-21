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
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

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
        $idGioiThieu = null;

        $gioiThieu = GioiThieu::where('id_nguoi_gioi_thieu', $hoiVien->id)
            ->where('tinh_trang', 1)
            ->where('da_su_dung', 0)
            ->where('thuong_nguoi_gioi_thieu', '>', 0)
            ->orderBy('id', 'asc')
            ->first();

        if ($gioiThieu) {
            $tienGiamGioiThieu = (float) $gioiThieu->thuong_nguoi_gioi_thieu;
            $idGioiThieu = $gioiThieu->id;
        } else {
            $idGioiThieu = null;
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
                'id_gioi_thieu' => $idGioiThieu,

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

    /* =========================================================================
     * ADMIN API: QUẢN LÝ GÓI TẬP (CRUD, TÌM KIẾM, THAY ĐỔI TRẠNG THÁI)
     * ========================================================================= */

    /**
     * Định dạng dữ liệu gói tập cho giao diện Admin
     */
    protected function formatGoiTapAdmin($goi)
    {
        $loai = 'gym';
        if ($goi->so_buoi_pt > 0) {
            $loai = 'pt';
        } elseif ($goi->co_ai) {
            $loai = 'ai';
        }

        $thoiHan = $goi->thoi_han_ngay ?? $goi->thoi_han_mua ?? 30;

        $daBan = isset($goi->da_ban)
            ? (int)$goi->da_ban
            : (int)DB::table('chi_tiet_dang_ky_goi')->where('id_goi_tap', $goi->id)->count();

        return [
            'id' => $goi->id,
            'ma_goi_tap' => $goi->ma_goi_tap,
            'id_phong_tap' => $goi->id_phong_tap,
            'ten_goi_tap' => $goi->ten_goi_tap,
            'ten_goi' => $goi->ten_goi_tap,
            'loai' => $loai,
            'gia' => (float)$goi->gia,
            'thoi_han' => (int)$thoiHan,
            'thoi_han_ngay' => (int)($goi->thoi_han_ngay ?? $thoiHan),
            'thoi_han_mua' => (int)($goi->thoi_han_mua ?? $thoiHan),
            'thoi_han_tang' => (int)($goi->thoi_han_tang ?? 0),
            'so_buoi' => (int)($goi->so_buoi ?? 0),
            'so_buoi_pt' => (int)($goi->so_buoi_pt ?? 0),
            'co_ai' => (bool)$goi->co_ai,
            'co_trainer_review' => (bool)$goi->co_trainer_review,
            'noi_bat' => (bool)($goi->co_ai && $goi->so_buoi_pt == 0),
            'mo_ta' => $goi->mo_ta,
            'hinh_anh' => $goi->hinh_anh,
            'tinh_trang' => (int)$goi->tinh_trang,
            'trang_thai' => $goi->tinh_trang == 1 ? 'active' : 'inactive',
            'da_ban' => $daBan,
            'created_at' => $goi->created_at ? Carbon::parse($goi->created_at)->format('d/m/Y H:i') : null,
            'updated_at' => $goi->updated_at ? Carbon::parse($goi->updated_at)->format('d/m/Y H:i') : null,
        ];
    }

    /**
     * Admin: Lấy danh sách gói tập (hỗ trợ lọc theo loại, trạng thái, tìm kiếm từ khóa)
     */
    public function danhSachGoiTapAdmin(Request $request)
    {
        $keyword = $request->query('keyword', $request->query('search', ''));
        $loai = $request->query('loai');
        $tinhTrang = $request->query('tinh_trang');
        $trangThai = $request->query('trang_thai');

        $query = GoiTap::query();

        if (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {
                $q->where('ten_goi_tap', 'LIKE', '%' . $keyword . '%')
                  ->orWhere('ma_goi_tap', 'LIKE', '%' . $keyword . '%');
            });
        }

        if (!empty($loai)) {
            if ($loai === 'pt') {
                $query->where('so_buoi_pt', '>', 0);
            } elseif ($loai === 'ai') {
                $query->where('co_ai', 1)->where('so_buoi_pt', 0);
            } elseif ($loai === 'gym') {
                $query->where('so_buoi_pt', 0)->where('co_ai', 0);
            }
        }

        if ($tinhTrang !== null && $tinhTrang !== '') {
            $query->where('tinh_trang', (int)$tinhTrang);
        } elseif (!empty($trangThai)) {
            if ($trangThai === 'active') {
                $query->where('tinh_trang', 1);
            } elseif ($trangThai === 'inactive') {
                $query->where('tinh_trang', 0);
            }
        }

        $list = $query->orderBy('id', 'desc')->get();
        $data = $list->map(function ($item) {
            return $this->formatGoiTapAdmin($item);
        });

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Lấy danh sách gói tập thành công.',
            'data' => $data,
        ]);
    }

    /**
     * Admin: Tìm kiếm gói tập
     */
    public function timKiemGoiTapAdmin(Request $request)
    {
        $keyword = $request->query('keyword', $request->noi_dung_tim_kiem ?? $request->query('search', ''));

        $query = GoiTap::query();
        if (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {
                $q->where('ten_goi_tap', 'LIKE', '%' . $keyword . '%')
                  ->orWhere('ma_goi_tap', 'LIKE', '%' . $keyword . '%');
            });
        }

        $list = $query->orderBy('id', 'desc')->get();
        $data = $list->map(function ($item) {
            return $this->formatGoiTapAdmin($item);
        });

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Tìm kiếm gói tập thành công.',
            'data' => $data,
        ]);
    }

    /**
     * Admin: Chi tiết gói tập theo ID
     */
    public function chiTietGoiTapAdmin($id)
    {
        $goiTap = GoiTap::find($id);
        if (!$goiTap) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy gói tập.',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Lấy thông tin chi tiết gói tập thành công.',
            'data' => $this->formatGoiTapAdmin($goiTap),
        ]);
    }

    /**
     * Admin: Thêm mới gói tập
     */
    public function themMoiGoiTapAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ten_goi_tap' => 'required_without:ten_goi|nullable|string|max:255',
            'ten_goi' => 'required_without:ten_goi_tap|nullable|string|max:255',
            'gia' => 'required|numeric|min:0',
            'thoi_han' => 'nullable|integer|min:1',
            'thoi_han_ngay' => 'nullable|integer|min:1',
            'thoi_han_mua' => 'nullable|integer|min:1',
            'thoi_han_tang' => 'nullable|integer|min:0',
            'so_buoi' => 'nullable|integer|min:0',
            'so_buoi_pt' => 'nullable|integer|min:0',
            'co_ai' => 'nullable|boolean',
            'co_trainer_review' => 'nullable|boolean',
            'mo_ta' => 'nullable|string',
            'hinh_anh' => 'nullable|string',
            'tinh_trang' => 'nullable|integer',
        ], [
            'ten_goi_tap.required_without' => 'Vui lòng nhập tên gói tập.',
            'ten_goi.required_without' => 'Vui lòng nhập tên gói tập.',
            'gia.required' => 'Vui lòng nhập giá gói tập.',
            'gia.numeric' => 'Giá gói tập phải là số hợp lệ.',
            'gia.min' => 'Giá gói tập không được âm.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $tenGoi = trim($request->ten_goi_tap ?? $request->ten_goi);
        $maGoiTap = $request->ma_goi_tap;
        if (empty($maGoiTap)) {
            $maGoiTap = 'GT' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        }

        $thoiHan = $request->thoi_han_ngay ?? $request->thoi_han ?? $request->thoi_han_mua ?? 30;
        $thoiHanMua = $request->thoi_han_mua ?? $request->thoi_han ?? $request->thoi_han_ngay ?? 30;
        $thoiHanTang = $request->thoi_han_tang ?? 0;

        $tinhTrang = 1;
        if ($request->has('tinh_trang') && $request->tinh_trang !== null) {
            $tinhTrang = (int)$request->tinh_trang;
        } elseif ($request->has('trang_thai')) {
            $tinhTrang = $request->trang_thai === 'inactive' ? 0 : 1;
        }

        $coAi = $request->has('co_ai') ? (bool)$request->co_ai : false;
        $coTrainerReview = $request->has('co_trainer_review') ? (bool)$request->co_trainer_review : false;
        $soBuoiPt = (int)($request->so_buoi_pt ?? 0);
        $soBuoi = (int)($request->so_buoi ?? 0);

        if ($request->loai === 'pt' && $soBuoiPt == 0) {
            $soBuoiPt = 12;
        }
        if ($request->loai === 'ai') {
            $coAi = true;
        }

        $goiTap = GoiTap::create([
            'ma_goi_tap' => $maGoiTap,
            'id_phong_tap' => $request->id_phong_tap ?? 1,
            'ten_goi_tap' => $tenGoi,
            'thoi_han_mua' => $thoiHanMua,
            'thoi_han_tang' => $thoiHanTang,
            'thoi_han_ngay' => $thoiHan,
            'gia' => $request->gia,
            'hinh_anh' => $request->hinh_anh ?? null,
            'so_buoi' => $soBuoi,
            'so_buoi_pt' => $soBuoiPt,
            'mo_ta' => $request->mo_ta,
            'co_ai' => $coAi ? 1 : 0,
            'co_trainer_review' => $coTrainerReview ? 1 : 0,
            'tinh_trang' => $tinhTrang,
        ]);

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Thêm mới gói tập thành công.',
            'data' => $this->formatGoiTapAdmin($goiTap),
        ], 201);
    }

    /**
     * Admin: Cập nhật thông tin gói tập
     */
    public function capNhatGoiTapAdmin(Request $request, $id)
    {
        $goiTap = GoiTap::find($id);
        if (!$goiTap) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy gói tập.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'gia' => 'nullable|numeric|min:0',
            'thoi_han' => 'nullable|integer|min:1',
            'thoi_han_ngay' => 'nullable|integer|min:1',
            'thoi_han_mua' => 'nullable|integer|min:1',
            'thoi_han_tang' => 'nullable|integer|min:0',
            'so_buoi' => 'nullable|integer|min:0',
            'so_buoi_pt' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $updateData = [];

        if ($request->has('ten_goi_tap') || $request->has('ten_goi')) {
            $updateData['ten_goi_tap'] = trim($request->ten_goi_tap ?? $request->ten_goi);
        }
        if ($request->has('ma_goi_tap')) {
            $updateData['ma_goi_tap'] = trim($request->ma_goi_tap);
        }
        if ($request->has('gia')) {
            $updateData['gia'] = $request->gia;
        }
        if ($request->has('thoi_han_ngay') || $request->has('thoi_han')) {
            $thoiHan = $request->thoi_han_ngay ?? $request->thoi_han;
            $updateData['thoi_han_ngay'] = $thoiHan;
            $updateData['thoi_han_mua'] = $request->thoi_han_mua ?? $thoiHan;
        } elseif ($request->has('thoi_han_mua')) {
            $updateData['thoi_han_mua'] = $request->thoi_han_mua;
            $updateData['thoi_han_ngay'] = $request->thoi_han_mua;
        }
        if ($request->has('thoi_han_tang')) {
            $updateData['thoi_han_tang'] = $request->thoi_han_tang;
        }
        if ($request->has('so_buoi')) {
            $updateData['so_buoi'] = $request->so_buoi;
        }
        if ($request->has('so_buoi_pt')) {
            $updateData['so_buoi_pt'] = $request->so_buoi_pt;
        }
        if ($request->has('co_ai')) {
            $updateData['co_ai'] = $request->boolean('co_ai') ? 1 : 0;
        }
        if ($request->has('co_trainer_review')) {
            $updateData['co_trainer_review'] = $request->boolean('co_trainer_review') ? 1 : 0;
        }
        if ($request->has('mo_ta')) {
            $updateData['mo_ta'] = $request->mo_ta;
        }
        if ($request->has('hinh_anh')) {
            $updateData['hinh_anh'] = $request->hinh_anh;
        }
        if ($request->has('tinh_trang')) {
            $updateData['tinh_trang'] = (int)$request->tinh_trang;
        } elseif ($request->has('trang_thai')) {
            $updateData['tinh_trang'] = $request->trang_thai === 'active' ? 1 : 0;
        }

        $goiTap->update($updateData);

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Cập nhật thông tin gói tập thành công.',
            'data' => $this->formatGoiTapAdmin($goiTap->fresh()),
        ]);
    }

    /**
     * Admin: Xóa gói tập
     */
    public function xoaGoiTapAdmin($id)
    {
        $goiTap = GoiTap::find($id);
        if (!$goiTap) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy gói tập.',
            ], 404);
        }

        $countDangKy = DB::table('chi_tiet_dang_ky_goi')->where('id_goi_tap', $id)->count();
        if ($countDangKy > 0) {
            $goiTap->update(['tinh_trang' => 0]);
            return response()->json([
                'status' => true,
                'success' => true,
                'message' => "Gói tập đã có {$countDangKy} lượt đăng ký trong hệ thống nên không thể xóa khỏi CSDL. Hệ thống đã tự động chuyển trạng thái sang ngừng bán.",
                'data' => $this->formatGoiTapAdmin($goiTap),
                'is_soft_disabled' => true,
            ]);
        }

        $goiTap->delete();

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Xóa gói tập thành công.',
        ]);
    }

    /**
     * Admin: Thay đổi trạng thái gói tập (Đang bán <-> Ngừng bán)
     */
    public function doiTrangThaiGoiTapAdmin(Request $request, $id)
    {
        $goiTap = GoiTap::find($id);
        if (!$goiTap) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy gói tập.',
            ], 404);
        }

        if ($request->has('tinh_trang') && $request->tinh_trang !== null) {
            $newStatus = (int)$request->tinh_trang;
        } elseif ($request->has('trang_thai')) {
            $newStatus = $request->trang_thai === 'active' ? 1 : 0;
        } else {
            $newStatus = $goiTap->tinh_trang == 1 ? 0 : 1;
        }

        $goiTap->update(['tinh_trang' => $newStatus]);

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => $newStatus == 1 ? 'Đã kích hoạt mở bán gói tập.' : 'Đã chuyển gói tập sang ngừng bán.',
            'data' => $this->formatGoiTapAdmin($goiTap->fresh()),
        ]);
    }
}
