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
            if (!Schema::hasColumn('mon_an', 'danh_muc_slug')) {
                $table->string('danh_muc_slug', 50)->nullable()->after('ten_mon_an')->index();
            }
            if (!Schema::hasColumn('mon_an', 'danh_muc_ten')) {
                $table->string('danh_muc_ten', 100)->nullable()->after('danh_muc_slug');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mon_an', function (Blueprint $table) {
            if (Schema::hasColumn('mon_an', 'danh_muc_slug')) {
                $table->dropColumn('danh_muc_slug');
            }
            if (Schema::hasColumn('mon_an', 'danh_muc_ten')) {
                $table->dropColumn('danh_muc_ten');
            }
        });
    }
};
