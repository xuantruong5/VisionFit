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
        Schema::create('dang_ky_chuong_trinh', function (Blueprint $table) {
            $table->id(); // id_dang_ky_chuong_trinh
            $table->unsignedBigInteger('id_hoi_vien');
            $table->unsignedBigInteger('id_chuong_trinh');
            $table->date('ngay_bat_dau')->nullable();
            $table->date('ngay_du_kien_ket_thuc')->nullable();
            $table->decimal('phan_tram_hoan_thanh', 5, 2)->default(0);
            $table->string('tinh_trang')->default(0)->comment('0: chua_bat_dau, 1: dang_tap, 2: hoan_thanh, 3: tam_dung, 4: huy');
            $table->dateTime('ngay_tao')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dang_ky_chuong_trinh');
    }
};
