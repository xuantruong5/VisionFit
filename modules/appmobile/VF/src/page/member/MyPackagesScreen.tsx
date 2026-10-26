
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  primary: '#0D7F8D',
  dark: '#075865',
  bg: '#F4FAFB',
  white: '#FFFFFF',
  text: '#16383E',
  muted: '#78949A',
  border: '#DFEAEC',
  soft: '#E7F5F6',
};

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
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={23} color={C.text} />
        </TouchableOpacity>

        <Text style={s.headerTitle}>Gói tập của tôi</Text>
        <Ionicons name="barbell-outline" size={24} color={C.primary} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.subText}>Đang tải gói tập...</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

            {/* Banner */}
            <LinearGradient colors={['#087F8F', '#064E60']} style={s.hero}>
              <View style={s.heroIcon}>
                <Ionicons name="fitness-outline" size={24} color={C.white} />
              </View>

              <Text style={s.heroTitle}>Hành trình tập luyện của bạn</Text>
              <Text style={s.heroDesc}>
                Theo dõi các gói tập đã đăng ký và quản lý thông tin tập luyện tại VisionFit.
              </Text>

              <View style={s.heroBadge}>
                <Ionicons name="information-circle-outline" size={16} color="#D7F5F5" />
                <Text style={s.heroBadgeText}>Dữ liệu đăng ký Demo</Text>
              </View>
            </LinearGradient>

            {/* Thống kê */}
            <View style={s.summaryCard}>
              <View style={s.summaryIcon}>
                <Ionicons name="albums-outline" size={26} color={C.primary} />
              </View>

              <View style={s.flex}>
                <Text style={s.summaryLabel}>Tổng số đăng ký Demo</Text>
                <Text style={s.summaryValue}>{registrations.length} gói tập</Text>
              </View>

              <Ionicons name="checkmark-circle-outline" size={24} color={C.primary} />
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
                  <Ionicons name="barbell-outline" size={37} color={C.primary} />
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
                        <Ionicons name="time-outline" size={14} color={C.primary} />
                        <Text style={s.pendingText}>Chờ thanh toán</Text>
                      </View>
                    </View>

                    <View style={s.divider} />

                    {/* Gói tập */}
                    <View style={s.packageRow}>
                      <View style={s.packageIcon}>
                        <Ionicons name="barbell" size={24} color={C.primary} />
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

                    <View style={s.divider} />

                    {/* Tổng tiền */}
                    <View style={s.priceRow}>
                      <View>
                        <Text style={s.priceLabel}>TỔNG TẠM TÍNH</Text>
                        <Text style={s.priceValue}>{total.toLocaleString('vi-VN')}đ</Text>
                      </View>

                      <TouchableOpacity
                        style={s.detailButton}
                        onPress={() => {
                          if (navigation.getState()?.routeNames?.includes('MyPackageDetail')) {
                            navigation.navigate('MyPackageDetail', { registration: item });
                          } else {
                            Alert.alert('Thông báo', 'Màn chi tiết gói tập sẽ được thêm ở bước tiếp theo.');
                          }
                        }}
                      >
                        <Text style={s.detailText}>Xem chi tiết</Text>
                        <Ionicons name="arrow-forward" size={17} color={C.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Lưu ý */}
            <View style={s.notice}>
              <Ionicons name="information-circle-outline" size={21} color={C.primary} />
              <Text style={s.noticeText}>
                Danh sách này chỉ gồm các đăng ký mô phỏng lưu trên thiết bị. Các gói chưa được kích hoạt hoặc thanh toán thực tế.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity
              style={s.addButton}
              onPress={() => navigation.navigate('WorkoutSelection')}
            >
              <Ionicons name="add-circle-outline" size={22} color={C.white} />
              <Text style={s.addText}>Đăng ký gói tập mới</Text>
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
  flex: {
    flex: 1,
  },
  header: {
    height: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    backgroundColor: C.white,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 25,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  subText: {
    fontSize: 12,
    lineHeight: 19,
    color: C.muted,
  },
  hero: {
    borderRadius: 23,
    padding: 23,
    marginBottom: 19,
  },
  heroIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.white,
    lineHeight: 31,
  },
  heroDesc: {
    fontSize: 12,
    lineHeight: 20,
    color: '#D2F0F2',
    marginTop: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 19,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D7F5F5',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 25,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.soft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 19,
    fontWeight: '900',
    color: C.text,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.soft,
  },
  countText: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
    padding: 28,
    alignItems: 'center',
    marginBottom: 22,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 12,
    lineHeight: 20,
    color: C.muted,
    textAlign: 'center',
  },
  packageCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
    padding: 17,
    marginBottom: 17,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  registrationCode: {
    flexShrink: 1,
    fontSize: 11,
    color: C.muted,
    fontWeight: '700',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: C.soft,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.primary,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packageIcon: {
    width: 49,
    height: 49,
    borderRadius: 14,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 5,
  },
  details: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 14,
    marginTop: 17,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoLabel: {
    flex: 1,
    fontSize: 12,
    color: C.muted,
  },
  infoValue: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: C.text,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  priceLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: '700',
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 21,
    fontWeight: '900',
    color: C.primary,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.primary,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: C.soft,
    borderRadius: 14,
    padding: 15,
    marginTop: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: C.primary,
  },
  footer: {
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 19,
    paddingVertical: 15,
  },
  addButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: C.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  addText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.white,
  },
});

export default MyPackagesScreen;
