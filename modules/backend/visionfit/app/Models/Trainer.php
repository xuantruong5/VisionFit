<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;

class Trainer extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    protected $table = 'trainers';
    protected $fillable = [
        'ho_ten',
        'email',
        'password',
        'so_dien_thoai',
        'ngay_sinh',
        'gioi_tinh',
        'mo_ta',
        'hinh_anh',
        'chuc_danh',
        'so_nam_kinh_nghiem',
        'kinh_nghiem_lam_viec',
        'qua_trinh_dao_tao',
        'chung_chi',
        'thanh_tuu',
        'tinh_trang',
        'id_phong_tap',
        'is_active',
        'is_block',
        'hash_reset',
        'hash_active',
    ];
}
