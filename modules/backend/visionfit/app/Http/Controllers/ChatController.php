<?php

namespace App\Http\Controllers;

use App\Events\SentMessageEvent;
use App\Models\Client;
use App\Models\Trainer;
use App\Models\DetailRoomClient;
use App\Models\RoomClient;
use App\Models\RoomHistoryChat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Events\ChatUpdatedEvent;

class ChatController extends Controller
{
    // Chuẩn hóa danh tính: ID giống nhau nhưng loại khác nhau không phải cùng tài khoản.
    protected function identity(Request $request): array
    {
        $user = $request->user('sanctum');
        if (!$user instanceof Client && !$user instanceof Trainer) {
            abort(401, 'Bạn cần đăng nhập để sử dụng chức năng này');
        }
        return [$user, $user instanceof Trainer ? 'trainer' : 'client'];
    }

    protected function getRoomMembership($room, $idNguoiDung, $type = 'client')
    {
        return DetailRoomClient::where('room_client_id', $room->id)
            ->where('client_id', $idNguoiDung)
            ->where('participant_type', $type)
            ->first();
    }

    protected function findRoom(Request $request): ?RoomClient
    {
        if ($request->filled('room_uuid')) {
            return RoomClient::where('uuid', $request->input('room_uuid'))->first();
        }
        if ($request->filled('room_id')) {
            return RoomClient::find($request->input('room_id'));
        }
        return null;
    }

    protected function resolveRoom($id): ?RoomClient
    {
        return RoomClient::where('uuid', $id)->orWhere('id', $id)->first();
    }

    protected function publicPartner(DetailRoomClient $membership): array
    {
        $type = $membership->participant_type ?: 'client';
        $person = $type === 'trainer'
            ? Trainer::find($membership->client_id)
            : Client::find($membership->client_id);
        return [
            'id_nguoi_dung' => $membership->client_id,
            'loai_nguoi_dung' => $type,
            'ho_ten' => $person?->ho_ten ?? 'Người dùng VisionFit',
            'anh_dai_dien' => $type === 'trainer'
                ? ($person?->hinh_anh ?? null) : ($person?->anh_dai_dien ?? null),
            'vai_tro' => $type === 'trainer' ? 'HUAN_LUYEN_VIEN' : 'HOI_VIEN',
            'chuyen_mon' => $type === 'trainer' ? 'Huấn luyện viên cá nhân' : 'Hội viên',
            'online' => false,
        ];
    }

    protected function formatMessage(RoomHistoryChat $msg, int $viewerId, string $viewerType, int $partnerReadId = 0): array
    {
        $senderType = $msg->sender_type ?: 'client';
        $isMine = (int) $msg->client_id === $viewerId && $senderType === $viewerType;
        $recalled = $msg->status === RoomHistoryChat::STATUS_RECALLED;
        $reply = $msg->replyTo;
        $replyIsMine = $reply && (int) $reply->client_id === $viewerId
            && ($reply->sender_type ?: 'client') === $viewerType;
        $replyName = null;
        if ($reply) {
            if ($replyIsMine) {
                $replyName = 'Bạn';
            } elseif (($reply->sender_type ?: 'client') === 'trainer') {
                $replyName = Trainer::find($reply->client_id)?->ho_ten ?? 'Huấn luyện viên';
            } else {
                $replyName = Client::find($reply->client_id)?->ho_ten ?? 'Hội viên';
            }
        }
        return [
            'id' => $msg->id, 'id_tin_nhan' => $msg->id,
            'id_nguoi_gui' => $msg->client_id, 'sender_type' => $senderType,
            'isSent' => $isMine, 'loai_tin_nhan' => $msg->message_type,
            'noi_dung' => $recalled ? 'Tin nhắn đã được thu hồi' : $msg->message,
            'text' => $recalled ? 'Tin nhắn đã được thu hồi' : $msg->message,
            'media_url' => $recalled ? null : $msg->media_url,
            'workout' => $recalled ? null : $msg->workout_data,
            'id_tin_nhan_tra_loi' => $msg->reply_to_id,
            'tra_loi_noi_dung' => $reply ? ($reply->status === RoomHistoryChat::STATUS_RECALLED ? 'Tin nhắn đã được thu hồi' : $reply->message) : null,
            'tra_loi_nguoi_gui' => $replyName,
            'reactions' => $msg->reactions ?? [], 'trang_thai' => $msg->status,
            'thoi_gian_gui' => $msg->created_at?->format('H:i'),
            'timestamp' => $msg->created_at?->format('d/m/Y H:i'),
            'da_xem' => $isMine ? $partnerReadId >= $msg->id : true,
        ];
    }

