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
        Schema::create('buoi_tap_pt', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_chi_tiet_dang_ky_goi');
            // Người tham gia
            $table->unsignedBigInteger('id_hoi_vien');
            $table->unsignedBigInteger('id_trainer');
            $table->unsignedBigInteger('id_lich_tap')->nullable();

            // Lịch tập
            $table->date('ngay_tap')->nullable();
            $table->time('gio_bat_dau')->nullable();
            $table->time('gio_ket_thuc')->nullable();

            // Trạng thái buổi PT
            $table->integer('tinh_trang')->default(0)->comment('0: cho_dat_lich, 1: cho_xac_nhan, 2: da_xac_nhan, 3: hoan_thanh, 4: huy');

            $table->text('ghi_chu')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('buoi_tap_pt');
    }
};
