<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichSuHiepTap extends Model
{
    protected $table = 'lich_su_hiep_taps';
    protected $fillable = [
        'id_tien_do_bai_tap',
        'id_buoi_tap',
        'loai_ghi_nhan',
        'so_hiep',
        'so_rep_thuc_te',
        'so_phut_thuc_te',
        'thoi_gian_thuc_te_giay',
        'trong_luong_ta_thuc_te',
        'ghi_chu',
    ];
}
