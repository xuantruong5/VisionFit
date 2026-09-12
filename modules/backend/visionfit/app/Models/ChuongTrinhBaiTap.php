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
        'thu_tu',
        'so_hiep',
        'so_lan_lap',
        'trong_luong_goi_y',
        'thoi_gian_giay',
        'thoi_gian_nghi',
        'cho_phep_bo_qua',
        'tinh_trang',
    ];
}
