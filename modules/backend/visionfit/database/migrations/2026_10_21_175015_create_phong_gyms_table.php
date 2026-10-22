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
        Schema::create('phong_gyms', function (Blueprint $table) {
            $table->id();
            $table->integer('id_ward')->nullable();;
            $table->string('ten_phong_gym')->nullable();
            $table->text('dia_chi')->nullable();

            $table->decimal('vi_do', 10, 7)->nullable();
            $table->decimal('kinh_do', 10, 7)->nullable();

            $table->string('so_dien_thoai')->nullable();
            $table->string('website')->nullable();
            $table->string('hinh_anh', 2048)->nullable();

            $table->string('nguon_du_lieu')->default('OpenStreetMap');
            $table->string('osm_type', 20);
            $table->string('osm_id', 100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phong_gyms');
    }
};
