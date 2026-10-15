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
        Schema::create('tin_nhan', function (Blueprint $table) {
            $table->id('id_tin_nhan');
            $table->unsignedBigInteger('id_cuoc_chat');
            $table->unsignedBigInteger('id_nguoi_gui'); // client or trainner 
            $table->unsignedBigInteger('id_tra_loi')->nullable();
            $table->string('loai_tin_nhan')->default('text');
            $table->text('noi_dung')->nullable(); 
            $table->string('media_url', 500)->nullable();
             $table->string('tinh_trang')->default(1)->comment('0: chưa gửi, 1: đã gửi, 2: đã gỡ');
            $table->timestamps();// thời gian gửi thời gian chỉnh sửa 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tin_nhan');
    }
};
