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
        Schema::create('chi_tiet_bai_tap', function (Blueprint $table) {
            $table->id();
            $table->integer('id_bai_tap')->unique();
            $table->string('video_huong_dan')->nullable();
            $table->string('video_sai')->nullable();
            $table->text('mo_ta')->nullable();
            $table->text('ghi_chu')->nullable();
            $table->text('huong_dan')->nullable();
            $table->text('canh_bao')->nullable();
            $table->string('noi_tap')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chi_tiet_bai_tap');
    }
};
