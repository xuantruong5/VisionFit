<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomHistoryChat extends Model
{
    protected $table = 'room_history_chats';

    protected $fillable = [
        'room_client_id',
        'client_id',
        'message',
        'message_type',
        'media_url',
        'workout_data',
        'reply_to_id',
        'reactions',
        'status',
        'is_seen',
    ];

    const IS_SEEN  = 1;
    const NOT_SEEN = 0;

    const STATUS_SENT     = 'DA_GUI';
    const STATUS_RECALLED = 'DA_THU_HOI';

    const TYPE_TEXT    = 'VAN_BAN';
    const TYPE_IMAGE   = 'HINH_ANH';
    const TYPE_WORKOUT = 'LICH_TAP';
    const TYPE_FILE    = 'TEP_TIN';

    protected $casts = [
        'workout_data' => 'array',
        'reactions'    => 'array',
        'is_seen'      => 'integer',
    ];

    /**
     * Thuộc về phòng chat nào
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(RoomClient::class, 'room_client_id');
    }

    /**
     * Người gửi tin nhắn (Client)
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    /**
     * Tin nhắn được trích dẫn trả lời (nếu có)
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(RoomHistoryChat::class, 'reply_to_id');
    }
}
