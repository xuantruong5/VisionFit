<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $table = 'media';

    protected $primaryKey = 'id_media';

    protected $fillable = [
        'id_bai_dang',
        'loai_media',
        'media_url',
        'thu_tu',
    ];

    public function baiDang()
    {
        return $this->belongsTo(
            BaiDang::class,
            'id_bai_dang',
            'id_bai_dang'
        );
    }
}
