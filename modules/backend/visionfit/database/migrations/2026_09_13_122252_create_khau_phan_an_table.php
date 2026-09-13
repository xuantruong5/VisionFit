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
        Schema::create('khau_phan_an', function (Blueprint $table) {
            $table->id();  //id_khau_phan_an;
            $table->unsignedBigInteger('id_ke_hoach_an');
            $table->unsignedBigInteger('id_mon_an');
            $table->date('ngay_an');
            $table->time('gio_an')->nullable()->comment('Giờ ăn');
            $table->string('bua_an', 30); // SANG, PHU_SANG, TRUA, PHU_TRUA, TOI, PHU_TOI
            // Số lượng khẩu phần
            $table->decimal('so_luong', 8, 2)->default(1)->comment('Số khẩu phần');
            $table->string('ghi_chu')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('khau_phan_an');
    }
};
