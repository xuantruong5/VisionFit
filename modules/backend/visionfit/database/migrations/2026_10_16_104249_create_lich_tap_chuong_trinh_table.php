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
        Schema::create('lich_tap_chuong_trinh', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_chuong_trinh');
            // $table->unsignedBigInteger('id_chuong_trinh_bai_tap')->nullable();
            // $table->integer('ngay_thu')->nullable(); // ngày thứ mấy trong gói đó ví dụ gói đó có 20 ngày thì thứ mấy trong 20 ngày
            $table->string('thu_trong_tuan')->comment('1: Thứ 2, 2: Thứ 3, ..., 6: Thứ 7, 7: Chủ nhật');
            $table->time('gio_bat_dau')->nullable(); // phút 
            $table->time('gio_ket_thuc')->nullable();// phút 
            $table->text('ghi_chu')->nullable();
            $table->string('tinh_trang')->default('0')->comment('0: hủy, 1: hoat động ');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lich_tap_chuong_trinh');
    }
};
