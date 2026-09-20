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
        Schema::create('bach_khoa_toan_thu', function (Blueprint $table) {
            $table->id();
            $table->string('tieu_de', 500);
            $table->string('chu_de', 100)->nullable();
            $table->string('anh_bia', 500)->nullable();
            $table->text('tom_tat')->nullable();
            $table->longText('noi_dung');
            $table->unsignedBigInteger('luot_xem')->default(0);
            $table->tinyInteger('tinh_trang')->default(1)->comment('1: active, 0: inactive');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bach_khoa_toan_thu');
    }
};
