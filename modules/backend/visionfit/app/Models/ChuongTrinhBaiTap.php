<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChuongTrinhBaiTap extends Model
{
    protected $table = 'chuong_trinh_bai_tap';
    protected $fillable = [
        'id_chuong_trinh',
        'id_bai_tap',
        'ngay_thu',
        'ten_ngay_tap',
        'thoi_gian_phut',
        'thoi_gian_nghi',
        'cho_phep_bo_qua',
        'tinh_trang',
    ];
    const DANG_KHOA = 0;
    const DANG_MO = 1;


}
