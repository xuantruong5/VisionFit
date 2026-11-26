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
        Schema::create('moc_phan_thuong_chuoi_tap', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('so_ngay')->unique();
            $table->string('ten_phan_thuong');
            $table->text('mo_ta')->nullable();
            $table->string('hinh_anh')->nullable();
            $table->tinyInteger('trang_thai')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('moc_phan_thuong_chuoi_tap');
    }
};
