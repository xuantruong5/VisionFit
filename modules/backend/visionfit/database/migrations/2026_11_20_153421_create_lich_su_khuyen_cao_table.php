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
        Schema::create('lich_su_khuyen_cao', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_hoi_vien');
            $table->unsignedBigInteger('id_chi_so_dinh_duong');
            $table->text('danh_gia_the_trang')->nullable();
            $table->text('dinh_huong_dinh_duong')->nullable();
            $table->json('goi_y_thuc_pham')->nullable();
            $table->text('dinh_huong_tap_luyen')->nullable();
            $table->json('viec_can_thuc_hien')->nullable();
            $table->json('chi_so_can_theo_doi')->nullable();
            $table->tinyInteger('trang_thai')->default(1) ->comment('0: Ngừng áp dụng, 1: Đang áp dụng');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lich_su_khuyen_cao');
    }
};
