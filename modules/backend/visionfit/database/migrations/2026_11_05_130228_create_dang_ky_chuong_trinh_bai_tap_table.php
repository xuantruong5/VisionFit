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
        Schema::create('dang_ky_chuong_trinh_bai_tap', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_dang_ky_chuong_trinh');
            $table->unsignedBigInteger('id_chuong_trinh_bai_tap');
            $table->boolean('cho_phep_bo_qua')->default(0);
            $table->tinyInteger('tinh_trang')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dang_ky_chuong_trinh_bai_tap');
    }
};
