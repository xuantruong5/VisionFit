
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AppHeader from '../../components/AppHeader';

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

const MyPackageDetailScreen = ({ navigation, route }: any) => {
  const registration = route?.params?.registration;
  const pkg = registration?.selectedPackage;
  const pt = registration?.selectedTrainer;
  const total = Number(registration?.estimatedTotal ?? pkg?.gia ?? 0);
  const benefits: string[] = pkg?.quyen_loi || [];

  const method = registration?.paymentMethod === 'bank'
    ? 'Chuyển khoản ngân hàng'
    : registration?.paymentMethod === 'wallet'
      ? 'Ví điện tử'
      : registration?.paymentMethod === 'counter'
        ? 'Thanh toán tại quầy'
        : 'Chưa chọn';

  const extraPT = !!pt && pkg?.loai !== 'pt' && Number(pkg?.so_buoi_pt || 0) === 0;

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        title="Chi tiết gói tập"
        onBack={() => navigation.goBack()}
        rightComponent={
          <Ionicons name="document-text-outline" size={22} color={C.primary} />
        }
      />

      {!pkg ? (
        <View style={s.empty}>
          <Ionicons name="alert-circle-outline" size={45} color={C.muted} />
          <Text style={s.emptyTitle}>Không tìm thấy gói tập</Text>
          <Text style={s.subText}>Vui lòng quay lại danh sách gói tập.</Text>

          <TouchableOpacity onPress={() => navigation.navigate('MyPackages')}>
            <Text style={s.linkText}>Xem gói tập của tôi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

            {/* Banner */}
            <LinearGradient colors={['#087F8F', '#064E60']} style={s.hero}>
              <View style={s.heroIcon}>
                <Ionicons name="barbell-outline" size={26} color={C.white} />
              </View>

              <Text style={s.heroLabel}>VISIONFIT MEMBERSHIP</Text>
              <Text style={s.heroTitle}>{pkg.ten_goi}</Text>
              <Text style={s.heroDesc}>
                Thông tin chi tiết về gói tập và đăng ký của bạn.
              </Text>

              <View style={s.heroBottom}>
                <Ionicons name="time-outline" size={17} color="#D7F5F5" />
                <Text style={s.heroBottomText}>Thời hạn {pkg.thoi_han} ngày</Text>
              </View>
            </LinearGradient>

            {/* Trạng thái */}
            <View style={s.statusBox}>
              <View style={s.statusIcon}>
                <Ionicons name="time-outline" size={24} color={C.primary} />
              </View>

              <View style={s.flex}>
                <Text style={s.statusTitle}>Chờ thanh toán</Text>
                <Text style={s.subText}>Đăng ký Demo chưa kích hoạt</Text>
              </View>

              <View style={s.statusBadge}>
                <Text style={s.statusBadgeText}>DEMO</Text>
              </View>
            </View>

            {/* Thông tin gói */}
            <Text style={s.sectionTitle}>Thông tin gói tập</Text>

            <View style={s.card}>
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

            <View style={s.card}>
              {benefits.length > 0 ? (
                benefits.map((benefit, index) => (
                  <View key={index} style={s.benefitRow}>
                    <Ionicons name="checkmark-circle" size={20} color={C.primary} />
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
                    <Ionicons name="person-outline" size={28} color={C.primary} />
                  </View>

                  <View style={s.flex}>
                    <Text style={s.trainerName}>{pt.ho_ten}</Text>
                    <Text style={s.subText}>
                      {pt.chuc_danh || 'Personal Trainer'}
                    </Text>
                  </View>

                  <Ionicons name="checkmark-circle" size={23} color={C.primary} />
                </View>
              ) : (
                <View style={s.noTrainer}>
                  <Ionicons name="people-outline" size={28} color={C.muted} />
                  <Text style={s.subText}>Không có huấn luyện viên được chọn</Text>
                </View>
              )}
            </View>

            {/* Thông tin đăng ký */}
            <Text style={s.sectionTitle}>Thông tin đăng ký</Text>

            <View style={s.card}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Mã đăng ký Demo</Text>
                <Text style={s.infoValue}>{registration.id || '—'}</Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Ngày đăng ký</Text>
                <Text style={s.infoValue}>
                  {registration.createdAt
                    ? new Date(registration.createdAt).toLocaleDateString('vi-VN')
                    : '—'}
                </Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Phương thức</Text>
                <Text style={s.infoValue}>{method}</Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Trạng thái</Text>
                <Text style={s.pendingText}>Chờ thanh toán</Text>
              </View>
            </View>

            {/* Thanh toán */}
            <Text style={s.sectionTitle}>Chi tiết chi phí</Text>

            <View style={s.card}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Giá gói tập</Text>
                <Text style={s.infoValue}>
                  {Number(pkg.gia || 0).toLocaleString('vi-VN')}đ
                </Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Phí PT chọn thêm</Text>
                <Text style={s.infoValue}>
                  {extraPT ? 'Chưa xác định' : 'Không tính thêm'}
                </Text>
              </View>

              <View style={s.divider} />

              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Tổng tạm tính</Text>
                <Text style={s.totalValue}>
                  {total.toLocaleString('vi-VN')}đ
                </Text>
              </View>

              {extraPT && (
                <Text style={s.priceNote}>
                  Phí PT chọn thêm chưa được tính vào tổng tạm tính.
                </Text>
              )}
            </View>

            {/* Thông báo */}
            <View style={s.notice}>
              <Ionicons name="information-circle-outline" size={22} color={C.primary} />
              <Text style={s.noticeText}>
                Đây là thông tin đăng ký mô phỏng được lưu trên thiết bị.
                Gói tập chưa được kích hoạt và chưa phát sinh thanh toán thực tế.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity
              style={s.backListButton}
              onPress={() => navigation.navigate('MyPackages')}
            >
              <Ionicons name="albums-outline" size={21} color={C.white} />
              <Text style={s.backListText}>Quay lại gói tập của tôi</Text>
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
    borderRadius: 13,
    backgroundColor: C.white,
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.primary,
  },
  subText: {
    fontSize: 12,
    lineHeight: 19,
    color: C.muted,
  },
  hero: {
    borderRadius: 23,
    padding: 23,
    marginBottom: 17,
  },
  heroIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: '#D4F9FA',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    color: C.white,
  },
  heroDesc: {
    fontSize: 12,
    lineHeight: 20,
    color: '#D2F0F2',
    marginTop: 10,
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 20,
  },
  heroBottomText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D7F5F5',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: C.soft,
    borderRadius: 16,
    marginBottom: 25,
  },
  statusIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: C.white,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    marginBottom: 13,
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
    padding: 17,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
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
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: C.text,
  },
  trainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trainerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.soft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainerName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 5,
  },
  noTrainer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.primary,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 17,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  totalValue: {
    fontSize: 23,
    fontWeight: '900',
    color: C.primary,
  },
  priceNote: {
    fontSize: 11,
    lineHeight: 18,
    color: '#B47A30',
    marginTop: 13,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    borderRadius: 14,
    backgroundColor: C.soft,
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
  backListButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: C.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  backListText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },
});

export default MyPackageDetailScreen;
