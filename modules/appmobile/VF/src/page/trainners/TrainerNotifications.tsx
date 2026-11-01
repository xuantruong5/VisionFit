import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const FILTERS = ['Tất cả', 'Ca dạy', 'Học viên', 'Hệ thống'];

type Noti = { id: string; type: string; title: string; desc: string; time: string; icon?: string; bg?: string; ink?: string; avatar?: string; unread?: boolean };

const GROUPS: { title: string; items: Noti[] }[] = [
  {
    title: 'Hôm nay',
    items: [
      { id: '1', type: 'Ca dạy', icon: 'time-outline', bg: '#FFF1EC', ink: '#A9744A', title: 'Ca dạy sắp bắt đầu', desc: 'Trần Minh Anh • Cardio & Giảm mỡ lúc 14:30', time: '13:45', unread: true },
      { id: '2', type: 'Học viên', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', title: 'Nguyễn Văn An đã check-in', desc: 'Phòng Gym A • sẵn sàng cho buổi tập', time: '08:52', unread: true },
      { id: '3', type: 'Học viên', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80', title: 'Phạm Thu Hà đánh giá 5 sao', desc: '“Buổi tập rất hiệu quả, cảm ơn HLV!”', time: '07:30' },
    ],
  },
  {
    title: 'Hôm qua',
    items: [
      { id: '4', type: 'Hệ thống', icon: 'wallet-outline', bg: '#ECFDF5', ink: '#5E7B45', title: 'Đã nhận thanh toán', desc: '+500.000 ₫ từ buổi PT với Nguyễn Văn An', time: '19:10' },
      { id: '5', type: 'Ca dạy', icon: 'close-circle-outline', bg: '#FEF2F2', ink: '#C0625A', title: 'Học viên huỷ ca dạy', desc: 'Lê Hoàng Nam huỷ ca 18:00 • Full Body', time: '15:22' },
      { id: '6', type: 'Hệ thống', icon: 'megaphone-outline', bg: '#EAF3FC', ink: '#6E8CA8', title: 'Cập nhật chính sách', desc: 'Chính sách thưởng theo buổi dạy tháng 11', time: '09:00' },
    ],
  },
];

const TrainerNotifications = ({ navigation }: any) => {
  const [filter, setFilter] = useState('Tất cả');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7}>
          <Ionicons name="checkmark-done" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        {FILTERS.map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.8}
            onPress={() => setFilter(item)}
            style={[styles.chip, filter === item && styles.chipActive]}>
            <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {GROUPS.map((group) => {
          const items = group.items.filter((n) => filter === 'Tất cả' || n.type === filter);
          if (items.length === 0) return null;
          return (
            <View key={group.title}>
              <Text style={styles.sectionTitle}>{group.title}</Text>
              <View style={styles.card}>
                {items.map((item, index) => (
                  <View key={item.id} style={[styles.row, index < items.length - 1 && styles.rowBorder]}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.iconTile, { backgroundColor: item.bg }]}>
                        <Ionicons name={item.icon || "notifications-outline"} size={20} color={item.ink} />
                      </View>
                    )}
                    <View style={styles.flex}>
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.desc} numberOfLines={2}>{item.desc}</Text>
                      <Text style={styles.time}>{item.time}</Text>
                    </View>
                    {item.unread && <View style={styles.unreadDot} />}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
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
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'serif',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 11.5,
    color: COLORS.textLight,
    marginTop: 4,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.accentOrange,
    marginTop: 6,
  },
});
