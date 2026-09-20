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
        Schema::create('dinh_duong_the_thao', function (Blueprint $table) {
            $table->id();
            $table->string('danh_muc_slug', 50)->index();
            $table->string('danh_muc_ten', 100);
            $table->string('danh_muc_anh', 500)->nullable();
            $table->string('ten_san_pham', 255);
            $table->string('anh_san_pham', 500)->nullable();
            $table->text('mo_ta_ngan')->nullable();
            $table->longText('noi_dung_chi_tiet')->nullable();
            $table->integer('luot_xem')->default(0);
            $table->tinyInteger('tinh_trang')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dinh_duong_the_thao');
    }
};
