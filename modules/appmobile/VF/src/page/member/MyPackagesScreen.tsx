
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';


const STORAGE_KEY = 'visionfit_demo_registrations';

type Registration = {
  id: string;
  createdAt?: string;
  selectedPackage: {
    id: number | string;
    ten_goi: string;
    gia: number;
    thoi_han: number;
    so_buoi_pt?: number;
  };
  selectedTrainer?: {
    id: number | string;
    ho_ten: string;
  } | null;
  estimatedTotal?: number;
  paymentMethod?: string;
  status?: string;
};

const MyPackagesScreen = ({ navigation }: any) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Tải danh sách đăng ký đã lưu trên thiết bị
  useFocusEffect(useCallback(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];

        if (active) {
          setRegistrations(Array.isArray(data) ? data.filter(item => item?.selectedPackage) : []);
        }
      } catch {
        if (active) Alert.alert('Lỗi', 'Không thể tải danh sách gói tập.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, []));

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        title="Gói tập của tôi"
        onBack={() => navigation.goBack()}
        rightComponent={
          <View style={s.headerIcon}>
            <Ionicons name="barbell-outline" size={20} color={COLORS.primary} />
          </View>
        }
      />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.subText}>Đang tải gói tập...</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

            {/* Banner */}
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
              <View style={s.heroDecor} />
              <View style={s.heroIcon}>
                <Ionicons name="fitness-outline" size={22} color={COLORS.white} />
              </View>

              <Text style={s.heroTitle}>Hành trình tập luyện của bạn</Text>
              <Text style={s.heroDesc}>
                Theo dõi các gói tập đã đăng ký và quản lý thông tin tập luyện tại VisionFit.
              </Text>

              <View style={s.heroBadge}>
                <Ionicons name="information-circle-outline" size={15} color={COLORS.white} />
                <Text style={s.heroBadgeText}>Dữ liệu đăng ký Demo</Text>
              </View>
            </LinearGradient>

            {/* Thống kê */}
            <View style={s.summaryCard}>
              <View style={s.summaryIcon}>
                <Ionicons name="albums" size={22} color="#8B5CF6" />
              </View>

              <View style={s.flex}>
                <Text style={s.summaryLabel}>Tổng số đăng ký Demo</Text>
                <Text style={s.summaryValue}>{registrations.length} gói tập</Text>
              </View>

              <Ionicons name="checkmark-circle" size={24} color={COLORS.accentGreen} />
            </View>

            {/* Danh sách */}
            <View style={s.sectionRow}>
              <View style={s.flex}>
                <Text style={s.sectionTitle}>Danh sách gói tập</Text>
                <Text style={s.subText}>Những gói bạn đã hoàn tất đăng ký thử</Text>
              </View>

              <View style={s.countBadge}>
                <Text style={s.countText}>{registrations.length} gói</Text>
              </View>
            </View>

            {registrations.length === 0 ? (
              <View style={s.emptyBox}>
                <View style={s.emptyIcon}>
                  <Ionicons name="barbell-outline" size={34} color={COLORS.primary} />
                </View>

                <Text style={s.emptyTitle}>Chưa có gói tập nào</Text>
                <Text style={s.emptyDesc}>
                  Bạn chưa hoàn tất đăng ký gói tập Demo nào. Hãy chọn một gói phù hợp để bắt đầu nhé!
                </Text>
              </View>
            ) : (
              registrations.map(item => {
                const pkg = item.selectedPackage;
                const pt = item.selectedTrainer;
                const total = Number(item.estimatedTotal ?? pkg.gia ?? 0);

                const methodName = item.paymentMethod === 'bank'
                  ? 'Chuyển khoản ngân hàng'
                  : item.paymentMethod === 'wallet'
                    ? 'Ví điện tử'
                    : item.paymentMethod === 'counter'
                      ? 'Thanh toán tại quầy'
                      : 'Chưa chọn';

                return (
                  <View key={item.id} style={s.packageCard}>

                    {/* Mã đăng ký và trạng thái */}
                    <View style={s.cardHeader}>
                      <Text style={s.registrationCode}>#{item.id}</Text>

                      <View style={s.pendingBadge}>
                        <Ionicons name="time-outline" size={13} color={COLORS.accentGold} />
                        <Text style={s.pendingText}>Chờ thanh toán</Text>
                      </View>
                    </View>

                    <View style={s.divider} />

                    {/* Gói tập */}
                    <View style={s.packageRow}>
                      <View style={s.packageIcon}>
                        <Ionicons name="barbell" size={22} color={COLORS.primary} />
                      </View>

                      <View style={s.flex}>
                        <Text style={s.packageName}>{pkg.ten_goi}</Text>
                        <Text style={s.subText}>Gói tập VisionFit</Text>
                      </View>
                    </View>

                    {/* Thông tin chi tiết */}
                    <View style={s.details}>
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Thời hạn</Text>
                        <Text style={s.infoValue}>{pkg.thoi_han} ngày</Text>
                      </View>

                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Huấn luyện viên</Text>
                        <Text style={s.infoValue}>{pt?.ho_ten || 'Không chọn PT'}</Text>
                      </View>

                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Số buổi PT</Text>
                        <Text style={s.infoValue}>{pkg.so_buoi_pt || 0} buổi</Text>
                      </View>

                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Thanh toán</Text>
                        <Text style={s.infoValue}>{methodName}</Text>
                      </View>

                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Ngày đăng ký Demo</Text>
                        <Text style={s.infoValue}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </Text>
                      </View>
                    </View>

                    <View style={s.dashedDivider} />

                    {/* Tổng tiền */}
                    <View style={s.priceRow}>
                      <View>
                        <Text style={s.priceLabel}>TỔNG TẠM TÍNH</Text>
                        <Text style={s.priceValue}>{total.toLocaleString('vi-VN')}đ</Text>
                      </View>

                      <TouchableOpacity
                        style={s.detailButton}
                        onPress={() => {
                          const routeNames = navigation.getState()?.routeNames || [];
                          const target = routeNames.includes('MyPackageDetail') ? 'MyPackageDetail' : routeNames.includes('MyPackageDetailScreen') ? 'MyPackageDetailScreen' : 'MyPackageDetail';
                          navigation.navigate(target, { registration: item });
                        }}
                      >
                        <Text style={s.detailText}>Xem chi tiết</Text>
                        <Ionicons name="arrow-forward" size={15} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Lưu ý */}
            <View style={s.notice}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={s.noticeText}>
                Danh sách này chỉ gồm các đăng ký mô phỏng lưu trên thiết bị. Các gói chưa được kích hoạt hoặc thanh toán thực tế.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const routeNames = navigation.getState()?.routeNames || [];
                const target = routeNames.includes('WorkoutSelection') ? 'WorkoutSelection' : routeNames.includes('WorkoutSelectionScreen') ? 'WorkoutSelectionScreen' : 'WorkoutSelection';
                navigation.navigate(target);
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.addButton}
              >
                <Ionicons name="add-circle-outline" size={21} color={COLORS.white} />
                <Text style={s.addText}>Đăng ký gói tập mới</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  subText: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textMuted,
  },
  hero: {
    borderRadius: 22,
    padding: 20,
    paddingBottom: 46,
    overflow: 'hidden',
  },
  heroDecor: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
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
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 29,
  },
  heroDesc: {
    fontSize: 12.5,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 12,
    marginTop: -30,
    marginBottom: 24,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.primaryLight,
  },
  countText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12.5,
    lineHeight: 19,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  packageCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  registrationCode: {
    flexShrink: 1,
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
  },
  pendingText: {
    fontSize: 10.5,
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
    marginVertical: 14,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packageIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  details: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoLabel: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  infoValue: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  priceLabel: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  detailText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.white,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.surfaceTeal,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 19,
    color: COLORS.primaryDark,
  },
  footer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    ...SHADOWS.card,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  addButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  addText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
});

export default MyPackagesScreen;
