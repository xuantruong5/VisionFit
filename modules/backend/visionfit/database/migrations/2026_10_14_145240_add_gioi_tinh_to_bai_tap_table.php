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
        Schema::table('bai_tap', function (Blueprint $table) {
            $table->integer('gioi_tinh_ap_dung')->default(2)->comment('0: Nam, 1: Nu, 2: Ca hai')->after('nhom_co');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bai_tap', function (Blueprint $table) {
            $table->dropColumn('gioi_tinh_ap_dung');
        });
    }
};
