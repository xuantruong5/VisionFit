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
        Schema::create('chuong_trinh_tap', function (Blueprint $table) {
            $table->id('id_chuong_trinh');
            $table->string('ten_chuong_trinh');
            $table->string('mo_ta')->nullable();
            $table->string('muc_tieu', 50)->nullable();
            $table->integer('nhom_muc_tieu')->default(0)->comment('0: không mục tiêu , 1: mục tiêu ');
            $table->string('cap_do', 50)->nullable();
            $table->integer('gioi_tinh_ap_dung')->default(0)->comment('0: Nam, 1: Nu, 2: cả hai');
            $table->string('noi_tap', 30)->nullable();
            $table->integer('so_ngay')->default(0);
            $table->integer('so_buoi_moi_tuan')->default(0);
            $table->string('anh_dai_dien', 500)->nullable();
            $table->string('tinh_trang')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chuong_trinh_tap');
    }
};
