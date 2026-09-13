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
        Schema::create('mon_an', function (Blueprint $table) {
            $table->id(); // id_mon_an
            $table->string('ten_mon_an', 255);
            $table->text('mo_ta')->nullable();
            $table->string('anh_dai_dien', 500)->nullable();
            $table->decimal('khoi_luong_gram', 8, 2)->nullable()->comment('Khối lượng món ăn tính bằng gram');
            $table->integer('thoi_gian_nau')->nullable()->comment('Thời gian nấu tính bằng phút');
            $table->decimal('calo', 8, 2)->nullable()->comment('kcal');
            $table->decimal('protein', 8, 2)->nullable()->comment('gram');
            $table->decimal('carb', 8, 2)->nullable()->comment('gram');
            $table->decimal('fat', 8, 2)->nullable()->comment('gram');
            $table->string('nguyen_lieu')->nullable(); // bao gồm cả gia vị 
            $table->string('huong_dan_nau')->nullable();
            $table->integer('tinh_trang') ->default(1)->comment('0: nghi, 1: đang hoạt động');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mon_an');
    }
};
