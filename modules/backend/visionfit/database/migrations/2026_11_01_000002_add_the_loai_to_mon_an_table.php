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
        Schema::table('mon_an', function (Blueprint $table) {
            if (!Schema::hasColumn('mon_an', 'the_loai')) {
                $table->string('the_loai', 100)->nullable()->after('loai_bua');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mon_an', function (Blueprint $table) {
            if (Schema::hasColumn('mon_an', 'the_loai')) {
                $table->dropColumn('the_loai');
            }
        });
    }
};

