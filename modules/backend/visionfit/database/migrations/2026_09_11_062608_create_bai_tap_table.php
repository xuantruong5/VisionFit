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
        Schema::create('bai_tap', function (Blueprint $table) {
            $table->id('id_bai_tap');
            $table->string('ma_bai_tap', 50)->unique();
            $table->string('ten_bai_tap');
            $table->string('nhom_co');
            $table->string('cap_do')->nullable();
            $table->string('mo_ta')->nullable();
            $table->string('huong_dan')->nullable();
            $table->string('loi_thuong_gap')->nullable();
            $table->string('thiet_bi', 255)->nullable();
            $table->string('anh_dai_dien', 500)->nullable();
            $table->string('video_huong_dan', 500)->nullable();
            $table->boolean('ho_tro_ai')->nullable();
            $table->string('goc_camera_khuyen_nghi', 255)->nullable();
            $table->integer('tinh_trang')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bai_tap');
    }
};
