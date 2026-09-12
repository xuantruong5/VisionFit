<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChuongTrinhTap extends Model
{
    protected $table = 'chuong_trinh_tap';
    protected $fillable = [
        'ten_chuong_trinh',
        'mo_ta',
        'muc_tieu',
        'nhom_muc_tieu',
        'cap_do',
        'gioi_tinh_ap_dung',
        'noi_tap',
        'so_ngay',
        'so_buoi_moi_tuan',
        'anh_dai_dien',
        'tinh_trang',
    ];
}
