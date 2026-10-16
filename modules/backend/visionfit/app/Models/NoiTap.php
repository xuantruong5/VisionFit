<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NoiTap extends Model
{
    protected $table = 'noi_tap';
    protected $fillable = [
        'ten_noi_tap',
        'mo_ta',
    ];
}
