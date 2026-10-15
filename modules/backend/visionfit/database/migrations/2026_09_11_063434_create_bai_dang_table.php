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
        Schema::create('bai_dang', function (Blueprint $table) {
            $table->id('id_bai_dang');
            $table->unsignedBigInteger('id_nguoi_dung');
            $table->text('caption')->nullable();
            $table->string('pham_vi_hien_thi')->default(0)->comment('0: cộng đồng , 1: bạn bè, 2: người được phép xem ');
            $table->string('tinh_trang')->default(1)->comment('1:hiện thị, 0:xóa');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bai_dang');
    }
};
