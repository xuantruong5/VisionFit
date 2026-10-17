<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KhauPhanAn extends Model
{
    protected $table = 'khau_phan_an';
    protected $fillable = [
        'id_ke_hoach_an',
        'id_muc_tieu_dinh_duong',
        'id_mon_an',
        'ngay_thu',
        'ngay_an',
        'gio_an',
        'bua_an',
        'so_luong',
        'ghi_chu',
    ];
}
