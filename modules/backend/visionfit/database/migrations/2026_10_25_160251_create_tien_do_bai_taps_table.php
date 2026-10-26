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
        Schema::create('tien_do_bai_taps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_dang_ky_chuong_trinh');
            $table->unsignedBigInteger('id_chuong_trinh_bai_tap');
            $table->unsignedBigInteger('id_bai_tap');
            $table->unsignedBigInteger('id_buoi_tap');
            $table->integer('so_set_thuc_te')->nullable();
            $table->integer('so_phut_thuc_te')->nullable();
            $table->integer('so_rep_thuc_te')->nullable();
            $table->integer('thoi_gian_thuc_te_giay')->nullable();
            $table->decimal('trong_luong_ta_thuc_te', 6, 2)->nullable();
            $table->text('ly_do_bo_qua')->nullable();
            $table->integer('tinh_trang')->nullable();
            $table->decimal('phan_tram_hoan_thanh', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tien_do_bai_taps');
    }
};
