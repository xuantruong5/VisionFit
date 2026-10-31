import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const MEMBERS = [
  { id: '1', name: 'Nguyễn Văn An', email: 'an.nguyen@email.com', goal: 'Giảm cân', sessions: 18, totalSessions: 24, status: 'Đang tập', next: 'Hôm nay, 09:00', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Trần Minh Anh', email: 'minhanh@email.com', goal: 'Tăng cơ', sessions: 12, totalSessions: 20, status: 'Đang tập', next: 'Hôm nay, 14:30', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Lê Hoàng Nam', email: 'nam.le@email.com', goal: 'Duy trì', sessions: 8, totalSessions: 16, status: 'Tạm nghỉ', next: 'Chưa có lịch', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Phạm Thu Hà', email: 'ha.pham@email.com', goal: 'Giảm cân', sessions: 21, totalSessions: 24, status: 'Đang tập', next: 'Thứ 2, 10:00', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { id: '5', name: 'Võ Minh Khang', email: 'khang.vo@email.com', goal: 'Tăng cơ', sessions: 6, totalSessions: 12, status: 'Tạm nghỉ', next: 'Chưa có lịch', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' },
];

const FILTERS = ['Tất cả', 'Đang tập', 'Tạm nghỉ'];

const HEADER_STATS = [
  { value: '24', label: 'Tổng học viên' },
  { value: '19', label: 'Đang tập' },
  { value: '86%', label: 'Chuyên cần' },
];

const Members = ({ navigation }: any) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const keyword = search.trim().toLowerCase();
  const members = MEMBERS.filter(
    (m) =>
      (activeFilter === 'Tất cả' || m.status === activeFilter) &&
      (m.name.toLowerCase().includes(keyword) || m.goal.toLowerCase().includes(keyword))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. HEADER GRADIENT */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circleLg} />

          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.headerSub}>Quản lý & theo dõi tiến độ</Text>
              <Text style={styles.headerTitle}>Học viên của tôi</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
              <Ionicons name="person-add" size={19} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statRow}>
            {HEADER_STATS.map((item) => (
              <View key={item.label} style={styles.statBox}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
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
            placeholder="Tìm theo tên, mục tiêu..."
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
          {/* 3. BỘ LỌC */}
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

          {/* 4. DANH SÁCH */}
          {members.map((member) => {
            const progress = Math.round((member.sessions / member.totalSessions) * 100);
            const paused = member.status === 'Tạm nghỉ';
            return (
              <TouchableOpacity
                key={member.id}
                activeOpacity={0.85}
                style={styles.memberCard}
                onPress={() => navigation?.navigate('MemberDetail', { member })}>
                <View style={styles.cardTop}>
                  <View>
                    <Image source={{ uri: member.avatar }} style={[styles.avatar, paused && styles.avatarPaused]} />
                    <View style={[styles.statusDot, paused && { backgroundColor: COLORS.accentGold }]} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={styles.tagRow}>
                      <View style={styles.goalTag}>
                        <Ionicons name="flag" size={11} color={COLORS.primary} />
                        <Text style={styles.goalText}>{member.goal}</Text>
                      </View>
                      <Text style={[styles.statusText, paused && { color: COLORS.accentGold }]}>{member.status}</Text>
                    </View>
                  </View>
                  <View style={[styles.percentBadge, paused && styles.percentBadgePaused]}>
                    <Text style={[styles.percentText, paused && { color: COLORS.textMuted }]}>{progress}%</Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={paused ? [COLORS.textLight, COLORS.textLight] : ['#22B8C8', COLORS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.metaRow}>
                    <Ionicons name="barbell-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>
                      {member.sessions}/{member.totalSessions} buổi
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color={paused ? COLORS.textMuted : COLORS.primary} />
                    <Text style={[styles.metaText, !paused && styles.metaTextActive]}>{member.next}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {members.length === 0 && (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={34} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Không tìm thấy học viên</Text>
              <Text style={styles.metaText}>Thử tìm với tên hoặc từ khoá khác</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Members;

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
    paddingBottom: 24,
  },
  body: {
    paddingHorizontal: 16,
  },

  // HEADER
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
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
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
    fontWeight: '800',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // TÌM KIẾM
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

  // CHIPS
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 14,
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

  // THẺ HỌC VIÊN
  memberCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  avatarPaused: {
    opacity: 0.6,
  },
  statusDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accentGreen,
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  memberName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.accentGreen,
  },
  percentBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBadgePaused: {
    borderColor: COLORS.border,
  },
  percentText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  },
  metaTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // EMPTY
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 4,
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
});
