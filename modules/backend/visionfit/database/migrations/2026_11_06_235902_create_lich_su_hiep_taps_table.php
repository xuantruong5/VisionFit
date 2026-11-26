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
        Schema::create('lich_su_hiep_taps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_tien_do_bai_tap');
            $table->unsignedBigInteger('id_buoi_tap');
            $table->string('loai_ghi_nhan', 20);
            $table->unsignedInteger('so_hiep')->nullable();
            $table->unsignedInteger('so_phut_thuc_te')->nullable();
            $table->unsignedInteger('so_rep_thuc_te')->nullable();
            $table->unsignedInteger('thoi_gian_thuc_te_giay')->nullable();
            $table->decimal('trong_luong_ta_thuc_te', 8, 2)->nullable();
            $table->text('ghi_chu')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lich_su_hiep_taps');
    }
};
