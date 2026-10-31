import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const SESSIONS = [
  { id: '1', date: 'Thứ Sáu, 30/10', time: '09:00', member: 'Nguyễn Văn An', type: 'Strength Training', duration: '60 phút', status: 'Hoàn thành', calories: '520 kcal', rating: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: '2', date: 'Thứ Sáu, 30/10', time: '14:30', member: 'Trần Minh Anh', type: 'Cardio', duration: '45 phút', status: 'Hoàn thành', calories: '410 kcal', rating: 0, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: '3', date: 'Thứ Năm, 29/10', time: '18:00', member: 'Lê Hoàng Nam', type: 'Full Body', duration: '60 phút', status: 'Đã hủy', calories: '', rating: 0, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: '4', date: 'Thứ Tư, 28/10', time: '09:30', member: 'Phạm Thu Hà', type: 'Weight Loss', duration: '60 phút', status: 'Hoàn thành', calories: '580 kcal', rating: 4, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { id: '5', date: 'Thứ Tư, 28/10', time: '16:00', member: 'Võ Minh Khang', type: 'Upper Body', duration: '50 phút', status: 'Hoàn thành', calories: '460 kcal', rating: 5, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' },
];

const FILTERS = ['Tất cả', 'Hoàn thành', 'Đã hủy'];

const SUMMARY = [
  { value: '32', label: 'Tổng ca' },
  { value: '28', label: 'Hoàn thành' },
  { value: '4', label: 'Đã hủy' },
  { value: '48h', label: 'Giờ dạy' },
];

const SessionHistory = ({ navigation }: any) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const keyword = search.trim().toLowerCase();
  const sessions = SESSIONS.filter(
    (s) =>
      (activeFilter === 'Tất cả' || s.status === activeFilter) &&
      (s.member.toLowerCase().includes(keyword) || s.type.toLowerCase().includes(keyword))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. HEADER GRADIENT */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circleLg} />

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Lịch sử buổi dạy</Text>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
              <Ionicons name="options-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            {SUMMARY.map((item) => (
              <View key={item.label} style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* 2. TÌM KIẾM NỔI */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color={COLORS.primary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo học viên, bài tập..."
            placeholderTextColor={COLORS.textLight}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.body}>
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

          {/* 3. DANH SÁCH THEO NGÀY */}
          {sessions.map((item, index) => {
            const showDate = index === 0 || sessions[index - 1].date !== item.date;
            const cancelled = item.status === 'Đã hủy';
            return (
              <View key={item.id}>
                {showDate && <Text style={styles.dateLabel}>{item.date}</Text>}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.sessionCard, cancelled && styles.sessionCardCancelled]}
                  disabled={cancelled}
                  onPress={() => navigation?.navigate('SessionReview', { session: item })}>
                  <View style={styles.cardTop}>
                    <Image source={{ uri: item.avatar }} style={[styles.avatar, cancelled && styles.avatarCancelled]} />
                    <View style={styles.flex}>
                      <Text style={styles.memberName}>{item.member}</Text>
                      <Text style={styles.subText}>
                        {item.type} • {item.time} • {item.duration}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, cancelled && styles.cancelledBadge]}>
                      <Ionicons
                        name={cancelled ? 'close-circle' : 'checkmark-circle'}
                        size={13}
                        color={cancelled ? COLORS.accentRed : COLORS.accentGreen}
                      />
                      <Text style={[styles.statusText, cancelled && { color: COLORS.accentRed }]}>{item.status}</Text>
                    </View>
                  </View>

                  {!cancelled && (
                    <View style={styles.cardBottom}>
                      <View style={styles.metaRow}>
                        <Ionicons name="flame" size={13} color={COLORS.accentOrange} />
                        <Text style={styles.metaText}>{item.calories}</Text>
                      </View>
                      {item.rating > 0 ? (
                        <View style={styles.metaRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name="star"
                              size={13}
                              color={star <= item.rating ? COLORS.accentGold : COLORS.border}
                            />
                          ))}
                        </View>
                      ) : (
                        <View style={styles.reviewPill}>
                          <Ionicons name="create-outline" size={13} color={COLORS.white} />
                          <Text style={styles.reviewPillText}>Đánh giá ngay</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {sessions.length === 0 && (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="time-outline" size={34} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Không có buổi tập</Text>
              <Text style={styles.subText}>Không tìm thấy lịch sử phù hợp.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SessionHistory;

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
    paddingBottom: 40,
  },
  body: {
    paddingHorizontal: 16,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  summaryLabel: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // TÌM KIẾM & LỌC
  searchBox: {
    height: 52,
    borderRadius: 18,
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
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // DANH SÁCH
  dateLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  sessionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  sessionCardCancelled: {
    backgroundColor: '#FBFDFD',
    borderStyle: 'dashed',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
  },
  avatarCancelled: {
    opacity: 0.5,
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  cancelledBadge: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentGreen,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  reviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  reviewPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.white,
  },

  // EMPTY
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
