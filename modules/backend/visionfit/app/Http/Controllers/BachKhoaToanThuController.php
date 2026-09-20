<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BachKhoaToanThu;
use Illuminate\Http\Request;

class BachKhoaToanThuController extends Controller
{
    /**
     * Lấy danh sách bài viết bách khoa toàn thư
     */
    public function index(Request $request)
    {
        $query = BachKhoaToanThu::where('tinh_trang', 1);

        // Tìm kiếm theo từ khóa
        if ($request->filled('q')) {
            $keyword = trim($request->q);
            $query->where(function ($q) use ($keyword) {
                $q->where('tieu_de', 'like', "%{$keyword}%")
                  ->orWhere('tom_tat', 'like', "%{$keyword}%")
                  ->orWhere('chu_de', 'like', "%{$keyword}%");
            });
        }

        // Lọc theo chủ đề
        if ($request->filled('chu_de')) {
            $query->where('chu_de', $request->chu_de);
        }

        $data = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách bách khoa toàn thư thành công',
            'data' => $data
        ]);
    }

    /**
     * Lấy chi tiết bài viết bách khoa toàn thư
     */
    public function show($id)
    {
        $item = BachKhoaToanThu::where('id', $id)
            ->where('tinh_trang', 1)
            ->first();

        if (!$item) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bài viết'
            ], 404);
        }

        // Tăng lượt xem
        $item->increment('luot_xem');

        return response()->json([
            'status' => true,
            'message' => 'Lấy chi tiết bài viết thành công',
            'data' => $item
        ]);
    }
}
