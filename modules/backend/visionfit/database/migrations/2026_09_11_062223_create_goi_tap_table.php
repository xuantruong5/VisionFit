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
            $table->id('id_goi_tap');
            $table->unsignedBigInteger('id_phong_tap');
            $table->string('ten_goi_tap');
            $table->integer('thoi_han_ngay');
            $table->decimal('gia', 12, 2);
            $table->string('hinh_anh', 500)->nullable();
            $table->integer('tinh_trang')->default(1);
            $table->string('mo_ta')->nullable();
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
