
<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\RoomClient;
use App\Models\DetailRoomClient;
use App\Models\Client;

Broadcast::channel(
    'chat-room.{roomUuid}',
    function ($user, $roomUuid) {

        if (!($user instanceof Client)) {
            return false;
        }

        $room = RoomClient::where('uuid', $roomUuid)->first();

        if (!$room) {
            return false;
        }

        return DetailRoomClient::where('room_client_id', $room->id)
            ->where('client_id', $user->id)
            ->exists();
    },
    ['guards' => ['sanctum']]
);
