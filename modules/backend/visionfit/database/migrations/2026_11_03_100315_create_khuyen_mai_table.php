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
        Schema::create('khuyen_mai', function (Blueprint $table) {
            $table->id();
            $table->string('ten_khuyen_mai');
            $table->string('ma_khuyen_mai')->nullable()->unique();
            $table->enum('loai_giam', ['phan_tram', 'tien_mat']);
            $table->decimal('gia_tri_giam', 12, 2);
            $table->unsignedInteger('lan_dang_ky_tu')->default(1);
            $table->unsignedInteger('lan_dang_ky_den')->nullable();
            $table->date('ngay_bat_dau');
            $table->date('ngay_ket_thuc')->nullable();
            // Null: áp dụng cho tất cả gói tập
            $table->unsignedBigInteger('id_goi_tap')->nullable();

            // 1: Đang hoạt động, 0: Ngừng
            $table->integer('tinh_trang')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('khuyen_mai');
    }
};
