
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';


const PACKAGE_KEY = 'visionfit_selected_package';
const TRAINER_KEY = 'visionfit_selected_pt';
const DRAFT_KEY = 'visionfit_registration_draft';

type Package = {
  id: number | string; ten_goi: string; gia: number; thoi_han: number;
  loai?: string; so_buoi_pt?: number; trang_thai?: string;
};

type Trainer = {
  id: number | string; ho_ten: string;
  chuc_danh?: string; so_nam_kinh_nghiem?: number | string;
  selected_for_package_id?: number | string;
};

const money = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

const InfoRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={[s.infoValue, color ? { color } : {}]}>{value}</Text>
  </View>
);

const RegistrationReviewScreen = ({ navigation, route }: any) => {
  const [pkg, setPkg] = useState<Package | null>(null);
  const [pt, setPt] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Đọc lại dữ liệu mỗi lần quay về từ trang chỉnh sửa.
  useFocusEffect(useCallback(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [p, t] = await Promise.all([
          AsyncStorage.getItem(PACKAGE_KEY),
          AsyncStorage.getItem(TRAINER_KEY),
        ]);

        const selectedPackage = p ? JSON.parse(p) : route?.params?.selectedPackage || null;
        const selectedTrainer = t ? JSON.parse(t) : route?.params?.selectedTrainer || null;
        const samePackage = selectedTrainer?.selected_for_package_id == null ||
          String(selectedTrainer.selected_for_package_id) === String(selectedPackage?.id);

        if (active) {
          setPkg(selectedPackage);
          setPt(selectedPackage && samePackage ? selectedTrainer : null);
        }
      } catch {
        if (active) Alert.alert('Lỗi', 'Không thể tải thông tin đăng ký.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [route?.params?.selectedPackage, route?.params?.selectedTrainer]));

  const price = Number(pkg?.gia || 0);
  const validPackage = !!pkg?.id && Number.isFinite(price) && price >= 0 &&
    Number(pkg?.thoi_han) > 0 && pkg?.trang_thai !== 'inactive';
  const requiresPT = pkg?.loai === 'pt' || Number(pkg?.so_buoi_pt || 0) > 0;
  const optionalPT = !!pt && !requiresPT;
  const canContinue = validPackage && (!requiresPT || !!pt) && !saving;

  const goTo = (screen: string) => {
    const names = navigation.getState()?.routeNames || [];
    const target = names.includes(screen) ? screen : names.includes(`${screen}Screen`) ? `${screen}Screen` : screen;
    navigation.navigate(target, screen === 'PTList' ? { selectedPackage: pkg } : undefined);
  };

  const handleContinue = async () => {
    if (!canContinue || !pkg) return;
    setSaving(true);

    try {
      // Chỉ lưu bản nháp FE. Backend sẽ xác thực giá và tạo mã đăng ký sau.
      const draft = {
        selectedPackage: pkg,
        selectedTrainer: pt,
        packagePrice: price,
        estimatedTotal: price,
        additionalPtFee: optionalPT ? null : 0,
        status: 'draft',
      };

      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

      const routeNames = navigation.getState()?.routeNames || [];
      const target = routeNames.includes('Payment') ? 'Payment' : routeNames.includes('PaymentScreen') ? 'PaymentScreen' : 'Payment';
      navigation.navigate(target, { draft });
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu thông tin đăng ký.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        title="Xem lại đăng ký"
        onBack={() => navigation.goBack()}
        rightComponent={
          <View style={s.headerIcon}>
            <Ionicons name="reader-outline" size={20} color={COLORS.primary} />
          </View>
        }
      />

      <View style={s.progress}>
        <View style={s.between}>
          <Text style={s.step}>BƯỚC 03 / 04</Text>
          <Text style={s.subText}>Xác nhận thông tin</Text>
        </View>
        <View style={s.track}><View style={s.fill} /></View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.subText}>Đang tải thông tin...</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
              <View style={s.heroDecor} />
              <View style={s.heroIcon}>
                <Ionicons name="document-text-outline" size={22} color={COLORS.white} />
              </View>
              <Text style={s.heroTitle}>Kiểm tra lại{'\n'}thông tin đăng ký</Text>
              <Text style={s.heroDesc}>Hãy đảm bảo mọi lựa chọn đều chính xác trước khi thanh toán.</Text>
            </LinearGradient>

            <View style={s.statusBox}>
              <View style={s.statusIcon}>
                <Ionicons name="time-outline" size={20} color={COLORS.accentGold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.statusTitle}>Bản đăng ký tạm</Text>
                <Text style={s.subText}>Chưa tạo đơn hàng và chưa thanh toán</Text>
              </View>
              <View style={s.statusBadge}><Text style={s.statusBadgeText}>BẢN NHÁP</Text></View>
            </View>

            <Text style={s.sectionTitle}>Thông tin hội viên</Text>
            <View style={s.card}>
              <View style={s.personRow}>
                <View style={s.iconBox}><Ionicons name="person-outline" size={23} color={COLORS.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.personName}>{route?.params?.member?.ho_ten || 'Hội viên VisionFit'}</Text>
                  <Text style={s.subText}>{route?.params?.member?.email || 'Tài khoản đăng nhập'}</Text>
                </View>
                <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={s.divider} />
              <InfoRow label="Mã đăng ký" value="Chưa được cấp" />
              <InfoRow label="Trạng thái" value="Chưa tạo đăng ký" color={COLORS.primary} />
            </View>

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Gói tập đã chọn</Text>
              <TouchableOpacity onPress={() => goTo('WorkoutSelection')} style={s.editButton}>
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={s.editText}>Thay đổi</Text>
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              {pkg ? (
                <>
                  <View style={s.personRow}>
                    <View style={s.iconBox}><Ionicons name="barbell" size={24} color={COLORS.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.packageName}>{pkg.ten_goi}</Text>
                      <Text style={s.subText}>Gói tập VisionFit</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                  <View style={s.divider} />
                  <InfoRow label="Thời hạn" value={`${pkg.thoi_han} ngày`} />
                  <InfoRow label="Số buổi PT trong gói" value={`${pkg.so_buoi_pt || 0} buổi`} />
                  <InfoRow label="Giá gói tập" value={money(price)} color={COLORS.primary} />
                </>
              ) : (
                <Text style={s.warning}>Bạn chưa chọn gói tập. Hãy quay lại bước 1.</Text>
              )}
            </View>

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Huấn luyện viên (PT)</Text>
              <TouchableOpacity onPress={() => goTo('PTList')} style={s.editButton}>
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={s.editText}>Thay đổi</Text>
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              {pt ? (
                <>
                  <View style={s.personRow}>
                    <View style={s.ptAvatar}><Ionicons name="person" size={27} color={COLORS.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.personName}>{pt.ho_ten}</Text>
                      <Text style={s.subText}>{pt.chuc_danh || 'Personal Trainer'}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={23} color={COLORS.primary} />
                  </View>
                  <View style={s.divider} />
                  <InfoRow label="Kinh nghiệm" value={`${pt.so_nam_kinh_nghiem || '—'} năm`} />
                  <InfoRow label="Lựa chọn" value="Đã chọn PT" color={COLORS.primary} />
                </>
              ) : (
                <View style={s.emptyPT}>
                  <View style={s.emptyIcon}>
                    <Ionicons name="people-outline" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={s.subText}>{requiresPT ? 'Gói tập này yêu cầu chọn PT' : 'Bạn chưa chọn huấn luyện viên'}</Text>
                  <TouchableOpacity onPress={() => goTo('PTList')} style={s.emptyBtn}>
                    <Text style={s.editText}>Chọn huấn luyện viên →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={s.sectionTitle}>Chi tiết thanh toán</Text>
            <View style={s.card}>
              <InfoRow label="Chi phí gói tập" value={money(price)} />
              <InfoRow label="Chi phí PT" value={optionalPT ? 'Chưa xác định' : requiresPT ? 'Theo quyền lợi gói' : '0đ'} />
              <View style={s.dashedDivider} />
              <View style={[s.between, s.totalBox]}>
                <Text style={s.totalLabel}>Tổng tạm tính</Text>
                <Text style={s.totalPrice}>{money(price)}</Text>
              </View>
              <Text style={s.priceNote}>* Tổng tiền cuối cùng sẽ được Backend xác minh trước thanh toán.</Text>
              {optionalPT && <Text style={s.warning}>PT chọn thêm có thể phát sinh phí chưa tính trong tổng tạm tính.</Text>}
            </View>

            <View style={s.notice}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={s.noticeText}>Bạn có thể quay lại thay đổi gói tập hoặc PT. Bản nháp hiện chưa được gửi lên máy chủ.</Text>
            </View>
          </ScrollView>

          <View style={s.footer}>
            <View style={s.between}>
              <View>
                <Text style={s.subText}>TỔNG TẠM TÍNH</Text>
                <Text style={s.footerPrice}>{money(price)}</Text>
              </View>
              <View style={s.secureBadge}>
                <Ionicons name="lock-closed-outline" size={15} color={COLORS.primary} />
                <Text style={s.secureText}>Bước tiếp theo</Text>
              </View>
            </View>

            <TouchableOpacity style={s.buttonWrap} activeOpacity={0.85} disabled={!canContinue} onPress={handleContinue}>
              <LinearGradient
                colors={canContinue ? [COLORS.primary, COLORS.primaryDark] : ['#AECBD0', '#AECBD0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.button}
              >
                {saving ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Text style={s.buttonText}>Tiếp tục thanh toán</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  step: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: {
    width: '75%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  subText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  hero: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  heroDecor: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -50,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    color: COLORS.white,
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    marginBottom: 24,
    ...SHADOWS.card,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDE6C4',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusBadgeText: {
    color: COLORS.accentGold,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
  },
  editText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    ...SHADOWS.card,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.surfaceTeal,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  packageName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  ptAvatar: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surfaceTeal,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.borderFocus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 14,
  },
  dashedDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginTop: 2,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  emptyPT: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
  },
  totalBox: {
    backgroundColor: COLORS.surfaceTeal,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  totalPrice: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  priceNote: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 10,
  },
  warning: {
    color: '#B47A30',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 10,
    overflow: 'hidden',
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.surfaceTeal,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
    borderRadius: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 19,
    color: COLORS.primaryDark,
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.card,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  footerPrice: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '900',
    marginTop: 2,
  },
  secureBadge: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceTeal,
  },
  secureText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  buttonWrap: {
    marginTop: 12,
  },
  button: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
});

export default RegistrationReviewScreen;
