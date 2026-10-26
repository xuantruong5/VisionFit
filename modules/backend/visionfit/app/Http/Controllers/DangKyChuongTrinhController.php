<?php

namespace App\Http\Controllers;
use App\Http\Requests\DangKyChuongTrinh\StoreDKChuongTrinhRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DKChuongTrinh;
use App\Models\ChuongTrinhTap;
use App\Models\Client;
use App\Models\CapDo;
use App\Models\KhauPhanAn;
use App\Models\KeHoachAn;
use App\Models\ChuongTrinhBaiTapChiTiet;
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
        // 4. Lấy mục tiêu dinh dưỡng theo chương trình, không dùng mapping
        $mucTieuDinhDuong = DB::table('muc_tieu_dinh_duong')
            ->where('id_chuong_trinh', $idChuongTrinh)
            ->first();

        if (!$mucTieuDinhDuong) {
            return response()->json([
                'success' => false,
                'message' => 'Chương trình chưa có mục tiêu dinh dưỡng.',
            ], 422);
        }

        $idMucTieuDinhDuong = $mucTieuDinhDuong->id;

        // 5. Lấy thực đơn mẫu
        $khauPhanMau = DB::table('khau_phan_an')
            ->where('id_muc_tieu_dinh_duong', $idMucTieuDinhDuong)
            ->whereNull('id_ke_hoach_an')
            ->get();

        if ($khauPhanMau->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thực đơn mẫu cho chương trình.',
            ], 422);
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
            $ngayKetThuc,
            $chuongTrinh,
            $idMucTieuDinhDuong,
            $khauPhanMau
        ) {
            DKChuongTrinh::where('id_hoi_vien', $idHoiVien)
                ->where('tinh_trang', 1)
                ->update([
                    'tinh_trang' => 0,
            ]);
            $dangKy = DKChuongTrinh::create([
                'id_hoi_vien' => $idHoiVien,
                'id_chuong_trinh' => $idChuongTrinh,
                'id_cap_do' => $idCapDo,
                'id_noi_tap' => $idNoiTap,
                'ngay_bat_dau' => $ngayBatDau->toDateString(),
                'ngay_du_kien_ket_thuc' => $ngayKetThuc->toDateString(),
                'phan_tram_hoan_thanh' => 0,
                'tinh_trang' => 1,
            ]);
            $this->taoLichTap($dangKy->id);
            // 3. Tạo kế hoạch ăn
            $keHoachAn = KeHoachAn::create([
                'id_chuong_trinh' => $idChuongTrinh,
                'id_hoi_vien' => $idHoiVien,
                'id_nguoi_tao' => $idHoiVien,
                'id_dang_ky_chuong_trinh' => $dangKy->id,
                'ten_ke_hoach' => 'Kế hoạch ăn chương trình ' . $idChuongTrinh,
                'tinh_trang' => 1,
            ]);
            // Tạo khẩu phần ăn theo từng ngày
            $khauPhanMoi = [];
            $thoiGianHienTai = now();

            for ($ngayThu = 1; $ngayThu <= $chuongTrinh->so_ngay; $ngayThu++) {
                $ngayAn = $ngayBatDau->copy()
                    ->addDays($ngayThu - 1)
                    ->toDateString();

                foreach ($khauPhanMau as $mau) {
                    $khauPhanMoi[] = [
                        'id_ke_hoach_an' => $keHoachAn->id,
                        'id_muc_tieu_dinh_duong' => $idMucTieuDinhDuong,
                        'id_mon_an' => $mau->id_mon_an,
                        'ngay_thu' => $ngayThu,
                        'ngay_an' => $ngayAn,
                        'gio_an' => $mau->gio_an,
                        'bua_an' => $mau->bua_an,
                        'so_luong' => $mau->so_luong,
                        'ghi_chu' => $mau->ghi_chu,
                        'created_at' => $thoiGianHienTai,
                        'updated_at' => $thoiGianHienTai,
                    ];
                }
            }
            foreach (array_chunk($khauPhanMoi, 500) as $chunk) {
                DB::table('khau_phan_an')->insert($chunk);
            }
            return $dangKy;
        });
        return response()->json([
            'success' => true,
            'message' => 'Đăng ký chương trình và tạo kế hoạch ăn thành công.',
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





    private function taoNgayAn($keHoachAn)
    {
        $idKeHoachMau = 1; // Thay bằng ID kế hoạch mẫu thực tế

        $thucDonMau = DB::table('khau_phan_an')
            ->where('id_ke_hoach_an', $idKeHoachMau)
            ->orderBy('ngay_an')
            ->orderBy('gio_an')
            ->get();

        if ($thucDonMau->isEmpty()) {
            throw new \RuntimeException('Kế hoạch mẫu chưa có thực đơn.');
        }

        $ngayBatDau = Carbon::parse($keHoachAn->ngay_bat_dau);
        $ngayKetThuc = Carbon::parse($keHoachAn->ngay_ket_thuc);

        $soNgayChuKy = max(
            1,
            Carbon::parse($thucDonMau->min('ngay_an'))
                ->diffInDays(Carbon::parse($thucDonMau->max('ngay_an'))) + 1
        );

        $ngay = $ngayBatDau->copy();

        while ($ngay->lte($ngayKetThuc)) {
            $ngayThu = $ngayBatDau->diffInDays($ngay);

            foreach ($thucDonMau as $mon) {
                $ngayMau = Carbon::parse($mon->ngay_an);
                $ngayMauThu = Carbon::parse($thucDonMau->min('ngay_an'))
                    ->diffInDays($ngayMau);

                if ($ngayMauThu !== $ngayThu % $soNgayChuKy) {
                    continue;
                }

                DB::table('khau_phan_an')->insert([
                    'id_ke_hoach_an' => $keHoachAn->id_ke_hoach_an,
                    'id_mon_an' => $mon->id_mon_an,
                    'ngay_an' => $ngay->toDateString(),
                    'gio_an' => $mon->gio_an,
                    'bua_an' => $mon->bua_an,
                    'so_luong' => $mon->so_luong,
                    'ghi_chu' => $mon->ghi_chu,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
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
            ->where('dang_ky_chuong_trinh.tinh_trang', 1)
            ->join( 'chuong_trinh_tap as ct','dang_ky_chuong_trinh.id_chuong_trinh', '=', 'ct.id')
            ->leftJoin( 'cap_do as cd','dang_ky_chuong_trinh.id_cap_do','=', 'cd.id')
            ->leftJoin( 'noi_tap as nt','dang_ky_chuong_trinh.id_noi_tap','=','nt.id')
            ->leftJoin( 'lich_tap as lt','dang_ky_chuong_trinh.id','=','lt.id_dang_ky_chuong_trinh')
            ->select(
                'dang_ky_chuong_trinh.id',
                'dang_ky_chuong_trinh.id_chuong_trinh',
                'dang_ky_chuong_trinh.tinh_trang',
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

    public function getAllListPrograms()
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
                'dang_ky_chuong_trinh.tinh_trang',
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
        // 1. Lấy toàn bộ giáo án của chương trình đang đăng ký
        $data = DKChuongTrinh::where( 'dang_ky_chuong_trinh.id_hoi_vien', $user->id )
            ->where('dang_ky_chuong_trinh.tinh_trang', 1)
            ->join('chuong_trinh_tap as ct','dang_ky_chuong_trinh.id_chuong_trinh','=','ct.id' )
            ->join( 'chuong_trinh_bai_tap as ctbt', 'ct.id','=','ctbt.id_chuong_trinh' )
            ->leftJoin( 'cap_do as cd', 'dang_ky_chuong_trinh.id_cap_do','=', 'cd.id')
            ->leftJoin( 'noi_tap as nt','dang_ky_chuong_trinh.id_noi_tap', '=','nt.id')
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

        if ($data->isEmpty()) {
            return response()->json([
                'success' => true,
                'message' => 'Chưa có chương trình đang hoạt động',
                'data' => [],
            ], 200);
        }

        // 2. Lấy lịch tập thực tế theo đăng ký
        $idDangKy = $data->first()->id_dang_ky_chuong_trinh;
        $lichTap = DB::table('lich_tap')
            ->where('id_dang_ky_chuong_trinh', $idDangKy)
            ->orderBy('ngay_tap')
            ->get()
            ->values();

        // 3. Bổ sung thông tin lịch tập vào từng buổi giáo án
        foreach ($data as $index => $buoi) {
            $lich = $lichTap->get($index);
            $buoi->buoi_thuc_te = $lich ? $index + 1 : null;
            $buoi->id_lich_tap = $lich->id ?? null;
            $buoi->ngay_tap = $lich->ngay_tap ?? null;
            if ($lich && $lich->ngay_tap) {
                $ngayTap = \Carbon\Carbon::parse($lich->ngay_tap);
                $buoi->ngay_tap_hien_thi = $ngayTap->format('d/m/Y');
                $buoi->thu_tap = match ($ngayTap->dayOfWeekIso) { 1 => 'Thứ 2', 2 => 'Thứ 3', 3 => 'Thứ 4', 4 => 'Thứ 5', 5 => 'Thứ 6', 6 => 'Thứ 7', 7 => 'Chủ nhật', };
            } else {
                $buoi->ngay_tap_hien_thi = null;
                $buoi->thu_tap = null;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách ngày tập và lịch tập thành công',
            'data' => $data,
        ], 200);
    }
    
   
    public function getExercises($id)
    {
        // 1. Lấy hội viên đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }
        // 2. Lấy bài tập thuộc ngày tập của chương trình đang đăng ký
        $data = DKChuongTrinh::where( 'dang_ky_chuong_trinh.id_hoi_vien', $user->id )
            ->where('dang_ky_chuong_trinh.tinh_trang', 1)
            ->join( 'chuong_trinh_tap as ct', 'dang_ky_chuong_trinh.id_chuong_trinh','=', 'ct.id')
            ->join( 'chuong_trinh_bai_tap as ctbt','ct.id','=','ctbt.id_chuong_trinh')
            // Chỉ lấy bài tập có trong ngày tập
            ->join( 'chuong_trinh_bai_tap_chi_tiet as ctbtct','ctbt.id','=','ctbtct.id_chuong_trinh_bai_tap')
            // Nối danh mục bài tập
            ->join( 'bai_tap as bt','ctbtct.id_bai_tap','=','bt.id')
            // Lọc theo cấp độ và nơi tập đã đăng ký
            ->join('bai_tap_phan_loai as btpl', function ($join) {
                $join->on('bt.id', '=', 'btpl.id_bai_tap')
                    ->on(
                        'dang_ky_chuong_trinh.id_cap_do',
                        '=',
                        'btpl.id_cap_do'
                    )
                    ->on(
                        'dang_ky_chuong_trinh.id_noi_tap',
                        '=',
                        'btpl.id_noi_tap'
                    );
            })
            // Lấy thông tin chi tiết bài tập
            ->leftJoin('chi_tiet_bai_tap as ctct','bt.id','=','ctct.id_bai_tap' )
            // Đúng ngày tập được yêu cầu
            ->where('ctbt.id', $id)

            ->select(
                'dang_ky_chuong_trinh.id as id_dang_ky_chuong_trinh',
                'dang_ky_chuong_trinh.id_chuong_trinh',
                'dang_ky_chuong_trinh.id_cap_do',
                'dang_ky_chuong_trinh.id_noi_tap',

                'ctbt.id as id_chuong_trinh_bai_tap',
                'ctbt.ten_ngay_tap',

                'bt.id as id_bai_tap',
                'bt.ten_bai_tap',
                'bt.mo_ta as mo_ta_bai_tap',
                'bt.thoi_gian_phut',
                'bt.rep_yeu_cau',
                'bt.set_yeu_cau',
                'bt.giay_yeu_cau',
                'bt.anh_dai_dien as anh_bai_tap',
                'bt.muc_ta_toi_thieu',
                'bt.thiet_bi',

                'ctct.video_huong_dan',
                'ctct.video_sai',
                'ctct.huong_dan',
                'ctct.canh_bao',
                'ctct.noi_tap',
                'ctct.mo_ta',

                'ctbtct.thu_tu'
            )

            ->where('ctbt.id', $id)
            ->orderBy('ctbtct.thu_tu', 'asc')
            ->get()
            ->values()
            ->map(function ($item, $index) {
                $item->thu_tu = $index + 1;
                return $item;
            });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách bài tập phù hợp với cấp độ và nơi tập thành công',
            'total_exercises' => $data->count(),
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
        ->where('dang_ky_chuong_trinh.tinh_trang', 1)
        ->join( 'ke_hoach_an as kha','dang_ky_chuong_trinh.id', '=', 'kha.id_dang_ky_chuong_trinh')
        ->leftJoin( 'khau_phan_an as kpa','kha.id', '=','kpa.id_ke_hoach_an')
        ->leftJoin('mon_an as ma','kpa.id_mon_an','=', 'ma.id'
        )
        ->leftJoin( 'muc_tieu_dinh_duong as mtd', 'kpa.id_muc_tieu_dinh_duong', '=', 'mtd.id'
        )
        ->where('kha.tinh_trang', 1)
        ->select(
            // Kế hoạch ăn
            'kha.id as id_ke_hoach_an',
            'kha.id_chuong_trinh',
            'kha.ten_ke_hoach',
            'kha.tinh_trang',

            // Mục tiêu dinh dưỡng
            'mtd.muc_tieu_the_trang',
            'mtd.muc_tieu_calo',
            'mtd.protein_muc_tieu',
            'mtd.carb_muc_tieu',
            'mtd.fat_muc_tieu',

            // Khẩu phần ăn
            'kpa.id as id_khau_phan_an',
            'kpa.ngay_thu',
            'kpa.ngay_an',
            'kpa.gio_an',
            'kpa.bua_an',
            'kpa.so_luong',
            'kpa.ghi_chu',

            // Thông tin món ăn
            'ma.id as id_mon_an',
            'ma.ten_mon_an',
            'ma.mo_ta',
            'ma.anh_dai_dien',
            'ma.calo',
            'ma.khoi_luong_gram',
            'ma.fat',
            'ma.carb',
            'ma.protein',
            'ma.nguyen_lieu',
            'ma.gia_vi',
            'ma.thoi_gian_nau',
            'ma.huong_dan_nau',
            'ma.loai_bua'
        )
        ->orderBy('kha.id')
        ->orderBy('kpa.ngay_thu')
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

    
    public function destroy($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }
        $idHoiVien = $user->id;
        $dangKy = DKChuongTrinh::where('id', $id)
            ->where('id_hoi_vien', $idHoiVien)
            ->first();
        if (!$dangKy) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đăng ký chương trình hoặc bạn không có quyền xóa.',
            ], 404);
        }
        $dangHoatDong = $dangKy->tinh_trang == 1;
        $dangKy->delete();
        if ($dangHoatDong) {
        // Tìm chương trình còn lại
            $chuongTrinhConLai = DKChuongTrinh::where('id_hoi_vien', $idHoiVien)
                ->orderBy('id', 'desc')
                ->first();
            // Nếu còn chương trình thì kích hoạt
            if ($chuongTrinhConLai) {
                $chuongTrinhConLai->tinh_trang = 1;
                $chuongTrinhConLai->save();
            }
        }
        return response()->json([
            'success' => true,
            'message' => 'Xóa đăng ký chương trình tập thành công.',
        ], 200);
    }

    public function activateProgram($id)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập',
            ], 401);
        }
        $idHoiVien = $user->id;
        $program = DB::table('dang_ky_chuong_trinh')
            ->where('id', $id)
            ->where('id_hoi_vien', $idHoiVien)
            ->first();

        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương trình đã đăng ký',
            ], 404);
        }
        DB::transaction(function () use ($idHoiVien, $id) {
            // Chuyển tất cả chương trình của hội viên về không hoạt động
            DB::table('dang_ky_chuong_trinh')
                ->where('id_hoi_vien', $idHoiVien)
                ->update([
                    'tinh_trang' => 0,
                ]);
            // Kích hoạt chương trình được chọn
            DB::table('dang_ky_chuong_trinh')
                ->where('id', $id)
                ->where('id_hoi_vien', $idHoiVien)
                ->update([
                    'tinh_trang' => 1,
                ]);
        });
        return response()->json([
            'success' => true,
            'message' => 'Đã chuyển chương trình đang hoạt động',
            'data' => [
                'id_dang_ky_chuong_trinh' => $id,
                'tinh_trang' => 1,
            ],
        ]);

    }


    // api tổng hợp
    // public function getMyProgramDetail()
    // {
        
    //     $user = Auth::guard('sanctum')->user();
    //     if (!$user) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Chưa đăng nhập',
    //         ], 401);
    //     }

       
    //     $programs = DKChuongTrinh::where( 'dang_ky_chuong_trinh.id_hoi_vien', $user->id)
    //         ->where('dang_ky_chuong_trinh.tinh_trang', 1)
    //         ->join('chuong_trinh_tap as ct','dang_ky_chuong_trinh.id_chuong_trinh', '=','ct.id')
    //         ->leftJoin( 'cap_do as cd','dang_ky_chuong_trinh.id_cap_do', '=','cd.id')
    //         ->leftJoin( 'noi_tap as nt','dang_ky_chuong_trinh.id_noi_tap','=','nt.id')
    //         ->select(
    //             'dang_ky_chuong_trinh.id as id_dang_ky_chuong_trinh',
    //             'dang_ky_chuong_trinh.id_chuong_trinh',
    //             'ct.ten_chuong_trinh',
    //             'ct.so_sao',
    //             'ct.so_ngay',
    //             'ct.so_buoi_moi_tuan',
    //             'ct.anh_dai_dien',
    //             'cd.ten_cap_do',
    //             'nt.ten_noi_tap'
    //         )
    //         ->orderByDesc('dang_ky_chuong_trinh.id')
    //         ->get();

        
       

       
    //     foreach ($programs as $program) {
    //          $program->lich_tap = DB::table('lich_tap as lt')
    //         ->where(
    //             'lt.id_dang_ky_chuong_trinh',
    //             $program->id_dang_ky_chuong_trinh
    //         )
    //         ->select(
    //             'lt.id',
    //             'lt.id_chuong_trinh',
    //             'lt.id_hoi_vien',
    //             'lt.ngay_thu',
    //             'lt.ngay_tap'
    //         )
    //         ->orderBy('lt.ngay_tap')
    //         ->get();
    //         $program->ngay_tap = DB::table('chuong_trinh_bai_tap as ctbt')
    //             ->where('ctbt.id_chuong_trinh', $program->id_chuong_trinh)
    //             ->select(
    //                 'ctbt.id as id_chuong_trinh_bai_tap',
    //                 'ctbt.ngay_thu',
    //                 'ctbt.ten_ngay_tap',
    //                 'ctbt.thoi_gian_phut',
    //                 'ctbt.cho_phep_bo_qua',
    //                 'ctbt.tinh_trang'
    //             )
    //             ->orderBy('ctbt.ngay_thu')
    //             ->get();

    //         foreach ($program->ngay_tap as $day) {
    //             $day->bai_tap = DB::table('bai_tap as bt')
    //                 ->leftJoin('chi_tiet_bai_tap as ctct','bt.id', '=', 'ctct.id_bai_tap')
    //                 ->where('bt.id_chuong_trinh_bai_tap', $day->id_chuong_trinh_bai_tap )
    //                 ->select(
    //                     'bt.id as id_bai_tap',
    //                     'bt.ten_bai_tap',
    //                     'bt.mo_ta as mo_ta_bai_tap',
    //                     'bt.thoi_gian_phut',
    //                     'bt.rep_yeu_cau',
    //                     'bt.set_yeu_cau',
    //                     'bt.anh_dai_dien as anh_bai_tap',
    //                     'bt.muc_ta_toi_thieu',
    //                     'ctct.video_huong_dan',
    //                     'ctct.video_sai',
    //                     'ctct.huong_dan',
    //                     'ctct.canh_bao'
    //                 )
    //                 ->orderBy('bt.id')
    //                 ->get();
    //         }

    //         $program->ke_hoach_an = DB::table('ke_hoach_an as kha')
    //             ->where( 'kha.id_dang_ky_chuong_trinh',$program->id_dang_ky_chuong_trinh)
    //             ->where('kha.tinh_trang', 1)
    //             ->select(
    //                 'kha.id as id_ke_hoach_an',
    //                 'kha.id_chuong_trinh',
    //                 'kha.ten_ke_hoach',
    //                 'kha.tinh_trang'
    //             )
    //             ->get();

    //         foreach ($program->ke_hoach_an as $mealPlan) {
    //             $mealPlan->mon_an = DB::table('khau_phan_an as kpa')
    //                 ->leftJoin('mon_an as ma', 'kpa.id_mon_an', '=','ma.id')
    //                 ->leftJoin('muc_tieu_dinh_duong as mtd','kpa.id_muc_tieu_dinh_duong', '=', 'mtd.id')
    //                 ->where('kpa.id_ke_hoach_an', $mealPlan->id_ke_hoach_an)
    //                 ->select(
    //                     'kpa.id as id_khau_phan_an',
    //                     'kpa.ngay_thu',
    //                     'kpa.ngay_an',
    //                     'kpa.gio_an',
    //                     'kpa.bua_an',
    //                     'kpa.so_luong',
    //                     'kpa.ghi_chu',
    //                     'ma.id as id_mon_an',
    //                     'ma.ten_mon_an',
    //                     'ma.mo_ta',
    //                     'ma.anh_dai_dien',
    //                     'ma.calo',
    //                     'ma.khoi_luong_gram',
    //                     'ma.fat',
    //                     'ma.carb',
    //                     'ma.protein',
    //                     'ma.nguyen_lieu',
    //                     'ma.gia_vi',
    //                     'ma.thoi_gian_nau',
    //                     'ma.huong_dan_nau',
    //                     'ma.loai_bua',
    //                     'mtd.muc_tieu_the_trang',
    //                     'mtd.muc_tieu_calo',
    //                     'mtd.protein_muc_tieu',
    //                     'mtd.carb_muc_tieu',
    //                     'mtd.fat_muc_tieu'
    //                 )
    //                 ->orderBy('kpa.ngay_thu')
    //                 ->orderBy('kpa.gio_an')
    //                 ->get();
    //         }
    //     }

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Lấy thông tin chương trình thành công',
    //         'data' => $programs,
    //     ], 200);
    // }








}
