<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DangKyGoi extends Model
{
    protected $table = 'dang_ky_goi';
    protected $fillable = [
        'id_hoi_vien',
        'id_gioi_thieu',
        'ngay_dang_ky',
        'tinh_trang',
        'phuong_thuc_thanh_toan',
        'is_thanh_toan',
        'tong_tien',
    ];
}
