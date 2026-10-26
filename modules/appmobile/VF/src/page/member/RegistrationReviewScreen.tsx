
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  primary: '#0D7F8D', dark: '#075865', bg: '#F4FAFB',
  white: '#FFFFFF', text: '#16383E', muted: '#78949A',
  border: '#DFEAEC', soft: '#E7F5F6',
};

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
    if (names.includes(screen)) navigation.navigate(screen, screen === 'PTList' ? { selectedPackage: pkg } : undefined);
    else if (navigation.canGoBack()) navigation.goBack();
    else Alert.alert('Thông báo', `Chưa khai báo màn hình ${screen}.`);
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

      if (navigation.getState()?.routeNames?.includes('Payment')) {
        navigation.navigate('Payment', { draft });
      } else {
        Alert.alert('Đã lưu bản nháp', 'Thông tin đã được lưu. Trang thanh toán sẽ được tạo ở bước tiếp theo.');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu thông tin đăng ký.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={23} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Xem lại đăng ký</Text>
        <Ionicons name="reader-outline" size={23} color={C.primary} />
      </View>

      <View style={s.progress}>
        <View style={s.between}>
          <Text style={s.step}>BƯỚC 03 / 04</Text>
          <Text style={s.subText}>Xác nhận thông tin</Text>
        </View>
        <View style={s.track}><View style={s.fill} /></View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.subText}>Đang tải thông tin...</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={['#087F8F', '#064E60']} style={s.hero}>
              <View style={s.heroIcon}>
                <Ionicons name="document-text-outline" size={23} color="#FFFFFF" />
              </View>
              <Text style={s.heroTitle}>Kiểm tra lại{'\n'}thông tin đăng ký</Text>
              <Text style={s.heroDesc}>Hãy đảm bảo mọi lựa chọn đều chính xác trước khi thanh toán.</Text>
            </LinearGradient>

            <View style={s.statusBox}>
              <Ionicons name="time-outline" size={21} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.statusTitle}>Bản đăng ký tạm</Text>
                <Text style={s.subText}>Chưa tạo đơn hàng và chưa thanh toán</Text>
              </View>
              <View style={s.statusBadge}><Text style={s.statusBadgeText}>BẢN NHÁP</Text></View>
            </View>

            <Text style={s.sectionTitle}>Thông tin hội viên</Text>
            <View style={s.card}>
              <View style={s.personRow}>
                <View style={s.iconBox}><Ionicons name="person-outline" size={23} color={C.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.personName}>{route?.params?.member?.ho_ten || 'Hội viên VisionFit'}</Text>
                  <Text style={s.subText}>{route?.params?.member?.email || 'Tài khoản đăng nhập'}</Text>
                </View>
                <Ionicons name="shield-checkmark-outline" size={22} color={C.primary} />
              </View>
              <View style={s.divider} />
              <InfoRow label="Mã đăng ký" value="Chưa được cấp" />
              <InfoRow label="Trạng thái" value="Chưa tạo đăng ký" color={C.primary} />
            </View>

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Gói tập đã chọn</Text>
              <TouchableOpacity onPress={() => goTo('WorkoutSelection')} style={s.editButton}>
                <Ionicons name="create-outline" size={16} color={C.primary} />
                <Text style={s.editText}>Thay đổi</Text>
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              {pkg ? (
                <>
                  <View style={s.personRow}>
                    <View style={s.iconBox}><Ionicons name="barbell" size={24} color={C.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.packageName}>{pkg.ten_goi}</Text>
                      <Text style={s.subText}>Gói tập VisionFit</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={C.primary} />
                  </View>
                  <View style={s.divider} />
                  <InfoRow label="Thời hạn" value={`${pkg.thoi_han} ngày`} />
                  <InfoRow label="Số buổi PT trong gói" value={`${pkg.so_buoi_pt || 0} buổi`} />
                  <InfoRow label="Giá gói tập" value={money(price)} color={C.primary} />
                </>
              ) : (
                <Text style={s.warning}>Bạn chưa chọn gói tập. Hãy quay lại bước 1.</Text>
              )}
            </View>

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Huấn luyện viên (PT)</Text>
              <TouchableOpacity onPress={() => goTo('PTList')} style={s.editButton}>
                <Ionicons name="create-outline" size={16} color={C.primary} />
                <Text style={s.editText}>Thay đổi</Text>
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              {pt ? (
                <>
                  <View style={s.personRow}>
                    <View style={s.ptAvatar}><Ionicons name="person" size={27} color={C.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.personName}>{pt.ho_ten}</Text>
                      <Text style={s.subText}>{pt.chuc_danh || 'Personal Trainer'}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={23} color={C.primary} />
                  </View>
                  <View style={s.divider} />
                  <InfoRow label="Kinh nghiệm" value={`${pt.so_nam_kinh_nghiem || '—'} năm`} />
                  <InfoRow label="Lựa chọn" value="Đã chọn PT" color={C.primary} />
                </>
              ) : (
                <View style={s.emptyPT}>
                  <Ionicons name="people-outline" size={32} color={C.muted} />
                  <Text style={s.subText}>{requiresPT ? 'Gói tập này yêu cầu chọn PT' : 'Bạn chưa chọn huấn luyện viên'}</Text>
                  <TouchableOpacity onPress={() => goTo('PTList')}>
                    <Text style={s.editText}>Chọn huấn luyện viên →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={s.sectionTitle}>Chi tiết thanh toán</Text>
            <View style={s.card}>
              <InfoRow label="Chi phí gói tập" value={money(price)} />
              <InfoRow label="Chi phí PT" value={optionalPT ? 'Chưa xác định' : requiresPT ? 'Theo quyền lợi gói' : '0đ'} />
              <View style={s.divider} />
              <View style={s.between}>
                <Text style={s.totalLabel}>Tổng tạm tính</Text>
                <Text style={s.totalPrice}>{money(price)}</Text>
              </View>
              <Text style={s.priceNote}>* Tổng tiền cuối cùng sẽ được Backend xác minh trước thanh toán.</Text>
              {optionalPT && <Text style={s.warning}>PT chọn thêm có thể phát sinh phí chưa tính trong tổng tạm tính.</Text>}
            </View>

            <View style={s.notice}>
              <Ionicons name="information-circle-outline" size={20} color={C.primary} />
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
                <Ionicons name="lock-closed-outline" size={15} color={C.primary} />
                <Text style={s.secureText}>Bước tiếp theo</Text>
              </View>
            </View>

            <TouchableOpacity style={[s.button, !canContinue && s.disabled]} disabled={!canContinue} onPress={handleContinue}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Text style={s.buttonText}>Tiếp tục thanh toán</Text>
                  <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
                </>
              )}
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
    backgroundColor: C.bg,
  },
  header: {
    height: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  progress: {
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  step: {
    fontSize: 11,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 1,
  },
  track: {
    height: 5,
    borderRadius: 8,
    backgroundColor: '#DCEBED',
    marginTop: 12,
  },
  fill: {
    width: '75%',
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: 8,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  subText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  hero: {
    borderRadius: 23,
    padding: 23,
    marginBottom: 17,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    color: C.white,
  },
  heroDesc: {
    color: '#D2F0F2',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 10,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: C.soft,
    borderRadius: 16,
    marginBottom: 25,
  },
  statusTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  statusBadge: {
    backgroundColor: C.white,
    borderRadius: 8,
    padding: 7,
  },
  statusBadgeText: {
    color: C.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    marginBottom: 13,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  editText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
    padding: 17,
    marginBottom: 24,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    backgroundColor: C.soft,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  packageName: {
    color: C.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },
  ptAvatar: {
    width: 51,
    height: 51,
    backgroundColor: C.soft,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 17,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  infoLabel: {
    color: C.muted,
    fontSize: 12,
    flex: 1,
  },
  infoValue: {
    color: C.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
  emptyPT: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
  },
  totalLabel: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },
  totalPrice: {
    color: C.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  priceNote: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 13,
  },
  warning: {
    color: '#B47A30',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    backgroundColor: C.soft,
    borderRadius: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: C.primary,
  },
  footer: {
    backgroundColor: C.white,
    paddingHorizontal: 19,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerPrice: {
    fontSize: 22,
    color: C.primary,
    fontWeight: '900',
    marginTop: 5,
  },
  secureBadge: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  secureText: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '700',
  },
  button: {
    height: 54,
    backgroundColor: C.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 15,
  },
  disabled: {
    backgroundColor: '#AECBD0',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.white,
  },
});

export default RegistrationReviewScreen;
