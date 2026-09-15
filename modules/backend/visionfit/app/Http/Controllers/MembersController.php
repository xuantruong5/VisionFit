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
}
