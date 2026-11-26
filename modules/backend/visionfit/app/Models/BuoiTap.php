<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BuoiTap extends Model
{
    protected $table = 'buoi_tap';

    protected $fillable = [
        'id_hoi_vien',
        'id_lich_tap',
        'id_chuong_trinh_bai_tap',
        'ngay_tap',
        'thoi_gian_bat_dau',
        'thoi_gian_ket_thuc',
        'tong_thoi_gian_giay',
        'tong_thoi_gian_nghi',
        'tong_so_lan_lap',
        'calo_tieu_thu',
        'phan_tram_hoan_thanh',
        'tinh_trang',
    ];

}
