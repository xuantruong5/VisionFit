<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BinhLuanBaiDang extends Model
{
    protected $table = 'binh_luan_bai_dang';

    protected $primaryKey = 'id_binh_luan';

    protected $fillable = [
        'id_bai_dang',
        'id_nguoi_dung',
        'id_binh_luan_cha',
        'noi_dung',
        'tinh_trang',
    ];

    public function client()
    {
        return $this->belongsTo(
            Client::class,
            'id_nguoi_dung',
            'id'
        );
    }
}
