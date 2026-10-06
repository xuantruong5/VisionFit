<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonAn extends Model
{
    use HasFactory;

    protected $table = 'mon_an';

    protected $fillable = [
        'ten_mon_an',
        'danh_muc_slug',
        'danh_muc_ten',
        'mo_ta',
        'anh_dai_dien',
        'khoi_luong_gram',
        'thoi_gian_nau',
        'calo',
        'protein',
        'carb',
        'fat',
        'nguyen_lieu',
        'huong_dan_nau',
        'tinh_trang',
    ];

    protected $casts = [
        'calo' => 'float',
        'protein' => 'float',
        'carb' => 'float',
        'fat' => 'float',
        'khoi_luong_gram' => 'float',
        'thoi_gian_nau' => 'integer',
        'tinh_trang' => 'integer',
    ];

    public function getAnhDaiDienAttribute($value)
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }
        return url($value);
    }
}
