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
        Schema::table('chuong_trinh_tap', function (Blueprint $table) {
            if (!Schema::hasColumn('chuong_trinh_tap', 'id_cap_do')) {
                $table->integer('id_cap_do')->after('id_chuong_trinh')->default(1);
            }
            if (Schema::hasColumn('chuong_trinh_tap', 'cap_do')) {
                $table->dropColumn('cap_do');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chuong_trinh_tap', function (Blueprint $table) {
            if (!Schema::hasColumn('chuong_trinh_tap', 'cap_do')) {
                $table->string('cap_do', 50)->nullable();
            }
            if (Schema::hasColumn('chuong_trinh_tap', 'id_cap_do')) {
                $table->dropColumn('id_cap_do');
            }
        });
    }
};
