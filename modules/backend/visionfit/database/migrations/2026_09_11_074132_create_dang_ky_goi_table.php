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
        Schema::create('dang_ky_goi', function (Blueprint $table) {
            $table->id();
            $table->integer('id_hoi_vien');
            $table->date('ngay_dang_ky')->nullable();
            $table->integer('tinh_trang')->default(1)->comment('0: huy, 1: dang_ky, 2: hoan_thanh');
            $table->string('phuong_thuc_thanh_toan', 30)->nullable()->comment('0: tien_mat, 1: chuyen_khoan, 2: the');
            $table->integer('is_thanh_toan')->default(0)->comment('0: chua_thanh_toan, 1: da_thanh_toan');
            $table->double('tong_tien')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dang_ky_goi');
    }
};
