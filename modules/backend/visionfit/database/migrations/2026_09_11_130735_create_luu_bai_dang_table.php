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
        Schema::create('luu_bai_dang', function (Blueprint $table) {
            $table->id('id_luu');

            $table->unsignedBigInteger('id_bai_dang');
            $table->unsignedBigInteger('id_nguoi_dung');

            $table->timestamps();

            $table->unique([
                'id_bai_dang',
                'id_nguoi_dung'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('luu_bai_dang');
    }
};
