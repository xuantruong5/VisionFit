<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('luot_thich_bai_dang', function (Blueprint $table) {
            $table->id('id_luot_thich');
            $table->unsignedBigInteger('id_bai_dang');
            $table->unsignedBigInteger('id_nguoi_dung');
            $table->string('loai_nguoi_dung', 20)->default('client');
            $table->timestamps();

            $table->unique( ['id_bai_dang', 'id_nguoi_dung', 'loai_nguoi_dung'], 'unique_luot_thich');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('luot_thich_bai_dang');
    }
};
