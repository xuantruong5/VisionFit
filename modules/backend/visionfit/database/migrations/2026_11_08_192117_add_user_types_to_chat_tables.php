
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detail_room_clients', function (Blueprint $table) {
            $table->string('participant_type', 20)
                ->default('client');
        });

        Schema::table('room_history_chats', function (Blueprint $table) {
            $table->string('sender_type', 20)
                ->default('client');
        });

        Schema::table('room_clients', function (Blueprint $table) {
            $table->string('created_by_type', 20)
                ->default('client');
        });
    }

    public function down(): void
    {
        Schema::table('room_clients', function (Blueprint $table) {
            $table->dropColumn('created_by_type');
        });

        Schema::table('room_history_chats', function (Blueprint $table) {
            $table->dropColumn('sender_type');
        });

        Schema::table('detail_room_clients', function (Blueprint $table) {
            $table->dropColumn('participant_type');
        });
    }
};
