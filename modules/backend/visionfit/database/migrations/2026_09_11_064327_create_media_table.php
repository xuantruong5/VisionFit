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
        Schema::create('media', function (Blueprint $table) {
            $table->id('id_media');
            $table->unsignedBigInteger('id_bai_dang');
            $table->string('loai_media', 30);
            $table->string('media_url', 500);
            $table->integer('thu_tu')->default(0); // thứ tự hình ảnh 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
