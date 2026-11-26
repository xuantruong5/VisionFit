<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GioiThieu extends Model
{
    protected $table = 'gioi_thieu';
    protected $fillable = [
        'id_nguoi_gioi_thieu',
        'id_hoi_vien_duoc_gioi_thieu',
        'ma_gioi_thieu',
        'tinh_trang',
        'thuong_nguoi_gioi_thieu',
        'thuong_nguoi_duoc_gioi_thieu',
        'da_su_dung',
    ];
}
