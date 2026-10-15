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
        Schema::create('room_history_chats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('room_client_id')->index();
            $table->unsignedBigInteger('client_id')->index()->comment('ID người gửi');
            $table->text('message')->nullable()->comment('Nội dung tin nhắn');
            $table->string('message_type', 50)->default('VAN_BAN')->comment('VAN_BAN, HINH_ANH, LICH_TAP, TEP_TIN');
            $table->string('media_url', 500)->nullable()->comment('Đường dẫn ảnh hoặc tài liệu');
            $table->json('workout_data')->nullable()->comment('Dữ liệu buổi tập nếu message_type=LICH_TAP');
            $table->unsignedBigInteger('reply_to_id')->nullable()->index()->comment('ID tin nhắn trích dẫn');
            $table->json('reactions')->nullable()->comment('Danh sách emoji cảm xúc');
            $table->string('status', 30)->default('DA_GUI')->comment('DA_GUI, DA_THU_HOI');
            $table->tinyInteger('is_seen')->default(0)->comment('0: Chưa xem, 1: Đã xem');
            $table->timestamps();

            $table->foreign('room_client_id')->references('id')->on('room_clients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_history_chats');
    }
};
