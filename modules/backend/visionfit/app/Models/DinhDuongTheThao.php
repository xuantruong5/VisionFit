<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DinhDuongTheThao extends Model
{
    use HasFactory;

    protected $table = 'dinh_duong_the_thao';

    protected $fillable = [
        'danh_muc_slug',
        'danh_muc_ten',
        'danh_muc_anh',
        'ten_san_pham',
        'anh_san_pham',
        'mo_ta_ngan',
        'noi_dung_chi_tiet',
        'luot_xem',
        'tinh_trang',
    ];

    protected $casts = [
        'luot_xem' => 'integer',
        'tinh_trang' => 'integer',
    ];

    public function getAnhSanPhamAttribute($value)
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }
        return url($value);
    }

    public function getDanhMucAnhAttribute($value)
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }
        return url($value);
    }
}
