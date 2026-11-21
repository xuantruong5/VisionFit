<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichSuKhuyenCao extends Model
{
    protected $table = 'lich_su_khuyen_cao';

    protected $fillable = [
        'id_hoi_vien',
        'id_chi_so_dinh_duong',
        'danh_gia_the_trang',
        'dinh_huong_dinh_duong',
        'goi_y_thuc_pham',
        'dinh_huong_tap_luyen',
        'viec_can_thuc_hien',
        'chi_so_can_theo_doi',
        'trang_thai',
    ];
    protected $casts = [
        'goi_y_thuc_pham' => 'array',
        'viec_can_thuc_hien' => 'array',
        'chi_so_can_theo_doi' => 'array',
    ];
}
