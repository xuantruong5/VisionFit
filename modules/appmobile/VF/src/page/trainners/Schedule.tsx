import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image, Modal, TextInput, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { TRAINER_COLORS as COLORS, TRAINER_SHADOWS as SHADOWS } from '../../general/theme';

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

const INITIAL_SCHEDULES = [
  { id: '1', date: 31, time: '09:00', end: '10:00', member: 'Nguyễn Văn An', type: 'Tập thể lực & Tăng cơ', place: 'Phòng Gym A', status: 'done', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: '2', date: 31, time: '14:30', end: '15:15', member: 'Trần Minh Anh', type: 'Cardio & Giảm mỡ', place: 'Khu Cardio', status: 'next', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: '3', date: 31, time: '18:00', end: '19:00', member: 'Lê Hoàng Nam', type: 'Full Body Kháng lực', place: 'Phòng Gym B', status: 'cho_duyet', changeReason: 'Học viên bận đột xuất xin dời ca', proposedTime: '02/11 lúc 18:00', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: '4', date: 28, time: '10:00', end: '11:00', member: 'Phạm Thu Hà', type: 'Giảm cân chuyên sâu', place: 'Phòng Gym A', status: 'done', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { id: '5', date: 29, time: '07:30', end: '08:20', member: 'Võ Minh Khang', type: 'Upper Body', place: 'Phòng Gym B', status: 'done', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' },
  { id: '6', date: 1, time: '08:00', end: '09:00', member: 'Nguyễn Văn An', type: 'Leg Day', place: 'Phòng Gym A', status: 'upcoming', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
];

const STATUS = {
  done: { label: 'Hoàn thành', color: COLORS.accentGreen, bg: '#ECFDF5' },
  next: { label: 'Sắp diễn ra', color: COLORS.accentOrange, bg: '#FFF1EC' },
  upcoming: { label: 'Đã lên lịch', color: COLORS.accentBlue, bg: '#EAF3FC' },
  cho_duyet: { label: 'Đang chờ duyệt đổi lịch', color: '#D97706', bg: '#FEF3C7' },
};

const Schedule = ({ navigation, route }: any) => {
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newDate, setNewDate] = useState('02/11/2026');
  const [newTime, setNewTime] = useState('15:00 - 16:00');
  const [reason, setReason] = useState('');

  const daySchedules = schedules.filter((item) => item.date === selectedDate);
  const doneCount = daySchedules.filter((item) => item.status === 'done').length;

  const handlePressSession = (session: any) => {
    if (session.status === 'cho_duyet') {
      Alert.alert(
        'Đang chờ duyệt đổi lịch',
        `Ca tập này đã được gửi yêu cầu dời lịch sang ${session.proposedTime || 'ngày mới'}.\nLý do: "${session.changeReason || 'Học viên bận đột xuất'}"\nVui lòng chờ Admin xét duyệt.`
      );
      return;
    }
    if (session.status === 'done') {
      Alert.alert('Buổi tập hoàn thành', `Ca dạy với học viên ${session.member} đã hoàn thành tốt đẹp.`);
      return;
    }
    setSelectedSession(session);
    setReason('');
    setShowChangeModal(true);
  };

  const handleSubmitChange = () => {
    if (!reason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do thay đổi lịch tập.');
      return;
    }
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === selectedSession.id
          ? {
              ...s,
              status: 'cho_duyet',
              changeReason: reason,
              proposedTime: `${newDate} lúc ${newTime}`,
            }
          : s
      )
    );
    setShowChangeModal(false);
    Alert.alert(
      'Đã gửi yêu cầu đổi lịch!',
      `Yêu cầu dời ca tập của học viên ${selectedSession.member} sang ${newDate} (${newTime}) đã được gửi đến Ban quản trị.\n\nCa tập được gắn huy hiệu màu vàng cam: "Đang chờ duyệt đổi lịch".`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. HEADER GRADIENT + CHỌN NGÀY */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circleLg} />

          <View style={styles.headerRow}>
            {(navigation?.canGoBack?.() || route?.params?.fromMember) ? (
              <TouchableOpacity
                style={[styles.glassBtn, { marginRight: 12 }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (navigation?.canGoBack?.()) {
                    navigation.goBack();
                  } else {
                    navigation?.navigate?.('MainTabs', { screen: 'Members' });
                  }
                }}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.white} />
              </TouchableOpacity>
            ) : null}
            <View style={styles.flex}>
              <Text style={styles.headerSub}>Lịch huấn luyện</Text>
              <Text style={styles.headerTitle}>Tháng 10, 2026</Text>
            </View>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.glassBtn, styles.addBtn]} activeOpacity={0.8} onPress={() => navigation?.navigate('CreateSchedule')}>
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

        </LinearGradient>

        {/* 2. DẢI CHỌN NGÀY TRONG TUẦN */}
        <LinearGradient colors={[COLORS.primaryLight, COLORS.primarySoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.weekStrip}>
          {WEEK.map((item) => {
            const selected = item.date === selectedDate;
            const isToday = item.date === TODAY;
            const hasSchedule = schedules.some((s) => s.date === item.date);
            return (
              <TouchableOpacity
                key={item.date}
                activeOpacity={0.8}
                onPress={() => setSelectedDate(item.date)}
                style={styles.dayItem}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]} numberOfLines={1}>
                  {isToday ? 'Hôm nay' : item.day}
                </Text>
                {selected ? (
                  <LinearGradient colors={['#5FD0DA', COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.dayCircle, styles.dayCircleSelected]}>
                    <Text style={[styles.dayDate, styles.dayDateActive]}>{item.date}</Text>
                    {hasSchedule && <View style={styles.innerDot} />}
                  </LinearGradient>
                ) : (
                  <View style={[styles.dayCircle, hasSchedule && styles.dayCircleWithDot]}>
                    <Text style={styles.dayDate}>{item.date}</Text>
                    {hasSchedule && <View style={[styles.innerDot, styles.innerDotIdle]} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </LinearGradient>

        {/* 3. TÓM TẮT NGÀY */}
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

        {/* 4. DANH SÁCH CA DẠY */}
        <View style={styles.body}>
          {daySchedules.map((item) => {
            const status = STATUS[item.status as keyof typeof STATUS] || STATUS.upcoming;
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.timeCol}>
                  <Text style={[styles.timeText, item.status === 'next' && { color: COLORS.primary }]}>{item.time}</Text>
                  <Text style={styles.endText}>{item.end}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handlePressSession(item)}
                  style={[
                    styles.scheduleCard,
                    item.status === 'next' && styles.scheduleCardActive,
                    item.status === 'done' && styles.scheduleCardDone,
                    item.status === 'cho_duyet' && styles.scheduleCardPending,
                  ]}>
                  <View style={[styles.accentBar, { backgroundColor: status.color }]} />
                  <View style={styles.cardTop}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    <View style={styles.flex}>
                      <Text style={styles.memberName}>{item.member}</Text>
                      <Text style={styles.subText}>{item.type}</Text>
                    </View>
                    {item.status !== 'done' && item.status !== 'cho_duyet' && (
                      <View style={styles.changeActionPill}>
                        <Ionicons name="swap-horizontal" size={12} color={COLORS.primary} />
                        <Text style={styles.changeActionText}>Dời ca</Text>
                      </View>
                    )}
                  </View>

                  {/* THÔNG BÁO NẾU ĐANG CHỜ DUYỆT ĐỔI LỊCH */}
                  {item.status === 'cho_duyet' && (
                    <View style={styles.pendingChangeNotice}>
                      <Ionicons name="time" size={13} color="#D97706" />
                      <Text style={styles.pendingChangeText} numberOfLines={1}>
                        Chờ Admin duyệt: Dời sang {item.proposedTime}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardBottom}>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{item.place}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
              <TouchableOpacity style={styles.emptyBtn} activeOpacity={0.85} onPress={() => navigation?.navigate('CreateSchedule')}>
                <Ionicons name="add" size={18} color={COLORS.white} />
                <Text style={styles.emptyBtnText}>Thêm ca dạy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL YÊU CẦU ĐỔI LỊCH / DỜI CA */}
      {showChangeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Yêu Cầu Dời Ca Huấn Luyện</Text>
              </View>
              <TouchableOpacity onPress={() => setShowChangeModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {selectedSession && (
              <View style={styles.sessionBrief}>
                <Text style={styles.sessionBriefMember}>Học viên: <Text style={{ fontWeight: '800' }}>{selectedSession.member}</Text></Text>
                <Text style={styles.sessionBriefCurrent}>Ca hiện tại: Ngày {selectedSession.date}/10 lúc {selectedSession.time}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Chọn ngày tập mới</Text>
            <View style={styles.dateOptionRow}>
              {['01/11', '02/11', '03/11', '04/11'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dateOptionPill, newDate.startsWith(d) && styles.dateOptionPillActive]}
                  onPress={() => setNewDate(`${d}/2026`)}>
                  <Text style={[styles.dateOptionText, newDate.startsWith(d) && styles.dateOptionTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Khung giờ mới</Text>
            <View style={styles.dateOptionRow}>
              {['08:00 - 09:00', '15:00 - 16:00', '18:00 - 19:00'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.dateOptionPill, newTime === t && styles.dateOptionPillActive]}
                  onPress={() => setNewTime(t)}>
                  <Text style={[styles.dateOptionText, newTime === t && styles.dateOptionTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Lý do dời ca (Bắt buộc để Admin duyệt)</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="VD: Học viên bận việc đột xuất xin dời, HLV có ca training..."
              placeholderTextColor={COLORS.textLight}
              value={reason}
              onChangeText={setReason}
              multiline={true}
              numberOfLines={3}
            />

            <View style={styles.adminReviewNotice}>
              <Ionicons name="information-circle-outline" size={16} color="#D97706" />
              <Text style={styles.adminReviewNoticeText}>
                Yêu cầu này sẽ chuyển sang trạng thái "Chờ duyệt" và gửi đến Ban quản trị. Sau khi Admin duyệt, lịch sẽ được cập nhật chính thức.
              </Text>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowChangeModal(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitChange} activeOpacity={0.85}>
                <Text style={styles.submitBtnText}>GỬI YÊU CẦU</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    fontWeight: '600',
  },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
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
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
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
  weekStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 28,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  dayLabelToday: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    borderColor: COLORS.white,
    paddingBottom: 6,
  },
  dayCircleWithDot: {
    paddingBottom: 6,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayDateActive: {
    color: COLORS.white,
  },
  innerDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  innerDotIdle: {
    borderColor: COLORS.primary,
  },

  // TÓM TẮT
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 26,
    padding: 14,
    ...SHADOWS.card,
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  endText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    fontWeight: '600',
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 14,
    paddingLeft: 18,
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
    fontWeight: '600',
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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 999,
    marginTop: 16,
    ...SHADOWS.glow,
  },
  emptyBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.white,
  },

  // THÊM CHO TRẠNG THÁI ĐỔI LỊCH & MODAL
  scheduleCardPending: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  changeActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 3,
  },
  changeActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pendingChangeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
    gap: 5,
  },
  pendingChangeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
    flex: 1,
  },

  // MODAL ĐỔI LỊCH
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sessionBrief: {
    backgroundColor: COLORS.surfaceTeal,
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  sessionBriefMember: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sessionBriefCurrent: {
    fontSize: 12.5,
    color: COLORS.primaryDark,
    marginTop: 3,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 6,
  },
  dateOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  dateOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateOptionPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dateOptionTextActive: {
    color: '#FFFFFF',
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 12,
    fontSize: 13.5,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: 14,
  },
  adminReviewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    gap: 7,
    marginBottom: 18,
  },
  adminReviewNoticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
});
