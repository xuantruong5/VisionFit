import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SAGE as PASTEL, RADIUS, SOFT_SHADOW } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const TRAINER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80';

const STATS = [
  { icon: 'calendar-outline', value: '8', label: 'Ca hôm nay', bg: PASTEL.tealSoft, ink: PASTEL.teal, route: 'Schedule' },
  { icon: 'people-outline', value: '24', label: 'Học viên', bg: PASTEL.mint, ink: PASTEL.mintInk, route: 'Members' },
  { icon: 'star-outline', value: '4.9', label: 'Đánh giá', bg: PASTEL.butter, ink: PASTEL.butterInk, route: 'Profile' },
  { icon: 'wallet-outline', value: '12.5tr', label: 'Thu nhập', bg: PASTEL.peach, ink: PASTEL.peachInk, route: 'Income' },
];

const NEXT_SESSION = {
  member: 'Trần Minh Anh',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  type: 'Cardio & Giảm mỡ',
  start: '14:30',
  place: 'Khu Cardio',
};

const TODAY_SESSIONS = [
  { time: '09:00', member: 'Nguyễn Văn An', type: 'Tập thể lực & Tăng cơ', done: true },
  { time: '14:30', member: 'Trần Minh Anh', type: 'Cardio & Giảm mỡ', next: true },
  { time: '18:00', member: 'Lê Hoàng Nam', type: 'Full Body Kháng lực' },
];

