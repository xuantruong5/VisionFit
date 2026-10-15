<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailRoomClient extends Model
{
    protected $table = 'detail_room_clients';

    protected $fillable = [
        'room_client_id',
        'client_id',
        'nickname',
        'role',
        'is_pinned',
        'is_muted',
        'last_seen_at',
        'last_read_message_id',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_muted' => 'boolean',
        'last_seen_at' => 'datetime',
        'last_read_message_id' => 'integer',
    ];

    /**
     * Phòng chat thuộc về
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(RoomClient::class, 'room_client_id');
    }

    /**
     * Thông tin Client thành viên
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    /**
     * Tin nhắn cuối cùng thành viên đã đọc
     */
    public function lastReadMessage(): BelongsTo
    {
        return $this->belongsTo(RoomHistoryChat::class, 'last_read_message_id');
    }
}