    // Lấy danh sách cuộc trò chuyện của người dùng
    public function getListRooms(Request $request)
    {
        [$user, $type] = $this->identity($request);
        $memberships = DetailRoomClient::with(['room.lastMessage', 'room.members'])
            ->where('client_id', $user->id)
            ->where('participant_type', $type)
            ->get();
        $data = $memberships->map(function ($membership) use ($user, $type) {
            $room = $membership->room;
            if (!$room) return null;
            $isGroup = (int) $room->type === RoomClient::TYPE_GROUP;
            $other = $room->members->first(function ($m) use ($user, $type) {
                return !((int) $m->client_id === (int) $user->id
                    && ($m->participant_type ?: 'client') === $type);
            });
            $last = $room->lastMessage;
            $preview = 'Đã bắt đầu cuộc trò chuyện mới';
            if ($last) {
                if ($last->status === RoomHistoryChat::STATUS_RECALLED) $preview = 'Tin nhắn đã được thu hồi';
                elseif ($last->message_type === RoomHistoryChat::TYPE_IMAGE) $preview = '[Hình ảnh]';
                elseif ($last->message_type === RoomHistoryChat::TYPE_WORKOUT) $preview = '[Lịch tập]';
                else $preview = $last->message ?: 'Đã gửi một tin nhắn';
            }
            $unread = RoomHistoryChat::where('room_client_id', $room->id)
                ->where(function ($q) use ($user, $type) {
                    $q->where('client_id', '<>', $user->id)
                      ->orWhere('sender_type', '<>', $type);
                });
            if ($membership->last_read_message_id) {
                $unread->where('id', '>', $membership->last_read_message_id);
            }
            $unreadCount = $unread->count();
            return [
                'id_cuoc_tro_chuyen' => $room->id, 'room_uuid' => $room->uuid,
                'loai' => $isGroup ? 'NHOM' : 'TRUC_TIEP',
                'ten_nhom' => $room->name ?? 'Nhóm tập luyện VisionFit', 'anh_nhom' => $room->avatar,
                'doi_phuong' => !$isGroup && $other ? $this->publicPartner($other) : null,
                'thoi_gian_tin_nhan_cuoi' => $last?->created_at?->format('H:i') ?? 'Vừa xong',
                'noi_dung_cuoi' => $preview, 'so_tin_chua_doc' => $unreadCount,
                'ghim' => (bool) $membership->is_pinned,
                'da_tat_thong_bao' => (bool) $membership->is_muted,
                'da_xem' => $unreadCount === 0,
                'last_read_message_id' => $membership->last_read_message_id,
                'updated_at' => $room->last_message_at ?? $room->updated_at,
            ];
        })->filter()->sort(function ($a, $b) {
            if ($a['ghim'] !== $b['ghim']) return $b['ghim'] <=> $a['ghim'];
            return strtotime((string) $b['updated_at']) <=> strtotime((string) $a['updated_at']);
        })->values();
        return response()->json(['status' => true, 'data' => $data]);
    }

    public function getTrainerRooms(Request $request)
    {
        return $this->getListRooms($request);
    }

