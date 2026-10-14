<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ChuongTrinhTap;

class MembersController extends Controller
{
    public function getChuongTrinhTap()
    {
        $data = ChuongTrinhTap::where('nhom_muc_tieu', 1)
            ->where('tinh_trang', '1')
            ->orderBy('id_chuong_trinh')
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
        $data = ChuongTrinhTap::join(
                'cap_do',
                'chuong_trinh_tap.id_cap_do',
                '=',
                'cap_do.id'
            )
            ->where('chuong_trinh_tap.id_chuong_trinh', $id)
            ->where('chuong_trinh_tap.tinh_trang', 1)
            ->select(
                'chuong_trinh_tap.*',
                'cap_do.ten_cap_do'
            )
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

    // Lấy danh sách bài tập theo ngày hoặc theo chương trình và giới tính
    public function getDanhSachBaiTap(Request $request)
    {
        $idChuongTrinh = $request->id_chuong_trinh ?? 1;
        $ngayThu = $request->ngay_thu ?? 1;
        $gioiTinh = $request->gioi_tinh; // 0: Nam, 1: Nữ, null: tất cả

        $query = \Illuminate\Support\Facades\DB::table('chuong_trinh_bai_tap')
            ->join('bai_tap', 'chuong_trinh_bai_tap.id_bai_tap', '=', 'bai_tap.id_bai_tap')
            ->where('chuong_trinh_bai_tap.id_chuong_trinh', $idChuongTrinh)
            ->where('chuong_trinh_bai_tap.ngay_thu', $ngayThu)
            ->where('bai_tap.tinh_trang', 1);

        if ($gioiTinh !== null) {
            $g = (int)$gioiTinh;
            $query->whereIn('bai_tap.gioi_tinh_ap_dung', [$g, 2]); // Bài tập của giới tính đó hoặc cho Cả hai
        }

        $exercises = $query->orderBy('chuong_trinh_bai_tap.thu_tu', 'asc')
            ->select(
                'bai_tap.id_bai_tap as id',
                'bai_tap.ten_bai_tap as name',
                'bai_tap.nhom_co as muscle',
                'bai_tap.gioi_tinh_ap_dung',
                'bai_tap.anh_dai_dien as image',
                'bai_tap.video_huong_dan as video',
                'bai_tap.mo_ta',
                'bai_tap.huong_dan',
                'chuong_trinh_bai_tap.so_hiep',
                'chuong_trinh_bai_tap.so_lan_lap',
                'chuong_trinh_bai_tap.thoi_gian_giay',
                'chuong_trinh_bai_tap.thoi_gian_nghi',
                'chuong_trinh_bai_tap.ten_ngay_tap'
            )
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'muscle' => $item->muscle,
                    'gioi_tinh_ap_dung' => $item->gioi_tinh_ap_dung,
                    'sets' => $item->so_hiep . ' hiệp x ' . $item->so_lan_lap . ' lần',
                    'duration' => round($item->thoi_gian_giay / 60) . ' ph',
                    'image' => $item->image,
                    'video' => $item->video,
                    'completed' => false,
                ];
            });

        // Nếu ngày đó chưa có thì lấy tất cả bài tập từ bai_tap theo giới tính
        if ($exercises->isEmpty()) {
            $fallback = \Illuminate\Support\Facades\DB::table('bai_tap')
                ->where('tinh_trang', 1);

            if ($gioiTinh !== null) {
                $g = (int)$gioiTinh;
                $fallback->whereIn('gioi_tinh_ap_dung', [$g, 2]);
            }

            $exercises = $fallback->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id_bai_tap,
                        'name' => $item->ten_bai_tap,
                        'muscle' => $item->nhom_co,
                        'gioi_tinh_ap_dung' => $item->gioi_tinh_ap_dung,
                        'sets' => '3 hiệp x 15 lần',
                        'duration' => '5 ph',
                        'image' => $item->anh_dai_dien,
                        'video' => $item->video_huong_dan,
                        'completed' => false,
                    ];
                });
        }

        return response()->json([
            'status' => true,
            'data' => $exercises
        ]);
    }

    // Lấy thông tin hồ sơ cá nhân của hội viên
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
