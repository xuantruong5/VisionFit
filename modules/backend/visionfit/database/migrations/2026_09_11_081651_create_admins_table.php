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
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('ho_ten')->nullable();
            $table->string('email')->unique()->nullable();
            $table->string('password')->nullable();
            $table->string('so_dien_thoai')->nullable();
            $table->string('hinh_anh')->nullable();
            $table->integer('tinh_trang')->default(1)->comment('0: khoa, 1: dang_hoat_dong');
            $table->integer('id_chuc_vu');
            $table->integer('is_master')->default(0)->comment('0: admin thuong, 1: admin tong');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};
