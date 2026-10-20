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
        Schema::create('muc_tieu_dinh_duong', function (Blueprint $table) {
            $table->id();
            $table->integer('id_chuong_trinh');
            $table->integer('muc_tieu_the_trang')->default(0);
            // 0: Duy trì
            // 1: Tăng cân
            // 2: Giảm cân
            $table->integer('muc_tieu_calo')->nullable();
            $table->decimal('protein_muc_tieu', 8, 2)->nullable();
            $table->decimal('carb_muc_tieu', 8, 2)->nullable();
            $table->decimal('fat_muc_tieu', 8, 2)->nullable();
            $table->integer('tinh_trang')->default(1)->comment('1: active, 0: inactive');
            $table->timestamps();
        }); // khi hội viên đăng ký xong cái chương trình này và update cân nặng và 
        // chiều cao các thứ thì trainer sẽ xem thay đổi chỗ này của hội viên đó. sau này tra từ id_dang_ky ra id_chuong trinh roi update nay cho nay 
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('muc_tieu_dinh_duong');
    }
};
