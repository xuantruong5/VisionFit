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
        Schema::create('lich_tap', function (Blueprint $table) {
            $table->id('id_lich_tap');
            $table->unsignedBigInteger('id_hoi_vien');
            $table->unsignedBigInteger('id_goi');
            $table->unsignedBigInteger('id_trainner')->nullable();
            $table->integer('ngay_thu')->nullable(); // ngày thứ mấy trong gói đó ví dụ gói đó có 20 ngày thì thứ mấy trong 20 ngày
            $table->date('ngay_tap');
            $table->time('gio_bat_dau')->nullable();
            $table->time('gio_ket_thuc')->nullable();
            $table->text('ghi_chu')->nullable();
            $table->string('tinh_trang')->default('0')->comment('0: chua_bat_dau, 1: dang_tap, 2: đã tập, 3: vắng or hủy');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lich_tap');
    }
};
