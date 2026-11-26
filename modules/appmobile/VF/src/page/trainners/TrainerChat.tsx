import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { TRAINER_COLORS as COLORS, TRAINER_SHADOWS as SHADOWS } from '../../general/theme';
import apiFitlife, { BASE_URL } from '../../general/api';

// Dữ liệu huấn luyện viên hiện tại
const CURRENT_TRAINER = {
  id_nguoi_dung: 99,
  ho_ten: 'HLV VisionFit',
  anh_dai_dien: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  vai_tro: 'HUAN_LUYEN_VIEN',
  online: true,
};

// Dữ liệu mẫu ban đầu (Fallback Mock Data khi chưa có dữ liệu từ Backend)
const INITIAL_ROOMS = [
  {
    id_cuoc_tro_chuyen: 101,
    room_uuid: 'room-pt-001',
    loai: 'TRUC_TIEP',
    doi_phuong: {
      id_nguoi_dung: 1,
      ho_ten: 'Nguyễn Văn An',
      anh_dai_dien: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      vai_tro: 'HOI_VIEN',
      chuyen_mon: 'Mục tiêu: Giảm cân',
      online: true,
    },
    thoi_gian_tin_nhan_cuoi: '09:15',
    noi_dung_cuoi: 'Thầy ơi, hôm nay em tập theo giáo án ngực hay chân ạ?',
    so_tin_chua_doc: 3,
    ghim: true,
    da_tat_thong_bao: false,
    da_xem: false,
    updated_at: new Date().toISOString(),
  },
  {
    id_cuoc_tro_chuyen: 102,
    room_uuid: 'room-pt-002',
    loai: 'TRUC_TIEP',
    doi_phuong: {
      id_nguoi_dung: 2,
      ho_ten: 'Trần Minh Anh',
      anh_dai_dien: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      vai_tro: 'HOI_VIEN',
      chuyen_mon: 'Mục tiêu: Tăng cơ',
      online: true,
    },
    thoi_gian_tin_nhan_cuoi: '08:45',
    noi_dung_cuoi: 'Đề xuất lịch tập: Cardio HIIT Đốt mỡ (15 phút)',
    so_tin_chua_doc: 0,
    ghim: false,
    da_tat_thong_bao: false,
    da_xem: true,
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id_cuoc_tro_chuyen: 103,
    room_uuid: 'room-group-001',
    loai: 'NHOM',
    ten_nhom: 'Nhóm PT - Thử Thách 30 Ngày Tăng Cơ',
    anh_nhom: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
    doi_phuong: null,
    thoi_gian_tin_nhan_cuoi: 'Hôm qua',
    noi_dung_cuoi: 'Lê Hoàng Nam: Em đã hoàn thành buổi tập kháng lực chiều nay!',
    so_tin_chua_doc: 5,
    ghim: true,
    da_tat_thong_bao: false,
    da_xem: false,
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id_cuoc_tro_chuyen: 104,
    room_uuid: 'room-pt-003',
    loai: 'TRUC_TIEP',
    doi_phuong: {
      id_nguoi_dung: 3,
      ho_ten: 'Lê Hoàng Nam',
      anh_dai_dien: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      vai_tro: 'HOI_VIEN',
      chuyen_mon: 'Mục tiêu: Duy trì',
      online: false,
    },
    thoi_gian_tin_nhan_cuoi: 'Hôm qua',
    noi_dung_cuoi: '[Hình ảnh] Bữa ăn dinh dưỡng sáng nay của em',
    so_tin_chua_doc: 1,
    ghim: false,
    da_tat_thong_bao: false,
    da_xem: false,
    updated_at: new Date(Date.now() - 90000000).toISOString(),
  },
  {
    id_cuoc_tro_chuyen: 105,
    room_uuid: 'room-pt-004',
    loai: 'TRUC_TIEP',
    doi_phuong: {
      id_nguoi_dung: 4,
      ho_ten: 'Phạm Thu Hà',
      anh_dai_dien: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
      vai_tro: 'HOI_VIEN',
      chuyen_mon: 'Mục tiêu: Giảm cân',
      online: true,
    },
    thoi_gian_tin_nhan_cuoi: '03/11',
    noi_dung_cuoi: 'Dạ vâng, thứ 2 tuần tới em qua phòng tập đúng giờ ạ.',
    so_tin_chua_doc: 0,
    ghim: false,
    da_tat_thong_bao: false,
    da_xem: true,
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const FILTERS = ['Tất cả', 'Chưa đọc', 'Học viên PT', 'Nhóm tập'];

const getImageUrl = (url: string | null) => {
  if (!url) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url}`;
};

const TrainerChat = ({ navigation }: any) => {
  const [conversations, setConversations] = useState<any[]>(INITIAL_ROOMS);
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [selectedRoomOptions, setSelectedRoomOptions] = useState<any>(null);

  // 1. Tải danh sách phòng chat từ Backend
  const fetchRooms = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await apiFitlife.get('/chat/rooms');
      if (res.data && res.data.status && Array.isArray(res.data.data)) {
        if (res.data.data.length > 0) {
          setConversations(res.data.data);
        }
      }
    } catch (error) {
      console.log('Error fetching chat rooms from backend, using current list:', error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 2. Tải danh bạ học viên từ Backend
  const fetchContacts = useCallback(async () => {
    try {
      const res = await apiFitlife.get('/chat/contacts');
      if (res.data && res.data.status && res.data.data) {
        const memberList = res.data.data.members || res.data.data.all || [];
        setContacts(memberList);
      }
    } catch (error) {
      console.log('Error fetching contacts from backend:', error);
    }
  }, []);

  useEffect(() => {
    fetchRooms(true);
    fetchContacts();

    // Polling định kỳ mỗi 4s để cập nhật tin nhắn và trạng thái thời gian thực
    const interval = setInterval(() => {
      fetchRooms(false);
    }, 4000);

    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchRooms(false);
    });

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [fetchRooms, fetchContacts, navigation]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRooms(false);
    fetchContacts();
  };

  // Tính toán số liệu thống kê cho Header (phong cách Members.tsx)
  const headerStats = useMemo(() => {
    const totalUnread = conversations.reduce((acc, curr) => acc + (curr.so_tin_chua_doc || 0), 0);
    const onlineCount = conversations.filter(
      (c) => c.loai === 'TRUC_TIEP' && c.doi_phuong?.online
    ).length;
    const total = conversations.length;

    return [
      { value: `${totalUnread}`, label: 'Tin chưa đọc' },
      { value: `${onlineCount}`, label: 'Đang online' },
      { value: `${total}`, label: 'Hội thoại' },
    ];
  }, [conversations]);

  // Lọc danh sách hội thoại
  const keyword = search.trim().toLowerCase();
  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      const isGroup = item.loai === 'NHOM';
      const name = isGroup ? item.ten_nhom : item.doi_phuong?.ho_ten;
      const lastMsg = item.noi_dung_cuoi || '';

      const matchSearch =
        (name || '').toLowerCase().includes(keyword) ||
        lastMsg.toLowerCase().includes(keyword);

      if (!matchSearch) return false;

      if (activeFilter === 'Chưa đọc') {
        return (item.so_tin_chua_doc || 0) > 0;
      }
      if (activeFilter === 'Học viên PT') {
        return item.loai === 'TRUC_TIEP';
      }
      if (activeFilter === 'Nhóm tập') {
        return item.loai === 'NHOM';
      }

      return true;
    });
  }, [conversations, keyword, activeFilter]);

  // Mở phòng chat
  const handleOpenRoom = (room: any) => {
    // Đánh dấu đã đọc trên giao diện ngay lập tức
    setConversations((prev) =>
      prev.map((c) =>
        c.id_cuoc_tro_chuyen === room.id_cuoc_tro_chuyen
          ? { ...c, so_tin_chua_doc: 0, da_xem: true }
          : c
      )
    );

    // Gửi yêu cầu markAsRead lên backend
    if (room.room_uuid || room.id_cuoc_tro_chuyen) {
      apiFitlife.post(`/chat/room/${room.room_uuid || room.id_cuoc_tro_chuyen}/read`).catch(() => {});
    }

    navigation?.navigate('ChatRoom', {
      conversation: room,
      currentUser: CURRENT_TRAINER,
    });
  };

  // Bắt đầu chat với học viên từ danh bạ
  const handleStartChatWithStudent = async (student: any) => {
    setShowNewChatModal(false);
    try {
      setIsLoading(true);
      const res = await apiFitlife.get(`/chat/room/${student.id_nguoi_dung}`);
      if (res.data && res.data.status && res.data.data) {
        const roomData = res.data.data;
        const newConv = {
          id_cuoc_tro_chuyen: roomData.id,
          room_uuid: roomData.uuid,
          loai: 'TRUC_TIEP',
          doi_phuong: student,
          thoi_gian_tin_nhan_cuoi: 'Vừa xong',
          noi_dung_cuoi: 'Đã bắt đầu cuộc trò chuyện mới',
          so_tin_chua_doc: 0,
          ghim: false,
          da_tat_thong_bao: false,
          da_xem: true,
        };

        setConversations((prev) => [newConv, ...prev.filter((c) => c.id_cuoc_tro_chuyen !== roomData.id)]);
        navigation?.navigate('ChatRoom', {
          conversation: newConv,
          currentUser: CURRENT_TRAINER,
        });
      }
    } catch (e) {
      // Nếu API lỗi, mở trực tiếp với mock room
      const fallbackRoom = {
        id_cuoc_tro_chuyen: student.id_nguoi_dung + 1000,
        room_uuid: `room-pt-${student.id_nguoi_dung}`,
        loai: 'TRUC_TIEP',
        doi_phuong: student,
        thoi_gian_tin_nhan_cuoi: 'Vừa xong',
        noi_dung_cuoi: 'Đã kết nối trực tiếp với học viên',
        so_tin_chua_doc: 0,
        da_xem: true,
      };
      navigation?.navigate('ChatRoom', {
        conversation: fallbackRoom,
        currentUser: CURRENT_TRAINER,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Ghim / Bỏ ghim cuộc trò chuyện
  const handleTogglePin = async (room: any) => {
    setSelectedRoomOptions(null);
    const newPinned = !room.ghim;
    setConversations((prev) =>
      prev.map((c) => (c.id_cuoc_tro_chuyen === room.id_cuoc_tro_chuyen ? { ...c, ghim: newPinned } : c))
    );

    try {
      await apiFitlife.post(`/chat/room/${room.room_uuid || room.id_cuoc_tro_chuyen}/pin`);
    } catch (e) {
      console.log('Lỗi cập nhật ghim:', e);
    }
  };

  // Tắt / Bật thông báo
  const handleToggleMute = async (room: any) => {
    setSelectedRoomOptions(null);
    const newMuted = !room.da_tat_thong_bao;
    setConversations((prev) =>
      prev.map((c) => (c.id_cuoc_tro_chuyen === room.id_cuoc_tro_chuyen ? { ...c, da_tat_thong_bao: newMuted } : c))
    );

    try {
      await apiFitlife.post(`/chat/room/${room.room_uuid || room.id_cuoc_tro_chuyen}/mute`);
    } catch (e) {
      console.log('Lỗi cập nhật tắt thông báo:', e);
    }
  };

  // Danh bạ học viên lọc theo tìm kiếm trong Modal
  const filteredModalContacts = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        (c.ho_ten || '').toLowerCase().includes(q) ||
        (c.chuyen_mon || '').toLowerCase().includes(q)
    );
  }, [contacts, modalSearch]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }>
        {/* 1. HEADER GRADIENT - Chuẩn phong cách Members.tsx */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}>
          <View style={styles.circleLg} />

          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.headerSub}>Tin nhắn & Trao đổi trực tuyến</Text>
              <Text style={styles.headerTitle}>Đoạn chat học viên</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={() => setShowNewChatModal(true)}>
              <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statRow}>
            {headerStats.map((item) => (
              <View key={item.label} style={styles.statBox}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* 2. TÌM KIẾM NỔI - Chuẩn phong cách Members.tsx */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color={COLORS.primary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên học viên, nội dung chat..."
            placeholderTextColor={COLORS.textLight}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.body}>
          {/* 3. BỘ LỌC CHIP - Chuẩn phong cách Members.tsx */}
          <View style={styles.chipRow}>
            {FILTERS.map((filter) => {
              const active = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.85}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 4. DANH SÁCH HỘI THOẠI - Cấu trúc thẻ card giống hệt Members.tsx */}
          {isLoading && !isRefreshing && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Đang đồng bộ tin nhắn...</Text>
            </View>
          )}

          {filteredConversations.map((item) => {
            const isGroup = item.loai === 'NHOM';
            const partner = item.doi_phuong;
            const displayName = isGroup ? item.ten_nhom : (partner?.ho_ten || 'Hội viên VisionFit');
            const displayAvatar = isGroup
              ? item.anh_nhom || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80'
              : getImageUrl(partner?.anh_dai_dien);

            const isOnline = isGroup ? false : partner?.online;
            const unread = item.so_tin_chua_doc || 0;
            const isPinned = item.ghim;
            const isMuted = item.da_tat_thong_bao;
            const isWorkoutMsg = item.noi_dung_cuoi?.includes('Đề xuất') || item.noi_dung_cuoi?.includes('lịch tập');

            return (
              <TouchableOpacity
                key={item.id_cuoc_tro_chuyen || item.room_uuid}
                activeOpacity={0.88}
                style={[styles.memberCard, isPinned && styles.memberCardPinned]}
                onPress={() => handleOpenRoom(item)}
                onLongPress={() => setSelectedRoomOptions(item)}>
                {/* Phần trên thẻ: Avatar, Tên, Tag mục tiêu/nhóm, Badge chưa đọc */}
                <View style={styles.cardTop}>
                  <View style={styles.avatarWrap}>
                    <Image source={{ uri: displayAvatar }} style={styles.avatar} />
                    {isOnline ? (
                      <View style={[styles.statusDot, { backgroundColor: COLORS.accentGreen }]} />
                    ) : (
                      <View style={[styles.statusDot, { backgroundColor: COLORS.borderFocus }]} />
                    )}
                  </View>

                  <View style={styles.flex}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.memberName, unread > 0 && styles.memberNameUnread]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      {isPinned && <Ionicons name="pin" size={13} color={COLORS.primary} style={{ marginLeft: 4 }} />}
                      {isMuted && <Ionicons name="notifications-off" size={13} color={COLORS.textMuted} style={{ marginLeft: 4 }} />}
                    </View>

                    <View style={styles.tagRow}>
                      <View style={styles.goalTag}>
                        <Ionicons
                          name={isGroup ? 'people' : 'barbell'}
                          size={11}
                          color={COLORS.primary}
                        />
                        <Text style={styles.goalText}>
                          {isGroup ? 'Nhóm tập' : (partner?.chuyen_mon || 'Học viên PT')}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.statusText,
                          unread > 0 ? { color: COLORS.accentOrange } : { color: COLORS.accentGreen },
                        ]}>
                        {unread > 0 ? `${unread} tin mới` : (isOnline ? 'Đang online' : 'Đã xem')}
                      </Text>
                    </View>
                  </View>

                  {/* Badge số tin chưa đọc phong cách percentBadge trong Members.tsx */}
                  {unread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                    </View>
                  ) : (
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>{item.thoi_gian_tin_nhan_cuoi || 'Hôm nay'}</Text>
                    </View>
                  )}
                </View>

                {/* Khung xem trước tin nhắn cuối cùng */}
                <View style={[styles.messageTrack, unread > 0 && styles.messageTrackUnread]}>
                  <Ionicons
                    name={isWorkoutMsg ? 'calendar' : unread > 0 ? 'chatbubble-ellipses' : 'chatbubble-outline'}
                    size={13}
                    color={unread > 0 ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[styles.lastMessageText, unread > 0 && styles.lastMessageTextUnread]}
                    numberOfLines={1}>
                    {item.noi_dung_cuoi || 'Bắt đầu cuộc trò chuyện'}
                  </Text>
                </View>

                {/* Phần dưới thẻ: Thời gian tin nhắn cuối & Nút thao tác nhanh */}
                <View style={styles.cardBottom}>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.thoi_gian_tin_nhan_cuoi || 'Vừa xong'}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.chatActionBtn}
                      activeOpacity={0.7}
                      onPress={() => handleOpenRoom(item)}>
                      <Ionicons name="chatbubble" size={12} color={COLORS.white} />
                      <Text style={styles.chatActionText}>Nhắn tin</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* TRẠNG THÁI TRỐNG - Chuẩn phong cách Members.tsx */}
          {filteredConversations.length === 0 && (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={34} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Không có cuộc trò chuyện nào</Text>
              <Text style={styles.metaText}>Bấm nút tròn phía trên để bắt đầu nhắn tin với học viên</Text>
              <TouchableOpacity
                style={styles.startChatBtn}
                onPress={() => setShowNewChatModal(true)}>
                <Text style={styles.startChatBtnText}>+ Nhắn tin học viên mới</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL BẮT ĐẦU ĐOẠN CHAT MỚI */}
      <Modal visible={showNewChatModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chọn học viên để chat</Text>
                <Text style={styles.modalSub}>Danh sách học viên và thành viên của bạn</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNewChatModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={16} color={COLORS.primary} />
              <TextInput
                value={modalSearch}
                onChangeText={setModalSearch}
                placeholder="Tìm tên hoặc mục tiêu tập..."
                placeholderTextColor={COLORS.textLight}
                style={styles.modalSearchInput}
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {filteredModalContacts.map((contact) => (
                <TouchableOpacity
                  key={`contact-${contact.id_nguoi_dung}`}
                  style={styles.contactItem}
                  activeOpacity={0.8}
                  onPress={() => handleStartChatWithStudent(contact)}>
                  <Image source={{ uri: getImageUrl(contact.anh_dai_dien) }} style={styles.contactAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{contact.ho_ten}</Text>
                    <Text style={styles.contactGoal}>{contact.chuyen_mon || 'Học viên VisionFit'}</Text>
                  </View>
                  <View style={styles.contactChatBadge}>
                    <Ionicons name="chatbubble" size={14} color={COLORS.primary} />
                    <Text style={styles.contactChatBadgeText}>Nhắn tin</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {filteredModalContacts.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted }}>Không tìm thấy học viên phù hợp</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL TÙY CHỌN CUỘC TRÒ CHUYỆN (Ghim, Tắt thông báo) */}
      <Modal visible={!!selectedRoomOptions} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedRoomOptions(null)}>
          <View style={styles.optionModalCard}>
            <Text style={styles.optionModalTitle}>Tùy chọn cuộc trò chuyện</Text>
            {selectedRoomOptions && (
              <>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => handleTogglePin(selectedRoomOptions)}>
                  <Ionicons
                    name={selectedRoomOptions.ghim ? 'pin-outline' : 'pin'}
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.optionText}>
                    {selectedRoomOptions.ghim ? 'Bỏ ghim cuộc trò chuyện' : 'Ghim lên đầu danh sách'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => handleToggleMute(selectedRoomOptions)}>
                  <Ionicons
                    name={selectedRoomOptions.da_tat_thong_bao ? 'notifications-outline' : 'notifications-off-outline'}
                    size={18}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.optionText}>
                    {selectedRoomOptions.da_tat_thong_bao ? 'Bật thông báo' : 'Tắt thông báo'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionRow, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    const r = selectedRoomOptions;
                    setSelectedRoomOptions(null);
                    handleOpenRoom(r);
                  }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.accentGreen} />
                  <Text style={styles.optionText}>Mở cửa sổ chat trực tiếp</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default TrainerChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: 28,
  },
  body: {
    paddingHorizontal: 16,
  },

  // 1. HEADER (chuẩn Members.tsx)
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 46,
    borderRadius: 28,
    marginHorizontal: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  circleLg: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -80,
    right: -60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 12.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '600',
  },

  // 2. TÌM KIẾM NỔI (chuẩn Members.tsx)
  searchBox: {
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginHorizontal: 16,
    marginTop: -26,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
    fontWeight: '600',
  },

  // 3. CHIPS BỘ LỌC (chuẩn Members.tsx)
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 26,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // 4. THẺ HỘI THOẠI (chuẩn phong cách memberCard trong Members.tsx)
  memberCard: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  memberCardPinned: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  statusDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  memberNameUnread: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  goalText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Badge tin nhắn chưa đọc
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceTeal,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Đoạn xem trước tin nhắn cuối cùng
  messageTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 12,
  },
  messageTrackUnread: {
    backgroundColor: COLORS.primarySoft,
  },
  lastMessageText: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  lastMessageTextUnread: {
    color: COLORS.textDark,
    fontWeight: '700',
  },

  // Dưới thẻ
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chatActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Loading
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // TRẠNG THÁI TRỐNG (chuẩn Members.tsx)
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  startChatBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startChatBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // MODAL BẮT ĐẦU CHAT
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  contactName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  contactGoal: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  contactChatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  contactChatBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // MODAL TÙY CHỌN
  optionModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginHorizontal: 30,
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: 20,
    ...SHADOWS.card,
  },
  optionModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
