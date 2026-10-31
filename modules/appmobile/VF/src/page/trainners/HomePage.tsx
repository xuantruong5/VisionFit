import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const TRAINER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80';

const STATS = [
  { icon: 'calendar', value: '8', label: 'Ca hôm nay', color: COLORS.primary },
  { icon: 'people', value: '24', label: 'Học viên', color: COLORS.accentGreen },
  { icon: 'star', value: '4.9', label: 'Đánh giá', color: COLORS.accentGold },
];

const NEXT_SESSION = {
  member: 'Trần Minh Anh',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  type: 'Cardio & Giảm mỡ',
  time: '14:30 - 15:15',
  place: 'Khu Cardio • Tầng 2',
  countdown: 'Bắt đầu sau 45 phút',
};

const SHORTCUTS = [
  { icon: 'people', title: 'Học viên', colors: ['#34D399', '#059669'], route: 'Members' },
  { icon: 'calendar', title: 'Lịch dạy', colors: ['#22B8C8', '#0D7F8D'], route: 'Schedule' },
  { icon: 'document-text', title: 'Lịch sử', colors: ['#A78BFA', '#7C3AED'], route: 'SessionHistory' },
  { icon: 'wallet', title: 'Thu nhập', colors: ['#FBBF24', '#E6A94A'], route: 'Income' },
];

const TODAY_SESSIONS = [
  { time: '09:00', member: 'Nguyễn Văn An', type: 'Tập thể lực & Tăng cơ', done: true },
  { time: '14:30', member: 'Trần Minh Anh', type: 'Cardio & Giảm mỡ', next: true },
  { time: '18:00', member: 'Lê Hoàng Nam', type: 'Full Body Kháng lực' },
];

