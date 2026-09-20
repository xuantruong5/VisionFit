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
    public function getChuongTrinhTapKhongMucTieu()
    {
        $chuongTrinh = \App\Models\ChuongTrinhTap::where('nhom_muc_tieu', 0)
            ->where('gioi_tinh_ap_dung', 2)
            ->where('tinh_trang', '1')
            ->orderBy('id_chuong_trinh')
            ->get();

        $data = $chuongTrinh->map(function ($item) {
            return [
                'id' => $item->id_chuong_trinh,
                'name' => $item->ten_chuong_trinh,
                'description' => $item->mo_ta,
                'goalMode' => (bool) $item->nhom_muc_tieu,
                'gender' => match ((int) $item->gioi_tinh_ap_dung) {
                    0 => 'male',
                    1 => 'female',
                    2 => 'all',
                    default => 'all'
                },
                'difficulty' => $item->cap_do,
                'stars' => $item->so_sao,
                'location' => $item->noi_tap,
                'durationDays' => $item->so_ngay,
                'sessionsPerWeek' => $item->so_buoi_moi_tuan,
                'coverUrl' => $item->anh_dai_dien,
                'status' => (int) $item->tinh_trang,
            ];
        });



        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function getCapDoChuongTrinh(Request $request)
    {
        $request->validate([
            'ten_chuong_trinh' => 'required|string',
            'noi_tap' => 'required|string',
            'nhom_muc_tieu' => 'required|integer|in:0,1',
        ]);

        $noiTap = match ($request->noi_tap) {
            'GYM' => 'Phòng gym',
            'TAI_NHA' => 'Tại nhà',
            default => $request->noi_tap,
        };

        $query = ChuongTrinhTap::where(
            'ten_chuong_trinh',
            $request->ten_chuong_trinh
        )
            ->where('nhom_muc_tieu', $request->nhom_muc_tieu)
            ->where('noi_tap', $noiTap)
            ->where('tinh_trang', '1');

        if ((int) $request->nhom_muc_tieu === 1) {
            $gioiTinh = match ($request->gioi_tinh) {
                'Nam' => 0,
                'Nữ' => 1,
                '0', 0 => 0,
                '1', 1 => 1,
                default => null,
            };

            if ($gioiTinh === null) {
                return response()->json([
                    'status' => false,
                    'message' => 'Giới tính không hợp lệ',
                ], 422);
            }

            $query->where('gioi_tinh_ap_dung', $gioiTinh);
        } else {
            $query->where('gioi_tinh_ap_dung', 2);
        }

        $data = $query
            ->orderBy('so_sao')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }

    public function getChiTietChuongTrinhTap($id)
    {
        $data = ChuongTrinhTap::where(
            'id_chuong_trinh',
            $id
        )
            ->where('tinh_trang', '1')
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
