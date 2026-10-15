<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LuotThichBinhLuan extends Model
{
    protected $table = 'luot_thich_binh_luan';

    protected $primaryKey = 'id_luot_thich_binh_luan';

    protected $fillable = [
        'id_binh_luan',
        'id_nguoi_dung',
    ];
}
