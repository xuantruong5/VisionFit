<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PhongGym;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class PhongGymController extends Controller
{
    public function danhSach(Request $request)
    {
        $data = PhongGym::query();

        if ($request->filled('tu_khoa')) {
            $data->where(
                'ten_phong_gym',
                'like',
                '%' . $request->tu_khoa . '%'
            );
        }

        return response()->json([
            'thanh_cong' => true,
            'data' => $data->orderBy('id')->paginate(20),
        ]);
    }


}