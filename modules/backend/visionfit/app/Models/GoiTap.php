<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoiTap extends Model
{
    protected $table = 'goi_tap';
    protected $fillable = [
        'ma_goi_tap',
        'id_phong_tap',
        'ten_goi_tap',
        'thoi_han_mua',
        'thoi_han_tang',
        'thoi_han_ngay',
        'gia',
        'hinh_anh',
        'so_buoi',
        'so_buoi_pt',
        'mo_ta',
        'tinh_trang',
    ];
}
