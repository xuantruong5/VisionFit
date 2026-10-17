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
        $ngayKetThuc = $ngayBatDau->copy()->addDays($chuongTrinh->so_ngay - 1);
        // 6. Tạo đăng ký và tự động sinh lịch tập
        $dangKy = DB::transaction(function () use (
            $idHoiVien,
            $idChuongTrinh,
            $idCapDo,
            $idNoiTap,
            $ngayBatDau,
            $ngayKetThuc
        ) {
            $dangKy = DKChuongTrinh::create([
                'id_hoi_vien' => $idHoiVien,
                'id_chuong_trinh' => $idChuongTrinh,
                'id_cap_do' => $idCapDo,
                'id_noi_tap' => $idNoiTap,
                'ngay_bat_dau' => $ngayBatDau->toDateString(),
                'ngay_du_kien_ket_thuc' => $ngayKetThuc->toDateString(),
                'phan_tram_hoan_thanh' => 0,
                'tinh_trang' => 0,
            ]);
            $this->taoLichTap($dangKy->id);
            return $dangKy;
        });
        return response()->json([
            'success' => true,
            'message' => 'Đăng ký chương trình thành công.',
            'data' => $dangKy,
        ], 201);
    }

    // hàm tạo lịch
    private function taoLichTap($idDangKyChuongTrinh)
    {
        $dangKy = DKChuongTrinh::findOrFail($idDangKyChuongTrinh);
        $chuongTrinh = ChuongTrinhTap::findOrFail($dangKy->id_chuong_trinh);
        $lichTuan = DB::table('lich_tap_chuong_trinh')
            ->where('id_chuong_trinh', $dangKy->id_chuong_trinh)
            ->where('tinh_trang', 1)
            ->get();

        if ($lichTuan->isEmpty()) { throw new \RuntimeException('Chương trình chưa có lịch tập hoạt động.');}
        $ngay = Carbon::parse($dangKy->ngay_bat_dau);
        $demBuoi = 0;
        $soBuoi = (int) $chuongTrinh->so_ngay;

        for ($i = 0; $demBuoi < $soBuoi; $i++) {
            $thuHienTai = [
                1 => 'Thứ 2',
                2 => 'Thứ 3',
                3 => 'Thứ 4',
                4 => 'Thứ 5',
                5 => 'Thứ 6',
                6 => 'Thứ 7',
                7 => 'Chủ nhật',
            ][$ngay->dayOfWeekIso];
            $lich = $lichTuan->first(function ($lich) use ($thuHienTai) {
                return trim($lich->thu_trong_tuan) == $thuHienTai;
            });
            if ($lich) {
                DB::table('lich_tap')->insert([
                    'id_dang_ky_chuong_trinh' => $dangKy->id,
                    'id_chuong_trinh' => $dangKy->id_chuong_trinh,
                    'id_hoi_vien' => $dangKy->id_hoi_vien,
                    'id_goi' => null,
                    'id_trainner' => null,
                    'ngay_thu' => $demBuoi + 1,
                    'ngay_tap' => $ngay->toDateString(),
                    'gio_bat_dau' => $lich->gio_bat_dau,
                    'gio_ket_thuc' => $lich->gio_ket_thuc,
                    'ghi_chu' => $lich->ghi_chu,
                    'tinh_trang' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $demBuoi++;
            }
            $ngay->addDay();
        }
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
        // 3. Lấy danh sách chương trình đã đăng ký và thông tin nơi tập
        $data = DKChuongTrinh::where('dang_ky_chuong_trinh.id_hoi_vien', $user->id)
            ->join( 'chuong_trinh_tap as ct','dang_ky_chuong_trinh.id_chuong_trinh', '=', 'ct.id')
            ->leftJoin( 'cap_do as cd','dang_ky_chuong_trinh.id_cap_do','=', 'cd.id')
            ->leftJoin( 'noi_tap as nt','dang_ky_chuong_trinh.id_noi_tap','=','nt.id')
            ->leftJoin( 'lich_tap as lt','dang_ky_chuong_trinh.id','=','lt.id_dang_ky_chuong_trinh')
            ->select(
                'dang_ky_chuong_trinh.id',
                'dang_ky_chuong_trinh.id_chuong_trinh',
                'ct.ten_chuong_trinh',
                'nt.ten_noi_tap',
                'ct.so_sao',
                'cd.ten_cap_do',
                'ct.so_ngay',
                'ct.so_buoi_moi_tuan',
                'ct.anh_dai_dien',
                'lt.ngay_tap',
            )
            ->orderByDesc('dang_ky_chuong_trinh.id')
            ->orderBy('lt.ngay_tap')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách chương trình thành công',
            'data' => $data,
        ], 200);
    }

    public function getListProgramExercises()
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }
        $idHoiVien = $user->id;
        $data = DKChuongTrinh::where('dang_ky_chuong_trinh.id_hoi_vien', $idHoiVien)
            ->join( 'chuong_trinh_tap as ct', 'dang_ky_chuong_trinh.id_chuong_trinh', '=', 'ct.id' )
            ->join('chuong_trinh_bai_tap as ctbt', 'ct.id','=','ctbt.id_chuong_trinh')
            ->leftJoin( 'cap_do as cd','dang_ky_chuong_trinh.id_cap_do','=', 'cd.id')
            ->leftJoin( 'noi_tap as nt','dang_ky_chuong_trinh.id_noi_tap','=','nt.id')
            ->select(
                'dang_ky_chuong_trinh.id as id_dang_ky_chuong_trinh',
                'dang_ky_chuong_trinh.id_chuong_trinh',
                'ct.ten_chuong_trinh',
                'nt.ten_noi_tap',
                'ct.so_sao',
                'cd.ten_cap_do',
                'ct.so_ngay',
                'ct.so_buoi_moi_tuan',
                'ct.anh_dai_dien',
                'ctbt.id as id_chuong_trinh_bai_tap',
                'ctbt.ngay_thu',
                'ctbt.ten_ngay_tap',
                'ctbt.thoi_gian_phut',
                'ctbt.cho_phep_bo_qua',
                'ctbt.tinh_trang'
            )
            ->orderByDesc('dang_ky_chuong_trinh.id')
            ->orderBy('ctbt.ngay_thu')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách ngày tập thành công',
            'data' => $data,
        ], 200);
    }

    public function getListMealPlans()
    {
        // 1. Lấy người dùng đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }
        // 2. Lấy ID hội viên
        $idHoiVien = $user->id;

        // 3. Lấy kế hoạch ăn theo chương trình đã đăng ký
        $data = DKChuongTrinh::where('dang_ky_chuong_trinh.id_hoi_vien', $idHoiVien)
            ->join( 'ke_hoach_an as kha','dang_ky_chuong_trinh.id_chuong_trinh', '=','kha.id_chuong_trinh')
            ->leftJoin('khau_phan_an as kpa','kha.id','=','kpa.id_ke_hoach_an')
            ->leftJoin('mon_an as ma','kpa.id_mon_an','=','ma.id')
            ->where('kha.tinh_trang', 1)
            ->select(
                'kha.id as id_ke_hoach_an',
                'kha.id_chuong_trinh',
                'kha.id_hoi_vien',
                'kha.ten_ke_hoach',
                'kha.muc_tieu_calo',
                'kha.protein_muc_tieu',
                'kha.carb_muc_tieu',
                'kha.fat_muc_tieu',
                'kha.ngay_bat_dau',
                'kha.ngay_ket_thuc',
                'kha.tinh_trang',
                'kpa.id as id_khau_phan_an',
                'kpa.ngay_an',
                'kpa.gio_an',
                'kpa.bua_an',
                'kpa.so_luong',
                'kpa.ghi_chu',
                'ma.id as id_mon_an',
                'ma.ten_mon_an',
                'ma.mo_ta',
                'ma.anh_dai_dien',
                'ma.khoi_luong_gram',
                'ma.thoi_gian_nau',
                'ma.loai_bua',
                'ma.calo',
                'ma.protein',
                'ma.carb',
                'ma.fat',
                'ma.nguyen_lieu',
                'ma.gia_vi',
                'ma.huong_dan_nau'
            )
            ->orderBy('kha.id')
            ->orderBy('kpa.ngay_an')
            ->orderBy('kpa.gio_an')
            ->get();

        return response()->json([
            'success' => true,
            'message' => $data->isEmpty()
                ? 'Hội viên chưa có kế hoạch ăn'
                : 'Lấy danh sách kế hoạch ăn thành công',
            'data' => $data,
        ]);
    }
}
