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
        Schema::create('bai_tap_nhom_co', function (Blueprint $table) {
            $table->id();
            $table->integer('id_bai_tap');
            $table->string('ten_nhom_co', 100);
            $table->decimal('ty_le_tac_dong', 5, 2)->default(0)->comment('Tỷ lệ tác động lên nhóm cơ, đơn vị phần trăm');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bai_tap_nhom_co');
    }
};
