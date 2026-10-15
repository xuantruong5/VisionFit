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
        Schema::create('room_clients', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 64)->unique();
            $table->tinyInteger('type')->default(1)->comment('1: single, 2: group');
            $table->string('name')->nullable()->comment('Tên phòng hoặc tên nhóm');
            $table->string('avatar', 500)->nullable()->comment('Ảnh đại diện phòng / nhóm');
            $table->unsignedBigInteger('created_by')->nullable()->comment('ID người tạo phòng');
            $table->dateTime('last_message_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_clients');
    }
};
