<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;

class Client extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
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
        'ma_gioi_thieu',
        'chieu_cao_cm',
        'can_nang_kg',
        'dang_nguoi',
        'muc_tieu_hien_tai',
        'muc_tieu_hoat_dong',
        'cap_do_hien_tai',
        'noi_tap_uu_tien',
        'trang_thai_ho_so',
        'ngan_sach_ban_dau',
        'note',
        'di_ung',
        'che_do_an_ua_thich',
        'muc_ngan_sach_an_uong',
        'tinh_trang',
        'is_active',
        'is_block',
        'hash_reset',
        'hash_active',
        'ngay_cap_nhat_chi_so'
    ];

    protected $casts = [
        'ngay_sinh' => 'date:Y-m-d',
        'ngay_cap_nhat_chi_so' => 'datetime',
        'di_ung' => 'array',
        'che_do_an_ua_thich' => 'array',
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
