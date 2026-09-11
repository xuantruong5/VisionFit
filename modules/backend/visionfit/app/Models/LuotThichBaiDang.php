<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LuotThichBaiDang extends Model
{
    protected $table = 'luot_thich_bai_dang';

    protected $primaryKey = 'id_luot_thich';

    protected $fillable = [
        'id_bai_dang',
        'id_nguoi_dung',
    ];
}
