<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChiTietDangKyGoi extends Model
{
    protected $table = 'chi_tiet_dang_ky_goi';
    protected $fillable = [
        'id_dang_ky_goi',
        'id_noi_tap',
        'id_goi_tap',
        'so_buoi',
        'so_buoi_pt',
        'don_gia',
        'giam_gia',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'tinh_trang',
    ];

}
