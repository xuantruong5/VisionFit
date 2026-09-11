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
        Schema::create('chi_tiet_dang_ky_goi', function (Blueprint $table) {
            $table->id();
            $table->integer('id_dang_ky_goi');
            $table->integer('id_goi_tap');
            $table->integer('so_buoi')->default(0);
            $table->integer('so_buoi_pt')->default(0);
            $table->double('don_gia')->default(0);
            $table->double('giam_gia')->default(0);
            $table->date('ngay_bat_dau')->nullable();
            $table->date('ngay_ket_thuc')->nullable();
            $table->integer('tinh_trang')->default(0)->comment('0: chua_bat_dau, 1: dang_tap, 2: hoan_thanh, 3: Hủy');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chi_tiet_dang_ky_goi');
    }
};
