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
        Schema::create('buoi_tap', function (Blueprint $table) {
            $table->id('id_buoi_tap');
            $table->unsignedBigInteger('id_hoi_vien');
            $table->unsignedBigInteger('id_lich_tap');
            $table->dateTime('thoi_gian_bat_dau');
            $table->dateTime('thoi_gian_ket_thuc');
            $table->integer('tong_thoi_gian_giay')->nullable();
            $table->integer('tong_so_lan_lap')->nullable();
            $table->decimal('calo_tieu_thu', 8, 2)->nullable();
            $table->decimal('phan_tram_hoan_thanh', 5, 2)->nullable();
            $table->string('tinh_trang')->default('0')->comment('0: chua_bat_dau, 1: dang_tap, 2: hoan_thanh, 3: ket_thuc');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('buoi_tap');
    }
};
