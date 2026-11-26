<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LichSuChiSoDinhDuong extends Model
{
    use HasFactory;

    protected $table = 'lich_su_chi_so_dinh_duong';

    protected $fillable = [
        'id_user',
        'can_nang',
        'bmi',
        'bmr',
        'tdee',
        'kcal_muc_tieu',
        'protein',
        'carb',
        'fat',
    ];

    protected $casts = [
        'can_nang' => 'float',
        'bmi' => 'float',
        'bmr' => 'float',
        'tdee' => 'float',
        'kcal_muc_tieu' => 'float',
        'protein' => 'float',
        'carb' => 'float',
        'fat' => 'float',
    ];

    /**
     * Quan hệ tới Client (Hội viên)
     */
    public function client()
    {
        return $this->belongsTo(Client::class, 'id_user', 'id');
    }
}

