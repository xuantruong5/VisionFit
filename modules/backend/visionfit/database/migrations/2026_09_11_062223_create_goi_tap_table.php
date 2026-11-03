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
        Schema::create('goi_tap', function (Blueprint $table) {
            $table->id();
            $table->string('ma_goi_tap', 50);
            $table->unsignedBigInteger('id_phong_tap')->nullable();
            $table->string('ten_goi_tap');
            $table->integer('thoi_han_mua')->default(30);
            $table->integer('thoi_han_tang')->default(0);
            $table->integer('thoi_han_ngay');
            $table->decimal('gia', 12, 2);
            $table->string('hinh_anh', 500)->nullable();
            $table->integer('so_buoi')->default(0);
            $table->integer('so_buoi_pt')->default(0);
            $table->text('mo_ta')->nullable();
            $table->integer('tinh_trang')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goi_tap');
    }
};
