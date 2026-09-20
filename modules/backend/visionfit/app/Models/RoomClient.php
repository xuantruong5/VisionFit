<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RoomClient extends Model
{
    protected $table = 'room_clients';

    protected $fillable = [
        'uuid',
        'type',
        'name',
        'avatar',
        'created_by',
        'last_message_at',
    ];

    const TYPE_SINGLE = 1;
    const TYPE_GROUP = 2;

    /**
     * Danh sách thành viên trong phòng chat (DetailRoomClient)
     */
    public function members(): HasMany
    {
        return $this->hasMany(DetailRoomClient::class, 'room_client_id');
    }

    /**
     * Danh sách người dùng tham gia phòng
     */
    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'detail_room_clients', 'room_client_id', 'client_id');
    }

    /**
     * Toàn bộ lịch sử tin nhắn trong phòng
     */
    public function messages(): HasMany
    {
        return $this->hasMany(RoomHistoryChat::class, 'room_client_id');
    }

    /**
     * Tin nhắn mới nhất trong phòng
     */
    public function lastMessage(): HasOne
    {
        return $this->hasOne(RoomHistoryChat::class, 'room_client_id')->latestOfMany();
    }
}
