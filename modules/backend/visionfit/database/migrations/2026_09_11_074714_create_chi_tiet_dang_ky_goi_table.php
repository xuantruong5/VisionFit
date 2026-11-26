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
            $table->integer('id_noi_tap')->nullable();
            $table->integer('id_goi_tap');
            $table->unsignedBigInteger('id_chuong_trinh_tap')->nullable();
            $table->unsignedBigInteger('id_trainer')->nullable();
            $table->integer('so_buoi')->default(0);
            $table->integer('so_buoi_pt')->default(0);
            $table->double('don_gia')->default(0);
             // Chi tiết từng khoản giảm
            $table->decimal('tien_giam_khuyen_mai', 12, 2)->default(0);
            $table->decimal('tien_giam_gioi_thieu', 12, 2)->default(0);
             // Tổng tiền giảm
            $table->double('giam_gia')->default(0);
            // Thông tin ưu đãi tại thời điểm đăng ký
            $table->string('ma_khuyen_mai')->nullable();
            $table->string('ma_gioi_thieu')->nullable();
            $table->string('ten_khuyen_mai')->nullable();
            $table->integer('lan_dang_ky')->default(1);
            $table->decimal('phan_tram_giam', 5, 2)->default(0);
             // Tiền cuối cùng sau giảm
            $table->decimal('thanh_tien', 12, 2)->default(0);
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
