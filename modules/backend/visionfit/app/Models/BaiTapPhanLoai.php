<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaiTapPhanLoai extends Model
{
    protected $table = 'bai_tap_phan_loai';
    protected $fillable = [
        'id_bai_tap',
        'id_cap_do',
        'id_noi_tap',
    ];
}
