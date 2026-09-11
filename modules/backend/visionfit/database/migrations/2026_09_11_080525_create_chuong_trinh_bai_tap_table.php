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
        Schema::create('chuong_trinh_bai_tap', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_chuong_trinh');
            $table->unsignedBigInteger('id_bai_tap');
            $table->integer('ngay_thu'); // ngày thứ mấy trong chương trình
            $table->string('ten_ngay_tap', 255)->nullable(); // toàn thân hay gì đó 
            $table->integer('thu_tu'); // thứ tự bài tập trong ngày 
            $table->integer('so_hiep')->nullable();
            $table->integer('so_lan_lap')->nullable();
            $table->decimal('trong_luong_goi_y', 6, 2)->nullable(); // mức tạ gợi ý 
            $table->integer('thoi_gian_giay')->nullable(); // Thời gian thực hiện bài, tính bằng phút giây
            $table->integer('thoi_gian_nghi')->nullable(); //Thời gian nghỉ giữa các hiệp, tính bằng phút 
            $table->boolean('cho_phep_bo_qua')->default(false);
            $table->string('tinh_trang')->default(1)->comment('0: ngung, 1: dang_hoat_dong'); //0: ngung → bài tập này không còn sử dụng trong chương trình 1: dang_hoat_dong → bài tập đang được sử dụng
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chuong_trinh_bai_tap');
    }
};
