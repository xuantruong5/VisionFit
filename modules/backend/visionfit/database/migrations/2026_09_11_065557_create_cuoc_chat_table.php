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
        Schema::create('cuoc_chat', function (Blueprint $table) {
            $table->id('id_cuoc_chat');
            $table->unsignedBigInteger('id_nguoi_dung');
            $table->string('loai')->default(0)->comment('0:cá nhân , 1: nhóm,');
            $table->string('ten_nhom', 255)->nullable();
            $table->string('anh_nhom', 500)->nullable();
            $table->dateTime('thoi_gian_tin_nhan_cuoi')->nullable();
            $table->string('tinh_trang')->default(1)->comment('0: đã ẩn, 1: đang hoạt động');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuoc_chat');
    }
};
