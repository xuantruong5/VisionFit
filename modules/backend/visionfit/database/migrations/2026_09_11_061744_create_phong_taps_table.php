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
        Schema::create('phong_taps', function (Blueprint $table) {
            $table->id('id_phong_tap');
            $table->string('ten_phong_tap');
            $table->string('dia_chi', 500)->nullable();
            $table->string('so_dien_thoai')->nullable();
            $table->string('mo_ta')->nullable();
            $table->string('email')->nullable();
            $table->string('anh_banner')->nullable();
            $table->integer('tinh_trang')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phong_taps');
    }
};
