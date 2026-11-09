<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ChuongTrinhTap;
use App\Models\NoiTap;
use Carbon\Carbon;

use Illuminate\Support\Facades\DB;


class MembersController extends Controller
{

    public function login(Request $request)
    {
        $check = Auth::guard('client')->attempt([
            'email'     => $request->email,
            'password'  => $request->password
        ]);

        if($check) {
            $client = Auth::guard('client')->user();
            $token     = $client->createToken('Token_client')->plainTextToken;
            return response()->json([
                'status'    => true,
                'message'   => 'Đăng nhập thành công',
                'token'     =>$token,
                'client' =>$client
            ]);
        }else{
            return response()->json([
                'status' => false,
                'message' => 'Đăng Nhập Thất Bại.Tài khoản hoặc mật khẩu không đúng'
            ]);
        }
    }
    public function logoutClient(){
        $user = Auth::guard('sanctum')->user();
        if ($user && $user->currentAccessToken()) {
            DB::table('personal_access_tokens')
                ->where('id', $user->currentAccessToken()->id)
                ->delete();
            return response()->json([
                'status'  => true,
                'message' => "Đăng xuất thành công",
            ]);
        } else {
            return response()->json([
                'status'  => false,
                'message' => "Có lỗi xảy ra",
            ]);
        }
    }
    public function logoutAllClient(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            $ds_token = $user->tokens;
            foreach ($ds_token as $token) {
                $token->delete();
            }
            return response()->json([
                'status'  => 1,
                'message' => "Đăng xuất thành công",
            ]);
        } else {
            return response()->json([
                'status'  => 0,
                'message' => "Có lỗi xảy ra",
            ]);
        }
    }
    public function getChuongTrinhTap()
    {
        $data = ChuongTrinhTap::where('nhom_muc_tieu', 1)
            ->where('tinh_trang', '1')
            ->orderBy('id')
            ->get()
            ->unique(function ($item) {
                return $item->ten_chuong_trinh . '-' . $item->gioi_tinh_ap_dung;
            })
            ->values();

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }
    public function getChuongTrinhTapKhongMucTieu(Request $request)
    {
        $gioiTinh = $request->gioi_tinh_ap_dung;

        $data = ChuongTrinhTap::where('nhom_muc_tieu', 0)
            ->where('tinh_trang', 1)
            ->where('gioi_tinh_ap_dung', $gioiTinh)
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy chương trình tập không mục tiêu thành công',
            'data' => $data,
        ]);
    }

    public function getNoiTap($id)
    {
        $chuongTrinh = ChuongTrinhTap::find($id);
        if (!$chuongTrinh) {
            return response()->json([
                'status' => false,
                'message' => 'Chương trình không tồn tại',
            ], 404);
        }
        $idNoiTap = $chuongTrinh->id_noi_tap;
        // Giải mã JSON
        if (is_string($idNoiTap)) {
            $idNoiTap = json_decode($idNoiTap, true);
        }
        // Nếu chỉ có một ID, ví dụ 2
        if (is_numeric($idNoiTap)) {
            $idNoiTap = [$idNoiTap];
        }
        // Nếu JSON chứa object có id, lấy danh sách id
        if (is_array($idNoiTap) && isset($idNoiTap[0]['id'])) {
            $idNoiTap = array_column($idNoiTap, 'id');
        }
        $noiTap = NoiTap::whereIn('id', $idNoiTap ?? [])
            ->select('id', 'ten_noi_tap', 'mo_ta')
            ->get();
        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách nơi tập thành công',
            'data' => $noiTap,
        ], 200);
    }
    public function getCapDoChuongTrinh(Request $request)
    {
        $tenChuongTrinh = $request->input('ten_chuong_trinh');
        $gioiTinh = $request->input('gioi_tinh_ap_dung');

        $data = ChuongTrinhTap::join(
            'cap_do',
            'chuong_trinh_tap.id_cap_do',
            '=',
            'cap_do.id'
        )
            ->where('chuong_trinh_tap.ten_chuong_trinh', $tenChuongTrinh)
            ->where('chuong_trinh_tap.gioi_tinh_ap_dung', $gioiTinh)
            ->where('chuong_trinh_tap.tinh_trang', 1)
            ->select(
                'chuong_trinh_tap.id as id_chuong_trinh',
                'chuong_trinh_tap.id_cap_do',
                'cap_do.ten_cap_do',
                'cap_do.mo_ta as mo_ta_cap_do',
                'cap_do.hinh_anh',
                'chuong_trinh_tap.so_sao',
                'chuong_trinh_tap.ten_chuong_trinh',
                'chuong_trinh_tap.mo_ta as mo_ta_chuong_trinh',
                'chuong_trinh_tap.so_ngay',
                'chuong_trinh_tap.so_buoi_moi_tuan',
                'chuong_trinh_tap.id_noi_tap'
            )
            ->orderBy('chuong_trinh_tap.id_cap_do')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy cấp độ chương trình tập thành công',
            'data' => $data
        ]);
    }

    public function getChiTietChuongTrinhTap($id)
    {
        $data = ChuongTrinhTap::join('cap_do','chuong_trinh_tap.id_cap_do', '=','cap_do.id')
            ->where('chuong_trinh_tap.id', $id)
            ->where('chuong_trinh_tap.tinh_trang', 1)
            ->select( 'chuong_trinh_tap.*','cap_do.ten_cap_do')
            ->first();
        if (!$data) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy chương trình tập'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

        // Lấy danh sách bài tập kèm chi tiết (video đúng, video sai)
    public function getDanhSachBaiTap(Request $request)
    {
        $idChuongTrinh = $request->id_chuong_trinh ?? 1;
        $ngayThu = $request->ngay_thu ?? 1;

        // Truy vấn danh sách bài tập kèm chi tiết bài tập
        $exercises = \Illuminate\Support\Facades\DB::table('bai_tap')
            ->leftJoin('chi_tiet_bai_tap', 'bai_tap.id', '=', 'chi_tiet_bai_tap.id_bai_tap')
            ->where('bai_tap.tinh_trang', 1)
            ->select(
                'bai_tap.id',
                'bai_tap.ten_bai_tap as name',
                'bai_tap.anh_dai_dien as image',
                'bai_tap.set_yeu_cau',
                'bai_tap.rep_yeu_cau',
                'bai_tap.giay_yeu_cau',
                'bai_tap.thoi_gian_phut',
                'chi_tiet_bai_tap.video_huong_dan as video',
                'chi_tiet_bai_tap.video_sai as video_sai',
                'chi_tiet_bai_tap.mo_ta as description',
                'chi_tiet_bai_tap.huong_dan as instructions',
                'chi_tiet_bai_tap.canh_bao as warnings',
                'chi_tiet_bai_tap.noi_tap as location',
                'chi_tiet_bai_tap.ghi_chu as equipment'
            )
            ->get();

        // Lấy thông tin nhóm cơ và tỷ lệ tác động từ bai_tap_nhom_co
        $allMuscles = \Illuminate\Support\Facades\DB::table('bai_tap_nhom_co')
            ->orderBy('ty_le_tac_dong', 'desc')
            ->get()
            ->groupBy('id_bai_tap');

        $colorPalette = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

        $mapped = $exercises->map(function ($item) use ($allMuscles, $colorPalette) {
            $muscles = $allMuscles->get($item->id, collect());
            $primaryMuscle = $muscles->first()?->ten_nhom_co ?? 'Toàn thân';

            $distribution = $muscles->values()->map(function ($m, $idx) use ($colorPalette) {
                return [
                    'name' => $m->ten_nhom_co,
                    'percent' => (int)round((float)$m->ty_le_tac_dong),
                    'color' => $colorPalette[$idx % count($colorPalette)],
                ];
            })->toArray();

            $sets = ($item->set_yeu_cau ?? 3) . ' hiệp x ' . ($item->rep_yeu_cau ?? 15) . ' lần';
            $duration = ($item->thoi_gian_phut ?? 5) . ' ph';

            $videoUrl = $item->video;
            $videoSai = $item->video_sai;
            $imageUrl = $item->image ?: $videoUrl;

            return [
                'id' => $item->id,
                'name' => $item->name,
                'muscle' => $primaryMuscle,
                'sets' => $sets,
                'duration' => $duration,
                'image' => $imageUrl,
                'video' => $videoUrl,
                'video_sai' => $videoSai,
                'description' => $item->description,
                'instructions' => $item->instructions,
                'warnings' => $item->warnings,
                'equipment' => $item->equipment,
                'location' => $item->location,
                'musclesDistribution' => $distribution,
                'completed' => false,
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $mapped
        ]);
    }

    public function getProfile(Request $request)
    {
        $hoiVien = Auth::guard('sanctum')->user();

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        // Lấy thông tin gói tập
        $chiTietGoi = DB::table('dang_ky_goi')
            ->join('chi_tiet_dang_ky_goi', 'dang_ky_goi.id', '=', 'chi_tiet_dang_ky_goi.id_dang_ky_goi')
            ->leftJoin('goi_tap', 'chi_tiet_dang_ky_goi.id_goi_tap', '=', 'goi_tap.id')
            ->leftJoin('trainers', 'chi_tiet_dang_ky_goi.id_trainer', '=', 'trainers.id')
            ->where('dang_ky_goi.id_hoi_vien', $hoiVien->id)
            ->where('dang_ky_goi.is_thanh_toan', 1)
            ->where('dang_ky_goi.tinh_trang', 1)
            ->where('chi_tiet_dang_ky_goi.tinh_trang', 1)
            ->whereDate('chi_tiet_dang_ky_goi.ngay_ket_thuc', '>=', Carbon::today())
            ->orderByDesc('chi_tiet_dang_ky_goi.ngay_ket_thuc')
            ->select(
                'dang_ky_goi.id as id_dang_ky_goi',
                'goi_tap.ten_goi_tap',
                'chi_tiet_dang_ky_goi.ngay_bat_dau',
                'chi_tiet_dang_ky_goi.ngay_ket_thuc',
                'trainers.ho_ten',
                'trainers.chuc_danh'
            )
            ->first();

        // Tính số ngày còn lại
        $ngayConLai = null;

        if ($chiTietGoi && $chiTietGoi->ngay_ket_thuc) {
            $ngayConLai = max(0, Carbon::today()->diffInDays(
                Carbon::parse($chiTietGoi->ngay_ket_thuc)->startOfDay(),
                false
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin hồ sơ thành công.',
            'data' => [
                'ho_ten' => $hoiVien->ho_ten,
                'email' => $hoiVien->email,
                'so_dien_thoai' => $hoiVien->so_dien_thoai,
                'anh_dai_dien' => $hoiVien->anh_dai_dien,
                'ngay_sinh' => $hoiVien->ngay_sinh,
                'gioi_tinh' => $hoiVien->gioi_tinh,
                'chieu_cao_cm' => $hoiVien->chieu_cao_cm,
                'can_nang_kg' => $hoiVien->can_nang_kg,
                'dang_nguoi' => $hoiVien->dang_nguoi,

                'id' => $hoiVien->id,
                'ma_thanh_vien' => $chiTietGoi ? 'VF-' . str_pad($chiTietGoi->id_dang_ky_goi, 6, '0', STR_PAD_LEFT): null,
                'ma_gioi_thieu' => $hoiVien->ma_gioi_thieu,

                'muc_tieu_hien_tai' => $hoiVien->muc_tieu_hien_tai,
                'cap_do_hien_tai' => $hoiVien->cap_do_hien_tai,
                'noi_tap_uu_tien' => $hoiVien->noi_tap_uu_tien,

                'ten_goi_tap' => $chiTietGoi ? $chiTietGoi->ten_goi_tap : null,
                'ngay_bat_dau' => $chiTietGoi ? $chiTietGoi->ngay_bat_dau : null,
                'ngay_ket_thuc' => $chiTietGoi ? $chiTietGoi->ngay_ket_thuc : null,
                'so_ngay_con_lai' => $ngayConLai,
                'ho_ten_hlv' => $chiTietGoi ? $chiTietGoi->ho_ten : null,
                'chuc_danh' => $chiTietGoi ? $chiTietGoi->chuc_danh : null,
            ],
        ]);
    }

    // Cập nhật thông tin hồ sơ hội viên
    public function updateProfile(Request $request)
    {
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $client = \App\Models\Client::find($idNguoiDung) ?? \App\Models\Client::first();

        if (!$client) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hội viên'
            ], 404);
        }

        $request->validate([
            'ho_ten' => 'nullable|string|max:255',
            'so_dien_thoai' => 'nullable|string|max:20',
            'chieu_cao_cm' => 'nullable|numeric|min:50|max:250',
            'can_nang_kg' => 'nullable|numeric|min:20|max:300',
            'muc_tieu_hien_tai' => 'nullable|string|max:255',
            'ngay_sinh' => 'nullable|string|max:50',
        ]);

        $client->update([
            'ho_ten' => $request->ho_ten ?? $client->ho_ten,
            'so_dien_thoai' => $request->so_dien_thoai ?? $client->so_dien_thoai,
            'chieu_cao_cm' => $request->chieu_cao_cm ?? $client->chieu_cao_cm,
            'can_nang_kg' => $request->can_nang_kg ?? $client->can_nang_kg,
            'muc_tieu_hien_tai' => $request->muc_tieu_hien_tai ?? $client->muc_tieu_hien_tai,
            'ngay_sinh' => $request->ngay_sinh ?? $client->ngay_sinh,
            'noi_tap_uu_tien' => $request->noi_tap_uu_tien ?? $client->noi_tap_uu_tien,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Cập nhật hồ sơ thành công',
            'data' => $client
        ]);
    }

    // Tải lên ảnh đại diện mới
    public function uploadAvatar(Request $request)
    {
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $client = \App\Models\Client::find($idNguoiDung) ?? \App\Models\Client::first();

        if (!$client) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hội viên'
            ], 404);
        }

        $request->validate([
            'avatar' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:10240',
            'file' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $file = $request->file('avatar') ?? $request->file('file');

        if ($file) {
            $path = $file->store('avatars', 'public');
            $url = $request->getSchemeAndHttpHost() . \Illuminate\Support\Facades\Storage::url($path);

            $client->update(['anh_dai_dien' => $url]);

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật ảnh đại diện thành công',
                'url' => $url,
                'data' => $client
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không tìm thấy file ảnh'
        ], 400);
    }


    // lấy dữ liệu phòng tập theo xã phường 
    public function getProvinces()
    {
        $data = DB::table('provinces')
            ->select(
                'code',
                'name',
                'codename',
                'division_type'
            )
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    public function getWards($code)
    {
        $data = DB::table('provinces as p')
            ->join('wards as w', 'p.id', '=', 'w.id_province')
            ->where('p.code', $code)
            ->select(
                'p.code as ma_tinh',
                'p.name as ten_tinh',
                'w.id as id_ward',
                'w.code as ma_phuong_xa',
                'w.name as ten_phuong_xa',
                'w.codename',
                'w.division_type'
            )
            ->orderBy('w.name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    public function getGymsByProvince($code)
    {
        $data = DB::table('provinces as p')
            ->join('wards as w', 'p.id', '=', 'w.id_province')
            ->join('phong_gyms as pg', 'w.id', '=', 'pg.id_ward')
            ->where('p.code', $code)
            ->select(
                'p.name as ten_tinh',
                'w.name as ten_phuong_xa',
                'pg.id',
                'pg.ten_phong_gym',
                'pg.dia_chi',
                'pg.vi_do',
                'pg.kinh_do',
                'pg.id_ward',
                'pg.so_dien_thoai',
                'pg.website'
            )
            ->orderBy('w.name')
            ->orderBy('pg.ten_phong_gym')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    public function getGymsByWard($code)
    {
        $data = DB::table('wards as w')
            ->join('phong_gyms as pg', 'w.id', '=', 'pg.id_ward')
            ->where('w.code', $code)
            ->select(
                'w.id as id_ward',
                'w.code as ma_phuong_xa',
                'w.name as ten_phuong_xa',
                'pg.id as id_phong_gym',
                'pg.ten_phong_gym',
                'pg.dia_chi',
                'pg.vi_do',
                'pg.kinh_do',
                'pg.so_dien_thoai',
                'pg.website'
            )
            ->orderBy('pg.ten_phong_gym')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }











}
