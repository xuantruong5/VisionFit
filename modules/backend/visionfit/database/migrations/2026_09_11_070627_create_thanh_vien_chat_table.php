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
        Schema::create('thanh_vien_chat', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_cuoc_chat');
            $table->unsignedBigInteger('id_nguoi_dung');
            $table->string('vai_tro')->nullable();
            $table->dateTime('thoi_gian_doc_cuoi')->nullable();
            $table->boolean('da_tat_thong_bao')->default(false); 
            $table->string('tinh_trang')->default(1)->comment('0: đã rời, 1: đang hoạt động, 2: bị khóa');
            $table->dateTime('ngay_tham_gia')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('thanh_vien_chat');
    }
};
