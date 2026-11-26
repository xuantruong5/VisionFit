<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThongBao extends Model
{
    protected $table = 'thong_bao';
    protected $fillable = [
        'id_nguoi_nhan',
        'vai_tro',
        'loai',
        'tieu_de',
        'noi_dung',
        'da_doc',
        'deleted_at',
    ];
}
