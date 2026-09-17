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
        // 1. Tối ưu bảng chi tiết thành viên phòng chat (detail_room_clients)
        Schema::table('detail_room_clients', function (Blueprint $table) {
            if (!Schema::hasColumn('detail_room_clients', 'last_read_message_id')) {
                $table->unsignedBigInteger('last_read_message_id')
                    ->nullable()
                    ->after('last_seen_at')
                    ->index()
                    ->comment('ID tin nhắn cuối cùng thành viên đã đọc');
            }

            // Ràng buộc Unique ngăn chặn trùng lặp thành viên trong phòng
            $table->unique(['room_client_id', 'client_id'], 'uniq_room_client');

            // Index tối ưu truy vấn danh sách phòng đã ghim
            $table->index(['client_id', 'is_pinned'], 'idx_client_pinned');
        });

        // 2. Tối ưu bảng lịch sử tin nhắn (room_history_chats)
        Schema::table('room_history_chats', function (Blueprint $table) {
            // Composite Index tối ưu hóa phân trang 30 tin nhắn gần nhất
            $table->index(['room_client_id', 'id'], 'idx_room_msg_pagination');

            // Index tối ưu trạng thái tin nhắn
            $table->index(['room_client_id', 'status'], 'idx_room_msg_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_room_clients', function (Blueprint $table) {
            $table->dropUnique('uniq_room_client');
            $table->dropIndex('idx_client_pinned');
            if (Schema::hasColumn('detail_room_clients', 'last_read_message_id')) {
                $table->dropColumn('last_read_message_id');
            }
        });

        Schema::table('room_history_chats', function (Blueprint $table) {
            $table->dropIndex('idx_room_msg_pagination');
            $table->dropIndex('idx_room_msg_status');
        });
    }
};
