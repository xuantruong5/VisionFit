<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichTap extends Model
{
    protected $table = 'lich_tap';

    protected $fillable = [
        'id_dang_ky_chuong_trinh',
        'id_chuong_trinh',
        'id_hoi_vien',
        'id_goi',
        'id_trainer',
        'ngay_thu_trong_goi',
        'ngay_tap',
        'gio_bat_dau',
        'gio_ket_thuc',
        'ghi_chu',
        'tinh_trang',
    ];
}
