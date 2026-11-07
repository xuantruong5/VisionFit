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
        'ma_gioi_thieu',
        'id_trainer_gioi_thieu',
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
        'chuyen_mon',
        'is_verified',
        'trang_thai_tuyen_dung',
        'ngay_phong_van',
        'tinh_trang',
        'id_phong_tap',
        'is_active',
        'is_block',
        'hash_reset',
        'hash_active',
    ];

    const CHOLIENHE = 0; // trang_thai_tuyen_dung
    const DAGUIPHONGVAN=1; // trang_thai_tuyen_dung
    const DATPHONGVAN = 2; // trang_thai_tuyen_dung
    const KHONGDATPV= 3; // trang_thai_tuyen_dung
    const CHUAKICHHOAT_TK  = 0; // is_active
    const DAKICHHOAT = 1; // is_active
    const CHUAKICHHOAT = 0; // tinh_trang
    const DANGHOATDONG = 1; // tinh_trang
    const DANGHI = 2;       // tinh_trang


    const DAKHOA = 1; //is_block
    const KHONGKHOA = 0; //is_block

}
