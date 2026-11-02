<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GoiTap;

class GoiTapController extends Controller
{
    public function getAll()
    {
        $data = GoiTap::where('tinh_trang', 1)
            ->orderBy('gia', 'asc')
            ->get();

        foreach ($data as $goi) {
            $goi->mo_ta = array_values(array_filter(
                array_map('trim', preg_split('/[.!?]+/', $goi->mo_ta ?? ''))
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách gói tập thành công',
            'data' => $data
        ], 200);
    }
}
