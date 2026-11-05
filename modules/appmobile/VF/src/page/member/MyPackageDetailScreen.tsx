
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';


const MyPackageDetailScreen = ({ navigation, route }: any) => {
  const id = route?.params?.id;
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const response = await apiFitlife.get(`/client/goi-tap-cua-toi/${id}`);

        if (active) {
          setRegistration(response.data.data);
        }
      } catch (error: any) {
        if (active) {
          Alert.alert(
            'Lỗi',
            error.response?.data?.message || 'Không thể tải chi tiết gói tập.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (id) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);
  const pkg = registration;
  const pt = registration;
  const total = Number(registration?.tong_tien || 0);
  const method = registration?.phuong_thuc_thanh_toan || 'Chưa chọn';
  const isPaid = Number(registration?.is_thanh_toan) === 1;
  const benefits: string[] = registration?.mo_ta ? registration.mo_ta .split(/[,.]/) .map((item: string) => item.trim()) .filter((item: string) => item.length > 0)
    : [];
  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <AppHeader title="Chi tiết gói tập" onBack={() => navigation.goBack()} />

        <View style={s.empty}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.subText}>Đang tải thông tin gói tập...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        title="Chi tiết gói tập"
        onBack={() => navigation.goBack()}
        rightComponent={
          <View style={s.headerIcon}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          </View>
        }
      />

      {!pkg ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="alert-circle-outline" size={34} color={COLORS.accentOrange} />
          </View>
          <Text style={s.emptyTitle}>Không tìm thấy gói tập</Text>
          <Text style={s.subText}>Vui lòng quay lại danh sách gói tập.</Text>

          <TouchableOpacity
            onPress={() => {
              const routeNames = navigation.getState()?.routeNames || [];
              const target = routeNames.includes('MyPackages') ? 'MyPackages' : routeNames.includes('MyPackagesScreen') ? 'MyPackagesScreen' : 'MyPackages';
              navigation.navigate(target);
            }}
            style={s.linkBtn}
          >
            <Text style={s.linkText}>Xem gói tập của tôi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

            {/* Banner */}
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
              <View style={s.heroDecor} />
              <View style={s.heroDecorSmall} />
              <View style={s.heroIcon}>
                <Ionicons name="barbell-outline" size={22} color={COLORS.white} />
              </View>

              <Text style={s.heroLabel}>VISIONFIT MEMBERSHIP</Text>
              <Text style={s.heroTitle}>{pkg.ten_goi}</Text>
              <Text style={s.heroDesc}>
                Thông tin chi tiết về gói tập và đăng ký của bạn.
              </Text>

              <View style={s.heroBottom}>
                <Ionicons name="time-outline" size={15} color={COLORS.white} />
                <Text style={s.heroBottomText}>Thời hạn {pkg.thoi_han} ngày</Text>
              </View>
            </LinearGradient>

            {/* Trạng thái */}
            <View style={s.statusBox}>
              <View style={s.statusIcon}>
                  <Ionicons  name={isPaid ? 'checkmark-circle-outline' : 'time-outline'} size={20} color={isPaid ? COLORS.accentGreen : COLORS.accentGold} />
              </View>
              <View style={s.flex}>
                  <Text style={s.statusTitle}>
                      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </Text>
                  <Text style={s.subText}>
                      {isPaid ? 'Giao dịch đã được thanh toán' : 'Đang chờ thanh toán'}
                  </Text>
              </View>
              <View style={s.statusBadge}>
                  <Text style={s.statusBadgeText}>
                      {isPaid ? 'PAID' : 'PENDING'}
                  </Text>
              </View>
          </View>

            {/* Thông tin gói */}
            <Text style={s.sectionTitle}>Thông tin gói tập</Text>

            <View style={[s.card, s.cardList]}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Tên gói</Text>
                <Text style={s.infoValue}>{pkg.ten_goi}</Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Thời hạn</Text>
                <Text style={s.infoValue}>{pkg.thoi_han} ngày</Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Số buổi PT</Text>
                <Text style={s.infoValue}>{pkg.so_buoi_pt || 0} buổi</Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Hỗ trợ AI</Text>
                <Text style={s.infoValue}>
                  {pkg.co_ai ? 'Có' : 'Không'}
                </Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Đánh giá bởi PT</Text>
                <Text style={s.infoValue}>
                  {pkg.co_trainer_review ? 'Có' : 'Không'}
                </Text>
              </View>
            </View>

            {/* Quyền lợi */}
            <Text style={s.sectionTitle}>Quyền lợi gói tập</Text>

            <View style={[s.card, benefits.length > 0 && s.cardList]}>
              {benefits.length > 0 ? (
                benefits.map((benefit, index) => (
                  <View key={index} style={s.benefitRow}>
                    <View style={s.benefitIcon}>
                      <Ionicons name="checkmark" size={13} color={COLORS.white} />
                    </View>
                    <Text style={s.benefitText}>{benefit}</Text>
                  </View>
                ))
              ) : (
                <Text style={s.subText}>Chưa có thông tin quyền lợi chi tiết.</Text>
              )}
            </View>

            {/* Huấn luyện viên */}
            <Text style={s.sectionTitle}>Huấn luyện viên cá nhân</Text>

            <View style={s.card}>
              {pt ? (
                <View style={s.trainerRow}>
                  <View style={s.trainerAvatar}>
                    <Ionicons name="person" size={24} color={COLORS.primary} />
                  </View>

                  <View style={s.flex}>
                    <Text style={s.trainerName}>{pt.ho_ten}</Text>
                    <Text style={s.subText}>
                      {pt.chuc_danh || 'Personal Trainer'}
                    </Text>
                  </View>

                  <Ionicons name="checkmark-circle" size={23} color={COLORS.primary} />
                </View>
              ) : (
                <View style={s.noTrainer}>
                  <View style={s.noTrainerIcon}>
                    <Ionicons name="people-outline" size={24} color={COLORS.textMuted} />
                  </View>
                  <Text style={s.subText}>Không có huấn luyện viên được chọn</Text>
                </View>
              )}
            </View>

            {/* Thông tin đăng ký */}
            <Text style={s.sectionTitle}>Thông tin đăng ký</Text>
            <View style={[s.card, s.cardList]}>
                <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Mã đăng ký</Text>
                    <Text style={s.infoValue}>
                        VF-{String(registration.id).padStart(5, '0')}
                    </Text>
                </View>
                <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Ngày đăng ký</Text>
                    <Text style={s.infoValue}>
                        {registration.ngay_dang_ky ? new Date(registration.ngay_dang_ky).toLocaleDateString('vi-VN') : '—'}
                    </Text>
                </View>
                <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Phương thức</Text>
                    <Text style={s.infoValue}>{method}</Text>
                </View>
                <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Trạng thái</Text>
                    <Text style={s.infoValue}>
                        {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </Text>
                </View>
            </View>

            {/* Thanh toán */}
           <Text style={s.sectionTitle}>Chi tiết chi phí</Text>
          <View style={[s.card, s.cardList]}>
              <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Giá gói tập</Text>
                  <Text style={s.infoValue}>
                      {Number(registration.don_gia || 0).toLocaleString('vi-VN')}đ
                  </Text>
              </View>
              <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Giảm giá khuyến mãi</Text>
                  <Text style={s.infoValue}>
                      -{Number(registration.tien_giam_khuyen_mai || 0).toLocaleString('vi-VN')}đ
                  </Text>
              </View>
              <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Giảm giá giới thiệu</Text>
                  <Text style={s.infoValue}>
                      -{Number(registration.tien_giam_gioi_thieu || 0).toLocaleString('vi-VN')}đ
                  </Text>
              </View>
              <View style={s.dashedDivider} />
              <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Tổng thanh toán</Text>
                  <Text style={s.totalValue}>
                      {total.toLocaleString('vi-VN')}đ
                  </Text>
              </View>
          </View>

            {/* Thông báo */}
            <View style={s.notice}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={s.noticeText}>
                Thông tin đăng ký và chi phí được lấy trực tiếp từ hệ thống VisionFit.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity activeOpacity={0.85}
              onPress={() => { const routeNames = navigation.getState()?.routeNames || [];  const target = routeNames.includes('MyPackages') ? 'MyPackages' : routeNames.includes('MyPackagesScreen') ? 'MyPackagesScreen' : 'MyPackages'; navigation.navigate(target); }} >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.backListButton}
              >
                <Ionicons name="albums-outline" size={20} color={COLORS.white} />
                <Text style={s.backListText}>Quay lại gói tập của tôi</Text>
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
  flex: {
    flex: 1,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: 20,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FFF1EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  linkBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subText: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textMuted,
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -50,
  },
  heroDecorSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: -40,
    left: -20,
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
  heroLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    color: COLORS.white,
  },
  heroDesc: {
    fontSize: 12.5,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBottomText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
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
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statusBadge: {
    backgroundColor: COLORS.surfaceTeal,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
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
  cardList: {
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  benefitIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  trainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trainerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceTeal,
    borderWidth: 2,
    borderColor: COLORS.borderFocus,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainerName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  noTrainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  noTrainerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentGold,
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceTeal,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  priceNote: {
    fontSize: 12,
    lineHeight: 18,
    color: '#B47A30',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceTeal,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
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
  backListButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  backListText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});

export default MyPackageDetailScreen;
