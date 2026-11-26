<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoiTap extends Model
{
    protected $table = 'goi_tap';
    protected $fillable = [
        'ma_goi_tap',
        'id_phong_tap',
        'ten_goi_tap',
        'thoi_han_mua',
        'thoi_han_tang',
        'thoi_han_ngay',
        'gia',
        'hinh_anh',
        'so_buoi',
        'so_buoi_pt',
        'mo_ta',
        'co_ai',
        'co_trainer_review',
        'tinh_trang',
    ];

    // protected $casts = [
    //     'co_ai' => 'boolean',
    //     'co_trainer_review' => 'boolean',
    //     'tinh_trang' => 'integer',
    //     'gia' => 'float',
    //     'thoi_han_mua' => 'integer',
    //     'thoi_han_tang' => 'integer',
    //     'thoi_han_ngay' => 'integer',
    //     'so_buoi' => 'integer',
    //     'so_buoi_pt' => 'integer',
    // ];

    public function chiTietDangKy()
    {
        return $this->hasMany(ChiTietDangKyGoi::class, 'id_goi_tap', 'id');
    }
}

