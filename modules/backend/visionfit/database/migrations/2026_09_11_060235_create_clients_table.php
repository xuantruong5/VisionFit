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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_phong_tap');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('ho_ten');
            $table->string('so_dien_thoai')->nullable();
            $table->string('anh_dai_dien', 500)->nullable();
            $table->date('ngay_sinh')->nullable();
            $table->string('gioi_tinh')->default(0)->comment('0: Nam, 1: Nu, 2: Khác');
            $table->decimal('chieu_cao_cm', 5, 2)->nullable();
            $table->decimal('can_nang_kg', 5, 2)->nullable();
            $table->string('dang_nguoi', 500)->nullable(); // kiểu như đưa hình cho người ta chọn 
            $table->string('muc_tieu_hien_tai', 50)->nullable();
            $table->string('cap_do_hien_tai', 50)->nullable();
            $table->string('noi_tap_uu_tien', 30)->nullable();
            $table->string('trang_thai_ho_so', 30)->nullable();
            $table->string('tinh_trang', 30)->nullable(); 
            $table->string('hash_reset')->nullable(); // quên mật khẩu 
            $table->string('hash_active')->nullable(); // kích hoạt tài khoản 
            $table->integer('is_active')->default(0); // đã kích hoạt chưa 
            $table->integer('is_block')->default(0);// có bị khóa không 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
