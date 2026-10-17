<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KeHoachAn extends Model
{
    protected $table = 'ke_hoach_an';
    protected $fillable = [
        'id_chuong_trinh',
        'id_hoi_vien',
        'id_nguoi_tao',
        'id_dang_ky_chuong_trinh',
        'ten_ke_hoach',
        'tinh_trang',
    ];
}
