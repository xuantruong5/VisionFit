import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const NOTIFY_OPTIONS = [
  { key: 'session', title: 'Nhắc ca dạy', sub: 'Trước 30 phút khi ca bắt đầu' },
  { key: 'checkin', title: 'Học viên check-in', sub: 'Khi học viên đến phòng tập' },
  { key: 'review', title: 'Đánh giá mới', sub: 'Khi học viên đánh giá buổi tập' },
  { key: 'payment', title: 'Thanh toán', sub: 'Khi nhận được thu nhập' },
];

const SECURITY = [
  { icon: 'key-outline', title: 'Đổi mật khẩu', sub: 'Cập nhật lần cuối 3 tháng trước' },
  { icon: 'phone-portrait-outline', title: 'Thiết bị đăng nhập', sub: '2 thiết bị đang hoạt động' },
];

const HELP = [
  { icon: 'call-outline', title: 'Hotline hỗ trợ', sub: '1900 6868 • 8:00 - 22:00' },
  { icon: 'mail-outline', title: 'Email', sub: 'support@visionfit.vn' },
  { icon: 'document-text-outline', title: 'Điều khoản & chính sách', sub: 'Quy định dành cho huấn luyện viên' },
];

const TrainerSettings = ({ navigation }: any) => {
  const [notify, setNotify] = useState<Record<string, boolean>>({ session: true, checkin: true, review: true, payment: false });
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* THÔNG BÁO */}
        <Text style={styles.sectionTitle}>Thông báo</Text>
        <View style={styles.card}>
          {NOTIFY_OPTIONS.map((item, index) => (
            <View key={item.key} style={[styles.row, index < NOTIFY_OPTIONS.length - 1 && styles.rowBorder]}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
              <Switch
                value={notify[item.key]}
                onValueChange={(v) => setNotify({ ...notify, [item.key]: v })}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
        </View>

        {/* BẢO MẬT */}
        <Text style={styles.sectionTitle}>Bảo mật & Mật khẩu</Text>
        <View style={styles.card}>
          {SECURITY.map((item) => (
            <TouchableOpacity key={item.title} activeOpacity={0.7} style={[styles.row, styles.rowBorder]}>
              <View style={styles.iconTile}>
                <Ionicons name={item.icon} size={18} color={COLORS.primaryDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
          <View style={styles.row}>
            <View style={styles.iconTile}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primaryDark} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Xác thực 2 lớp</Text>
              <Text style={styles.rowSub}>Mã OTP qua số điện thoại</Text>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={setTwoFactor}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* TRỢ GIÚP */}
        <Text style={styles.sectionTitle}>Trợ giúp & Hỗ trợ</Text>
        <View style={styles.card}>
          {HELP.map((item, index) => (
            <TouchableOpacity key={item.title} activeOpacity={0.7} style={[styles.row, index < HELP.length - 1 && styles.rowBorder]}>
              <View style={styles.iconTile}>
                <Ionicons name={item.icon} size={18} color={COLORS.primaryDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>VisionFit Trainer • Phiên bản 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrainerSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SOFT_SHADOW,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSpace: {
    width: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 16,
    ...SOFT_SHADOW,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rowSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 20,
    fontWeight: '600',
  },
});
