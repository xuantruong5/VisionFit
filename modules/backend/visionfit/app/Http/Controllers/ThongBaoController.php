<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ThongBaoController extends Controller
{
    public function danhSach()
    {
        $hoiVien = Auth::guard('sanctum')->user();
        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }
        $query = DB::table('thong_bao')
            ->where('id_nguoi_nhan', $hoiVien->id)
            ->where('vai_tro', 'hoi_vien')
            ->whereNull('deleted_at');
        $soThongBaoChuaDoc = (clone $query)
            ->where('da_doc', 0)
            ->count();
        $thongBao = $query
            ->orderBy('da_doc')
            ->orderByDesc('created_at')
            ->paginate(20);
        return response()->json([
            'success' => true,
            'so_thong_bao_chua_doc' => $soThongBaoChuaDoc,
            'data' => $thongBao,
        ]);
    }
    public function danhDauDaDoc($id)
    {
        $hoiVien = Auth::guard('sanctum')->user();

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        $thongBao = DB::table('thong_bao')
            ->where('id', $id)
            ->where('id_nguoi_nhan', $hoiVien->id)
            ->where('vai_tro', 'hoi_vien')
            ->whereNull('deleted_at')
            ->first();

        if (!$thongBao) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thông báo.',
            ], 404);
        }

        DB::table('thong_bao')
            ->where('id', $id)
            ->update([
                'da_doc' => 1,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu thông báo đã đọc.',
        ]);
    }
    public function danhDauTatCaDaDoc()
    {
        $hoiVien = Auth::guard('sanctum')->user();

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        DB::table('thong_bao')
            ->where('id_nguoi_nhan', $hoiVien->id)
            ->where('vai_tro', 'hoi_vien')
            ->where('da_doc', 0)
            ->whereNull('deleted_at')
            ->update([
                'da_doc' => 1,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đọc tất cả thông báo.',
        ]);
    }
    public function xoa($id)
    {
        $hoiVien = Auth::guard('sanctum')->user();

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        $soLuong = DB::table('thong_bao')
            ->where('id', $id)
            ->where('id_nguoi_nhan', $hoiVien->id)
            ->where('vai_tro', 'hoi_vien')
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
            ]);

        if (!$soLuong) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thông báo.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa thông báo.',
        ]);
    }
    public function xoaTatCa()
    {
        $hoiVien = Auth::guard('sanctum')->user();

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        DB::table('thong_bao')
            ->where('id_nguoi_nhan', $hoiVien->id)
            ->where('vai_tro', 'hoi_vien')
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa tất cả thông báo.',
        ]);
    }


}
