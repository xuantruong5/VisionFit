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
        Schema::create('gioi_thieu', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_nguoi_gioi_thieu');
            $table->unsignedBigInteger('id_hoi_vien_duoc_gioi_thieu')->unique();
            $table->string('ma_gioi_thieu', 50);
            $table->integer('tinh_trang')->default(0); // 0: cho_thanh_toan / 1: thanh_cong / 2:huy
             // Tiền thưởng cho A
            $table->decimal('thuong_nguoi_gioi_thieu', 12, 2)->default(0);
            // Ưu đãi cho B
            $table->decimal('thuong_nguoi_duoc_gioi_thieu', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gioi_thieu');
    }
};
