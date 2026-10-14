<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CapDo extends Model
{
    protected $table = 'cap_do';
    protected $fillable = [
        'ten_cap_do',
        'mo_ta',
        'hinh_anh',
    ];
}
