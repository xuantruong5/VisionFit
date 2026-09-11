<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LuuBaiDang extends Model
{
    protected $table = 'luu_bai_dang';

    protected $primaryKey = 'id_luu';

    protected $fillable = [
        'id_bai_dang',
        'id_nguoi_dung',
    ];
}
