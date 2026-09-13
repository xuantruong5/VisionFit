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
        Schema::create('ke_hoach_an', function (Blueprint $table) {
            $table->id(); // 'id_ke_hoach_an'
            $table->unsignedBigInteger('id_chuong_trinh');
            $table->unsignedBigInteger('id_hoi_vien')->nullable();
            $table->unsignedBigInteger('id_nguoi_tao')->nullable();
            $table->string('ten_ke_hoach', 255);
            $table->integer('muc_tieu_calo_ngay')->nullable(); // ngày 
            $table->decimal('protein_muc_tieu', 8, 2)->nullable(); // ngày 
            $table->decimal('carb_muc_tieu', 8, 2)->nullable();// ngày 
            $table->decimal('fat_muc_tieu', 8, 2)->nullable();// ngày 
            // Thời gian áp dụng
            $table->date('ngay_bat_dau')->nullable();
            $table->date('ngay_ket_thuc')->nullable();
            // Trạng thái
            $table->integer('tinh_trang') ->default(1)->comment('0: nghi, 1: đang hoạt động');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ke_hoach_an');
    }
};
