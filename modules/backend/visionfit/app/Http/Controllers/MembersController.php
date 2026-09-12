<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MembersController extends Controller
{
    public function getChuongTrinhTap()
    {
        $data = \App\Models\ChuongTrinhTap::where('tinh_trang', '1')
            ->get();

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
}
