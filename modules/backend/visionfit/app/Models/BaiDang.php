<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaiDang extends Model
{
    protected $table = 'bai_dang';

    protected $primaryKey = 'id_bai_dang';

    protected $fillable = [
        'id_nguoi_dung',
        'caption',
        'pham_vi_hien_thi',
        'tinh_trang',
    ];

    public function media()
    {
        return $this->hasMany(
            Media::class,
            'id_bai_dang',
            'id_bai_dang'
        )->orderBy('thu_tu');
    }

    public function client()
    {
        return $this->belongsTo(
            Client::class,
            'id_nguoi_dung',
            'id'
        );
    }

    public function luotThich()
    {
        return $this->hasMany(
            LuotThichBaiDang::class,
            'id_bai_dang',
            'id_bai_dang'
        );
    }

    public function binhLuan()
    {
        return $this->hasMany(
            BinhLuanBaiDang::class,
            'id_bai_dang',
            'id_bai_dang'
        )->where('tinh_trang', '1');
    }

    public function luuBaiDang()
    {
        return $this->hasMany(
            LuuBaiDang::class,
            'id_bai_dang',
            'id_bai_dang'
        );
    }
}
