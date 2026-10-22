<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChiTietBaiTap extends Model
{
    protected $table = 'chi_tiet_bai_tap';
    protected $fillable = [
        'id_bai_tap',
        'video_huong_dan',
        'video_sai',
        'mo_ta',
        'ghi_chu',
        'huong_dan',
        'canh_bao',
        'noi_tap',
    ];
}
