import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image, Modal, TextInput, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { TRAINER_COLORS as COLORS, TRAINER_SHADOWS as SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';

const STATUS = {
  done: { label: 'Hoàn thành', color: COLORS.accentGreen, bg: '#ECFDF5', },
  next: { label: 'Sắp diễn ra', color: COLORS.accentOrange, bg: '#FFF1EC', },
  upcoming: { label: 'Đã lên lịch', color: COLORS.accentBlue, bg: '#EAF3FC', },
  cho_duyet: { label: 'Đang chờ duyệt đổi lịch', color: '#D97706', bg: '#FEF3C7', },
  cancelled: { label: 'Đã hủy', color: '#DC2626', bg: '#FEE2E2', },
};

const Schedule = ({ navigation, route }: any) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newDate, setNewDate] = useState('02/12/2026');
  const [newTime, setNewTime] = useState('15:00 - 16:00');
  const [reason, setReason] = useState('');

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [exerciseData, setExerciseData] = useState<any>(null);

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
  // Mở modal dời ca
  const handleOpenChange = (session: any) => {
    setSelectedSession(session);
    setReason('');
    setShowChangeModal(true);
  };

  // Xác nhận hoàn thành
  // ID của ca đang cập nhật
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Cập nhật trạng thái buổi tập PT
  const updateSessionStatus = async (id: string, tinhTrang: 3 | 4) => {
    try {
      setUpdatingId(id);
      const res = await apiFitlife.put( `/trainer/lich-pt/${id}/trang-thai`,
        {
          tinh_trang: tinhTrang,
        }
      );

      if (res.data.success) {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s,  status: tinhTrang === 3 ? 'done' : 'cancelled', } : s )
        );
        Alert.alert(
          'Thành công',
          tinhTrang === 3
            ? 'Hoàn thành buổi tập thành công.'
            : 'Hủy buổi tập thành công.'
        );
      } else {
        Alert.alert('Thông báo', res.data.message || 'Cập nhật thất bại.');
      }
    } catch (error: any) {
      console.log('Lỗi cập nhật trạng thái:', error.response?.data || error.message);
      Alert.alert( 'Thông báo', error.response?.data?.message || 'Không thể cập nhật trạng thái buổi tập.' );
    } finally {
      setUpdatingId(null);
    }
  };
  const getExercisesPT = async (id: string) => {
    try {
      setExerciseLoading(true);
      setShowExerciseModal(true);
      setExerciseData(null);
      const res = await apiFitlife.get( `/trainer/lich-pt/${id}/bai-tap` );
      if (res.data.success) {
        setExerciseData(res.data.data);
      } else {
        Alert.alert('Thông báo', res.data.message || 'Không lấy được danh sách bài tập.');
        setShowExerciseModal(false);
      }
    } catch (error: any) {
      Alert.alert(  'Thông báo', error.response?.data?.message || 'Không thể tải danh sách bài tập.' );
      setShowExerciseModal(false);
    } finally {
      setExerciseLoading(false);
    }
  };

  // Xác nhận hoàn thành
  const handleComplete = (id: string) => { updateSessionStatus(id, 3);};
  // Hủy ca tập
  const handleCancel = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn hủy ca tập này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy ca',
        style: 'destructive',
        onPress: () => updateSessionStatus(id, 4),
      },
    ]);
  };

  const today = new Date().toLocaleDateString('en-CA');
  const changeWeek = (direction: number) => {
    const date = new Date(`${selectedDate}T00:00:00`); date.setDate(date.getDate() + direction * 7);
    const start = new Date(date); start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toLocaleDateString('en-CA');
    });
    setSelectedDate(weekDates.find(d => schedules.some(s => s.date === d)) || weekDates[0]);
  };
  const weekStart = new Date(`${selectedDate}T00:00:00`);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const WEEK = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      day: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index],
      date: date.toLocaleDateString('en-CA'),
      number: date.getDate(),
    };
  });
  const daySchedules = schedules.filter(item => item.date === selectedDate);
  const doneCount = daySchedules.filter(item => item.status === 'done').length;

  const getSchedules = async () => {
    try {
      setLoading(true);
      const res = await apiFitlife.get('/trainer/lich-pt');
      if (res.data.success) {
        const data = res.data.data || [];
        const formattedData = data.map((item: any) => ({
          id: String(item.id),
          date: item.ngay_tap,
          time: item.gio_bat_dau?.slice(0, 5),
          end: item.gio_ket_thuc?.slice(0, 5),
          member: item.ho_ten || 'Học viên',
          type: item.ten_ngay_tap || 'Buổi tập PT',
          place: item.noi_tap || 'Phòng Gym',
          avatar: item.anh_dai_dien,
          changeReason: item.ghi_chu || '',
          proposedTime: item.ngay_tap ? `${new Date(item.ngay_tap + 'T00:00:00').toLocaleDateString('vi-VN')} lúc ${item.gio_bat_dau?.slice(0, 5) || ''}` : '',
          status:
            Number(item.tinh_trang) === 1 ? 'cho_duyet' :
              Number(item.tinh_trang) === 2 ? 'upcoming' :
                Number(item.tinh_trang) === 3 ? 'done' :
                  Number(item.tinh_trang) === 4 ? 'cancelled' : 'upcoming',
        }));
        setSchedules(formattedData);
        // Nếu hôm nay không có lịch thì chọn ngày tập gần nhất
        const today = new Date().toLocaleDateString('en-CA');
        const nearestSchedule = formattedData
          .filter((item: any) => item.date >= today)
          .sort((a: any, b: any) => a.date.localeCompare(b.date))[0];
        setSelectedDate(
          formattedData.some((item: any) => item.date === today)
            ? today
            : nearestSchedule?.date || today
        );
      }
    } catch (error: any) {
      console.log(
        'Lỗi lấy lịch PT:',
        error.response?.data || error.message
      );
      Alert.alert('Thông báo', 'Không thể tải danh sách lịch tập.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getSchedules();
  }, []);

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
              <Text style={styles.headerTitle}>
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                  'vi-VN',
                  { month: 'long', year: 'numeric' }
                )}
              </Text>
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
        <LinearGradient colors={[COLORS.primaryLight, COLORS.primarySoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.weekStrip} >
          {/* Nút tuần trước */}
          <TouchableOpacity style={styles.weekArrow} activeOpacity={0.7} onPress={() => changeWeek(-1)} >
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          {/* 7 ngày trong tuần */}
          <View style={styles.weekDays}>
            {WEEK.map((item) => {
              const selected = item.date === selectedDate;
              const isToday = item.date === today;
              const hasSchedule = schedules.some(s => s.date === item.date);
              return (
                <TouchableOpacity key={item.date} activeOpacity={0.8} onPress={() => setSelectedDate(item.date)} style={styles.dayItem} >
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday,]} numberOfLines={1}>
                    {isToday ? 'Hôm nay' : item.day}
                  </Text>

                  {selected ? (
                    <LinearGradient
                      colors={['#5FD0DA', COLORS.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.dayCircle,
                        styles.dayCircleSelected,
                      ]}
                    >
                      <Text style={[styles.dayDate, styles.dayDateActive]}>
                        {item.number}
                      </Text>
                      {hasSchedule && <View style={styles.innerDot} />}
                    </LinearGradient>
                  ) : (
                    <View style={[styles.dayCircle, hasSchedule && styles.dayCircleWithDot,]}  >
                      <Text style={styles.dayDate}>{item.number}</Text>
                      {hasSchedule && (
                        <View style={[styles.innerDot, styles.innerDotIdle]} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Nút tuần sau */}
          <TouchableOpacity style={styles.weekArrow} activeOpacity={0.7} onPress={() => changeWeek(1)} >
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </LinearGradient>

        {/* 3. TÓM TẮT NGÀY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="barbell" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.summaryTitle}>
              {selectedDate === today
                ? 'Hôm nay'
                : new Date(`${selectedDate}T00:00:00`).toLocaleDateString('vi-VN')} • {daySchedules.length} ca dạy
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
                  <Text style={styles.timeText}>{item.time}</Text>
                  <Text style={styles.endText}>{item.end}</Text>
                </View>

                <View style={[
                  styles.scheduleCard,
                  item.status === 'done' && styles.scheduleCardDone,
                  item.status === 'cho_duyet' && styles.scheduleCardPending,
                ]}>
                  <View style={[styles.accentBar, { backgroundColor: status.color }]} />

                  <View style={styles.cardTop}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  
                    <View style={styles.flex}>
                      <Text style={styles.memberName}>{item.member}</Text>
                      <Text style={styles.subText}>{item.type}</Text>

                      <TouchableOpacity style={styles.viewExerciseBtn} activeOpacity={0.8} onPress={() => getExercisesPT(item.id)}>
                        <Ionicons name="barbell-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.viewExerciseText}>Xem bài tập</Text>
                      </TouchableOpacity>
                    </View>


                    {item.status === 'upcoming' && (
                      <TouchableOpacity style={styles.changeActionPill} onPress={() => handleOpenChange(item)} >
                        <Ionicons name="swap-horizontal" size={12} color={COLORS.primary} />
                        <Text style={styles.changeActionText}>Dời ca</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {item.status === 'cho_duyet' && (
                    <View style={styles.pendingChangeNotice}>
                      <Ionicons name="time" size={13} color="#D97706" />
                      <Text style={styles.pendingChangeText}>
                        Chờ Admin duyệt: Dời sang {item.proposedTime}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardBottom}>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{item.place}</Text>
                    </View>

                    <View style={styles.cardActions}>
                      {item.status === 'upcoming' ? (
                        <>
                          <TouchableOpacity style={[styles.completeBtn, updatingId === item.id && { opacity: 0.5 },]}
                            disabled={updatingId === item.id} onPress={() => handleComplete(item.id)} >
                            <Text style={styles.completeBtnText}>
                              {updatingId === item.id ? 'Đang xử lý...' : 'Hoàn thành'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={[styles.cancelScheduleBtn, updatingId === item.id && { opacity: 0.5 },]}
                            disabled={updatingId === item.id} onPress={() => handleCancel(item.id)} >
                            <Ionicons name="close" size={15} color="#DC2626" />
                            <Text style={styles.cancelScheduleText}>Hủy</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                          <Text style={[styles.statusText, { color: status.color }]}>
                            {status.label}
                          </Text>
                        </View>
                      )}
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
      <Modal visible={showExerciseModal}  transparent animationType="slide" onRequestClose={() => setShowExerciseModal(false)} >
        <View style={styles.exerciseOverlay}>
          <View style={styles.exerciseModal}>
            {/* Header */}
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseTitle}>Danh sách bài tập</Text>
                {exerciseData && (
                  <Text style={styles.exerciseDate}>
                    Ngày tập: {new Date(
                      exerciseData.ngay_tap + 'T00:00:00'
                    ).toLocaleDateString('vi-VN')}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)} >
                <Ionicons name="close-circle" size={27} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {exerciseLoading ? (
              <View style={styles.exerciseLoading}>
                <Text style={styles.subText}>Đang tải danh sách bài tập...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} >
                {exerciseData?.danh_sach_bai_tap?.length > 0 ? (
                  exerciseData.danh_sach_bai_tap.map((exercise: any, index: number) => (
                    <View key={exercise.id_bai_tap} style={styles.exerciseCard}>
                      <View style={styles.exerciseImageBox}>
                        {exercise.anh_dai_dien ? (
                          <Image source={{ uri: exercise.anh_dai_dien }} style={styles.exerciseImage} resizeMode="cover" />
                        ) : (
                          <Ionicons name="barbell-outline" size={30} color={COLORS.primary}/>
                        )}
                      </View>

                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseNumber}>
                          BÀI TẬP {index + 1}
                        </Text>

                        <Text style={styles.exerciseName}>
                          {exercise.ten_bai_tap}
                        </Text>

                        <View style={styles.exerciseMeta}>
                          {!!exercise.thoi_gian_phut && (
                            <View style={styles.exerciseMetaItem}>
                              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                              <Text style={styles.exerciseMetaText}>
                                {exercise.thoi_gian_phut} phút
                              </Text>
                            </View>
                          )}

                          {!!exercise.rep_yeu_cau && (
                            <View style={styles.exerciseMetaItem}>
                              <Ionicons name="repeat-outline" size={14} color={COLORS.primary} />
                              <Text style={styles.exerciseMetaText}>
                                {exercise.rep_yeu_cau} rep
                              </Text>
                            </View>
                          )}

                          {!!exercise.set_yeu_cau && (
                            <View style={styles.exerciseMetaItem}>
                              <Ionicons name="layers-outline" size={14} color={COLORS.primary} />
                              <Text style={styles.exerciseMetaText}>
                                {exercise.set_yeu_cau} set
                              </Text>
                            </View>
                          )}

                          {!!exercise.giay_yeu_cau && (
                            <View style={styles.exerciseMetaItem}>
                              <Ionicons name="hourglass-outline" size={14} color={COLORS.primary} />
                              <Text style={styles.exerciseMetaText}>
                                {exercise.giay_yeu_cau} giây
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.exerciseEmpty}>
                    <Ionicons name="barbell-outline" size={36} color={COLORS.textMuted} />
                    <Text style={styles.subText}>Chưa có bài tập trong buổi này.</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



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
  weekArrow: {
    width: 28,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekDays: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  completeBtn: {
    backgroundColor: '#EAF3FC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  completeBtnText: {
    color: COLORS.accentBlue,
    fontSize: 12,
    fontWeight: '700',
  },

  cancelScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
  },

  cancelScheduleText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  exerciseModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    height: '80%',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 15,
  },
  exerciseTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },
  exerciseDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 5,
  },
  exerciseLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exerciseImageBox: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#EAF8F8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  exerciseNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 9,
  },
  exerciseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 3,
    fontWeight: '600',
  },
  exerciseEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  viewExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EAF8F8',
  },
  viewExerciseText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
});
export default Schedule;