<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChuongTrinhBaiTapChiTiet extends Model
{
    protected $table = 'chuong_trinh_bai_tap_chi_tiet';
    protected $fillable = [
        'id_chuong_trinh_bai_tap',
        'id_bai_tap',
        'thu_tu',
    ];
}
