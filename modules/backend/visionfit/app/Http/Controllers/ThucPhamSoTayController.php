<?php

namespace App\Http\Controllers;

use App\Models\MonAn;
use Illuminate\Http\Request;

class ThucPhamSoTayController extends Controller
{
    /**
     * Danh sách ảnh và thông tin danh mục cố định
     */
    private $categoryMeta = [
        'dairy' => [
            'id' => 'dairy',
            'name' => 'Sữa và các sản phẩm từ sữa, sữa chua, phô mai cottage',
            'image' => 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
        ],
        'grains' => [
            'id' => 'grains',
            'name' => 'Ngũ cốc, cháo, khoai tây chiên',
            'image' => 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
        ],
        'eggs_cheese' => [
            'id' => 'eggs_cheese',
            'name' => 'Trứng, phô mai, phô mai chế biến',
            'image' => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        ],
        'poultry' => [
            'id' => 'poultry',
            'name' => 'Thịt gà và thịt gia cầm khác, thịt gà xay, phụ phẩm',
            'image' => 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',
        ],
        'vegetables' => [
            'id' => 'vegetables',
            'name' => 'Rau, rau xanh, ô liu',
            'image' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        ],
        'meat_seafood' => [
            'id' => 'meat_seafood',
            'name' => 'Thịt đỏ, cá và hải sản',
            'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        ],
    ];

    /**
     * Lấy danh sách các nhóm thực phẩm / nguyên liệu
     */
    public function getCategories()
    {
        $dbCategories = MonAn::where('tinh_trang', 1)
            ->whereNotNull('danh_muc_slug')
            ->select('danh_muc_slug', 'danh_muc_ten')
            ->distinct()
            ->get();

        $result = [];
        foreach ($dbCategories as $cat) {
            $slug = $cat->danh_muc_slug;
            $meta = $this->categoryMeta[$slug] ?? null;

            $result[] = [
                'id' => $slug,
                'name' => $cat->danh_muc_ten ?? ($meta['name'] ?? $slug),
                'image' => $meta['image'] ?? 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
            ];
        }

        // Nếu DB chưa có danh mục, trả về danh sách mặc định
        if (empty($result)) {
            $result = array_values($this->categoryMeta);
        }

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh mục thực phẩm thành công',
            'data' => $result,
        ]);
    }

    /**
     * Lấy danh sách thực phẩm/món ăn theo danh mục hoặc tìm kiếm
     */
    public function index(Request $request)
    {
        $query = MonAn::where('tinh_trang', 1);

        // Lọc theo danh mục
        if ($request->filled('category')) {
            $category = $request->input('category');
            $query->where(function ($q) use ($category) {
                $q->where('danh_muc_slug', $category)
                  ->orWhere('danh_muc_ten', 'like', "%{$category}%");
            });
        }

        // Tìm kiếm theo từ khóa
        if ($request->filled('q') || $request->filled('search')) {
            $keyword = $request->input('q') ?? $request->input('search');
            $query->where(function ($q) use ($keyword) {
                $q->where('ten_mon_an', 'like', "%{$keyword}%")
                  ->orWhere('nguyen_lieu', 'like', "%{$keyword}%")
                  ->orWhere('mo_ta', 'like', "%{$keyword}%");
            });
        }

        $items = $query->orderBy('id', 'asc')->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách món ăn thành công',
            'data' => $items,
        ]);
    }

    /**
     * Lấy chi tiết món ăn / nguyên liệu
     */
    public function show($id)
    {
        $item = MonAn::where('id', $id)
            ->where('tinh_trang', 1)
            ->first();

        if (!$item) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy món ăn / nguyên liệu',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'message' => 'Lấy chi tiết món ăn thành công',
            'data' => $item,
        ]);
    }
}
