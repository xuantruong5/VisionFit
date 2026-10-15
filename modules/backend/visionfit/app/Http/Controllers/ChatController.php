<?php

namespace App\Http\Controllers;

use App\Events\SentMessageEvent;
use App\Models\Client;
use App\Models\DetailRoomClient;
use App\Models\RoomClient;
use App\Models\RoomHistoryChat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    // Kiểm tra quyền thành viên trong phòng chat
    protected function getRoomMembership($room, $idNguoiDung)
    {
        return DetailRoomClient::where('room_client_id', $room->id)
            ->where('client_id', $idNguoiDung)
            ->first();
    }

    // Lấy danh sách cuộc trò chuyện của người dùng
    public function getListRooms(Request $request)
    {
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $userRooms = DetailRoomClient::with([
            'room.lastMessage',
            'room.members.client:id,ho_ten,anh_dai_dien'
        ])
            ->where('client_id', $idNguoiDung)
            ->get();

        $data = $userRooms->map(function ($detail) use ($idNguoiDung) {
            $room = $detail->room;
            if (!$room) {
                return null;
            }

            $isGroup = $room->type == RoomClient::TYPE_GROUP;

            $partner = null;
            if (!$isGroup) {
                $otherMember = $room->members->firstWhere('client_id', '!=', $idNguoiDung);
                $partnerClient = $otherMember?->client;

                if ($partnerClient) {
                    $isTrainer = DB::table('trainers')
                        ->where('ho_ten', $partnerClient->ho_ten)
                        ->exists();

                    $partner = [
                        'id_nguoi_dung' => $partnerClient->id,
                        'ho_ten' => $partnerClient->ho_ten ?? 'Hội viên VisionFit',
                        'anh_dai_dien' => $partnerClient->anh_dai_dien,
                        'vai_tro' => $isTrainer ? 'HUAN_LUYEN_VIEN' : 'HOI_VIEN',
                        'chuyen_mon' => $isTrainer ? 'Huấn luyện viên cá nhân' : 'Hội viên',
                        'online' => true,
                    ];
                }
            }

            $lastMsg = $room->lastMessage;
            $noiDungCuoi = 'Đã bắt đầu cuộc trò chuyện mới';
            $thoiGianCuoi = 'Vừa xong';

            if ($lastMsg) {
                if ($lastMsg->status === RoomHistoryChat::STATUS_RECALLED) {
                    $noiDungCuoi = 'Tin nhắn đã được thu hồi';
                } elseif ($lastMsg->message_type === RoomHistoryChat::TYPE_IMAGE) {
                    $noiDungCuoi = '[Hình ảnh]';
                } elseif ($lastMsg->message_type === RoomHistoryChat::TYPE_WORKOUT) {
                    $workout = $lastMsg->workout_data;
                    $tenBai = is_array($workout) ? ($workout['ten_bai_tap'] ?? 'Lịch tập') : 'Lịch tập VisionFit';
                    $noiDungCuoi = 'Đề xuất lịch tập: ' . $tenBai;
                } else {
                    $noiDungCuoi = $lastMsg->message ?: 'Đã gửi một tin nhắn';
                }

                $diffDays = now()->diffInDays($lastMsg->created_at);
                if ($diffDays == 0) {
                    $thoiGianCuoi = $lastMsg->created_at->format('H:i');
                } elseif ($diffDays == 1) {
                    $thoiGianCuoi = 'Hôm qua';
                } else {
                    $thoiGianCuoi = $lastMsg->created_at->format('d/m');
                }
            }

            // Tính số tin chưa đọc dựa trên vị trí đọc riêng của người dùng
            $unreadQuery = RoomHistoryChat::where('room_client_id', $room->id)
                ->where('client_id', '!=', $idNguoiDung);

            if ($detail->last_read_message_id) {
                $unreadQuery->where('id', '>', $detail->last_read_message_id);
            }

            $soTinChuaDoc = $unreadQuery->count();

            return [
                'id_cuoc_tro_chuyen' => $room->id,
                'room_uuid' => $room->uuid,
                'loai' => $isGroup ? 'NHOM' : 'TRUC_TIEP',
                'ten_nhom' => $room->name ?? 'Nhóm tập luyện VisionFit',
                'anh_nhom' => $room->avatar,
                'doi_phuong' => $partner,
                'thoi_gian_tin_nhan_cuoi' => $thoiGianCuoi,
                'noi_dung_cuoi' => $noiDungCuoi,
                'so_tin_chua_doc' => $soTinChuaDoc,
                'ghim' => (bool)$detail->is_pinned,
                'da_tat_thong_bao' => (bool)$detail->is_muted,
                'da_xem' => $soTinChuaDoc === 0,
                'last_read_message_id' => $detail->last_read_message_id,
                'updated_at' => $room->last_message_at ?? $room->updated_at,
            ];
        })
            ->filter()
            ->values()
            ->sort(function ($a, $b) {
                if ($a['ghim'] !== $b['ghim']) {
                    return $b['ghim'] <=> $a['ghim'];
                }
                return strtotime($b['updated_at']) <=> strtotime($a['updated_at']);
            })
            ->values();

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    // Lấy danh bạ HLV và Hội viên
    public function getContacts(Request $request)
    {
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $trainers = DB::table('trainers')
            ->select('id', 'ho_ten', 'chuc_danh as chuyen_mon', 'hinh_anh as anh_dai_dien')
            ->where('tinh_trang', 1)
            ->get()
            ->map(function ($item) {
                return [
                    'id_nguoi_dung' => $item->id,
                    'ho_ten' => $item->ho_ten ?? 'HLV VisionFit',
                    'chuyen_mon' => $item->chuyen_mon ?? 'Huấn luyện viên cá nhân PT',
                    'anh_dai_dien' => $item->anh_dai_dien,
                    'vai_tro' => 'HUAN_LUYEN_VIEN',
                    'online' => true,
                ];
            });

        $clients = Client::where('id', '!=', $idNguoiDung)
            ->where('is_block', 0)
            ->get()
            ->map(function ($item) {
                return [
                    'id_nguoi_dung' => $item->id,
                    'ho_ten' => $item->ho_ten ?? 'Hội viên',
                    'chuyen_mon' => $item->muc_tieu_hien_tai ? 'Mục tiêu: ' . $item->muc_tieu_hien_tai : 'Hội viên VisionFit',
                    'anh_dai_dien' => $item->anh_dai_dien,
                    'vai_tro' => 'HOI_VIEN',
                    'online' => false,
                ];
            });

        return response()->json([
            'status' => true,
            'data' => [
                'trainers' => $trainers,
                'members' => $clients,
                'all' => $trainers->concat($clients)->values(),
            ]
        ]);
    }

    // Tìm hoặc tạo phòng chat 1-1
    public function getRoom($id, Request $request)
    {
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $userRoomIds = DetailRoomClient::where('client_id', $idNguoiDung)->pluck('room_client_id');
        $targetRoomIds = DetailRoomClient::where('client_id', $id)->pluck('room_client_id');
        $commonRoomIds = $userRoomIds->intersect($targetRoomIds);

        if ($commonRoomIds->isNotEmpty()) {
            $checkRoom = RoomClient::whereIn('id', $commonRoomIds)
                ->where('type', RoomClient::TYPE_SINGLE)
                ->first();

            if ($checkRoom) {
                return response()->json([
                    'status' => true,
                    'message' => 'Phòng đã tồn tại',
                    'data' => $checkRoom,
                ]);
            }
        }

        $room = DB::transaction(function () use ($idNguoiDung, $id) {
            $dataRoom = RoomClient::create([
                'uuid' => (string) Str::uuid(),
                'type' => RoomClient::TYPE_SINGLE,
                'created_by' => $idNguoiDung,
            ]);

            DetailRoomClient::firstOrCreate([
                'room_client_id' => $dataRoom->id,
                'client_id' => $idNguoiDung,
            ], [
                'role' => 'member',
            ]);

            DetailRoomClient::firstOrCreate([
                'room_client_id' => $dataRoom->id,
                'client_id' => $id,
            ], [
                'role' => 'member',
            ]);

            return $dataRoom;
        });

        return response()->json([
            'status' => true,
            'message' => 'Tạo phòng thành công',
            'data' => $room,
        ], 201);
    }

    // Tạo nhóm chat mới
    public function createGroupRoom(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'member_ids' => 'required|array|min:1',
        ]);

        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $groupRoom = DB::transaction(function () use ($request, $idNguoiDung) {
            $room = RoomClient::create([
                'uuid' => (string) Str::uuid(),
                'type' => RoomClient::TYPE_GROUP,
                'name' => $request->name,
                'avatar' => $request->avatar,
                'created_by' => $idNguoiDung,
            ]);

            DetailRoomClient::create([
                'room_client_id' => $room->id,
                'client_id' => $idNguoiDung,
                'role' => 'admin',
            ]);

            $memberIds = array_unique($request->member_ids);
            foreach ($memberIds as $memberId) {
                if ($memberId != $idNguoiDung) {
                    DetailRoomClient::firstOrCreate([
                        'room_client_id' => $room->id,
                        'client_id' => $memberId,
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
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $room = RoomClient::where('uuid', $request->room_uuid)
            ->orWhere('id', $request->room_id)
            ->first();

        if (!$room) {
            return response()->json([
                'status' => false,
                'message' => 'Phòng chat không tồn tại',
            ], 404);
        }

        // Kiểm tra quyền thành viên phòng chat
        $membership = $this->getRoomMembership($room, $idNguoiDung);
        if (!$membership) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này',
            ], 403);
        }

        $chatMessage = DB::transaction(function () use ($request, $room, $idNguoiDung, $membership) {
            $msg = RoomHistoryChat::create([
                'room_client_id' => $room->id,
                'client_id' => $idNguoiDung,
                'message' => $request->message ?? $request->noi_dung,
                'message_type' => $request->message_type ?? $request->loai_tin_nhan ?? RoomHistoryChat::TYPE_TEXT,
                'media_url' => $request->media_url,
                'workout_data' => $request->workout ?? $request->workout_data,
                'reply_to_id' => $request->id_tin_nhan_tra_loi ?? $request->reply_to_id,
                'reactions' => [],
                'status' => RoomHistoryChat::STATUS_SENT,
                'is_seen' => RoomHistoryChat::NOT_SEEN,
            ]);

            // Cập nhật vị trí đọc của chính người gửi và thời gian tin nhắn phòng
            $membership->update([
                'last_read_message_id' => $msg->id,
                'last_seen_at' => now(),
            ]);

            $room->update(['last_message_at' => now()]);

            return $msg;
        });

        $replyMessage = $chatMessage->reply_to_id
            ? RoomHistoryChat::with('sender:id,ho_ten')->find($chatMessage->reply_to_id)
            : null;

        $data = [
            'id' => $chatMessage->id,
            'id_tin_nhan' => $chatMessage->id,
            'id_nguoi_gui' => $idNguoiDung,
            'isSent' => true,
            'loai_tin_nhan' => $chatMessage->message_type,
            'noi_dung' => $chatMessage->message,
            'text' => $chatMessage->message,
            'media_url' => $chatMessage->media_url,
            'workout' => $chatMessage->workout_data,
            'id_tin_nhan_tra_loi' => $chatMessage->reply_to_id,
            'tra_loi_noi_dung' => $replyMessage?->message,
            'tra_loi_nguoi_gui' => $replyMessage?->sender?->ho_ten ?? ($replyMessage?->client_id == $idNguoiDung ? 'Bạn' : 'Người dùng'),
            'reactions' => [],
            'trang_thai' => $chatMessage->status,
            'thoi_gian_gui' => $chatMessage->created_at->format('H:i'),
            'timestamp' => $chatMessage->created_at->format('d/m/Y H:i'),
            'da_xem' => false,
        ];

        // Kích hoạt broadcast event cho realtime
        try {
            event(new SentMessageEvent($room->uuid, $data));
        } catch (\Exception $e) {
        }

        return response()->json([
            'status' => true,
            'message' => 'Gửi tin nhắn thành công',
            'data' => $data,
        ], 201);
    }

    // Lấy lịch sử tin nhắn phòng chat (Phân trang 30 tin gần nhất + Phân quyền + Trạng thái đã xem riêng)
    public function historyMessage(Request $request)
    {
        $idNguoiDung = $request->id_nguoi_dung ?? 1;
        $limit = min((int)($request->limit ?? 30), 100);
        $beforeId = $request->before_id;

        $room = RoomClient::where('uuid', $request->room_uuid)
            ->orWhere('id', $request->room_id)
            ->first();

        if (!$room) {
            return response()->json([
                'status' => false,
                'message' => 'Phòng chat không tồn tại',
                'data' => [],
            ], 404);
        }

        // Kiểm tra quyền truy cập phòng chat
        $membership = $this->getRoomMembership($room, $idNguoiDung);
        if (!$membership) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không có quyền truy cập vào cuộc trò chuyện này',
                'data' => [],
            ], 403);
        }

        // Cập nhật vị trí đọc của người dùng khi mở phòng (không phải tải trang cũ)
        if (!$beforeId) {
            $maxRoomMsgId = RoomHistoryChat::where('room_client_id', $room->id)->max('id');
            if ($maxRoomMsgId && ($membership->last_read_message_id < $maxRoomMsgId)) {
                $membership->update([
                    'last_read_message_id' => $maxRoomMsgId,
                    'last_seen_at' => now(),
                ]);
            }
        }

        // Lấy thông tin vị trí đọc của đối phương (đối với chat 1-1) để tính chính xác cờ `da_xem`
        $isGroup = $room->type == RoomClient::TYPE_GROUP;
        $partnerLastReadId = 0;

        if (!$isGroup) {
            $partnerDetail = DetailRoomClient::where('room_client_id', $room->id)
                ->where('client_id', '!=', $idNguoiDung)
                ->first();
            $partnerLastReadId = $partnerDetail?->last_read_message_id ?? 0;
        }

        // Truy vấn phân trang 30 tin gần nhất (tối ưu hóa qua index idx_room_msg_pagination)
        $query = RoomHistoryChat::with(['sender:id,ho_ten,anh_dai_dien', 'replyTo.sender:id,ho_ten'])
            ->where('room_client_id', $room->id);

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $rawMessages = $query->orderBy('id', 'desc')
            ->limit($limit + 1)
            ->get();

        $hasMore = $rawMessages->count() > $limit;
        if ($hasMore) {
            $rawMessages->pop();
        }

        $nextCursor = $rawMessages->last()?->id;

        // Đảo lại thứ tự tăng dần theo thời gian hiển thị trong UI chat
        $data = $rawMessages->reverse()->values()->map(function ($msg) use ($idNguoiDung, $isGroup, $partnerLastReadId, $room) {
            $isSender = $msg->client_id == $idNguoiDung;
            $isRecalled = $msg->status === RoomHistoryChat::STATUS_RECALLED;

            // Tính cờ đã xem riêng biệt
            if ($isGroup) {
                $isSeen = DetailRoomClient::where('room_client_id', $room->id)
                    ->where('client_id', '!=', $msg->client_id)
                    ->where('last_read_message_id', '>=', $msg->id)
                    ->exists();
            } else {
                $isSeen = $isSender ? ($partnerLastReadId >= $msg->id) : true;
            }

            return [
                'id' => $msg->id,
                'id_tin_nhan' => $msg->id,
                'id_nguoi_gui' => $msg->client_id,
                'isSent' => $isSender,
                'loai_tin_nhan' => $msg->message_type,
                'noi_dung' => $isRecalled ? 'Tin nhắn đã được thu hồi' : $msg->message,
                'text' => $isRecalled ? 'Tin nhắn đã được thu hồi' : $msg->message,
                'media_url' => $isRecalled ? null : $msg->media_url,
                'workout' => $isRecalled ? null : $msg->workout_data,
                'id_tin_nhan_tra_loi' => $msg->reply_to_id,
                'tra_loi_noi_dung' => $msg->replyTo ? ($msg->replyTo->status === RoomHistoryChat::STATUS_RECALLED ? 'Tin nhắn đã được thu hồi' : $msg->replyTo->message) : null,
                'tra_loi_nguoi_gui' => $msg->replyTo ? ($msg->replyTo->client_id == $idNguoiDung ? 'Bạn' : ($msg->replyTo->sender?->ho_ten ?? 'Người dùng')) : null,
                'reactions' => $msg->reactions ?? [],
                'trang_thai' => $msg->status,
                'thoi_gian_gui' => $msg->created_at->format('H:i'),
                'timestamp' => $msg->created_at->format('d/m/Y H:i'),
                'da_xem' => (bool)$isSeen,
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $data,
            'pagination' => [
                'limit' => $limit,
                'has_more' => $hasMore,
                'next_cursor' => $nextCursor,
            ]
        ]);
    }

    // Đánh dấu đã đọc vị trí tin nhắn của thành viên
    public function markAsRead(Request $request, $id)
    {
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $room = RoomClient::where('uuid', $id)->orWhere('id', $id)->first();
        if (!$room) {
            return response()->json([
                'status' => false,
                'message' => 'Phòng chat không tồn tại',
            ], 404);
        }

        $membership = $this->getRoomMembership($room, $idNguoiDung);
        if (!$membership) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không có quyền truy cập vào cuộc trò chuyện này',
            ], 403);
        }

        $targetMessageId = $request->message_id ?? RoomHistoryChat::where('room_client_id', $room->id)->max('id');

        if ($targetMessageId) {
            $membership->update([
                'last_read_message_id' => $targetMessageId,
                'last_seen_at' => now(),
            ]);
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
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $msg = RoomHistoryChat::find($id);

        if (!$msg) {
            return response()->json([
                'status' => false,
                'message' => 'Tin nhắn không tồn tại',
            ], 404);
        }

        // Kiểm tra quyền: chỉ thu hồi tin của chính mình
        if ($msg->client_id != $idNguoiDung) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chỉ có thể thu hồi tin nhắn của chính mình',
            ], 403);
        }

        $msg->update([
            'status' => RoomHistoryChat::STATUS_RECALLED,
            'message' => 'Tin nhắn đã được thu hồi',
            'media_url' => null,
            'workout_data' => null,
        ]);

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

        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $msg = RoomHistoryChat::find($id);

        if (!$msg) {
            return response()->json([
                'status' => false,
                'message' => 'Tin nhắn không tồn tại',
            ], 404);
        }

        $room = RoomClient::find($msg->room_client_id);
        if (!$room || !$this->getRoomMembership($room, $idNguoiDung)) {
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

        return response()->json([
            'status' => true,
            'message' => 'Cập nhật cảm xúc thành công',
            'reactions' => $reactions,
        ]);
    }

    // Ghim / Bỏ ghim cuộc trò chuyện
    public function togglePinRoom(Request $request, $id)
    {
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $room = RoomClient::where('uuid', $id)->orWhere('id', $id)->first();
        if (!$room) {
            return response()->json([
                'status' => false,
                'message' => 'Phòng chat không tồn tại'
            ], 404);
        }

        $detail = DetailRoomClient::where('room_client_id', $room->id)
            ->where('client_id', $idNguoiDung)
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
        $idNguoiDung = $request->id_nguoi_dung ?? 1;

        $room = RoomClient::where('uuid', $id)->orWhere('id', $id)->first();
        if (!$room) {
            return response()->json([
                'status' => false,
                'message' => 'Phòng chat không tồn tại'
            ], 404);
        }

        $detail = DetailRoomClient::where('room_client_id', $room->id)
            ->where('client_id', $idNguoiDung)
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
