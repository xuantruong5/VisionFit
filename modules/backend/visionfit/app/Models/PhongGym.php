<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhongGym extends Model
{
    protected $table = 'phong_gyms';
    protected $fillable = [
        'ten_phong_gym',
        'dia_chi',
        'vi_do',
        'kinh_do',
        'id_ward',
        'so_dien_thoai',
        'website',
        'nguon_du_lieu',
        'osm_type',
        'osm_id',
    ];
}
