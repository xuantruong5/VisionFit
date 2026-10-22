<?php

namespace App\Http\Controllers;
use App\Http\Requests\ChuongTrinhBaiTap\ChangeSkipRequest;
use App\Models\ChuongTrinhBaiTap;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ChuongTrinhBaiTapController extends Controller
{
    public function changeSkip(ChangeSkipRequest $request, $id)
    {
        $baiTap = ChuongTrinhBaiTap::find($id);
        if (!$baiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương trình bài tập',
            ], 404);
        }
       
        $baiTap->cho_phep_bo_qua = 1;
        $baiTap->save();
    
        $ngayTiepTheo = ChuongTrinhBaiTap::where('id_chuong_trinh', $baiTap->id_chuong_trinh)
            ->where('ngay_thu', '>', $baiTap->ngay_thu)
            ->orderBy('ngay_thu')
            ->first();
  
        if ($ngayTiepTheo) {
            $ngayTiepTheo->tinh_trang = 1;
            $ngayTiepTheo->save();
        }
        return response()->json([
            'success' => true,
            'message' => 'Bỏ qua ngày tập thành công',
            'data' => [
                'id' => $baiTap->id,
                'cho_phep_bo_qua' => $baiTap->cho_phep_bo_qua,
                'ngay_tiep_theo' => $ngayTiepTheo,
            ],
        ], 200);
    }
}
