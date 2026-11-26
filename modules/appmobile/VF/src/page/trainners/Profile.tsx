import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { TRAINER_COLORS as COLORS, TRAINER_SHADOWS as SHADOWS } from '../../general/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiFitlife from '../../general/api';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';


// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const COVER = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80';
const AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80';

const STATS = [
  { icon: 'barbell', value: '32', label: 'Buổi dạy', color: COLORS.primary, bg: COLORS.surfaceTeal },
  { icon: 'people', value: '24', label: 'Học viên', color: COLORS.accentGreen, bg: '#ECFDF5' },
  { icon: 'star', value: '4.9', label: 'Đánh giá', color: COLORS.accentGold, bg: '#FFF7ED' },
  { icon: 'trophy', value: '5 năm', label: 'Kinh nghiệm', color: '#8B5CF6', bg: '#F5F3FF' },
];

const SPECIALTIES = ['Strength Training', 'Cardio', 'Giảm mỡ', 'Phục hồi chức năng'];

const CERTIFICATES = [
  { title: 'NASM Certified Personal Trainer', org: 'NASM • 2021' },
  { title: 'First Aid / CPR / AED', org: 'Red Cross • 2023' },
];

const PERSONAL_INFO = [
  { icon: 'mail-outline', title: 'Email', value: 'trainer.nguyen@visionfit.vn' },
  { icon: 'call-outline', title: 'Số điện thoại', value: '0901 234 567' },
  { icon: 'location-outline', title: 'Cơ sở làm việc', value: 'VisionFit Center - Quận 1, TP.HCM' },
];

const MENU = [
  { icon: 'wallet', title: 'Doanh thu & Thu nhập', sub: '12.500.000 ₫ tháng này', color: COLORS.accentGold, bg: '#FFF7ED', route: 'Income' },
  { icon: 'time', title: 'Lịch sử buổi dạy', sub: 'Nhật ký các ca huấn luyện', color: '#8B5CF6', bg: '#F5F3FF', route: 'SessionHistory' },
  { icon: 'notifications', title: 'Cài đặt thông báo', sub: 'Nhắc ca dạy, học viên check-in', color: COLORS.accentBlue, bg: '#EAF3FC', route: 'TrainerSettings' },
  { icon: 'shield-checkmark', title: 'Bảo mật & Mật khẩu', sub: 'Đổi mật khẩu, xác thực 2 lớp', color: COLORS.accentGreen, bg: '#ECFDF5', route: 'TrainerSettings' },
  { icon: 'help-circle', title: 'Trợ giúp & Hỗ trợ', sub: 'Hotline: 1900 6868', color: COLORS.primary, bg: COLORS.surfaceTeal, route: 'TrainerSettings' },
];

