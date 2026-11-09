import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { TRAINER_COLORS as COLORS, TRAINER_SHADOWS as SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';

const MemberDetail = ({ navigation, route }: any) => {
  const initial = route?.params?.member || {};
  const [member, setMember] = useState<any>(initial);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const memberId = member.id_hoi_vien || member.id;

  const loadMemberDetail = async () => {
    try {
      const response = await apiFitlife.get('/trainer/members/' + memberId);
      if (response.data?.success && response.data?.data) {
        setMember(response.data.data);
      }
    } catch (error: any) {
      console.log('Lỗi lấy chi tiết học viên:', error);
    }
  };

  useEffect(() => {
    if (memberId) {
      loadMemberDetail();
    }
  }, [memberId]);

  const height = Number(member.chieu_cao_cm) || 0;
  const weight = Number(member.can_nang_kg) || 0;
  const bmi = height > 0 && weight > 0 
    ? (weight / ((height / 100) * (height / 100))).toFixed(1) 
    : '--';

  let age: any = '--';
  if (member.ngay_sinh) {
    const birthYear = new Date(member.ngay_sinh).getFullYear();
    if (!isNaN(birthYear)) {
      age = new Date().getFullYear() - birthYear;
    }
  }

  const total = Number(member.so_buoi_pt || 24);
  const sessions = 0;
  const progress = total > 0 ? Math.min(100, Math.round((sessions / total) * 100)) : 0;
  const isPaused = member.tinh_trang === 3;

  const bodyStats = [
    { icon: 'calendar-outline', value: age, unit: 'tuổi' },
    { icon: 'resize-outline', value: height || '--', unit: 'cm' },
    { icon: 'speedometer-outline', value: weight || '--', unit: 'kg' },
    { icon: 'pulse-outline', value: bmi, unit: 'BMI' },
  ];

  // Đổi trạng thái học viên (Đang tập / Tạm nghỉ)
  const handleUpdateStatus = async (nextStatus: number) => {
    try {
      const response = await apiFitlife.put('/trainer/members/' + memberId, {
        tinh_trang: nextStatus,
      });
      if (response.data?.success) {
        setMember((prev: any) => ({
          ...prev,
          tinh_trang: nextStatus,
        }));
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái.');
    }
  };

  // Gỡ học viên khỏi danh sách
  const handleDeleteMember = async () => {
    try {
      const response = await apiFitlife.delete('/trainer/members/' + memberId);
      if (response.data?.success) {
        navigation?.goBack?.();
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gỡ học viên.');
    }
  };

  const avatar = member.anh_dai_dien || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

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
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7} onPress={() => setShowMenuModal(true)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileRow}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={styles.flex}>
              <Text style={styles.name}>{member.ho_ten || 'Học viên'}</Text>
              <Text style={styles.email}>{member.email || 'Chưa cập nhật email'}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.glassBadge}>
                  <View style={[styles.statusDot, isPaused && { backgroundColor: COLORS.accentGold }]} />
                  <Text style={styles.glassBadgeText}>{isPaused ? 'Tạm nghỉ' : 'Đang tập'}</Text>
                </View>
                <View style={styles.glassBadge}>
                  <Ionicons name="card-outline" size={12} color={COLORS.white} />
                  <Text style={styles.glassBadgeText}>{member.ten_goi_tap || 'Gói PT'}</Text>
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
              onPress={() =>
                navigation?.navigate('ChatRoom', {
                  conversation: {
                    id_cuoc_tro_chuyen: memberId || 1,
                    room_uuid: 'room-pt-' + (memberId || 1),
                    loai: 'TRUC_TIEP',
                    doi_phuong: {
                      id_nguoi_dung: memberId || 1,
                      ho_ten: member.ho_ten || 'Học viên',
                      anh_dai_dien: avatar,
                      chuyen_mon: 'Mục tiêu: ' + (member.muc_tieu_hien_tai || 'Tập luyện'),
                      online: true,
                    },
                  },
                  currentUser: {
                    id_nguoi_dung: 99,
                    ho_ten: 'HLV VisionFit',
                    vai_tro: 'HUAN_LUYEN_VIEN',
                    online: true,
                  },
                })
              }>
              <Ionicons name="chatbubble-ellipses-outline" size={17} color={COLORS.primary} />
              <Text style={styles.outlineBtnText}>Nhắn tin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flex}
              activeOpacity={0.85}
              onPress={() => navigation?.navigate('Schedule', { fromMember: true, memberName: member.ho_ten })}
            >
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
                  {sessions}/{total} buổi đã tập
                </Text>
                <Text style={styles.subText}>
                  {total > sessions ? `Còn ${total - sessions} buổi` : 'Đã hoàn thành'}
                  {member.ngay_ket_thuc ? ` • Hết hạn ${member.ngay_ket_thuc}` : ''}
                </Text>
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
          </View>

          {/* 5. MỤC TIÊU */}
          <Text style={styles.sectionTitle}>Mục tiêu: {member.muc_tieu_hien_tai || 'Rèn luyện thể hình'}</Text>
          <View style={styles.card}>
            <View style={styles.weightRow}>
              <View style={styles.weightItem}>
                <Text style={styles.subText}>Chiều cao</Text>
                <Text style={[styles.weightValue, { color: COLORS.primary }]}>{height || '--'} cm</Text>
              </View>
              <Ionicons name="fitness-outline" size={18} color={COLORS.textLight} />
              <View style={styles.weightItem}>
                <Text style={styles.subText}>Cân nặng</Text>
                <Text style={[styles.weightValue, { color: COLORS.accentGreen }]}>{weight || '--'} kg</Text>
              </View>
            </View>
          </View>

          {/* 6. BUỔI TẬP GẦN ĐÂY */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Buổi tập gần đây</Text>
          </View>
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Ionicons name="fitness-outline" size={32} color={COLORS.textLight} />
            <Text style={{ marginTop: 8, color: COLORS.textMuted, fontSize: 13, fontWeight: '500' }}>
              Chưa có lịch sử buổi tập nào
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 7. ACTION SHEET MODAL - TÙY CHỌN HỌC VIÊN */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />

            {/* Thông tin học viên */}
            <View style={styles.sheetHeader}>
              <Image source={{ uri: avatar }} style={styles.sheetAvatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetMemberName}>{member.ho_ten || 'Học viên'}</Text>
                <Text style={styles.sheetMemberSub}>
                  {member.ten_goi_tap || 'Gói PT'} • {isPaused ? 'Tạm nghỉ' : 'Đang tập'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenuModal(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetDivider} />

            {/* Đổi trạng thái */}
            <TouchableOpacity
              style={styles.sheetActionRow}
              activeOpacity={0.7}
              onPress={() => {
                setShowMenuModal(false);
                handleUpdateStatus(isPaused ? 1 : 3);
              }}
            >
              <View style={[styles.sheetIconBox, { backgroundColor: isPaused ? '#ECFDF5' : '#FFFBEB' }]}>
                <Ionicons
                  name={isPaused ? 'play' : 'pause'}
                  size={20}
                  color={isPaused ? COLORS.accentGreen : COLORS.accentGold}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.sheetActionTitle}>
                  {isPaused ? 'Chuyển sang: Đang tập' : 'Chuyển sang: Tạm nghỉ'}
                </Text>
                <Text style={styles.sheetActionSub}>
                  {isPaused ? 'Tiếp tục ghi nhận buổi tập cho học viên' : 'Tạm dừng lịch tập và bảo lưu gói'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            {/* Gỡ học viên */}
            <TouchableOpacity
              style={styles.sheetActionRow}
              activeOpacity={0.7}
              onPress={() => {
                setShowMenuModal(false);
                setShowDeleteModal(true);
              }}
            >
              <View style={[styles.sheetIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.sheetActionTitle, { color: '#EF4444' }]}>
                  Gỡ khỏi danh sách
                </Text>
                <Text style={styles.sheetActionSub}>
                  Xóa học viên khỏi danh sách bạn quản lý
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            {/* Nút Đóng */}
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              activeOpacity={0.8}
              onPress={() => setShowMenuModal(false)}
            >
              <Text style={styles.sheetCancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 8. MODAL XÁC NHẬN GỠ HỌC VIÊN */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconBox}>
              <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
            </View>
            <Text style={styles.confirmTitle}>Gỡ học viên?</Text>
            <Text style={styles.confirmDesc}>
              Bạn có chắc chắn muốn gỡ học viên{' '}
              <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>
                {member.ho_ten || 'này'}
              </Text>{' '}
              khỏi danh sách quản lý không?
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                activeOpacity={0.8}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setShowDeleteModal(false);
                  handleDeleteMember();
                }}
              >
                <Text style={styles.confirmDeleteText}>Gỡ học viên</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontWeight: '600',
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
    fontWeight: '700',
    color: COLORS.white,
  },
  email: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '600',
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
    borderRadius: 26,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
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
    borderRadius: 999,
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
    borderRadius: 999,
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
    fontSize: 18,
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
    borderRadius: 26,
    padding: 16,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#047857',
  },

  // BUỔI TẬP
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 12,
    marginBottom: 10,
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
    fontWeight: '700',
    color: COLORS.primary,
  },
  monthText: {
    fontSize: 10.5,
    fontWeight: '700',
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

  // BOTTOM SHEET MODAL
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 84, 104, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    ...SHADOWS.card,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceTeal,
  },
  sheetMemberName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sheetMemberSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  sheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sheetActionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sheetCancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMuted,
  },

  // CONFIRM MODAL
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 84, 104, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  confirmIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