    // Lấy danh bạ HLV và Hội viên
    public function getContacts(Request $request)
    {
        [$user, $type] = $this->identity($request);
        $trainers = Trainer::query()->where('tinh_trang', 1)->get()->filter(fn ($item) => $type !== 'trainer' || $item->id !== $user->id)
            ->map(fn ($item) => [
                'id_nguoi_dung' => $item->id, 'loai_nguoi_dung' => 'trainer',
                'ho_ten' => $item->ho_ten, 'chuyen_mon' => $item->chuc_danh ?? 'Huấn luyện viên cá nhân',
                'anh_dai_dien' => $item->hinh_anh ?? null,
                'vai_tro' => 'HUAN_LUYEN_VIEN', 'online' => false,
            ])->values();
        $clients = Client::query()->where('is_block', 0)->get()->filter(fn ($item) => $type !== 'client' || $item->id !== $user->id)
            ->map(fn ($item) => [
                'id_nguoi_dung' => $item->id, 'loai_nguoi_dung' => 'client',
                'ho_ten' => $item->ho_ten, 'chuyen_mon' => 'Hội viên VisionFit',
                'anh_dai_dien' => $item->anh_dai_dien,
                'vai_tro' => 'HOI_VIEN', 'online' => false,
            ])->values();
        return response()->json([
            'status' => true,
            'data' => ['trainers' => $trainers, 'members' => $clients, 'all' => $trainers->concat($clients)->values()],
        ]);
    }

    public function getTrainerContacts(Request $request)
    {
        return $this->getContacts($request);
    }

