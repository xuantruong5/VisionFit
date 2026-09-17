<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\RoomClient;
use App\Models\DetailRoomClient;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Xác thực quyền truy cập kênh WebSocket riêng tư của phòng chat
Broadcast::channel('private-chat-room.{roomUuid}', function ($user, $roomUuid) {
    $room = RoomClient::where('uuid', $roomUuid)->first();
    if (!$room) {
        return false;
    }

    return DetailRoomClient::where('room_client_id', $room->id)
        ->where('client_id', $user->id)
        ->exists();
});