const RECENT_MEMBERS = [
  { name: 'Nguyễn Văn An', goal: 'Giảm cân', sessions: 18, totalSessions: 24, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { name: 'Trần Minh Anh', goal: 'Tăng cơ', sessions: 12, totalSessions: 20, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { name: 'Phạm Thu Hà', goal: 'Giảm cân', sessions: 21, totalSessions: 24, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { name: 'Lê Hoàng Nam', goal: 'Duy trì', sessions: 8, totalSessions: 16, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
];

const HomePage = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. HEADER GRADIENT */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circleLg} />
          <View style={styles.circleSm} />

          <View style={styles.headerRow}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.navigate('Profile')}>
              <Image source={{ uri: TRAINER_AVATAR }} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </TouchableOpacity>
            <View style={styles.flex}>
              <Text style={styles.greeting}>Chào buổi sáng 👋</Text>
              <Text style={styles.name}>HLV Nguyễn Trainer</Text>
            </View>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7} onPress={() => navigation?.navigate('ChatList')}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
              <View style={styles.notiDot} />
            </TouchableOpacity>
          </View>

          <Text style={styles.dateText}>THỨ BẢY, 31 THÁNG 10</Text>
          <Text style={styles.heroTitle}>Hôm nay bạn có 8 ca dạy 💪</Text>
          <View style={styles.progressRow}>
            <View style={styles.heroTrack}>
              <View style={[styles.heroFill, { width: '37%' }]} />
            </View>
            <Text style={styles.progressText}>3/8 ca</Text>
          </View>
        </LinearGradient>

        {/* 2. THỐNG KÊ NỔI */}
        <View style={styles.statsCard}>
          {STATS.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.statItem}>
                <View style={styles.statValueRow}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                  <Text style={styles.statValue}>{item.value}</Text>
                </View>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.body}>
          {/* 3. CA DẠY TIẾP THEO */}
          <Text style={styles.sectionTitle}>Ca dạy tiếp theo</Text>
          <View style={styles.nextCard}>
            <View style={styles.nextTop}>
              <Image source={{ uri: NEXT_SESSION.avatar }} style={styles.nextAvatar} />
              <View style={styles.flex}>
                <Text style={styles.nextName}>{NEXT_SESSION.member}</Text>
                <Text style={styles.subText}>{NEXT_SESSION.type}</Text>
              </View>
              <View style={styles.countdownBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.countdownText}>45'</Text>
              </View>
            </View>

            <View style={styles.nextInfoRow}>
              <View style={styles.nextInfo}>
                <Ionicons name="time-outline" size={15} color={COLORS.primary} />
                <Text style={styles.nextInfoText}>{NEXT_SESSION.time}</Text>
              </View>
              <View style={styles.nextInfo}>
                <Ionicons name="location-outline" size={15} color={COLORS.primary} />
                <Text style={styles.nextInfoText}>{NEXT_SESSION.place}</Text>
              </View>
            </View>

            <View style={styles.nextActions}>
              <TouchableOpacity
                style={styles.outlineBtn}
                activeOpacity={0.8}
                onPress={() => navigation?.navigate('ChatRoom', { name: NEXT_SESSION.member })}>
                <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                <Text style={styles.outlineBtnText}>Nhắn tin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.flex} activeOpacity={0.85}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.solidBtn}>
                  <Ionicons name="play" size={15} color={COLORS.white} />
                  <Text style={styles.solidBtnText}>Bắt đầu ca</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. LỐI TẮT */}
          <View style={styles.shortcutRow}>
            {SHORTCUTS.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.shortcut}
                activeOpacity={0.8}
                onPress={() => navigation?.navigate(item.route)}>
                <LinearGradient colors={item.colors} style={styles.shortcutIcon}>
                  <Ionicons name={item.icon} size={22} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.shortcutText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 5. LỊCH HÔM NAY - TIMELINE */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Lịch hôm nay</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Schedule')}>
              <Text style={styles.seeAll}>Xem lịch</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {TODAY_SESSIONS.map((item, index) => (
              <View key={item.time} style={styles.timelineRow}>
                <Text style={[styles.timeText, item.next && { color: COLORS.primary }]}>{item.time}</Text>
                <View style={styles.timelineCol}>
                  <View style={[styles.timelineDot, item.done && styles.dotDone, item.next && styles.dotNext]}>
                    {item.done && <Ionicons name="checkmark" size={10} color={COLORS.white} />}
                  </View>
                  {index < TODAY_SESSIONS.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={[styles.timelineContent, item.next && styles.timelineContentActive]}>
                  <Text style={[styles.rowTitle, item.done && { color: COLORS.textMuted }]}>{item.member}</Text>
                  <Text style={styles.subText}>{item.type}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 6. HỌC VIÊN GẦN ĐÂY */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Học viên gần đây</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Members')}>
              <Text style={styles.seeAll}>Tất cả</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberList}>
          {RECENT_MEMBERS.map((item) => {
            const progress = Math.round((item.sessions / item.totalSessions) * 100);
            return (
              <TouchableOpacity
                key={item.name}
                style={styles.memberCard}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate('MemberDetail', { member: item })}>
                <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
                <Text style={styles.memberName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.goalTag}>
                  <Text style={styles.goalText}>{item.goal}</Text>
                </View>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.subText}>
                  {item.sessions}/{item.totalSessions} buổi
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;

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
  subText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  // HEADER
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 58,
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
    top: -70,
    right: -60,
  },
  circleSm: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accentGreen,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  greeting: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
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
  notiDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentOrange,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#9EE7E5',
    letterSpacing: 1,
    marginTop: 22,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  heroTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroFill: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#9EE7E5',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },

  // STATS NỔI
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -36,
    borderRadius: 20,
    paddingVertical: 16,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borderLight,
  },

  // SECTION
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
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // CA TIẾP THEO
  nextCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderFocus,
    ...SHADOWS.card,
  },
  nextTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  nextName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF1EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accentOrange,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentOrange,
  },
  nextInfoRow: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  nextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  nextActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  outlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.primarySoft,
  },
  outlineBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  solidBtn: {
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  solidBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.white,
  },

  // LỐI TẮT
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  shortcut: {
    flex: 1,
    alignItems: 'center',
  },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // TIMELINE
  timelineRow: {
    flexDirection: 'row',
  },
  timeText: {
    width: 46,
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  timelineCol: {
    width: 22,
    alignItems: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginTop: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  dotNext: {
    borderColor: COLORS.primary,
    borderWidth: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.borderLight,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 8,
    padding: 10,
    borderRadius: 14,
  },
  timelineContentActive: {
    backgroundColor: COLORS.surfaceTeal,
  },

  // HỌC VIÊN NGANG
  memberList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  memberCard: {
    width: 140,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  goalTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 5,
  },
  goalText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  miniTrack: {
    alignSelf: 'stretch',
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
    marginTop: 10,
  },
  miniFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
});
