<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KhuyenMai extends Model
{
    protected $table = 'khuyen_mai';
    protected $fillable = [
        'ten_khuyen_mai',
        'ma_khuyen_mai',
        'loai_giam',
        'gia_tri_giam',
        'lan_dang_ky_tu',
        'lan_dang_ky_den',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'id_goi_tap',
        'tinh_trang',
    ];
}
