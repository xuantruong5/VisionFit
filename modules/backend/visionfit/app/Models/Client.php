<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $table = 'clients';

    protected $fillable = [
        'id_phong_tap',
        'email',
        'password',
        'ho_ten',
        'so_dien_thoai',
        'anh_dai_dien',
        'ngay_sinh',
        'gioi_tinh',
        'chieu_cao_cm',
        'can_nang_kg',
        'dang_nguoi',
        'muc_tieu_hien_tai',
        'cap_do_hien_tai',
        'noi_tap_uu_tien',
        'trang_thai_ho_so',
        'tinh_trang',
        'is_active',
        'is_block',
    ];

    public function baiDang()
    {
        return $this->hasMany(
            BaiDang::class,
            'id_nguoi_dung',
            'id'
        );
    }
}
