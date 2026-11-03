import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

const DAYS_OF_WEEK = [
  { id: 2, label: 'T2', full: 'Thứ Hai' },
  { id: 3, label: 'T3', full: 'Thứ Ba' },
  { id: 4, label: 'T4', full: 'Thứ Tư' },
  { id: 5, label: 'T5', full: 'Thứ Năm' },
  { id: 6, label: 'T6', full: 'Thứ Sáu' },
  { id: 7, label: 'T7', full: 'Thứ Bảy' },
  { id: 8, label: 'CN', full: 'Chủ Nhật' },
];

const TIME_SLOTS = [
  '06:00 - 07:00 (Sáng sớm)',
  '08:30 - 09:30 (Buổi sáng)',
  '12:00 - 13:00 (Buổi trưa)',
  '17:30 - 18:30 (Chiều tối)',
  '19:00 - 20:00 (Tối muộn)',
];

const ChangeWorkoutScheduleScreen = ({ navigation }: any) => {
  // Main Tab: 'auto_trainer' | 'custom'
  const [activeTab, setActiveTab] = useState<'auto_trainer' | 'custom'>('auto_trainer');

  // Custom sub-mode: 'fixed_days' | 'cycle'
  const [customMode, setCustomMode] = useState<'fixed_days' | 'cycle'>('fixed_days');

  // State cho chế độ ngày cố định
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 4, 6]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[3]);

  // State cho chế độ chu kỳ (Ngày tập liên tiếp & Ngày nghỉ liên tiếp)
  const [startDayOffset, setStartDayOffset] = useState(0); // 0 = Hôm nay, 1 = Ngày mai
  const [consecutiveWorkoutDays, setConsecutiveWorkoutDays] = useState(3);
  const [consecutiveRestDays, setConsecutiveRestDays] = useState(1);

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) {
        Alert.alert('Lưu ý', 'Bạn cần chọn ít nhất 1 ngày tập trong tuần.');
        return;
      }
      setSelectedDays(selectedDays.filter((id) => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  // Tính trước 14 ngày theo chu kỳ tập / nghỉ
  const generateCyclePreview = () => {
    const list = [];
    const totalCycle = consecutiveWorkoutDays + consecutiveRestDays;
    const now = new Date();
    now.setDate(now.getDate() + startDayOffset);

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);

      const cycleIndex = i % totalCycle;
      const isWorkout = cycleIndex < consecutiveWorkoutDays;

      const dateStr = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = dayNames[targetDate.getDay()];

      list.push({
        index: i + 1,
        dateStr,
        dayName,
        isWorkout,
        activity: isWorkout ? `Buổi tập ${cycleIndex + 1}` : '🌴 Nghỉ ngơi phục hồi',
      });
    }
    return list;
  };

  const handleSaveSchedule = () => {
    if (activeTab === 'auto_trainer') {
      Alert.alert(
        'Đã lưu cài đặt!',
        'Lịch tập của bạn sẽ được tự động đồng bộ theo lịch xếp của Huấn luyện viên.',
        [{ text: 'Đồng ý', onPress: () => navigation.goBack() }]
      );
    } else if (customMode === 'fixed_days') {
      const daysText = selectedDays
        .map((d) => DAYS_OF_WEEK.find((item) => item.id === d)?.label)
        .join(', ');
      Alert.alert(
        'Cập nhật thành công!',
        `Lịch tập mới: ${daysText}\nKhung giờ: ${selectedTimeSlot}`,
        [{ text: 'Đồng ý', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert(
        'Cập nhật chu kỳ thành công!',
        `Chu kỳ mới: ${consecutiveWorkoutDays} ngày tập liên tiếp / ${consecutiveRestDays} ngày nghỉ.\nToàn bộ lịch tập đã được tạo lại theo chu kỳ này.`,
        [{ text: 'Đồng ý', onPress: () => navigation.goBack() }]
      );
    }
  };

  const cyclePreview = generateCyclePreview();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi Lịch Tập Luyện</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* MAIN TABS: TỰ ĐỘNG THEO HLV vs TỰ CHỈNH */}
        <View style={styles.mainTabWrap}>
          <TouchableOpacity
            style={[styles.mainTabBtn, activeTab === 'auto_trainer' && styles.mainTabBtnActive]}
            onPress={() => setActiveTab('auto_trainer')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color={activeTab === 'auto_trainer' ? '#FFFFFF' : COLORS.textMuted} />
            <Text style={[styles.mainTabText, activeTab === 'auto_trainer' && styles.mainTabTextActive]}>
              Theo Huấn Luyện Viên
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTabBtn, activeTab === 'custom' && styles.mainTabBtnActive]}
            onPress={() => setActiveTab('custom')}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={16} color={activeTab === 'custom' ? '#FFFFFF' : COLORS.textMuted} />
            <Text style={[styles.mainTabText, activeTab === 'custom' && styles.mainTabTextActive]}>
              Tự Chỉnh Lịch
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= TAB 1: TỰ ĐỘNG THEO HLV ================= */}
        {activeTab === 'auto_trainer' && (
          <View>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.trainerScheduleCard}>
              <View style={styles.trainerBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#A7F3D0" />
                <Text style={styles.trainerBadgeText}>CHẾ ĐỘ TỐI ƯU CHUYÊN SÂU</Text>
              </View>

              <Text style={styles.trainerCardTitle}>Đồng bộ tự động cùng HLV Hoàng Nam</Text>
              <Text style={styles.trainerCardDesc}>
                Huấn luyện viên của bạn sẽ trực tiếp sắp xếp lịch tập, đảm bảo cơ bắp có đủ thời gian phục hồi và đạt hiệu quả tối đa.
              </Text>

              <View style={styles.autoSyncPill}>
                <Ionicons name="sync-circle" size={17} color="#FDE68A" />
                <Text style={styles.autoSyncPillText}>Khi HLV dời ca (qua duyệt), lịch của bạn sẽ tự động nhảy theo</Text>
              </View>
            </LinearGradient>

            <Text style={styles.sectionHeaderTitle}>Lịch tập HLV đã xếp tuần này</Text>
            <View style={styles.scheduleListCard}>
              {[
                { day: 'Thứ Hai', time: '09:00 - 10:00', focus: 'Ngực & Tay sau', place: 'Khu tạ tự do' },
                { day: 'Thứ Tư', time: '09:00 - 10:00', focus: 'Lưng & Tay trước', place: 'Khu máy kéo' },
                { day: 'Thứ Sáu', time: '09:00 - 10:00', focus: 'Chân & Cơ bụng', place: 'Khu Squat rack' },
              ].map((item, index) => (
                <View key={item.day} style={[styles.sessionRow, index < 2 && styles.sessionRowBorder]}>
                  <View style={styles.sessionDayBox}>
                    <Text style={styles.sessionDayText}>{item.day}</Text>
                    <Text style={styles.sessionTimeText}>{item.time}</Text>
                  </View>
                  <View style={styles.sessionFocusBox}>
                    <Text style={styles.sessionFocusText}>{item.focus}</Text>
                    <View style={styles.sessionPlaceRow}>
                      <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.sessionPlaceText}>{item.place}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ================= TAB 2: TỰ CHỈNH LỊCH ================= */}
        {activeTab === 'custom' && (
          <View>
            {/* SUB-MODE SEGMENT */}
            <View style={styles.subModeWrap}>
              <TouchableOpacity
                style={[styles.subModeBtn, customMode === 'fixed_days' && styles.subModeBtnActive]}
                onPress={() => setCustomMode('fixed_days')}
                activeOpacity={0.8}
              >
                <Text style={[styles.subModeText, customMode === 'fixed_days' && styles.subModeTextActive]}>
                  📅 Thứ Cố Định Trong Tuần
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subModeBtn, customMode === 'cycle' && styles.subModeBtnActive]}
                onPress={() => setCustomMode('cycle')}
                activeOpacity={0.8}
              >
                <Text style={[styles.subModeText, customMode === 'cycle' && styles.subModeTextActive]}>
                  🔄 Theo Chu Kỳ Tập / Nghỉ
                </Text>
              </TouchableOpacity>
            </View>

            {/* CHẾ ĐỘ 1: THỨ CỐ ĐỊNH TRONG TUẦN */}
            {customMode === 'fixed_days' && (
              <View style={styles.customCard}>
                <Text style={styles.cardSectionLabel}>Chọn các ngày tập trong tuần</Text>
                <View style={styles.daysGrid}>
                  {DAYS_OF_WEEK.map((item) => {
                    const isSelected = selectedDays.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.dayCircleBtn, isSelected && styles.dayCircleBtnSelected]}
                        onPress={() => toggleDay(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.dayCircleLabel, isSelected && styles.dayCircleLabelSelected]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.cardSectionLabel}>Khung giờ tập ưu tiên</Text>
                <View style={styles.timeSlotList}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.timeSlotRow, isSelected && styles.timeSlotRowSelected]}
                        onPress={() => setSelectedTimeSlot(slot)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={isSelected ? COLORS.primary : COLORS.textLight}
                        />
                        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>{slot}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* CHẾ ĐỘ 2: THEO CHU KỲ (TẬP LIÊN TIẾP & NGHỈ LIÊN TIẾP) */}
            {customMode === 'cycle' && (
              <View>
                <View style={styles.customCard}>
                  {/* BẮT ĐẦU TỪ KHI NÀO */}
                  <Text style={styles.cardSectionLabel}>Ngày bắt đầu chu kỳ</Text>
                  <View style={styles.startDayRow}>
                    <TouchableOpacity
                      style={[styles.startDayPill, startDayOffset === 0 && styles.startDayPillActive]}
                      onPress={() => setStartDayOffset(0)}
                    >
                      <Text style={[styles.startDayText, startDayOffset === 0 && styles.startDayTextActive]}>
                        Hôm nay
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.startDayPill, startDayOffset === 1 && styles.startDayPillActive]}
                      onPress={() => setStartDayOffset(1)}
                    >
                      <Text style={[styles.startDayText, startDayOffset === 1 && styles.startDayTextActive]}>
                        Ngày mai
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* SỐ NGÀY TẬP LIÊN TIẾP */}
                  <View style={styles.counterRow}>
                    <View style={styles.counterInfo}>
                      <Text style={styles.counterLabel}>Số ngày tập luyện liên tiếp</Text>
                      <Text style={styles.counterSub}>Số buổi tập thực hiện liền nhau</Text>
                    </View>
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setConsecutiveWorkoutDays(Math.max(1, consecutiveWorkoutDays - 1))}
                      >
                        <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{consecutiveWorkoutDays} ngày</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setConsecutiveWorkoutDays(Math.min(7, consecutiveWorkoutDays + 1))}
                      >
                        <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* SỐ NGÀY NGHỈ LIÊN TIẾP */}
                  <View style={styles.counterRow}>
                    <View style={styles.counterInfo}>
                      <Text style={styles.counterLabel}>Số ngày nghỉ ngơi liên tiếp</Text>
                      <Text style={styles.counterSub}>Số ngày nghỉ để cơ bắp phục hồi</Text>
                    </View>
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setConsecutiveRestDays(Math.max(1, consecutiveRestDays - 1))}
                      >
                        <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{consecutiveRestDays} ngày</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setConsecutiveRestDays(Math.min(5, consecutiveRestDays + 1))}
                      >
                        <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* XEM TRƯỚC LỊCH 12 NGÀY TỚI */}
                <Text style={styles.sectionHeaderTitle}>Xem trước lịch 12 ngày tới</Text>
                <View style={styles.previewGrid}>
                  {cyclePreview.map((item) => (
                    <View
                      key={item.index}
                      style={[styles.previewItemCard, item.isWorkout ? styles.workoutCard : styles.restCard]}
                    >
                      <View style={styles.previewItemTop}>
                        <Text style={[styles.previewDayText, item.isWorkout ? styles.workoutText : styles.restText]}>
                          {item.dayName}
                        </Text>
                        <Text style={styles.previewDateText}>{item.dateStr}</Text>
                      </View>
                      <View style={[styles.previewBadge, item.isWorkout ? styles.workoutBadge : styles.restBadge]}>
                        <Ionicons
                          name={item.isWorkout ? 'barbell' : 'cafe'}
                          size={12}
                          color={item.isWorkout ? COLORS.primary : '#D97706'}
                        />
                        <Text style={[styles.previewBadgeText, item.isWorkout ? styles.workoutBadgeText : styles.restBadgeText]}>
                          {item.isWorkout ? 'Tập' : 'Nghỉ'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* NÚT LƯU VÀ CẬP NHẬT LỊCH */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSchedule} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>LƯU VÀ CẬP NHẬT LỊCH TẬP</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangeWorkoutScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSpace: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // MAIN TABS
  mainTabWrap: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
    padding: 4,
    marginBottom: 16,
  },
  mainTabBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mainTabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  mainTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  mainTabTextActive: {
    color: '#FFFFFF',
  },

  // CARD THEO HLV
  trainerScheduleCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.glow,
  },
  trainerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    marginBottom: 10,
  },
  trainerBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#A7F3D0',
  },
  trainerCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  trainerCardDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 19,
    marginBottom: 14,
  },
  autoSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  autoSyncPillText: {
    fontSize: 11.5,
    color: '#FDE68A',
    fontWeight: '600',
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  scheduleListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...SHADOWS.card,
    marginBottom: 20,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sessionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sessionDayBox: {
    width: 100,
  },
  sessionDayText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sessionTimeText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sessionFocusBox: {
    flex: 1,
  },
  sessionFocusText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sessionPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  sessionPlaceText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
  },

  // SUB-MODE SEGMENT
  subModeWrap: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subModeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subModeBtnActive: {
    backgroundColor: COLORS.surfaceTeal,
  },
  subModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  subModeTextActive: {
    color: COLORS.primary,
  },

  // CUSTOM CARD
  customCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  cardSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleBtnSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCircleLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  dayCircleLabelSelected: {
    color: '#FFFFFF',
  },
  timeSlotList: {
    gap: 8,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeSlotRowSelected: {
    backgroundColor: COLORS.surfaceTeal,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  timeSlotTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // START DAY
  startDayRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  startDayPill: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  startDayPillActive: {
    backgroundColor: COLORS.surfaceTeal,
    borderColor: COLORS.primary,
  },
  startDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  startDayTextActive: {
    color: COLORS.primary,
  },

  // COUNTER STEPPER
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  counterInfo: {
    flex: 1,
  },
  counterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  counterSub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  stepValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    minWidth: 46,
    textAlign: 'center',
  },

  // PREVIEW GRID
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  previewItemCard: {
    width: '31.5%',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A7F3D0',
  },
  restCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  previewItemTop: {
    alignItems: 'center',
    marginBottom: 6,
  },
  previewDayText: {
    fontSize: 13,
    fontWeight: '800',
  },
  workoutText: {
    color: COLORS.primary,
  },
  restText: {
    color: '#D97706',
  },
  previewDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  workoutBadge: {
    backgroundColor: COLORS.surfaceTeal,
  },
  restBadge: {
    backgroundColor: '#FDE68A',
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  workoutBadgeText: {
    color: COLORS.primary,
  },
  restBadgeText: {
    color: '#92400E',
  },

  // SAVE BUTTON
  saveBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  saveBtnGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
});

