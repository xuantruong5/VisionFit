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
        Schema::create('bai_tap_phan_loai', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_bai_tap');
            $table->unsignedBigInteger('id_cap_do');
            $table->unsignedBigInteger('id_noi_tap');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bai_tap_phan_loai');
    }
};
