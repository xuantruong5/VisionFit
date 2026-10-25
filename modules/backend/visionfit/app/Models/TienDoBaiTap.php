<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TienDoBaiTap extends Model
{
    protected $table = 'tien_do_bai_taps';
    protected $fillable = [
        'id_dang_ky_chuong_trinh',
        'id_chuong_trinh_bai_tap',
        'id_bai_tap',
        'id_buoi_tap',
        'so_set_thuc_te',
        'so_phut_thuc_te',
        'so_rep_thuc_te',
        'thoi_gian_thuc_te_giay',
        'trong_luong_ta_thuc_te',
        'ly_do_bo_qua',
        'tinh_trang',
    ];
    public function dangKyChuongTrinh(): BelongsTo
    {
        return $this->belongsTo(
            DKChuongTrinh::class,
            'id_dang_ky_chuong_trinh',
            'id'
        );
    }
}
