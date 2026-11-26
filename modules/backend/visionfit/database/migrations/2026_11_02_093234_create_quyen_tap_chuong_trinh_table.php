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
        Schema::create('quyen_tap_chuong_trinh', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_chi_tiet_dang_ky_goi');
            $table->unsignedBigInteger('id_dang_ky_chuong_trinh');
            $table->date('ngay_cap_quyen');
            $table->date('ngay_het_lich');
            $table->integer('tinh_trang')->default(1)->comment('1: con quyen, 0: het quyen');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quyen_tap_chuong_trinh');
    }
};
