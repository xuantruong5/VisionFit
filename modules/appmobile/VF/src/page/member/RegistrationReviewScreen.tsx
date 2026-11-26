
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';

const money = (n: number) => `${n.toLocaleString('vi-VN')}đ`;
const InfoRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={[s.infoValue, color ? { color } : {}]}>{value}</Text>
  </View>
);

const RegistrationReviewScreen = ({ navigation, route }: any) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  // Nhận dữ liệu từ trang Package và PT
  const pkg = route?.params?.selectedPackage || null;
  const pt = route?.params?.selectedTrainer || null;
  const price = Number(pkg?.gia || 0);
  const requiresPT = pkg?.loai === 'pt' || Number(pkg?.so_buoi_pt || 0) > 0;
  const optionalPT = !!pt && !requiresPT;
  const canContinue = !!pkg?.id && Number.isFinite(price) && price >= 0 && Number(pkg?.thoi_han_ngay) > 0 && (!requiresPT || !!pt?.id);

  const [promoCode, setPromoCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const [promotionData, setPromotionData] = useState<any>(null);
  const [promotionLoading, setPromotionLoading] = useState(false);

  // Lấy thông tin hội viên và chương trình tập từ API
  const getRegistrationPreview = async () => {
    try {
      setLoading(true);
      const response = await apiFitlife.post('/client/registration-preview', {
        id_goi_tap: pkg?.id,
        id_trainer: pt?.id || null,
      });
      if (response.data.success) {
        setPreviewData(response.data.data);
      } else {
        Alert.alert('Thông báo', response.data.message);
      }
    } catch (error: any) {
      console.log(
        'Lỗi lấy thông tin đăng ký:',
        error.response?.data || error.message
      );

      Alert.alert('Thông báo', 'Không thể lấy thông tin đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  // Tính khuyến mãi
  const tinhKhuyenMai = async (maKhuyenMai?: string) => {
    if (!pkg?.id) return;
    try {
      setPromotionLoading(true);
      const payload: any = {
        id_goi_tap: Number(pkg.id),
      };
      if (maKhuyenMai?.trim()) {
        payload.ma_khuyen_mai = maKhuyenMai.trim().toUpperCase();
      }
      const response = await apiFitlife.post( '/client/tinh-khuyen-mai', payload );

      if (response.data.success) {
        setPromotionData(response.data.data);
        if (maKhuyenMai?.trim()) {
          Alert.alert('Thông báo', response.data.message);
        }
      } else {
        Alert.alert('Thông báo', response.data.message);
      }
    } catch (error: any) {
      console.log(
        'Lỗi tính khuyến mãi:',
        error.response?.data || error.message
      );
      Alert.alert(
        'Thông báo',
        error.response?.data?.message || 'Không thể tính khuyến mãi.'
      );
    } finally {
      setPromotionLoading(false);
    }
  };


  // Lưu mã giới thiệu
  const luuMaGioiThieu = async () => {
    const maGioiThieu = referralCode.trim().toUpperCase();
    if (!maGioiThieu) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã giới thiệu.');
      return;
    }

    if (!pkg?.id) {
      Alert.alert('Thông báo', 'Vui lòng chọn gói tập trước.');
      return;
    }

    try {
      setReferralLoading(true);

      const response = await apiFitlife.post( '/client/luu-ma-gioi-thieu',
        {
          ma_gioi_thieu: maGioiThieu,
          id_goi_tap: Number(pkg.id),
        }
      );

      if (response.data.success) { setReferralCode(maGioiThieu);
         setReferrerName(response.data.data?.ten_nguoi_gioi_thieu || '');


        Alert.alert( 'Thông báo', response.data.message || 'Lưu mã giới thiệu thành công.');
        // Tính lại khuyến mãi sau khi lưu mã
        await tinhKhuyenMai();
      } else {
        Alert.alert('Thông báo', response.data.message);
      }
    } catch (error: any) {
      console.log(
        'Lỗi lưu mã giới thiệu:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Thông báo',
        error.response?.data?.message || 'Không thể lưu mã giới thiệu.'
      );
    } finally {
      setReferralLoading(false);
    }
  };

  // Lấy thông tin mã giới thiệu đang chờ thanh toán
  const layThongTinGioiThieu = async () => {
    try {
      const response = await apiFitlife.get(
        '/client/thong-tin-gioi-thieu'
      );

      if (response.data.success && response.data.data) {
        setReferralCode(
          response.data.data.ma_gioi_thieu || ''
        );

        setReferrerName(
          response.data.data.ten_nguoi_gioi_thieu || ''
        );
      } else {
        setReferralCode('');
        setReferrerName('');
      }
    } catch (error: any) {
      console.log(
        'Lỗi lấy thông tin giới thiệu:',
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    getRegistrationPreview();
  }, [pkg?.id, pt?.id]);
  useEffect(() => {
    layThongTinGioiThieu();
  }, []);
  useEffect(() => {
    tinhKhuyenMai();
  }, [pkg?.id]);

  const goTo = (screen: string) => {
    const names = navigation.getState()?.routeNames || [];
    const target = names.includes(screen) ? screen : names.includes(`${screen}Screen`) ? `${screen}Screen` : screen;
    navigation.navigate(target, {
      selectedPackage: pkg,
      selectedTrainer: pt,
    });
  };

  const handleContinue = async () => {
    if (!canContinue) {
      Alert.alert(
        'Thông báo',
        !pkg?.id
          ? 'Vui lòng chọn gói tập.'
          : 'Gói tập này yêu cầu chọn PT.'
      );
      return;
    }

    if (saving) return;

    try {
      setSaving(true);
      // 1. Chuẩn bị dữ liệu đăng ký
      const payload = { id_goi_tap: Number(pkg.id),
        id_chuong_trinh_tap: previewData?.chuong_trinh_tap?.id || null,
        id_noi_tap: previewData?.chuong_trinh_tap?.id_noi_tap || null,
        id_trainer: pt?.id || null,
        ma_khuyen_mai:  promoCode.trim().toUpperCase() || null,
        ma_gioi_thieu: referralCode.trim().toUpperCase() || null,
        tien_giam_khuyen_mai: Number( promotionData?.tien_giam_khuyen_mai || 0 ),
        tien_giam_gioi_thieu: Number( promotionData?.tien_giam_gioi_thieu || 0 ),
        lan_dang_ky: Number( promotionData?.lan_dang_ky || 1),
        phan_tram_giam: Number(  promotionData?.phan_tram_giam || 0 ),
        phuong_thuc_thanh_toan: 'VietQR',
      };
     console.log('===== KIỂM TRA ĐĂNG KÝ GÓI =====');
    console.log('ID GÓI:', payload.id_goi_tap);
    console.log('ID CHƯƠNG TRÌNH:', payload.id_chuong_trinh_tap);
    console.log('ID NƠI TẬP:', payload.id_noi_tap);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));

      // 2. Gọi API tạo đăng ký gói
      const response = await apiFitlife.post( '/client/dang-ky-goi', payload );

      if (!response.data.success) {
        Alert.alert(
          'Thông báo',
          response.data.message || 'Không thể tạo đăng ký gói.'
        );
        return;
      }

      // 3. Lấy thông tin đăng ký từ Backend
      const dangKy = response.data.data;
      // 4. Chuyển sang màn hình thanh toán
      const names = navigation.getState()?.routeNames || [];
      const target = names.includes('Payment')  ? 'Payment' : names.includes('PaymentScreen') ? 'PaymentScreen' : 'Payment';

      navigation.navigate(target, {
        draft: {
          selectedPackage: pkg,
          selectedTrainer: pt,

          chuongTrinhTap:
            previewData?.chuong_trinh_tap || null,

          noiTap: {
            id:
              previewData?.chuong_trinh_tap?.id_noi_tap || null,
            ten_noi_tap:
              previewData?.chuong_trinh_tap?.ten_noi_tap || '',
          },

          hoiVien: previewData?.hoi_vien || null,

          maKhuyenMai: promoCode.trim().toUpperCase(),
          maGioiThieu: referralCode.trim().toUpperCase(),
          tenNguoiGioiThieu: referrerName,

          chiTietUuDai: promotionData,

          // ID đăng ký vừa tạo trong database
          idDangKyGoi: dangKy.id_dang_ky_goi,

          idChiTietDangKy: dangKy.id_chi_tiet_dang_ky,

          // Lấy tổng tiền chính thức từ Backend
          tongTienTamTinh: Number(dangKy.tong_tien),

          isThanhToan: dangKy.is_thanh_toan,
        },
      });

    } catch (error: any) {
      console.log(
        'Lỗi tạo đăng ký gói:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Thông báo',
        error.response?.data?.message ||
        'Không thể tạo đăng ký gói. Vui lòng thử lại.'
      );
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
                {previewData?.hoi_vien?.anh_dai_dien ? (
                  <Image source={{ uri: previewData.hoi_vien.anh_dai_dien }} style={s.memberAvatar} />
                ) : (
                  <View style={s.iconBox}>
                    <Ionicons name="person-outline" size={23} color={COLORS.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.personName}>{previewData?.hoi_vien?.ho_ten || 'Hội viên VisionFit'}</Text>
                  <Text style={s.subText}>{previewData?.hoi_vien?.email || 'Chưa có email'}</Text>
                </View>
                <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={s.divider} />
              <InfoRow label="Số điện thoại" value={previewData?.hoi_vien?.so_dien_thoai || 'Chưa cập nhật'} />
              <InfoRow label="Ngày sinh" value={previewData?.hoi_vien?.ngay_sinh || 'Chưa cập nhật'} />
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
                      <Text style={s.packageName}>
                        {pkg.ten_goi_tap || 'Chưa có tên gói'}
                      </Text>
                      <Text style={s.subText}>Gói tập VisionFit</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                  <View style={s.divider} />
                  <InfoRow label="Thời hạn" value={`${pkg.thoi_han_ngay || 0} ngày`} />
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
            <Text style={s.sectionTitle}>Chương trình tập của bạn</Text>
            <View style={s.card}>
              {previewData?.chuong_trinh_tap ? (
                <View style={s.programItem}>
                  <View style={s.programRow}>
                    {previewData.chuong_trinh_tap.anh_dai_dien ? (
                      <Image source={{ uri: previewData.chuong_trinh_tap.anh_dai_dien, }} style={s.programImage} resizeMode="cover" />
                    ) : (
                      <View style={[s.programImage, s.iconBox]}>
                        <Ionicons name="barbell-outline" size={25} color={COLORS.primary} />
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={s.packageName}>
                        {previewData.chuong_trinh_tap.ten_chuong_trinh}
                      </Text>
                      <Text style={s.subText}>
                        Số ngày: {previewData.chuong_trinh_tap.so_ngay}
                      </Text>
                      <Text style={s.subText}>
                        Số buổi mỗi tuần: {previewData.chuong_trinh_tap.so_buoi_moi_tuan}
                      </Text>
                      <Text style={s.subText}>
                        Cấp độ: {previewData.chuong_trinh_tap.ten_cap_do}
                      </Text>
                      <Text style={s.subText}>
                        Nơi tập: {previewData.chuong_trinh_tap.ten_noi_tap}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  </View>
                </View>
              ) : (
                <Text style={s.warning}>Chưa có chương trình tập.</Text>
              )}
            </View>

            <Text style={s.sectionTitle}>Chi tiết thanh toán</Text>

            <View style={s.paymentCard}>
              {/* Chi phí gói tập */}
              {/* <View style={s.paymentRow}>
                <Text style={s.paymentLabel}>Chi phí gói tập</Text>
                <Text style={s.paymentValue}>{money(price)}</Text>
              </View> */}

              {/* Mã ưu đãi */}
              <View style={s.promoContainer}>
                <Text style={s.promoTitle}>MÃ ƯU ĐÃI</Text>
                <View style={s.promoInputRow}>
                  <TextInput style={s.promoInput} placeholder="Nhập mã (VD: SALE5)" placeholderTextColor="#94A3B8" value={promoCode} onChangeText={setPromoCode} autoCapitalize="characters" />
                  <TouchableOpacity style={s.applyButton} onPress={() => tinhKhuyenMai(promoCode)} disabled={promotionLoading}>
                    {promotionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={s.applyButtonText}>Áp dụng</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Mã giới thiệu */}
                <Text style={[s.promoTitle, { marginTop: 10 }]}>
                  MÃ GIỚI THIỆU (Nếu Có)
                </Text>

                <View style={s.promoInputRow}>
                  <TextInput style={s.promoInput} placeholder="Nhập mã (VD: REF50)" placeholderTextColor="#94A3B8" value={referralCode}  onChangeText={setReferralCode} autoCapitalize="characters"editable={!referralLoading}  />
                  <TouchableOpacity style={[s.applyButton,referralLoading && { opacity: 0.6 }]} onPress={luuMaGioiThieu} disabled={referralLoading}>
                    {referralLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={s.applyButtonText}>Áp dụng</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {/* Lưu ý mã giới thiệu */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
                  <Text style={{ marginLeft: 5, fontSize: 12, color: '#64748B', flex: 1, lineHeight: 18, }}>
                    Lưu ý: Nếu nhập sai mã giới thiệu, bạn có thể nhập lại mã khác cho đúng,Và người giới thiệu bạn chỉ được 1 lần áp dung mã giới thiệu 
                  </Text>
                </View>

                {referrerName !== '' && (
                    <Text style={{ marginTop: 8, fontSize: 13, color: '#0D7F8D' }}>
                      Người giới thiệu: {referrerName}
                    </Text>
                  )}
              </View>

              <Text style={s.discountTitle}>Chi tiết ưu đãi</Text>
              <View style={s.discountCard}>
                <View style={s.discountRow}>
                  <Text style={s.discountLabel}>Chi phí gói tập</Text>
                  <Text style={s.discountValue}>{money(price)}</Text>
                </View>
                {Number(promotionData?.tien_giam_khuyen_mai || 0) > 0 && (
                  <View style={s.discountRow}>
                    <Text style={s.discountLabel}>
                      {Number(promotionData?.lan_dang_ky || 1) >= 2
                        ? `Ưu đãi đăng ký lần ${promotionData.lan_dang_ky} (${promotionData.phan_tram_giam || 0}%)`
                        : promotionData?.ten_khuyen_mai || 'Ưu đãi khuyến mãi'}
                    </Text>

                    <Text style={s.discountValue2}>
                      -{money(Number(promotionData.tien_giam_khuyen_mai))}
                    </Text>
                  </View>
                )}
               {Number(promotionData?.tien_giam_gioi_thieu || 0) > 0 && (
                <View style={s.discountRow}>
                  <Text style={s.discountLabel}>Ưu đãi giới thiệu</Text>

                  <Text style={s.discountValue2}>
                    -{money(Number(promotionData.tien_giam_gioi_thieu))}
                  </Text>
                </View>
              )}

                <View style={s.discountRow}>
                  <Text style={s.discountTotalLabel}>Tổng giảm</Text>

                  <Text style={s.discountAmount}>
                    {money(Number(promotionData?.tong_tien_giam || 0))}
                  </Text>
                </View>

                <View style={[s.paymentRow, { marginTop: 8 }]}>
                  <Text style={s.paymentLabel}>Chi phí PT</Text>
                  <Text style={s.ptPrice}>
                    {optionalPT ? 'Chưa xác định' : requiresPT ? 'Theo quyền lợi gói' : '0đ'}
                  </Text>
                </View>

                <View style={s.discountTotalRow}>
                  <Text style={s.discountTotalLabel}>Tổng thanh toán</Text>
                  <Text style={s.finalPrice}>
                    {money(Number(promotionData?.tong_tien ?? price))}
                  </Text>
                </View>
              </View>

              <Text style={s.priceNote}>
                * Tổng tiền cuối cùng sẽ được Backend xác minh trước thanh toán.
              </Text>

              {optionalPT && (
                <View style={s.warningBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#F97316" />
                  <Text style={s.warningText}>
                    PT chọn thêm có thể phát sinh phí chưa tính trong tổng tạm tính.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={s.footer}>
            <View style={s.between}>
              <View>
                <Text style={s.subText}>TỔNG TẠM TÍNH</Text>
                <Text style={s.footerPrice}>{money(Number(promotionData?.tong_tien ?? price))}</Text>
              </View>
              <View style={s.secureBadge}>
                <Ionicons name="lock-closed-outline" size={15} color={COLORS.primary} />
                <Text style={s.secureText}>Bước tiếp theo</Text>
              </View>
            </View>

            <TouchableOpacity style={s.buttonWrap} activeOpacity={0.85} disabled={!canContinue || saving} onPress={handleContinue}>
              <LinearGradient
                colors={canContinue ? [COLORS.primary, COLORS.primaryDark] : ['#AFC8D3', '#AFC8D3']}
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
    borderRadius: 999,
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
    borderRadius: 999,
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
    borderRadius: 999,
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
  programItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  programImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTeal,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF4',
    borderRadius: 18,
    padding: 14,
    marginBottom: 24,
    ...SHADOWS.card,
  },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  paymentLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  paymentValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },

  paymentDivider: {
    height: 1,
    backgroundColor: '#EDF1F5',
    marginBottom: 10,
  },

  promoContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EDF1F5',
    borderRadius: 13,
    padding: 10,
  },

  promoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 5,
  },

  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  promoInput: {
    flex: 1,
    height: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4ED',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontSize: 12,
    color: '#0F172A',
  },

  applyButton: {
    height: 36,
    paddingHorizontal: 12,
    backgroundColor: '#172033',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  ptPrice: {
    fontSize: 14,
    color: '#94A3B8',
  },

  discountCard: {
    backgroundColor: '#FBFDFF',
    borderWidth: 1,
    borderColor: '#E8EEF4',
    borderRadius: 13,
    padding: 11,
    marginTop: 10,
  },

  discountTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    marginTop: 12,
  },

  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },

  discountLabel: {
    fontSize: 14,
    color: '#64748B',
  },

  discountValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  discountValue2: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },


  discountTotalLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },

  discountAmount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },

  discountTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },

  finalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00A878',
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: '#FDE7D0',
    borderRadius: 11,
    padding: 10,
    marginTop: 10,
  },

  warningText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    color: '#C2410C',
  },
});

export default RegistrationReviewScreen;
