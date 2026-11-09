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
        Schema::create('thong_bao', function (Blueprint $table) {
            $table->id();
             // ID tài khoản nhận thông báo
            $table->unsignedBigInteger('id_nguoi_nhan');
            // hoi_vien, trainer, admin
            $table->string('vai_tro', 20);
            // success, error, info
            $table->string('loai', 20)->default('info');
            $table->string('tieu_de');
            $table->text('noi_dung');
            // 0: Chưa đọc, 1: Đã đọc
            $table->tinyInteger('da_doc')->default(0);
            // Xóa mềm thông báo
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('thong_bao');
    }
};
