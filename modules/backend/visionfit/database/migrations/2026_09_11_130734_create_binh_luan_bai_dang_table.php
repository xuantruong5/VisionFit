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
        Schema::create('binh_luan_bai_dang', function (Blueprint $table) {
            $table->id('id_binh_luan');

            $table->unsignedBigInteger('id_bai_dang');
            $table->unsignedBigInteger('id_nguoi_dung');

            $table->text('noi_dung');

            $table->string('tinh_trang')
                ->default('1')
                ->comment('1: hien thi, 0: xoa');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('binh_luan_bai_dang');
    }
};
