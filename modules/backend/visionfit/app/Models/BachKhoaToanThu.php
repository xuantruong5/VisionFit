<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BachKhoaToanThu extends Model
{
    use HasFactory;

    protected $table = 'bach_khoa_toan_thu';

    protected $fillable = [
        'tieu_de',
        'chu_de',
        'anh_bia',
        'tom_tat',
        'noi_dung',
        'luot_xem',
        'tinh_trang',
    ];

    protected $casts = [
        'luot_xem' => 'integer',
        'tinh_trang' => 'integer',
    ];
}
