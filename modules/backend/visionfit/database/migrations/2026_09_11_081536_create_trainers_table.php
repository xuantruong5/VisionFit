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
        Schema::create('trainers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_trainer_gioi_thieu')->nullable();
            $table->string('ma_gioi_thieu')->unique()->nullable();
            $table->string('ho_ten')->nullable();
            $table->string('email')->unique()->nullable();
            $table->string('password')->nullable();
            $table->string('so_dien_thoai')->nullable();
            $table->date('ngay_sinh')->nullable();
            $table->integer('gioi_tinh')->default(0)->comment('0: Nam, 1: Nu, 2: Khac');
            $table->text('mo_ta')->nullable();
            $table->string('hinh_anh')->nullable();
            $table->string('chuc_danh')->nullable();
            $table->string('so_nam_kinh_nghiem')->nullable();
            $table->text('kinh_nghiem_lam_viec')->nullable();
            $table->text('qua_trinh_dao_tao')->nullable();
            $table->text('chung_chi')->nullable();
            $table->text('thanh_tuu')->nullable();
            $table->string('chuyen_mon')->nullable();
            $table->integer('is_verified')->default(0);
             $table->integer('trang_thai_tuyen_dung')->default(0) ->comment('0: Cho lien he, 1: Da moi phong van, 2: Phong van dat, 3: Phong van khong dat');
            // Lịch phỏng vấn
            $table->dateTime('ngay_phong_van')->nullable();
            $table->integer('tinh_trang') ->default(1)->comment('0: nghi, 1: dang_lam');
            $table->unsignedBigInteger('id_phong_tap')->nullable();
            $table->integer('is_active')->default(0);
            $table->integer('is_block')->default(0);
            $table->string('hash_reset')->nullable();
            $table->string('hash_active')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trainers');
    }
};
