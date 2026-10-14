<?php

namespace App\Http\Controllers;

use App\Models\DinhDuongTheThao;
use Illuminate\Http\Request;

class DinhDuongTheThaoController extends Controller
{
    /**
     * Lấy danh sách các danh mục dinh dưỡng thể thao (kèm ảnh và số lượng sản phẩm)
     */
    public function getCategories()
    {
        $categories = DinhDuongTheThao::where('tinh_trang', 1)
            ->select('danh_muc_slug', 'danh_muc_ten', 'danh_muc_anh')
            ->groupBy('danh_muc_slug', 'danh_muc_ten', 'danh_muc_anh')
            ->orderByRaw("FIELD(danh_muc_slug, 'protein', 'gainer', 'creatine', 'amino_acids', 'fat_burner', 'lcarnitine', 'vitamins', 'specialized', 'joints') ASC")
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->danh_muc_slug,
                    'name' => $item->danh_muc_ten,
                    'image' => $item->danh_muc_anh,
                ];
            });

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách danh mục dinh dưỡng thành công',
            'data' => $categories,
        ]);
    }

    /**
     * Lấy danh sách sản phẩm dinh dưỡng thể thao theo danh mục và từ khóa tìm kiếm
     */
    public function index(Request $request)
    {
        $query = DinhDuongTheThao::where('tinh_trang', 1);

        // Lọc theo danh mục nếu có (slug hoặc tên)
        if ($request->filled('category')) {
            $cat = $request->input('category');
            $query->where(function ($q) use ($cat) {
                $q->where('danh_muc_slug', $cat)
                  ->orWhere('danh_muc_ten', 'like', "%{$cat}%");
            });
        }

        // Tìm kiếm theo từ khóa
        if ($request->filled('q')) {
            $keyword = $request->input('q');
            $query->where(function ($q) use ($keyword) {
                $q->where('ten_san_pham', 'like', "%{$keyword}%")
                  ->orWhere('mo_ta_ngan', 'like', "%{$keyword}%")
                  ->orWhere('noi_dung_chi_tiet', 'like', "%{$keyword}%");
            });
        }

        $products = $query->orderBy('id', 'asc')->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách sản phẩm dinh dưỡng thành công',
            'data' => $products,
        ]);
    }

    /**
     * Chi tiết sản phẩm dinh dưỡng thể thao
     */
    public function show($id)
    {
        $product = DinhDuongTheThao::where('id', $id)
            ->where('tinh_trang', 1)
            ->first();

        if (!$product) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy sản phẩm dinh dưỡng',
            ], 404);
        }

        // Tăng lượt xem
        $product->increment('luot_xem');

        return response()->json([
            'status' => true,
            'message' => 'Lấy chi tiết sản phẩm dinh dưỡng thành công',
            'data' => $product,
        ]);
    }
}
