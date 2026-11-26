<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChiTietDangKyGoi extends Model
{
    protected $table = 'chi_tiet_dang_ky_goi';
    protected $fillable = [
        'id_dang_ky_goi',
        'id_noi_tap',
        'id_chuong_trinh_tap',
        'id_goi_tap',
        'id_trainer',
        'so_buoi',
        'so_buoi_pt',
        'don_gia',
        'tien_giam_khuyen_mai',
        'tien_giam_gioi_thieu',
        'giam_gia',
        'ma_khuyen_mai',
        'ma_gioi_thieu',
        'ten_khuyen_mai',
        'lan_dang_ky',
        'phan_tram_giam',
        'thanh_tien',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'tinh_trang',
    ];

}
