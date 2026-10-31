import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - tuần 26/10 → 01/11/2026
const TODAY = 31;
const WEEK = [
  { day: 'T2', date: 26 },
  { day: 'T3', date: 27 },
  { day: 'T4', date: 28 },
  { day: 'T5', date: 29 },
  { day: 'T6', date: 30 },
  { day: 'T7', date: 31 },
  { day: 'CN', date: 1 },
];

const SCHEDULES = [
  { id: '1', date: 31, time: '09:00', end: '10:00', member: 'Nguyễn Văn An', type: 'Tập thể lực & Tăng cơ', place: 'Phòng Gym A', status: 'done', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: '2', date: 31, time: '14:30', end: '15:15', member: 'Trần Minh Anh', type: 'Cardio & Giảm mỡ', place: 'Khu Cardio', status: 'next', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: '3', date: 31, time: '18:00', end: '19:00', member: 'Lê Hoàng Nam', type: 'Full Body Kháng lực', place: 'Phòng Gym B', status: 'upcoming', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: '4', date: 28, time: '10:00', end: '11:00', member: 'Phạm Thu Hà', type: 'Giảm cân chuyên sâu', place: 'Phòng Gym A', status: 'done', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { id: '5', date: 29, time: '07:30', end: '08:20', member: 'Võ Minh Khang', type: 'Upper Body', place: 'Phòng Gym B', status: 'done', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' },
  { id: '6', date: 1, time: '08:00', end: '09:00', member: 'Nguyễn Văn An', type: 'Leg Day', place: 'Phòng Gym A', status: 'upcoming', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
];

const STATUS = {
  done: { label: 'Hoàn thành', color: COLORS.accentGreen, bg: '#ECFDF5' },
  next: { label: 'Sắp diễn ra', color: COLORS.accentOrange, bg: '#FFF1EC' },
  upcoming: { label: 'Đã lên lịch', color: COLORS.accentBlue, bg: '#EAF3FC' },
};

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const daySchedules = SCHEDULES.filter((item) => item.date === selectedDate);
  const doneCount = daySchedules.filter((item) => item.status === 'done').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. HEADER GRADIENT + CHỌN NGÀY */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circleLg} />

          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.headerSub}>Lịch huấn luyện</Text>
              <Text style={styles.headerTitle}>Tháng 10, 2026</Text>
            </View>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.glassBtn, styles.addBtn]} activeOpacity={0.8}>
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEK.map((item) => {
              const selected = item.date === selectedDate;
              const hasSchedule = SCHEDULES.some((s) => s.date === item.date);
              return (
                <TouchableOpacity
                  key={item.date}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(item.date)}
                  style={[styles.dayPill, selected && styles.dayPillActive]}>
                  <Text style={[styles.dayLabel, selected && styles.dayLabelActive]}>{item.day}</Text>
                  <Text style={[styles.dayDate, selected && styles.dayDateActive]}>{item.date}</Text>
                  <View style={[styles.dayDot, hasSchedule && styles.dayDotOn, selected && hasSchedule && styles.dayDotActive]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        {/* 2. TÓM TẮT NGÀY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="barbell" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.summaryTitle}>
              {selectedDate === TODAY ? 'Hôm nay' : `Ngày ${selectedDate}`} • {daySchedules.length} ca dạy
            </Text>
            <Text style={styles.subText}>
              {doneCount} hoàn thành • {daySchedules.length - doneCount} sắp tới
            </Text>
          </View>
        </View>

        {/* 3. DANH SÁCH CA DẠY */}
        <View style={styles.body}>
          {daySchedules.map((item) => {
            const status = STATUS[item.status as keyof typeof STATUS];
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.timeCol}>
                  <Text style={[styles.timeText, item.status === 'next' && { color: COLORS.primary }]}>{item.time}</Text>
                  <Text style={styles.endText}>{item.end}</Text>
                </View>

                <View
                  style={[
                    styles.scheduleCard,
                    item.status === 'next' && styles.scheduleCardActive,
                    item.status === 'done' && styles.scheduleCardDone,
                  ]}>
                  <View style={[styles.accentBar, { backgroundColor: status.color }]} />
                  <View style={styles.cardTop}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    <View style={styles.flex}>
                      <Text style={styles.memberName}>{item.member}</Text>
                      <Text style={styles.subText}>{item.type}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBottom}>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{item.place}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {daySchedules.length === 0 && (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cafe-outline" size={34} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Ngày nghỉ ngơi</Text>
              <Text style={styles.subText}>Chưa có buổi tập nào được lên lịch.</Text>
              <TouchableOpacity style={styles.emptyBtn} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color={COLORS.white} />
                <Text style={styles.emptyBtnText}>Thêm ca dạy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Schedule;

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
    marginTop: 18,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 50,
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
    gap: 10,
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
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: COLORS.white,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  dayPill: {
    width: 44,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dayPillActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
  },
  dayLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  dayLabelActive: {
    color: COLORS.textMuted,
  },
  dayDate: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 4,
  },
  dayDateActive: {
    color: COLORS.primary,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
    backgroundColor: COLORS.transparent,
  },
  dayDotOn: {
    backgroundColor: '#9EE7E5',
  },
  dayDotActive: {
    backgroundColor: COLORS.accentOrange,
  },

  // TÓM TẮT
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 18,
    padding: 14,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // CA DẠY
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeCol: {
    width: 52,
    paddingTop: 14,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  endText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    paddingLeft: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  scheduleCardActive: {
    borderColor: COLORS.borderFocus,
    borderWidth: 1.5,
  },
  scheduleCardDone: {
    opacity: 0.75,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // EMPTY
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 14,
    marginTop: 16,
    ...SHADOWS.glow,
  },
  emptyBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.white,
  },
});