const Profile = ({ navigation }: any) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [trainerData, setTrainerData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const fetchTrainerProfile = async () => {
    try {
      const res = await apiFitlife.get('/trainer/profile');
      if (res.data?.status && res.data?.data) {
        setTrainerData(res.data.data);
      }
    } catch (err) {
      console.log('Lỗi lấy thông tin Trainer:', err);
    }
  };

  useEffect(() => {
    fetchTrainerProfile();
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchTrainerProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const referralCode = trainerData?.ma_gioi_thieu || 'PT-HOANGNAM-88';
  const trainerName = trainerData?.ho_ten || 'Nguyễn Trainer';
  const trainerAvatar = trainerData?.hinh_anh || AVATAR;
  const specialtiesList = Array.isArray(trainerData?.chuyen_mon) && trainerData.chuyen_mon.length > 0 ? trainerData.chuyen_mon : SPECIALTIES;
  const certificatesList = Array.isArray(trainerData?.chung_chi) && trainerData.chung_chi.length > 0 ? trainerData.chung_chi : CERTIFICATES;
  const personalInfo = [
    { icon: 'mail-outline', title: 'Email', value: trainerData?.email || 'trainer.nguyen@visionfit.vn' },
    { icon: 'call-outline', title: 'Số điện thoại', value: trainerData?.so_dien_thoai || '0901 234 567' },
    { icon: 'location-outline', title: 'Cơ sở làm việc', value: trainerData?.co_so || 'VisionFit Center - Quận 1, TP.HCM' },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              // Gọi API đăng xuất Trainer
              const response = await apiFitlife.post("/trainer/logout");
              console.log("LOGOUT TRAINER =", response.data);
            } catch (error: any) {
              console.log(
                "Lỗi API đăng xuất:",
                error.response?.data || error.message
              );
            } finally {
              // Xóa thông tin đăng nhập ở máy
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("role");
              // Quay về màn hình đăng nhập Trainer
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            }
          },
        },
      ]
    );
  };

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. ẢNH BÌA */}
        <View style={styles.cover}>
          <Image source={{ uri: COVER }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(15, 84, 104,0.55)', 'rgba(7,88,101,0.95)']} style={styles.coverOverlay}>
            <View style={styles.coverRow}>
              <Text style={styles.coverTitle}>Hồ sơ của tôi</Text>
              <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
                <Ionicons name="share-social-outline" size={19} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7} onPress={() => navigation?.navigate('TrainerSettings')}>
                <Ionicons name="settings-outline" size={19} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* 2. THẺ HỒ SƠ */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: trainerAvatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8} onPress={() => navigation?.navigate('EditTrainerProfile')}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{trainerName}</Text>
            <Ionicons name="checkmark-circle" size={19} color={COLORS.accentBlue} />
          </View>
          <Text style={styles.role}>Personal Trainer • VisionFit Q.1</Text>

          <View style={styles.tagWrap}>
            {specialtiesList.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statsRow}>
            {STATS.map((item) => (
              <View key={item.label} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={17} color={item.color} />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.editBtnWrap} activeOpacity={0.85} onPress={() => navigation?.navigate('EditTrainerProfile')}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.editBtn}>
              <Ionicons name="create-outline" size={17} color={COLORS.white} />
              <Text style={styles.editBtnText}>Chỉnh sửa hồ sơ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* MÃ GIỚI THIỆU CỦA TRAINER - CARD CAO CẤP */}
          <LinearGradient
            colors={['#0C4A57', '#08333D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.referralCard}
          >
            {/* Vòng sáng trang trí nền */}
            <View style={styles.cardGlowCircle1} />
            <View style={styles.cardGlowCircle2} />

            {/* Header: Huy hiệu & Số lượng học viên */}
            <View style={styles.referralHeader}>
              <View style={styles.referralBadge}>
                <Ionicons name="sparkles" size={13} color="#FBBF24" />
                <Text style={styles.referralBadgeText}>MÃ GIỚI THIỆU CỦA BẠN</Text>
              </View>
              <View style={styles.referralStudentCountPill}>
                <Ionicons name="people" size={12} color="#A7F3D0" />
                <Text style={styles.referralStudents}>15 học viên đã dùng</Text>
              </View>
            </View>

            <Text style={styles.referralTitle}>
              Gửi mã cho học viên để liên kết trực tiếp & nhận hoa hồng
            </Text>

            {/* VOUCHER / TICKET TRẮNG SANG TRỌNG */}
            <View style={styles.ticketBox}>
              <View style={styles.ticketTopRow}>
                <View style={styles.ticketLabelGroup}>
                  <Ionicons name="barcode-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.ticketLabel}>MÃ KÍCH HOẠT HỘI VIÊN</Text>
                </View>
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>Đang hoạt động</Text>
                </View>
              </View>

              {/* Ô HIỂN THỊ MÃ RỘNG RÃI, BẮT MẮT */}
              <View style={styles.codeContainer}>
                <Text style={styles.codeText} selectable>
                  {referralCode}
                </Text>
              </View>

              {/* HÀNG NÚT BẤM CÂN ĐỐI */}
              <View style={styles.ticketActionRow}>
                <TouchableOpacity
                  style={[styles.ticketCopyBtn, copied && styles.ticketCopyBtnSuccess]}
                  onPress={handleCopyCode}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={16}
                    color={copied ? '#065F46' : COLORS.white}
                  />
                  <Text style={[styles.ticketCopyText, copied && styles.ticketCopyTextSuccess]}>
                    {copied ? 'Đã sao chép!' : 'Sao chép mã'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ticketQrBtn}
                  onPress={() => setShowQrModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.ticketQrText}>Mã QR</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* DÒNG QUYỀN LỢI HOA HỒNG
            <View style={styles.referralBenefitRow}>
              <View style={styles.giftIconWrap}>
                <Ionicons name="gift" size={14} color="#F59E0B" />
              </View>
              <Text style={styles.referralBenefitText}>
                Tích lũy <Text style={styles.highlightGold}>10% hoa hồng</Text> cho mỗi gói tập học viên đăng ký
              </Text>
            </View> */}
          </LinearGradient>

          {/* 3. CHỨNG CHỈ */}
          <Text style={styles.sectionTitle}>Chứng chỉ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certList}>
            {certificatesList.map((item: any, idx: number) => (
              <LinearGradient key={`${item.title}_${idx}`} colors={['#FFFFFF', COLORS.surfaceTeal]} style={styles.certCard}>
                <View style={styles.certIcon}>
                  <Ionicons name="ribbon" size={20} color={COLORS.accentGold} />
                </View>
                <Text style={styles.certTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.subText}>{item.org}</Text>
              </LinearGradient>
            ))}
          </ScrollView>

          {/* 4. THÔNG TIN LIÊN HỆ */}
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          <View style={styles.card}>
            {personalInfo.map((item, index) => (
              <View key={item.title} style={[styles.row, index < personalInfo.length - 1 && styles.rowBorder]}>
                <View style={[styles.iconWrap, { backgroundColor: COLORS.surfaceTeal }]}>
                  <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.subText}>{item.title}</Text>
                  <Text style={styles.rowValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 5. QUẢN LÝ & TIỆN ÍCH */}
          <Text style={styles.sectionTitle}>Quản lý & tiện ích</Text>
          <View style={styles.card}>
            {MENU.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                activeOpacity={0.7}
                style={[styles.row, index < MENU.length - 1 && styles.rowBorder]}
                onPress={() => item.route && navigation?.navigate(item.route)}>
                <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowValue}>{item.title}</Text>
                  <Text style={styles.subText}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>

          {/* 6. ĐĂNG XUẤT */}
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={19} color={COLORS.accentRed} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>VisionFit Trainer • Phiên bản 1.0.0</Text>
        </View>
      </ScrollView>

      {/* MODAL MÃ QR GIỚI THIỆU */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <TouchableOpacity
          style={styles.qrModalOverlay}
          activeOpacity={1}
          onPress={() => setShowQrModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.qrModalCard}>
            <View style={styles.qrModalHeader}>
              <View style={styles.qrTitleGroup}>
                <View style={styles.qrIconWrap}>
                  <Ionicons name="qr-code" size={18} color={COLORS.primary} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.qrModalTitle}>Mã QR Huấn Luyện Viên</Text>
                  <Text style={styles.qrModalSub}>Quét để liên kết ngay trên app</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowQrModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.qrCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrBox}>
              <View style={styles.qrRealCanvas}>
                <QRCode
                  value={referralCode}
                  size={185}
                  color="#0F5468"
                  backgroundColor="#FFFFFF"
                />
              </View>

              <View style={styles.qrCodeTag}>
                <Text style={styles.qrCodeLabelText}>MÃ GIỚI THIỆU CỦA BẠN</Text>
                <Text style={styles.qrCodeLabelValue}>{referralCode}</Text>
              </View>
            </View>

            <View style={styles.qrActionRow}>
              <TouchableOpacity
                style={[styles.qrCopyActionBtn, copied && { backgroundColor: '#D1FAE5' }]}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={16}
                  color={copied ? '#065F46' : COLORS.primary}
                />
                <Text style={[styles.qrCopyActionText, copied && { color: '#065F46' }]}>
                  {copied ? 'Đã sao chép mã!' : 'Sao chép mã'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.qrDoneActionBtn}
                onPress={() => setShowQrModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.qrDoneActionText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;

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
    marginTop: 2,
    fontWeight: '600',
  },

  // ẢNH BÌA
  cover: {
    height: 190,
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 28,
    overflow: 'hidden',
  },
  coverOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coverTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // THẺ HỒ SƠ
  profileCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -80,
    borderRadius: 24,
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  avatarWrap: {
    position: 'absolute',
    top: -46,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  role: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '600',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  editBtnWrap: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
  editBtn: {
    height: 46,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // SECTION & CARD
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    paddingHorizontal: 14,
    ...SHADOWS.card,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // CHỨNG CHỈ
  certList: {
    gap: 12,
  },
  certCard: {
    width: 200,
    borderRadius: 26,
    padding: 14,
  },
  certIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  certTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },

  // LOGOUT
  logoutBtn: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 14,
    fontWeight: '600',
  },

  // MÃ GIỚI THIỆU CARD - VIP VOUCHER
  referralCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#07333D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  cardGlowCircle1: {
    position: 'absolute',
    top: -45,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardGlowCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  referralBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#FBBF24',
  },
  referralStudentCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  referralStudents: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '700',
  },
  referralTitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 14,
  },

  // TICKET BOX TRẮNG
  ticketBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.primary,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  codeContainer: {
    backgroundColor: '#F8FBFC',
    borderWidth: 1.2,
    borderColor: '#E2EEF1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#0F5468',
    textAlign: 'center',
  },
  ticketActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketCopyBtn: {
    flex: 1.3,
    height: 42,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ticketCopyBtnSuccess: {
    backgroundColor: '#D1FAE5',
  },
  ticketCopyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketCopyTextSuccess: {
    color: '#065F46',
  },
  ticketQrBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#F0F9FA',
    borderWidth: 1,
    borderColor: '#CFE6EC',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ticketQrText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // QUYỀN LỢI HOA HỒNG
  referralBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  giftIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralBenefitText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  highlightGold: {
    fontWeight: '800',
    color: '#FDE68A',
  },

  // QR MODAL
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  qrModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  qrModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  qrModalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  qrCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBox: {
    backgroundColor: '#F8FBFC',
    borderWidth: 1.5,
    borderColor: '#E2EEF1',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  qrRealCanvas: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  qrCodeTag: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#E6F0F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  qrCodeLabelText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.primary,
  },
  qrCodeLabelValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#0F5468',
    marginTop: 2,
  },
  qrActionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  qrCopyActionBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTeal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  qrCopyActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  qrDoneActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrDoneActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
