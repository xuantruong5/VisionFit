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
        Schema::create('luot_thich_binh_luan', function (Blueprint $table) {
            $table->id('id_luot_thich_binh_luan');

            $table->unsignedBigInteger('id_binh_luan');
            $table->unsignedBigInteger('id_nguoi_dung');

            $table->timestamps();

            $table->unique([
                'id_binh_luan',
                'id_nguoi_dung'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('luot_thich_binh_luan');
    }
};
