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
        Schema::create('chuong_trinh_bai_tap_chi_tiet', function (Blueprint $table) {
            $table->id();
            $table->integer('id_chuong_trinh_bai_tap');
            $table->integer('id_bai_tap');
            $table->unsignedInteger('thu_tu')->comment('Thứ tự bài tập trong buổi tập');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chuong_trinh_bai_tap_chi_tiet');
    }
};
