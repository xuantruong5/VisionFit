<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;

class ChatUpdatedEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $roomUuid,
        public string $eventType,
        public array $data
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat-room.' . $this->roomUuid)
        ];
    }

    public function broadcastAs(): string
    {
        return 'chat.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'room_uuid' => $this->roomUuid,
            'event_type' => $this->eventType,
            'data' => $this->data,
        ];
    }
}