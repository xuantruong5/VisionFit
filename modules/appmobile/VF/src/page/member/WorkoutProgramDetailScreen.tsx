import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../general/api';
import ImageTextGradient from '../../components/ImageTextGradient';
import LinearGradient from 'react-native-linear-gradient';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';

const WorkoutProgramDetailScreen = ({ navigation, route }: any) => {
  const { goalId, goalName, gender, capDoName, capDoId, id_noi_tap, ten_noi_tap } = route.params || {};

  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const handleRegisterProgram = async () => {
    if (registering) return;
    if (!goalId) {
      Alert.alert('Thông báo', 'Không tìm thấy ID chương trình tập.');
      return;
    }
    setRegistering(true);
    try {
      const res = await apiFitlife.post('/client/dang-ky-chuong-trinh', {
        id_chuong_trinh: goalId,
        id_cap_do: capDoId,
        id_noi_tap,
      });
      if (res.data?.success || res.data?.status) {
        Alert.alert(
          'Thành công',
          res.data?.message || 'Đăng ký chương trình tập thành công!',
          [{ text: 'Vào kế hoạch tập', onPress: () => navigation.navigate('headerPage') }],
        );
      } else {
        Alert.alert('Thông báo', res.data?.message || 'Đăng ký chưa thành công.');
      }
    } catch (error: any) {
      Alert.alert(
        'Thông báo',
        error?.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký chương trình.',
      );
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await apiFitlife.get(`/client/chuong-trinh-tap/${goalId}`);
        setProgram(res.data?.data || null);
      } catch (error) {
        console.log('Lỗi lấy chương trình:', error);
      } finally {
        setLoading(false);
      }
    };
    if (goalId) fetchProgram();
    else setLoading(false);
  }, [goalId]);

  const genderLabel =
    Number(gender) === 0 ? 'Dành cho nam' :
    Number(gender) === 1 ? 'Dành cho nữ' :
    'Tất cả giới tính';

  const genderIcon = Number(gender) === 1 ? 'female-outline' : 'male-outline';
  const locationLabel = ten_noi_tap || 'Tất cả nơi tập';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="Chi tiết kế hoạch"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải chi tiết kế hoạch...</Text>
        </View>
      ) : (
        <View style={styles.mainWrapper}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Image */}
            <View style={styles.heroContainer}>
              <View style={styles.heroImage}>
                <Image
                  source={{
                    uri:
                      program?.anh_dai_dien ||
                      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1400',
                  }}
                  style={styles.heroImageStyle}
                  resizeMode="cover"
                />
                <ImageTextGradient />
                <View style={styles.heroContent}>
                  <View style={styles.heroBadge}>
                    <Ionicons name="sparkles" size={13} color={COLORS.white} />
                    <Text style={styles.heroBadgeText}>Lộ trình cá nhân hóa</Text>
                  </View>

                  <Text style={styles.heroTitle}>
                    {goalName || program?.ten_chuong_trinh}
                  </Text>

                  <Text style={styles.heroSubtitle}>
                    {program?.so_ngay || 30} ngày tập luyện • {program?.so_buoi_moi_tuan || 4} buổi/tuần
                  </Text>
                </View>
              </View>
            </View>

            {/* Thông số tổng quan */}
            <View style={styles.statCardsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIconTile, styles.statIconTeal]}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.statNumber}>{program?.so_ngay || 0}</Text>
                <Text style={styles.statLabel}>Tổng ngày tập</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconTile, styles.statIconGreen]}>
                  <Ionicons name="repeat-outline" size={18} color={COLORS.accentGreen} />
                </View>
                <Text style={styles.statNumber}>{program?.so_buoi_moi_tuan || 0}</Text>
                <Text style={styles.statLabel}>Buổi mỗi tuần</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconTile, styles.statIconOrange]}>
                  <Ionicons name="speedometer-outline" size={18} color={COLORS.accentOrange} />
                </View>
                <Text style={styles.statNumber} numberOfLines={1}>{capDoName || 'Chuẩn'}</Text>
                <Text style={styles.statLabel}>Cấp độ khó</Text>
              </View>
            </View>

            {/* Mục Tiêu Chí Phù Hợp */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeaderTitle}>Tiêu chí áp dụng</Text>

              <View style={styles.criteriaRow}>
                <View style={styles.criteriaItem}>
                  <View style={styles.criteriaIconCircle}>
                    <Ionicons name={genderIcon} size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.criteriaLabel}>Giới tính</Text>
                    <Text style={styles.criteriaValue}>{genderLabel}</Text>
                  </View>
                </View>

                <View style={styles.criteriaItem}>
                  <View style={styles.criteriaIconCircle}>
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.criteriaLabel}>Nơi tập</Text>
                    <Text style={styles.criteriaValue}>{locationLabel}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Mô tả chương trình */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeaderTitle}>Mô tả lộ trình</Text>
              <Text style={styles.descriptionText}>
                {program?.mo_ta ||
                  'Chương trình được thiết kế bài bản với các bài tập tăng dần theo từng buổi, giúp kích thích nhóm cơ phát triển tối ưu và tăng cường sức bền thể lực.'}
              </Text>
            </View>

            {/* Quyền lợi */}
            <View style={styles.benefitCard}>
              <View style={styles.benefitHeader}>
                <View style={styles.benefitIconTile}>
                  <Ionicons name="shield-checkmark" size={18} color={COLORS.accentGreen} />
                </View>
                <Text style={styles.benefitTitle}>Cam kết lộ trình</Text>
              </View>
              <Text style={styles.benefitText}>
                • Bài tập kèm video hướng dẫn động tác chuẩn{'\n'}
                • Cảnh báo các lỗi sai tư thế hay gặp khi tập{'\n'}
                • Theo dõi tiến độ và ghi nhận hiệp tập tự động
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Fixed Action Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.addButtonWrap, registering && { opacity: 0.7 }]}
              onPress={handleRegisterProgram}
              disabled={registering}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButton}
              >
                {registering ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="add-circle" size={22} color={COLORS.white} />
                )}
                <Text style={styles.addButtonText}>
                  {registering ? 'ĐANG ĐĂNG KÝ...' : 'THÊM VÀO KẾ HOẠCH'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default WorkoutProgramDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  mainWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 200,
  },
  heroContainer: {
    width: '100%',
    height: 210,
    borderRadius: 22,
    marginBottom: 16,
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroImageStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroContent: {
    padding: 18,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  heroBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 29,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginTop: 4,
  },
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  statIconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconTeal: {
    backgroundColor: COLORS.surfaceTeal,
  },
  statIconGreen: {
    backgroundColor: '#ECFDF5',
  },
  statIconOrange: {
    backgroundColor: '#FFF1EC',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  criteriaRow: {
    gap: 12,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  criteriaIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  criteriaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  benefitCard: {
    backgroundColor: '#F0FDF7',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CDEFE0',
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  benefitIconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  benefitText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  // Thanh hành động nổi phía trên bottom tab bar (bottom 25 + height 70)
  bottomBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  addButtonWrap: {
    borderRadius: 16,
    ...SHADOWS.glow,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    gap: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});