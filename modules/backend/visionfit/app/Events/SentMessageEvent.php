<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SentMessageEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $room_uuid;
    public $data;

    public function __construct($room_uuid, $data)
    {
        $this->room_uuid = $room_uuid;
        $this->data = $data;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('chat-room.' . $this->room_uuid),
            new PrivateChannel('private-chat-room.' . $this->room_uuid),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
