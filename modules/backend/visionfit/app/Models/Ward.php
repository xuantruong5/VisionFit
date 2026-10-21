<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ward extends Model
{
    protected $table = 'wards';
    protected $fillable = [
        'code',
        'id_province',
        'name',
        'codename',
        'division_type',
    ];
}
