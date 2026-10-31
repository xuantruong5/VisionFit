import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const DEFAULT_MEMBER = {
  name: 'Nguyễn Văn An',
  email: 'an.nguyen@email.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  status: 'Đang tập',
  age: 25,
  height: 172,
  weight: 68,
  bmi: 23.0,
  goal: 'Giảm cân',
  startWeight: 74,
  targetWeight: 62,
  sessions: 18,
  totalSessions: 24,
  calories: '8,450',
  trainingTime: '14h 30m',
  package: 'Gói PT 24 buổi',
  expiry: '15/12/2026',
};

const RECENT_SESSIONS = [
  { date: '30', month: 'Th10', title: 'Strength Training', duration: '60 phút', calories: '520 kcal' },
  { date: '28', month: 'Th10', title: 'Cardio HIIT', duration: '45 phút', calories: '410 kcal' },
  { date: '26', month: 'Th10', title: 'Full Body', duration: '60 phút', calories: '580 kcal' },
];

const MemberDetail = ({ navigation, route }: any) => {
  const member = { ...DEFAULT_MEMBER, ...route?.params?.member };
  const progress = Math.round((member.sessions / member.totalSessions) * 100);
  const paused = member.status === 'Tạm nghỉ';

  const bodyStats = [
    { icon: 'calendar-outline', value: member.age, unit: 'tuổi' },
    { icon: 'resize-outline', value: member.height, unit: 'cm' },
    { icon: 'speedometer-outline', value: member.weight, unit: 'kg' },
    { icon: 'pulse-outline', value: member.bmi, unit: 'BMI' },
  ];

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
            <Text style={styles.navTitle}>Chi tiết học viên</Text>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileRow}>
            <Image source={{ uri: member.avatar }} style={styles.avatar} />
            <View style={styles.flex}>
              <Text style={styles.name}>{member.name}</Text>
              <Text style={styles.email}>{member.email}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.glassBadge}>
                  <View style={[styles.statusDot, paused && { backgroundColor: COLORS.accentGold }]} />
                  <Text style={styles.glassBadgeText}>{member.status}</Text>
                </View>
                <View style={styles.glassBadge}>
                  <Ionicons name="card-outline" size={12} color={COLORS.white} />
                  <Text style={styles.glassBadgeText}>{member.package}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 2. CHỈ SỐ CƠ THỂ NỔI */}
        <View style={styles.statsCard}>
          {bodyStats.map((item, index) => (
            <React.Fragment key={item.unit}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.statItem}>
                <Ionicons name={item.icon} size={16} color={COLORS.primary} />
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.unit}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.body}>
          {/* 3. HÀNH ĐỘNG */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.outlineBtn}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('ChatRoom', { name: member.name })}>
              <Ionicons name="chatbubble-ellipses-outline" size={17} color={COLORS.primary} />
              <Text style={styles.outlineBtnText}>Nhắn tin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.flex} activeOpacity={0.85} onPress={() => navigation?.navigate('Schedule')}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.solidBtn}>
                <Ionicons name="calendar" size={17} color={COLORS.white} />
                <Text style={styles.solidBtnText}>Đặt lịch tập</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 4. TIẾN ĐỘ GÓI TẬP */}
          <Text style={styles.sectionTitle}>Tiến độ gói tập</Text>
          <View style={styles.card}>
            <View style={styles.progressHead}>
              <View style={styles.ring}>
                <Text style={styles.ringValue}>{progress}%</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>
                  {member.sessions}/{member.totalSessions} buổi đã tập
                </Text>
                <Text style={styles.subText}>Còn {member.totalSessions - member.sessions} buổi • Hết hạn {member.expiry}</Text>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={['#22B8C8', COLORS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.miniRow}>
              <View style={[styles.miniBox, { backgroundColor: '#FFF1EC' }]}>
                <Ionicons name="flame" size={18} color={COLORS.accentOrange} />
                <Text style={styles.miniValue}>{member.calories}</Text>
                <Text style={styles.subText}>kcal tiêu hao</Text>
              </View>
              <View style={[styles.miniBox, { backgroundColor: COLORS.surfaceTeal }]}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
                <Text style={styles.miniValue}>{member.trainingTime}</Text>
                <Text style={styles.subText}>thời gian tập</Text>
              </View>
            </View>
          </View>

          {/* 5. MỤC TIÊU */}
          <Text style={styles.sectionTitle}>Mục tiêu: {member.goal}</Text>
          <View style={styles.card}>
            <View style={styles.weightRow}>
              <View style={styles.weightItem}>
                <Text style={styles.subText}>Bắt đầu</Text>
                <Text style={styles.weightValue}>{member.startWeight}kg</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} />
              <View style={styles.weightItem}>
                <Text style={styles.subText}>Hiện tại</Text>
                <Text style={[styles.weightValue, { color: COLORS.primary }]}>{member.weight}kg</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} />
              <View style={styles.weightItem}>
                <Text style={styles.subText}>Mục tiêu</Text>
                <Text style={[styles.weightValue, { color: COLORS.accentGreen }]}>{member.targetWeight}kg</Text>
              </View>
            </View>
            <View style={styles.goalNote}>
              <Ionicons name="trending-down" size={16} color={COLORS.accentGreen} />
              <Text style={styles.goalNoteText}>
                Đã giảm {member.startWeight - member.weight}kg, còn {member.weight - member.targetWeight}kg nữa là đạt mục tiêu!
              </Text>
            </View>
          </View>

          {/* 6. BUỔI TẬP GẦN ĐÂY */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Buổi tập gần đây</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('SessionHistory')}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {RECENT_SESSIONS.map((item) => (
            <View key={item.date} style={styles.sessionCard}>
              <View style={styles.dateBox}>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.monthText}>{item.month}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.subText}>
                  {item.duration} • {item.calories}
                </Text>
              </View>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark" size={15} color={COLORS.white} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MemberDetail;

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
    marginTop: 2,
  },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 56,
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  email: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  glassBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6EE7B7',
  },

  // STATS NỔI
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -34,
    borderRadius: 20,
    paddingVertical: 14,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.borderLight,
  },

  // HÀNH ĐỘNG
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  outlineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  solidBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  solidBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // SECTION & CARD
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // TIẾN ĐỘ
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    borderRadius: 4,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  miniBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
  },
  miniValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },

  // MỤC TIÊU
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightItem: {
    alignItems: 'center',
    flex: 1,
  },
  weightValue: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  goalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
  },
  goalNoteText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#047857',
  },

  // BUỔI TẬP
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  monthText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  doneIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
