<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DKChuongTrinh extends Model
{
    protected $table = 'dang_ky_chuong_trinh';
    protected $fillable = [
        'id_hoi_vien',
        'id_chuong_trinh',
        'ngay_bat_dau',
        'ngay_du_kien_ket_thuc',
        'phan_tram_hoan_thanh',
        'tinh_trang',
        'ngay_tao',
    ];
}