const RECENT_MEMBERS = [
  { name: 'Nguyễn Văn An', goal: 'Giảm cân', sessions: 18, totalSessions: 24, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { name: 'Trần Minh Anh', goal: 'Tăng cơ', sessions: 12, totalSessions: 20, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { name: 'Phạm Thu Hà', goal: 'Giảm cân', sessions: 21, totalSessions: 24, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
];

const HomePage = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. LỜI CHÀO */}
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.navigate('Profile')}>
            <Image source={{ uri: TRAINER_AVATAR }} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.flex}>
            <View style={styles.greetingRow}>
              <Ionicons name="sunny" size={13} color={PASTEL.butterInk} />
              <Text style={styles.greeting}>Chào buổi sáng</Text>
            </View>
            <Text style={styles.name}>HLV Nguyễn Trainer</Text>
          </View>
          <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.navigate('ChatList')}>
            <Ionicons name="chatbubble-outline" size={19} color={PASTEL.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.navigate('TrainerNotifications')}>
            <Ionicons name="notifications-outline" size={19} color={PASTEL.ink} />
            <View style={styles.notiDot} />
          </TouchableOpacity>
        </View>

        {/* 2. TỔNG QUAN HÔM NAY */}
        <View style={styles.todayCard}>
          <View style={styles.flex}>
            <Text style={styles.todayLabel}>Hôm nay bạn có</Text>
            <Text style={styles.todayValue}>
              8 <Text style={styles.todayUnit}>ca dạy</Text>
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '37%' }]} />
            </View>
          </View>
          <View style={styles.todayCount}>
            <Text style={styles.todayCountValue}>3</Text>
            <Text style={styles.todayCountTotal}>/8 xong</Text>
          </View>
        </View>

        {/* 3. THỐNG KÊ */}
        <Text style={styles.sectionTitle}>Tổng quan</Text>
        <View style={styles.grid}>
          {STATS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.statCard}
              activeOpacity={0.85}
              onPress={() => navigation?.navigate(item.route)}>
              <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={18} color={item.ink} />
              </View>
              <View>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. CA DẠY TIẾP THEO - KHỐI TỐI */}
        <View style={styles.darkBlock}>
          <View style={styles.darkHeader}>
            <Text style={styles.darkTitle}>Ca dạy tiếp theo</Text>
            <Text style={styles.darkTime}>{NEXT_SESSION.start}</Text>
          </View>
          <View style={styles.nextRow}>
            <Image source={{ uri: NEXT_SESSION.avatar }} style={styles.nextAvatar} />
            <View style={styles.flex}>
              <Text style={styles.nextName}>{NEXT_SESSION.member}</Text>
              <Text style={styles.nextSub}>
                {NEXT_SESSION.type} · {NEXT_SESSION.place}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.whiteCircle}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('ChatRoom', { name: NEXT_SESSION.member })}>
              <Ionicons name="chatbubble-outline" size={17} color={PASTEL.dark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.whiteCircle} activeOpacity={0.8}>
              <Ionicons name="call-outline" size={17} color={PASTEL.dark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. LỊCH HÔM NAY */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Lịch hôm nay</Text>
          <TouchableOpacity style={styles.linkPill} onPress={() => navigation?.navigate('Schedule')}>
            <Text style={styles.linkText}>Xem lịch</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {TODAY_SESSIONS.map((item) => (
            <View key={item.time} style={[styles.sessionRow, item.next && styles.sessionRowActive]}>
              <Text style={[styles.sessionTime, item.done && styles.mutedText]}>{item.time}</Text>
              <View style={styles.flex}>
                <Text style={[styles.sessionName, item.done && styles.mutedText]}>{item.member}</Text>
                <Text style={styles.sessionType}>{item.type}</Text>
              </View>
              {item.done ? (
                <View style={[styles.statusPill, styles.statusDone]}>
                  <Text style={[styles.statusText, styles.statusDoneText]}>Xong</Text>
                </View>
              ) : item.next ? (
                <View style={[styles.statusPill, styles.statusNext]}>
                  <Text style={[styles.statusText, styles.statusNextText]}>Sắp tới</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* 6. HỌC VIÊN GẦN ĐÂY */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Học viên gần đây</Text>
          <TouchableOpacity style={styles.linkPill} onPress={() => navigation?.navigate('Members')}>
            <Text style={styles.linkText}>Tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {RECENT_MEMBERS.map((item) => {
            const progress = Math.round((item.sessions / item.totalSessions) * 100);
            return (
              <TouchableOpacity
                key={item.name}
                style={styles.memberRow}
                activeOpacity={0.8}
                onPress={() => navigation?.navigate('MemberDetail', { member: item })}>
                <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
                <View style={styles.flex}>
                  <Text style={styles.memberName}>{item.name}</Text>
                  <Text style={styles.memberGoal}>
                    {item.goal} · {progress}% lộ trình
                  </Text>
                  <View style={styles.memberTrack}>
                    <View style={[styles.memberFill, { width: `${progress}%` }]} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  // LỜI CHÀO
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greeting: {
    fontSize: 12.5,
    color: PASTEL.inkSoft,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: PASTEL.ink,
    marginTop: 2,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PASTEL.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SOFT_SHADOW,
  },
  notiDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PASTEL.peachInk,
  },

  // HÔM NAY
  todayCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    backgroundColor: PASTEL.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginTop: 18,
    ...SOFT_SHADOW,
  },
  todayLabel: {
    fontSize: 13,
    color: PASTEL.inkSoft,
  },
  todayValue: {
    fontSize: 34,
    fontWeight: '300',
    color: PASTEL.ink,
    marginTop: 2,
  },
  todayUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: PASTEL.inkSoft,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: PASTEL.track,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    width: '37%',
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: PASTEL.teal,
  },
  todayCount: {
    alignItems: 'flex-end',
  },
  todayCountValue: {
    fontSize: 30,
    fontWeight: '300',
    color: PASTEL.ink,
  },
  todayCountTotal: {
    fontSize: 12,
    color: PASTEL.inkMuted,
  },

  // SECTION
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'serif',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PASTEL.ink,
    marginTop: 26,
    marginBottom: 12,
  },
  linkPill: {
    backgroundColor: PASTEL.surface,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    marginTop: 12,
    ...SOFT_SHADOW,
  },
  linkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PASTEL.ink,
  },
  card: {
    backgroundColor: PASTEL.surface,
    borderRadius: RADIUS.lg,
    padding: 8,
    ...SOFT_SHADOW,
  },

  // THỐNG KÊ
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statCard: {
    width: '48.3%',
    height: 124,
    justifyContent: 'space-between',
    backgroundColor: PASTEL.surface,
    borderRadius: 28,
    padding: 16,
    ...SOFT_SHADOW,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12.5,
    color: PASTEL.inkSoft,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '300',
    color: PASTEL.ink,
    marginTop: 2,
  },

  // KHỐI TỐI
  darkBlock: {
    backgroundColor: PASTEL.dark,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginTop: 14,
  },
  darkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  darkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PASTEL.surface,
  },
  darkTime: {
    fontSize: 28,
    fontWeight: '300',
    color: PASTEL.surface,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  nextName: {
    fontSize: 15.5,
    fontWeight: '500',
    color: PASTEL.surface,
  },
  nextSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  whiteCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PASTEL.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // LỊCH HÔM NAY
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  sessionRowActive: {
    backgroundColor: PASTEL.surfaceSoft,
  },
  sessionTime: {
    width: 48,
    fontSize: 15,
    fontWeight: '500',
    color: PASTEL.ink,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '500',
    color: PASTEL.ink,
  },
  sessionType: {
    fontSize: 12,
    color: PASTEL.inkSoft,
    marginTop: 2,
  },
  mutedText: {
    color: PASTEL.inkMuted,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusDone: {
    backgroundColor: PASTEL.mint,
  },
  statusDoneText: {
    color: PASTEL.mintInk,
  },
  statusNext: {
    backgroundColor: PASTEL.peach,
  },
  statusNextText: {
    color: PASTEL.peachInk,
  },

  // HỌC VIÊN
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
    color: PASTEL.ink,
  },
  memberGoal: {
    fontSize: 12,
    color: PASTEL.inkSoft,
    marginTop: 2,
  },
  memberTrack: {
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: PASTEL.track,
    marginTop: 8,
    overflow: 'hidden',
  },
  memberFill: {
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: PASTEL.mintInk,
  },
});
