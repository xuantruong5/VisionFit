<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BuoiTapPT extends Model
{
    protected $table = 'buoi_tap_pt';
    protected $fillable = [
        'id_chi_tiet_dang_ky_goi',
        'id_hoi_vien',
        'id_trainer',
        'id_lich_tap',
        'ngay_tap',
        'gio_bat_dau',
        'gio_ket_thuc',
        'tinh_trang',
        'ghi_chu',
    ];
    const TINH_TRANG_CHO_XAC_NHAN = 1;
    const TINH_TRANG_DA_XAC_NHAN = 2;
    const TINH_TRANG_HOAN_THANH = 3;
    const TINH_TRANG_HUY = 4;
}
