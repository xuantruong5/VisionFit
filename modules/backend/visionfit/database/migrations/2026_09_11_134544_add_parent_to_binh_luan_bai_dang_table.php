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
        Schema::table('binh_luan_bai_dang', function (Blueprint $table) {
            $table->unsignedBigInteger('id_binh_luan_cha')
                ->nullable()
                ->after('id_nguoi_dung');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('binh_luan_bai_dang', function (Blueprint $table) {
            $table->dropColumn('id_binh_luan_cha');
        });
    }
};
