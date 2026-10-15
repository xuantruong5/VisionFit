<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\DetailRoomClient;
use App\Models\RoomClient;
use App\Models\RoomHistoryChat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy client 1 làm user hiện tại
        $client1 = Client::find(1);
        $client2 = Client::find(2);
        $client3 = Client::find(3);

        if (!$client1 || !$client2) {
            return;
        }

        // 1. Tạo phòng chat 1-1 giữa Client 1 và Client 2 (HLV Tuấn Anh / Người hướng dẫn)
        $room1 = RoomClient::create([
            'uuid'            => (string) Str::uuid(),
            'type'            => RoomClient::TYPE_SINGLE,
            'name'            => null,
            'avatar'          => null,
            'created_by'      => $client1->id,
            'last_message_at' => now(),
        ]);

        DetailRoomClient::create([
            'room_client_id' => $room1->id,
            'client_id'      => $client1->id,
            'role'           => 'member',
            'is_pinned'      => true,
            'is_muted'       => false,
            'last_seen_at'   => now(),
        ]);

        DetailRoomClient::create([
            'room_client_id' => $room1->id,
            'client_id'      => $client2->id,
            'role'           => 'member',
            'is_pinned'      => false,
            'is_muted'       => false,
            'last_seen_at'   => now()->subMinutes(10),
        ]);

        // Tin nhắn mẫu cho phòng 1
        $msg1 = RoomHistoryChat::create([
            'room_client_id' => $room1->id,
            'client_id'      => $client2->id,
            'message'        => 'Chào bạn! Mình vừa xem video bài Squat hôm qua hệ thống VisionFit AI chấm điểm.',
            'message_type'   => RoomHistoryChat::TYPE_TEXT,
            'reactions'      => ['🔥'],
            'status'         => RoomHistoryChat::STATUS_SENT,
            'is_seen'        => RoomHistoryChat::IS_SEEN,
            'created_at'     => now()->subMinutes(45),
        ]);

        $msg2 = RoomHistoryChat::create([
            'room_client_id' => $room1->id,
            'client_id'      => $client2->id,
            'message'        => 'Góc nghiêng lưng dưới ở Rep 4 và 5 hơi cong khoảng 8 độ. Bạn chú ý gồng cơ lõi chặt hơn nhé:',
            'message_type'   => RoomHistoryChat::TYPE_IMAGE,
            'media_url'      => 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
            'status'         => RoomHistoryChat::STATUS_SENT,
            'is_seen'        => RoomHistoryChat::IS_SEEN,
            'created_at'     => now()->subMinutes(40),
        ]);

        $msg3 = RoomHistoryChat::create([
            'room_client_id' => $room1->id,
            'client_id'      => $client1->id,
            'message'        => 'Dạ em cảm ơn HLV! Đến rep cuối em hơi đuối nên gồng bụng chưa đủ chặt.',
            'message_type'   => RoomHistoryChat::TYPE_TEXT,
            'reply_to_id'    => $msg2->id,
            'reactions'      => ['👍'],
            'status'         => RoomHistoryChat::STATUS_SENT,
            'is_seen'        => RoomHistoryChat::IS_SEEN,
            'created_at'     => now()->subMinutes(30),
        ]);

        $msg4 = RoomHistoryChat::create([
            'room_client_id' => $room1->id,
            'client_id'      => $client2->id,
            'message'        => 'Đề xuất buổi tập PT 1:1 cùng HLV VisionFit',
            'message_type'   => RoomHistoryChat::TYPE_WORKOUT,
            'workout_data'   => [
                'ten_bai_tap'   => 'Ngực vát trên & Tay sau (Chest & Triceps)',
                'ngay_tap'      => 'Thứ Tư, 16/09/2026',
                'gio_tap'       => '18:00 - 19:15',
                'calo_muc_tieu' => 480,
            ],
            'reactions'      => ['❤️'],
            'status'         => RoomHistoryChat::STATUS_SENT,
            'is_seen'        => RoomHistoryChat::NOT_SEEN,
            'created_at'     => now()->subMinutes(5),
        ]);

        RoomHistoryChat::create([
            'room_client_id' => $room1->id,
            'client_id'      => $client2->id,
            'message'        => 'Bạn bấm Xác nhận lịch tập trên thẻ ở trên để hệ thống giữ máy tập nhé!',
            'message_type'   => RoomHistoryChat::TYPE_TEXT,
            'status'         => RoomHistoryChat::STATUS_SENT,
            'is_seen'        => RoomHistoryChat::NOT_SEEN,
            'created_at'     => now()->subMinutes(3),
        ]);

        // 2. Tạo phòng chat Nhóm: "🔥 Nhóm Siết Cơ 30 Ngày - VF Center"
        $room2 = RoomClient::create([
            'uuid'            => (string) Str::uuid(),
            'type'            => RoomClient::TYPE_GROUP,
            'name'            => '🔥 Nhóm Siết Cơ 30 Ngày - VF Center',
            'avatar'          => 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
            'created_by'      => $client1->id,
            'last_message_at' => now()->subHours(1),
        ]);

        DetailRoomClient::create([
            'room_client_id' => $room2->id,
            'client_id'      => $client1->id,
            'role'           => 'admin',
            'is_pinned'      => true,
            'is_muted'       => false,
            'last_seen_at'   => now(),
        ]);

        DetailRoomClient::create([
            'room_client_id' => $room2->id,
            'client_id'      => $client2->id,
            'role'           => 'member',
            'is_pinned'      => false,
            'is_muted'       => false,
            'last_seen_at'   => now(),
        ]);

        if ($client3) {
            DetailRoomClient::create([
                'room_client_id' => $room2->id,
                'client_id'      => $client3->id,
                'role'           => 'member',
                'is_pinned'      => false,
                'is_muted'       => false,
                'last_seen_at'   => now(),
            ]);
        }

        RoomHistoryChat::create([
            'room_client_id' => $room2->id,
            'client_id'      => $client2->id,
            'message'        => 'Chào mừng mọi người đến với thử thách Siết Cơ 30 Ngày! 💪',
            'message_type'   => RoomHistoryChat::TYPE_TEXT,
            'status'         => RoomHistoryChat::STATUS_SENT,
            'is_seen'        => RoomHistoryChat::IS_SEEN,
            'created_at'     => now()->subHours(2),
        ]);

        RoomHistoryChat::create([
            'room_client_id' => $room2->id,
            'client_id'      => $client3 ? $client3->id : $client1->id,
            'message'        => 'Hôm nay mình đã hoàn thành bữa sáng 350 calo chuẩn menu rồi nhé cả nhà! 🥗',
            'message_type'   => RoomHistoryChat::TYPE_TEXT,
            'status'         => RoomHistoryChat::STATUS_SENT,
            'is_seen'        => RoomHistoryChat::IS_SEEN,
            'created_at'     => now()->subHours(1),
        ]);
    }
}