    // Tìm hoặc tạo phòng chat 1-1
    public function getRoom($id, Request $request)
    {
        [$user, $type] = $this->identity($request);
        $targetType = $request->input('target_type', 'client');
        if (!in_array($targetType, ['client', 'trainer'], true)) {
            return response()->json(['status' => false, 'message' => 'Loại người nhận không hợp lệ'], 422);
        }
        if ($type === $targetType && (int) $user->id === (int) $id) {
            return response()->json(['status' => false, 'message' => 'Không thể chat với chính mình'], 422);
        }
        $target = $targetType === 'trainer' ? Trainer::find($id) : Client::find($id);
        if (!$target || ($targetType === 'client' && (int) $target->is_block === 1)) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy người nhận'], 404);
        }
        $existing = RoomClient::query()
            ->where('type', RoomClient::TYPE_SINGLE)
            ->whereHas('members', fn ($q) => $q->where('client_id', $user->id)->where('participant_type', $type))
            ->whereHas('members', fn ($q) => $q->where('client_id', $id)->where('participant_type', $targetType))
            ->has('members', '=', 2)->first();
        if ($existing) return response()->json(['status' => true, 'message' => 'Phòng đã tồn tại', 'data' => $existing]);
        $room = DB::transaction(function () use ($user, $type, $id, $targetType) {
            $room = RoomClient::create([
                'uuid' => (string) Str::uuid(), 'type' => RoomClient::TYPE_SINGLE,
                'created_by' => $user->id, 'created_by_type' => $type,
            ]);
            DetailRoomClient::create([
                'room_client_id' => $room->id, 'client_id' => $user->id,
                'participant_type' => $type, 'role' => 'member',
            ]);
            DetailRoomClient::create([
                'room_client_id' => $room->id, 'client_id' => $id,
                'participant_type' => $targetType, 'role' => 'member',
            ]);
            return $room;
        });
        return response()->json(['status' => true, 'message' => 'Tạo phòng thành công', 'data' => $room], 201);
    }

    public function getTrainerRoom($id, Request $request)
    {
        [$user, $type] = $this->identity($request);
        if ($type !== 'trainer') return response()->json(['status' => false, 'message' => 'Chỉ Trainer được truy cập'], 403);
        $request->merge(['target_type' => 'client']);
        return $this->getRoom($id, $request);
    }

    // Tạo nhóm chat mới
    public function createGroupRoom(Request $request)
    {
        [$actor, $actorType] = $this->identity($request);
        if ($actorType !== 'client') return response()->json(['status' => false, 'message' => 'Chức năng nhóm hiện hỗ trợ hội viên'], 403);
        $request->validate([
            'name' => 'required|string|max:255',
            'member_ids' => 'required|array|min:1',
        ]);

        $idNguoiDung = $request->user('sanctum')->id;

        $groupRoom = DB::transaction(function () use ($request, $idNguoiDung) {
            $room = RoomClient::create([
                'uuid' => (string) Str::uuid(),
                'type' => RoomClient::TYPE_GROUP,
                'name' => $request->name,
                'avatar' => $request->avatar,
                'created_by' => $idNguoiDung,
                'created_by_type' => 'client',
            ]);

            DetailRoomClient::create([
                'room_client_id' => $room->id,
                'client_id' => $idNguoiDung,
                'participant_type' => 'client',
                'role' => 'admin',
            ]);

            $memberIds = array_unique($request->member_ids);
            foreach ($memberIds as $memberId) {
                if ($memberId != $idNguoiDung) {
                    DetailRoomClient::firstOrCreate([
                        'room_client_id' => $room->id,
                        'client_id' => $memberId,
                        'participant_type' => 'client',
                    ], [
                        'role' => 'member',
                    ]);
                }
            }

            return $room;
        });

        return response()->json([
            'status' => true,
            'message' => 'Tạo nhóm chat thành công',
            'data' => $groupRoom,
        ], 201);
    }

    // Gửi tin nhắn mới trong phòng (Bảo vệ quyền thành viên)
    public function sentMessage(Request $request)
    {
        [$user, $type] = $this->identity($request);
        $request->validate([
            'room_uuid' => 'nullable|uuid', 'room_id' => 'nullable|integer',
            'message_type' => 'nullable|string', 'message' => 'nullable|string',
            'noi_dung' => 'nullable|string', 'reply_to_id' => 'nullable|integer',
            'id_tin_nhan_tra_loi' => 'nullable|integer',
        ]);
        $room = $this->findRoom($request);
        if (!$room) return response()->json(['status' => false, 'message' => 'Phòng chat không tồn tại'], 404);
        $membership = $this->getRoomMembership($room, $user->id, $type);
        if (!$membership) return response()->json(['status' => false, 'message' => 'Không có quyền gửi tin trong phòng này'], 403);
        $message = $request->input('message', $request->input('noi_dung'));
        $messageType = $request->input('message_type', $request->input('loai_tin_nhan', RoomHistoryChat::TYPE_TEXT));
        if (!in_array($messageType, [RoomHistoryChat::TYPE_TEXT, RoomHistoryChat::TYPE_IMAGE, RoomHistoryChat::TYPE_WORKOUT, RoomHistoryChat::TYPE_FILE], true)) {
            return response()->json(['status' => false, 'message' => 'Loại tin nhắn không hợp lệ'], 422);
        }
        if ($messageType === RoomHistoryChat::TYPE_TEXT && !is_string($message)) {
            return response()->json(['status' => false, 'message' => 'Thiếu nội dung tin nhắn'], 422);
        }
        if ($messageType === RoomHistoryChat::TYPE_TEXT && trim($message) === '') {
            return response()->json(['status' => false, 'message' => 'Tin nhắn rỗng'], 422);
        }
        $replyId = $request->input('id_tin_nhan_tra_loi', $request->input('reply_to_id'));
        if ($replyId && !RoomHistoryChat::where('id', $replyId)->where('room_client_id', $room->id)->exists()) {
            return response()->json(['status' => false, 'message' => 'Tin nhắn được trả lời không thuộc phòng này'], 422);
        }
        $chatMessage = DB::transaction(function () use ($request, $room, $user, $type, $membership, $message, $messageType, $replyId) {
            $msg = RoomHistoryChat::create([
                'room_client_id' => $room->id, 'client_id' => $user->id,
                'sender_type' => $type, 'message' => $message,
                'message_type' => $messageType,
                'media_url' => $request->input('media_url'),
                'workout_data' => $request->input('workout', $request->input('workout_data')),
                'reply_to_id' => $replyId, 'reactions' => [],
                'status' => RoomHistoryChat::STATUS_SENT, 'is_seen' => RoomHistoryChat::NOT_SEEN,
            ]);
            $membership->update(['last_read_message_id' => $msg->id, 'last_seen_at' => now()]);
            $room->update(['last_message_at' => now()]);
            return $msg;
        });
        $chatMessage->load('replyTo');
        $data = $this->formatMessage($chatMessage, (int) $user->id, $type);
        try {
            // Broadcast: mỗi thiết bị phải xác định isSent theo sender_type + id, không dùng nguyên isSent từ event.
            $broadcastData = $data;
            unset($broadcastData['isSent']); // isSent phụ thuộc người đang xem
            event(new SentMessageEvent($room->uuid, $broadcastData));
        } catch (\Throwable $e) {
            \Log::error('Chat broadcast failed', ['room_uuid' => $room->uuid, 'error' => $e->getMessage()]);
        }
        return response()->json(['status' => true, 'message' => 'Gửi tin nhắn thành công', 'data' => $data], 201);
    }

    public function sendTrainerMessage(Request $request)
    {
        [$user, $type] = $this->identity($request);
        if ($type !== 'trainer') return response()->json(['status' => false, 'message' => 'Chỉ Trainer được truy cập'], 403);
        return $this->sentMessage($request);
    }

    // Lấy lịch sử tin nhắn phòng chat (Phân trang 30 tin gần nhất + Phân quyền + Trạng thái đã xem riêng)
    public function historyMessage(Request $request)
    {
        [$user, $type] = $this->identity($request);
        $request->validate([
            'room_uuid' => 'nullable|uuid', 'room_id' => 'nullable|integer',
            'before_id' => 'nullable|integer|min:1', 'limit' => 'nullable|integer|min:1|max:100',
        ]);
        $room = $this->findRoom($request);
        if (!$room) return response()->json(['status' => false, 'message' => 'Phòng chat không tồn tại', 'data' => []], 404);
        $membership = $this->getRoomMembership($room, $user->id, $type);
        if (!$membership) return response()->json(['status' => false, 'message' => 'Không có quyền đọc phòng này', 'data' => []], 403);
        $limit = (int) $request->input('limit', 30);
        $beforeId = $request->input('before_id');
        if (!$beforeId) {
            $maxId = RoomHistoryChat::where('room_client_id', $room->id)->max('id');
            if ($maxId && $maxId > (int) $membership->last_read_message_id) {
                $membership->update(['last_read_message_id' => $maxId, 'last_seen_at' => now()]);
            }
        }
        $others = DetailRoomClient::where('room_client_id', $room->id)
            ->where(function ($q) use ($user, $type) {
                $q->where('client_id', '!=', $user->id)->orWhere('participant_type', '!=', $type);
            })->get();
        $partnerReadId = $others->count() === 1 ? (int) $others->first()->last_read_message_id : 0;
        $query = RoomHistoryChat::with('replyTo')->where('room_client_id', $room->id);
        if ($beforeId) $query->where('id', '<', $beforeId);
        $records = $query->orderByDesc('id')->limit($limit + 1)->get();
        $hasMore = $records->count() > $limit;
        if ($hasMore) $records->pop();
        $nextCursor = $records->last()?->id;
        $messages = $records->reverse()->values()->map(function ($msg) use ($user, $type, $room, $others, $partnerReadId) {
            $result = $this->formatMessage($msg, (int) $user->id, $type, $partnerReadId);
            if ((int) $room->type === RoomClient::TYPE_GROUP && $result['isSent']) {
                $result['da_xem'] = $others->contains(fn ($member) => (int) $member->last_read_message_id >= $msg->id);
            }
            return $result;
        });
        return response()->json(['status' => true, 'data' => $messages, 'pagination' => [
            'limit' => $limit, 'has_more' => $hasMore, 'next_cursor' => $nextCursor,
        ]]);
    }

    public function getTrainerHistory(Request $request)
    {
        [$user, $type] = $this->identity($request);
        if ($type !== 'trainer') return response()->json(['status' => false, 'message' => 'Chỉ Trainer được truy cập'], 403);
        return $this->historyMessage($request);
    }

    // Đánh dấu đã đọc vị trí tin nhắn của thành viên
    public function markAsRead(Request $request, $id)
    {
        [$actor, $actorType] = $this->identity($request);
        $idNguoiDung = $actor->id;

        $room = $this->resolveRoom($id);
        if (!$room) {
            return response()->json([
                'status' => false,
                'message' => 'Phòng chat không tồn tại',
            ], 404);
        }

        $membership = $this->getRoomMembership($room, $idNguoiDung, $actorType);
        if (!$membership) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không có quyền truy cập vào cuộc trò chuyện này',
            ], 403);
        }

        $request->validate([
            'message_id' => 'nullable|integer|min:1',
        ]);

        $maxMessageId = RoomHistoryChat::where(
            'room_client_id',
            $room->id
        )->max('id');

        $currentReadId = (int) ($membership->last_read_message_id ?? 0);

        if ($maxMessageId) {
            $requestedId = $request->filled('message_id')
                ? (int) $request->message_id
                : (int) $maxMessageId;

            if ($request->filled('message_id')) {
                $exists = RoomHistoryChat::where('room_client_id', $room->id)
                    ->where('id', $requestedId)
                    ->exists();

                if (!$exists) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Tin nhắn không thuộc phòng này',
                    ], 422);
                }
            }

            $targetMessageId = max($currentReadId, $requestedId);

            if ($targetMessageId > $currentReadId) {
                $membership->update([
                    'last_read_message_id' => $targetMessageId,
                    'last_seen_at' => now(),
                ]);

                try {
                    event(new ChatUpdatedEvent(
                        $room->uuid,
                        'message.read',
                        [
                            'user_id' => $idNguoiDung, 'user_type' => $actorType,
                            'last_read_message_id' => $targetMessageId,
                        ]
                    ));
                } catch (\Throwable $e) {
                    \Log::error('Read receipt broadcast failed', [
                        'room_uuid' => $room->uuid,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } else {
            $targetMessageId = $currentReadId ?: null;
        }

        return response()->json([
            'status' => true,
            'message' => 'Đã đánh dấu đã đọc',
            'last_read_message_id' => $targetMessageId,
        ]);
    }

    // Thu hồi tin nhắn (Phân quyền: chỉ thu hồi tin do chính mình gửi)
    public function recallMessage(Request $request, $id)
    {
        [$actor, $actorType] = $this->identity($request);
        $idNguoiDung = $actor->id;

        $msg = RoomHistoryChat::find($id);

        if (!$msg) {
            return response()->json([
                'status' => false,
                'message' => 'Tin nhắn không tồn tại',
            ], 404);
        }

        // Kiểm tra quyền: chỉ thu hồi tin của chính mình
        if ((int) $msg->client_id !== (int) $idNguoiDung || ($msg->sender_type ?: 'client') !== $actorType) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chỉ có thể thu hồi tin nhắn của chính mình',
            ], 403);
        }

        $roomForRecall = RoomClient::find($msg->room_client_id);
        if (!$roomForRecall || !$this->getRoomMembership($roomForRecall, $idNguoiDung, $actorType)) {
            return response()->json(['status' => false, 'message' => 'Không thuộc phòng chat này'], 403);
        }
        $msg->update([
            'status' => RoomHistoryChat::STATUS_RECALLED,
            'message' => 'Tin nhắn đã được thu hồi',
            'media_url' => null,
            'workout_data' => null,
        ]);
        $room = RoomClient::findOrFail($msg->room_client_id);

        try {
            event(new ChatUpdatedEvent(
                $room->uuid,
                'message.recalled',
                [
                    'message_id' => $msg->id,
                ]
            ));
        } catch (\Throwable $e) {
            \Log::error('Recall broadcast failed', [
                'message_id' => $msg->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Thu hồi tin nhắn thành công',
            'data' => $msg,
        ]);
    }

    // Thả hoặc gỡ cảm xúc Emoji trên tin nhắn (Kiểm tra quyền thành viên)
    public function reactMessage(Request $request, $id)
    {
        $request->validate([
            'emoji' => 'required|string',
        ]);

        [$actor, $actorType] = $this->identity($request);
        $idNguoiDung = $actor->id;

        $msg = RoomHistoryChat::find($id);

        if (!$msg) {
            return response()->json([
                'status' => false,
                'message' => 'Tin nhắn không tồn tại',
            ], 404);
        }

        $room = RoomClient::find($msg->room_client_id);
        if (!$room || !$this->getRoomMembership($room, $idNguoiDung, $actorType)) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không thuộc phòng chat này',
            ], 403);
        }

        $reactions = $msg->reactions ?? [];

        if (in_array($request->emoji, $reactions)) {
            $reactions = array_values(array_filter($reactions, fn($r) => $r !== $request->emoji));
        } else {
            $reactions[] = $request->emoji;
        }

        $msg->update(['reactions' => $reactions]);
        try {
            event(new ChatUpdatedEvent(
                $room->uuid,
                'message.reacted',
                [
                    'message_id' => $msg->id,
                    'reactions' => $reactions,
                ]
            ));
        } catch (\Throwable $e) {
            \Log::error('Reaction broadcast failed', [
                'message_id' => $msg->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Cập nhật cảm xúc thành công',
            'reactions' => $reactions,
        ]);
    }

    // Ghim / Bỏ ghim cuộc trò chuyện
    public function togglePinRoom(Request $request, $id)
    {
        [$actor, $actorType] = $this->identity($request);
        $idNguoiDung = $actor->id;

        $room = $this->resolveRoom($id);
        if (!$room) {
            return response()->json([
                'status' => false,
                'message' => 'Phòng chat không tồn tại'
            ], 404);
        }

        $detail = DetailRoomClient::where('room_client_id', $room->id)
            ->where('client_id', $idNguoiDung)
            ->where('participant_type', $actorType)
            ->first();

        if (!$detail) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không thuộc phòng chat này'
            ], 403);
        }

        $newPinned = !$detail->is_pinned;
        $detail->update(['is_pinned' => $newPinned]);

        return response()->json([
            'status' => true,
            'message' => $newPinned ? 'Đã ghim cuộc trò chuyện' : 'Đã bỏ ghim cuộc trò chuyện',
            'is_pinned' => $newPinned,
        ]);
    }

    // Tắt / Bật thông báo cuộc trò chuyện
    public function toggleMuteRoom(Request $request, $id)
    {
        [$actor, $actorType] = $this->identity($request);
        $idNguoiDung = $actor->id;

        $room = $this->resolveRoom($id);
        if (!$room) {
            return response()->json([
                'status' => false,
                'message' => 'Phòng chat không tồn tại'
            ], 404);
        }

        $detail = DetailRoomClient::where('room_client_id', $room->id)
            ->where('client_id', $idNguoiDung)
            ->where('participant_type', $actorType)
            ->first();

        if (!$detail) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không thuộc phòng chat này'
            ], 403);
        }

        $newMuted = !$detail->is_muted;
        $detail->update(['is_muted' => $newMuted]);

        return response()->json([
            'status' => true,
            'message' => $newMuted ? 'Đã tắt thông báo cuộc trò chuyện' : 'Đã bật thông báo cuộc trò chuyện',
            'is_muted' => $newMuted,
        ]);
    }

    // Tải lên file phương tiện chat
    public function uploadMedia(Request $request)
    {
        $request->validate([
            'file' => 'nullable|file|mimes:jpg,jpeg,png,webp,mp4,mov|max:20480',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,webp,mp4,mov|max:20480',
        ]);

        $file = $request->file('file') ?? $request->file('media');

        if ($file) {
            $path = $file->store('chat', 'public');
            $url = $request->getSchemeAndHttpHost() . Storage::url($path);

            return response()->json([
                'status' => true,
                'message' => 'Tải lên thành công',
                'url' => $url,
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không tìm thấy file để tải lên',
        ], 400);
    }
}
