
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';
import apiFitlife from '../../general/api';

const FILTERS = ['Tất cả', 'Ca dạy', 'Học viên', 'Hệ thống'];
type Noti = {
  id: number;
  type: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  loai: string;
};

const TrainerNotifications = ({ navigation }: any) => {
  const [filter, setFilter] = useState('Tất cả');
  const [notifications, setNotifications] = useState<Noti[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Định dạng thời gian
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString.replace(' ', 'T'));
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', });
    if (isToday) return time;
    if (isYesterday) return `Hôm qua • ${time}`;
    return `${date.toLocaleDateString('vi-VN')} • ${time}`;
  };

  // Xác định nhóm thông báo
  const getType = (item: any) => {
    const title = (item.tieu_de || '').trim().toLowerCase();
    // Chỉ thông báo có tiêu đề chính xác là "Học viên mới"
    // mới được xếp vào nhóm Học viên
    if (title === 'học viên mới') {
      return 'Học viên';
    }
    if (
      title.includes('ca dạy') ||
      title.includes('lịch dạy')
    ) {
      return 'Ca dạy';
    }
    return 'Hệ thống';
  };

  // Gọi API thông báo
  const fetchNotifications = async () => {
    try {
      const response = await apiFitlife.get('/trainer/thong-bao');
      if (response.data.success) {
        const data = response.data.data || [];
        const mappedData: Noti[] = data.map((item: any) => ({
          id: item.id,
          type: getType(item),
          title: item.tieu_de,
          desc: item.noi_dung,
          time: formatTime(item.created_at),
          unread: Number(item.da_doc) === 0,
          loai: item.loai,
        }));
        setNotifications(mappedData);
        setUnreadCount(response.data.so_thong_bao_chua_doc || 0);
      }
    } catch (error: any) {
      console.log(
        'Lỗi lấy thông báo:',
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchNotifications();
  }, []);

  // 1. Đánh dấu một thông báo đã đọc
  const markAsRead = async (id: number) => {
    const item = notifications.find(n => n.id === id);

    if (!item || !item.unread) return;

    try {
      const response = await apiFitlife.post(
        `/trainer/thong-bao/${id}/da-doc`
      );

      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === id ? { ...n, unread: false } : n
          )
        );

        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.log('Lỗi đánh dấu đã đọc:', error.response?.data || error.message);
    }
  };

  // 2. Đánh dấu tất cả đã đọc
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const response = await apiFitlife.post(
        '/trainer/thong-bao/da-doc-tat-ca'
      );

      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, unread: false }))
        );

        setUnreadCount(0);
      }
    } catch (error: any) {
      console.log('Lỗi đánh dấu tất cả đã đọc:', error.response?.data || error.message);
    }
  };

  // 3. Xóa một thông báo
  const deleteNotification = async (id: number) => {
    try {
      const response = await apiFitlife.delete(
        `/trainer/thong-bao/${id}`
      );

      if (response.data.success) {
        const deletedItem = notifications.find(n => n.id === id);

        setNotifications(prev =>
          prev.filter(n => n.id !== id)
        );

        if (deletedItem?.unread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }

        setDeletingId(null);
      }
    } catch (error: any) {
      console.log('Lỗi xóa thông báo:', error.response?.data || error.message);
    }
  };

  // 4. Xóa tất cả thông báo
  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;

    try {
      const response = await apiFitlife.delete(
        '/trainer/thong-bao'
      );

      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
        setDeletingId(null);
      }
    } catch (error: any) {
      console.log('Lỗi xóa tất cả:', error.response?.data || error.message);
    }
  };
  // Kéo xuống để tải lại
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Nhóm thông báo theo ngày
  const getGroupTitle = (time: string) => {
    if (time.startsWith('Hôm qua')) return 'Hôm qua';
    const today = new Date().toLocaleDateString('vi-VN');
    if (time.includes(today)) return 'Hôm nay';
    return 'Trước đó';
  };
  const filteredNotifications = notifications.filter(
    item => filter === 'Tất cả' || item.type === filter
  );
  const groups = [
    {
      title: 'Hôm nay',
      items: filteredNotifications.filter(item => {
        const date = new Date(item.time.includes('•')
          ? item.time.split(' • ')[0].split('/').reverse().join('-')
          : new Date().toISOString());
        return item.time.includes('Hôm qua') === false &&
          !item.time.includes('/');
      }),
    },
    {
      title: 'Hôm qua',
      items: filteredNotifications.filter(item =>
        item.time.includes('Hôm qua')
      ),
    },
    {
      title: 'Trước đó',
      items: filteredNotifications.filter(item =>
        item.time.includes('/')
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>
              {unreadCount} thông báo chưa đọc
            </Text>
          )}
        </View>
        <TouchableOpacity  style={styles.roundBtn} activeOpacity={0.7} onPress={markAllAsRead} >
          <Ionicons name="checkmark-done" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Xóa tất cả */}
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={deleteAllNotifications} >
          <Ionicons name="trash-outline" size={19} color="#E53935" />
        </TouchableOpacity>

      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        {FILTERS.map(item => (
          <TouchableOpacity  key={item}  activeOpacity={0.8} onPress={() => setFilter(item)}
            style={[styles.chip, filter === item && styles.chipActive]}>
            <Text style={[ styles.chipText, filter === item && styles.chipTextActive, ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>
              Chưa có thông báo nào
            </Text>
          </View>
        ) : (
          groups.map(group => {
            if (group.items.length === 0) return null;
            return (
              <View key={group.title}>
                <Text style={styles.sectionTitle}>
                  {group.title}
                </Text>

                <View style={styles.card}>
                  {group.items.map((item, index) => {
                    const isStudent = item.title?.trim().toLowerCase() === 'học viên mới';

                    return (
                      <View key={item.id} style={[  styles.row, index < group.items.length - 1 && styles.rowBorder, deletingId === item.id && styles.rowDeleting, ]} >
                        <TouchableOpacity style={styles.notificationContent}  activeOpacity={0.8} onPress={() => markAsRead(item.id)} onLongPress={() => setDeletingId(item.id)}  delayLongPress={400} >
                          <View  style={[ styles.iconTile,  {   backgroundColor: isStudent ? '#EAF8F8' : '#EAF3FC', },  ]} >
                            <Ionicons name={isStudent ? 'person-add-outline' : 'notifications-outline'} size={20} color={isStudent ? COLORS.primary : '#6E8CA8'} />
                          </View>

                          <View style={styles.flex}>
                            <Text style={styles.title}>
                              {item.title}
                            </Text>

                            <Text style={styles.desc} numberOfLines={2}>
                              {item.desc}
                            </Text>

                            <Text style={styles.time}>
                              {item.time}
                            </Text>
                          </View>

                          {item.unread && (
                            <View style={styles.unreadDot} />
                          )}
                        </TouchableOpacity>

                        <View style={styles.rightActions}>

                          {/* Nhấn giữ sẽ hiện nút xóa */}
                          {deletingId === item.id && (
                            <TouchableOpacity style={styles.deleteButton} activeOpacity={0.7} onPress={() => deleteNotification(item.id)} >
                              <Ionicons  name="trash" size={19} color="#E53935"  />
                            </TouchableOpacity>
                          )}

                          {/* Nút đặt lịch */}
                          {isStudent && (
                            <TouchableOpacity style={styles.bookingButton}  activeOpacity={0.8}
                              onPress={() => {  navigation.navigate('selectcalendar', {  notificationId: item.id, });}} >
                              <Ionicons name="calendar-outline" size={14} color="#FFFFFF"/>
                              <Text style={styles.bookingButtonText}>
                                Đặt lịch
                              </Text>
                            </TouchableOpacity>
                          )}


                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrainerNotifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SOFT_SHADOW,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  unreadCount: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  chipScroll: {
    flexGrow: 0,
    marginTop: 16,
  },
  chipRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    ...SOFT_SHADOW,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 22,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 16,
    ...SOFT_SHADOW,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  time: {
    fontSize: 11.5,
    color: COLORS.textLight,
    marginTop: 4,
    fontWeight: '600',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.accentOrange,
    marginTop: 6,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    minHeight: 85,
  },

  bookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    marginTop: 8,
  },

  bookingButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  rowDeleting: {
    // backgroundColor: '#FFF5F5',
  },

  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',

  },
});
