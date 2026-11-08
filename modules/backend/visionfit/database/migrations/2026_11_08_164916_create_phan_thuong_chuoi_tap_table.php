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
        Schema::create('phan_thuong_chuoi_tap', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_hoi_vien');
            $table->unsignedBigInteger('id_dang_ky_chuong_trinh');
            $table->integer('so_ngay');
            $table->string('ten_phan_thuong');
            $table->tinyInteger('tinh_trang')->default(0);
            $table->dateTime('ngay_dat_moc')->nullable();
            $table->dateTime('ngay_nhan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phan_thuong_chuoi_tap');
    }
};
