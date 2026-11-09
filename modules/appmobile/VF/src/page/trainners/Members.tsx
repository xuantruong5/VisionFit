import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { TRAINER_COLORS as COLORS, TRAINER_SHADOWS as SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';

const FILTERS = ['Tất cả', 'Đang tập', 'Tạm nghỉ'];

const Members = ({ navigation }: any) => {
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const fetchMembers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiFitlife.get('/trainer/members');
      if (res.data?.success && res.data?.data) {
        setMembersList(res.data.data);
      }
    } catch (error: any) {
      console.log('Lỗi lấy danh sách học viên:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchMembers();
    });
    return unsubscribe;
  }, [navigation]);

  const totalCount = membersList.length;
  const activeCount = membersList.filter((m) => m.tinh_trang === 1).length;
  const attendanceRate = totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}%` : '0%';

  const keyword = search.trim().toLowerCase();
  const members = membersList.filter((m) => {
    const name = (m.ho_ten || '').toLowerCase();
    const goal = (m.muc_tieu_hien_tai || '').toLowerCase();
    const isPaused = m.tinh_trang === 3;
    const statusText = isPaused ? 'Tạm nghỉ' : 'Đang tập';

    const matchFilter = activeFilter === 'Tất cả' || statusText === activeFilter;
    const matchSearch = name.includes(keyword) || goal.includes(keyword);
    return matchFilter && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMembers(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* 1. HEADER GRADIENT */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circleLg} />

          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.headerSub}>Quản lý & theo dõi tiến độ</Text>
              <Text style={styles.headerTitle}>Học viên của tôi</Text>
            </View>
            <TouchableOpacity style={[styles.addBtn, { marginRight: 8 }]} activeOpacity={0.8} onPress={() => navigation?.navigate('TrainerChat')}>
              <Ionicons name="chatbubbles" size={19} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => navigation?.navigate('AddMember')}>
              <Ionicons name="person-add" size={19} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalCount}</Text>
              <Text style={styles.statLabel}>Tổng học viên</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{activeCount}</Text>
              <Text style={styles.statLabel}>Đang tập</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{attendanceRate}</Text>
              <Text style={styles.statLabel}>Chuyên cần</Text>
            </View>
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

          {/* LOADING STATE */}
          {loading && !refreshing ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ marginTop: 12, color: COLORS.textMuted, fontSize: 13, fontWeight: '500' }}>
                Đang tải danh sách học viên...
              </Text>
            </View>
          ) : (
            <>
              {/* 4. DANH SÁCH */}
              {members.map((item, index) => {
                const isPaused = item.tinh_trang === 3;
                const totalSessions = Number(item.so_buoi_pt || 24);
                const sessions = 0;
                const progress = Math.min(100, Math.round((sessions / totalSessions) * 100));
                const avatar = item.anh_dai_dien || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

                return (
                  <TouchableOpacity
                    key={`member_${item.id_chi_tiet || item.id_hoi_vien}_${index}`}
                    activeOpacity={0.85}
                    style={styles.memberCard}
                    onPress={() => navigation?.navigate('MemberDetail', { member: item })}>
                    <View style={styles.cardTop}>
                      <View>
                        <Image source={{ uri: avatar }} style={[styles.avatar, isPaused && styles.avatarPaused]} />
                        <View style={[styles.statusDot, isPaused && { backgroundColor: COLORS.accentGold }]} />
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.memberName}>{item.ho_ten}</Text>
                        <View style={styles.tagRow}>
                          <View style={styles.goalTag}>
                            <Ionicons name="flag" size={11} color={COLORS.primary} />
                            <Text style={styles.goalText}>{item.muc_tieu_hien_tai || 'Rèn luyện sức khỏe'}</Text>
                          </View>
                          <Text style={[styles.statusText, isPaused && { color: COLORS.accentGold }]}>
                            {isPaused ? 'Tạm nghỉ' : 'Đang tập'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.percentBadge, isPaused && styles.percentBadgePaused]}>
                        <Text style={[styles.percentText, isPaused && { color: COLORS.textMuted }]}>{progress}%</Text>
                      </View>
                    </View>

                    <View style={styles.progressTrack}>
                      <LinearGradient
                        colors={isPaused ? [COLORS.textLight, COLORS.textLight] : ['#22B8C8', COLORS.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${progress}%` }]}
                      />
                    </View>

                    <View style={styles.cardBottom}>
                      <View style={styles.metaRow}>
                        <Ionicons name="barbell-outline" size={13} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>
                          {item.ten_goi_tap || `Gói PT ${totalSessions} buổi`}
                        </Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={13} color={isPaused ? COLORS.textMuted : COLORS.primary} />
                        <Text style={[styles.metaText, !isPaused && styles.metaTextActive]}>
                          {item.ngay_ket_thuc ? `Hạn: ${item.ngay_ket_thuc}` : 'Đang tập'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {members.length === 0 && (
                <View style={styles.emptyBox}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name={search ? "search-outline" : "people-outline"} size={34} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {search ? "Không tìm thấy học viên" : "Chưa có học viên nào"}
                  </Text>
                  <Text style={styles.metaText}>
                    {search ? "Thử tìm với tên hoặc từ khoá khác" : "Học viên khi đăng ký gói tập cùng bạn sẽ xuất hiện tại đây"}
                  </Text>
                  {!search && (
                    <TouchableOpacity
                      style={{ marginTop: 14, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}
                      onPress={() => navigation?.navigate('AddMember')}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Thêm học viên mới</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
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

  // TÌM KIẾM
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

  // THẺ HỌC VIÊN
  memberCard: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 14,
    marginBottom: 12,
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
    borderRadius: 26,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '600',
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
