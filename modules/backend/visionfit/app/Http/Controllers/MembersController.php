<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ChuongTrinhTap;
use App\Models\NoiTap;

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
        $data = ChuongTrinhTap::join('cap_do','chuong_trinh_tap.id_cap_do','=','cap_do.id')
            ->where('chuong_trinh_tap.tinh_trang', 1)
            ->select('cap_do.id','cap_do.ten_cap_do','cap_do.mo_ta','cap_do.hinh_anh' ,'chuong_trinh_tap.so_sao', 'chuong_trinh_tap.ten_chuong_trinh',)
            ->distinct()
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
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $client = \App\Models\Client::find($idNguoiDung) ?? \App\Models\Client::first();

        if (!$client) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hội viên'
            ], 404);
        }

        $data = [
            'id' => $client->id,
            'ho_ten' => $client->ho_ten ?? 'Lê Hoàng Nam',
            'email' => $client->email ?? 'nam.le@visionfit.vn',
            'so_dien_thoai' => $client->so_dien_thoai ?? '0901 234 567',
            'anh_dai_dien' => $client->anh_dai_dien,
            'ngay_sinh' => $client->ngay_sinh ?? '15/08/1998',
            'gioi_tinh' => ((int)$client->gioi_tinh === 1) ? 'Nữ' : 'Nam',
            'chieu_cao_cm' => $client->chieu_cao_cm ?? 175,
            'can_nang_kg' => $client->can_nang_kg ?? 68,
            'dang_nguoi' => $client->dang_nguoi ?? 'Cân đối',
            'muc_tieu_hien_tai' => $client->muc_tieu_hien_tai ?? 'Tăng cơ & Giảm mỡ',
            'cap_do_hien_tai' => $client->cap_do_hien_tai ?? 'Trung cấp',
            'noi_tap_uu_tien' => $client->noi_tap_uu_tien ?? 'Phòng gym',
            'hang_thanh_vien' => 'Hội viên Premium',
            'goi_tap' => 'Gói Hội Viên Toàn Diện 12 Tháng',
            'ngay_het_han' => '18/12/2026',
            'so_ngay_con_lai' => 92,
            'hlv_phu_trach' => 'Trần Minh Tuấn (HLV Chuyên sâu)',
            'thong_ke' => [
                'so_buoi_tap' => 32,
                'tong_gio_tap' => 48,
                'tuan_duy_tri' => 8,
                'calo_tieu_thu' => 14250,
            ]
        ];

        return response()->json([
            'status' => true,
            'data' => $data
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









}
