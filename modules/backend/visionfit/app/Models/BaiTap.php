<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaiTap extends Model
{
    protected $table = 'bai_tap';
    protected $fillable = [
        'id_chuong_trinh_bai_tap',
        'ma_bai_tap',
        'ten_bai_tap',
        'mo_ta',
        'thoi_gian_phut',
        'rep_yeu_cau',
        'set_yeu_cau',
        'muc_ta_toi_thieu',
        'giay_yeu_cau',
        'anh_dai_dien',
        'tinh_trang',
        'loi_thuong_gap',
        'thiet_bi',
        'ho_tro_ai',
        'goc_camera_khuyen_nghi',
    ];

}
