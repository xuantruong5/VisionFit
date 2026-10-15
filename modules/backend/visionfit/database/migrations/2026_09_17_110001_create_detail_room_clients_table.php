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
        Schema::create('detail_room_clients', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('room_client_id')->index();
            $table->unsignedBigInteger('client_id')->index();
            $table->string('nickname')->nullable();
            $table->string('role', 30)->default('member')->comment('admin, member');
            $table->boolean('is_pinned')->default(false)->comment('Ghim cuộc trò chuyện');
            $table->boolean('is_muted')->default(false)->comment('Tắt thông báo');
            $table->dateTime('last_seen_at')->nullable()->comment('Thời điểm xem tin nhắn cuối');
            $table->timestamps();

            $table->foreign('room_client_id')->references('id')->on('room_clients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_room_clients');
    }
};
