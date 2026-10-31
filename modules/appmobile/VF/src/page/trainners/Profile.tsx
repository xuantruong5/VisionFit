import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

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
  { icon: 'notifications', title: 'Cài đặt thông báo', sub: 'Nhắc ca dạy, học viên check-in', color: COLORS.accentBlue, bg: '#EAF3FC' },
  { icon: 'shield-checkmark', title: 'Bảo mật & Mật khẩu', sub: 'Đổi mật khẩu, xác thực 2 lớp', color: COLORS.accentGreen, bg: '#ECFDF5' },
  { icon: 'help-circle', title: 'Trợ giúp & Hỗ trợ', sub: 'Hotline: 1900 6868', color: COLORS.primary, bg: COLORS.surfaceTeal },
];

const Profile = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. ẢNH BÌA */}
        <View style={styles.cover}>
          <Image source={{ uri: COVER }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(13,127,141,0.55)', 'rgba(7,88,101,0.95)']} style={styles.coverOverlay}>
            <View style={styles.coverRow}>
              <Text style={styles.coverTitle}>Hồ sơ của tôi</Text>
              <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
                <Ionicons name="share-social-outline" size={19} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
                <Ionicons name="settings-outline" size={19} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* 2. THẺ HỒ SƠ */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: AVATAR }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>Nguyễn Trainer</Text>
            <Ionicons name="checkmark-circle" size={19} color={COLORS.accentBlue} />
          </View>
          <Text style={styles.role}>Personal Trainer • VisionFit Q.1</Text>

          <View style={styles.tagWrap}>
            {SPECIALTIES.map((tag) => (
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

          <TouchableOpacity style={styles.editBtnWrap} activeOpacity={0.85}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.editBtn}>
              <Ionicons name="create-outline" size={17} color={COLORS.white} />
              <Text style={styles.editBtnText}>Chỉnh sửa hồ sơ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* 3. CHỨNG CHỈ */}
          <Text style={styles.sectionTitle}>Chứng chỉ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certList}>
            {CERTIFICATES.map((item) => (
              <LinearGradient key={item.title} colors={['#FFFFFF', COLORS.surfaceTeal]} style={styles.certCard}>
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
            {PERSONAL_INFO.map((item, index) => (
              <View key={item.title} style={[styles.row, index < PERSONAL_INFO.length - 1 && styles.rowBorder]}>
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
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={() => navigation?.reset?.({ index: 0, routes: [{ name: 'TrainerAuthScreen' }] })}>
            <Ionicons name="log-out-outline" size={19} color={COLORS.accentRed} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>VisionFit Trainer • Phiên bản 1.0.0</Text>
        </View>
      </ScrollView>
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
    fontWeight: '800',
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
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  role: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
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
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  editBtnWrap: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
  editBtn: {
    height: 46,
    borderRadius: 14,
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
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderRadius: 14,
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
  },
});
