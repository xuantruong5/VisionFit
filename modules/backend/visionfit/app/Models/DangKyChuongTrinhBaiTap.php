<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DangKyChuongTrinhBaiTap extends Model
{
    protected $table = 'dang_ky_chuong_trinh_bai_tap';
    protected $fillable = [
        'id_dang_ky_chuong_trinh',
        'id_chuong_trinh_bai_tap',
        'cho_phep_bo_qua',
        'tinh_trang',
    ];
}
