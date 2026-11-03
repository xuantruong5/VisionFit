<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\GoiTap;
use App\Models\Trainer;
use App\Models\DKChuongTrinh;
use Illuminate\Support\Facades\DB;

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
    
    public function searchTrainer(Request $request)
    {
        $noi_dung_tim_kiem = $request->noi_dung_tim_kiem;
        $data = Trainer::where('is_active', 1)
            ->where('is_block', 0)
            ->where('tinh_trang', 1)
            ->whereRaw('(ho_ten LIKE ? OR chuyen_mon LIKE ?)', [
                '%' . $noi_dung_tim_kiem . '%',
                '%' . $noi_dung_tim_kiem . '%'
            ])
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy dữ liệu huấn luyện viên thành công',
            'data' => $data
        ]);
    }
    public function getTrainer()
    {
        $data = Trainer::where('is_active', 1)
            ->where('is_block', 0)
            ->where('tinh_trang', 1)
            ->select(
                'id',
                'ho_ten',
                'hinh_anh',
                'chuc_danh',
                'so_nam_kinh_nghiem',
                'chuyen_mon',
                'mo_ta',
                'kinh_nghiem_lam_viec',
                'qua_trinh_dao_tao',
                'chung_chi',
                'thanh_tuu',
                'tinh_trang',
                'id_phong_tap'
            )
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách huấn luyện viên thành công',
            'data' => $data
        ]);
    }

    public function getRegistrationPreview(Request $request)
    {
        $request->validate([
            'id_goi_tap' => 'required|integer',
            'id_trainer' => 'nullable|integer',
        ]);
        // 1. Lấy hội viên đang đăng nhập
        $hoiVien = Auth::guard('sanctum')->user();
        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.'
            ], 401);
        }
        // 2. Lấy thông tin gói tập
        $goiTap = GoiTap::find($request->id_goi_tap);
        if (!$goiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy gói tập.'
            ], 404);
        }
        // 3. Lấy thông tin PT đã chọn
        $trainer = null;
        if ($request->filled('id_trainer')) {
            $trainer = Trainer::find($request->id_trainer);

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy huấn luyện viên.'
                ], 404);
            }
        }
        // 4. Kiểm tra gói tập có yêu cầu PT không
        // if ($goiTap->so_buoi_pt > 0 && !$trainer) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Gói tập này yêu cầu chọn huấn luyện viên.'
        //     ], 422);
        // }

       // 5. Lấy chương trình tập hiện tại của hội viên
        $chuongTrinh = DB::table('dang_ky_chuong_trinh as dkct')
            ->join('chuong_trinh_tap as ct', 'dkct.id_chuong_trinh', '=', 'ct.id')
            ->leftJoin('cap_do as cd', 'ct.id_cap_do', '=', 'cd.id')
            ->leftJoin('noi_tap as nt', 'dkct.id_noi_tap', '=', 'nt.id')
            ->where('dkct.id_hoi_vien', $hoiVien->id)
            ->where('dkct.tinh_trang', 1)
            ->select(
                'ct.id',
                'ct.ten_chuong_trinh',
                'ct.so_ngay',
                'ct.so_buoi_moi_tuan',
                'ct.anh_dai_dien',
                'cd.id as id_cap_do',
                'cd.ten_cap_do',
                'nt.id as id_noi_tap',
                'nt.ten_noi_tap'
            )
            ->latest('dkct.id')
            ->first();
        // 6. Trả dữ liệu
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin đăng ký thành công.',
            'data' => [
                'hoi_vien' => $hoiVien,
                'goi_tap' => $goiTap,
                'trainer' => $trainer,
                'chuong_trinh_tap' => $chuongTrinh,
                'tong_tien' => $goiTap->gia,
            ]
        ]);
    }




}
