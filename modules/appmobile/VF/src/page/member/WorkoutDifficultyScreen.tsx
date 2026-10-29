import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';

const WorkoutDifficultyScreen = ({ navigation, route }: any) => {
  const { goalId, goalName, gender, id_noi_tap, ten_noi_tap } = route.params || {};

  const [difficulties, setDifficulties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDifficulties = async () => {
      try {
        setLoading(true);

        const res = await apiFitlife.get(
          '/client/chuong-trinh-tap/cap-do',
          {
            params: {
              ten_chuong_trinh: goalName?.trim(),
              gioi_tinh_ap_dung: gender,
              id_noi_tap: id_noi_tap,
            },
          },
        );

        const data = res.data?.data || [];
        setDifficulties(data);
      } catch (error: any) {
        console.log(
          'Lỗi lấy cấp độ:',
          error.response?.data || error.message,
        );
        setDifficulties([]);
      } finally {
        setLoading(false);
      }
    };

    if (goalName && gender !== undefined && id_noi_tap !== undefined) {
      fetchDifficulties();
    } else {
      setDifficulties([]);
      setLoading(false);
    }
  }, [goalName, gender, id_noi_tap]);

  const defaultBackgrounds = [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="Cấp độ tập luyện"
        onBack={() => navigation.goBack()}
      />

      {/* Thông tin chương trình và địa điểm đã chọn */}
      <View style={styles.goalSection}>
        <View style={styles.goalCard}>
          <View style={styles.goalIcon}>
            <Ionicons name="barbell" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalLabel}>Chương trình đang chọn</Text>
            <Text style={styles.goalName} numberOfLines={1}>
              {goalName || 'Chưa chọn chương trình'}
            </Text>
            {ten_noi_tap && (
              <View style={styles.locationChip}>
                <Ionicons name="location-outline" size={12} color={COLORS.primary} />
                <Text style={styles.locationChipText}>{ten_noi_tap}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>
          Chọn cấp độ phù hợp với thể lực hiện tại:
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải cấp độ...</Text>
          </View>
        ) : difficulties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              Không tìm thấy cấp độ cho chương trình này.
            </Text>
          </View>
        ) : (
          difficulties.map((item, index) => {
            const cardBgUri = item.hinh_anh || defaultBackgrounds[index % defaultBackgrounds.length];

            return (
              <TouchableOpacity
                key={`${item.id_chuong_trinh}-${item.id_cap_do}`}
                style={styles.card}
                activeOpacity={0.88}
                onPress={() =>
                  navigation.navigate('WorkoutProgramDetailScreen', {
                    ...route.params,
                    goalId: item.id_chuong_trinh,
                    capDoId: item.id_cap_do,
                    capDoName: item.ten_cap_do,
                    gender: gender,
                    goalName: item.ten_chuong_trinh,
                    id_noi_tap,
                    ten_noi_tap,
                    mo_ta_chuong_trinh: item.mo_ta_chuong_trinh,
                    so_ngay: item.so_ngay,
                    so_buoi_moi_tuan: item.so_buoi_moi_tuan,
                  })
                }
              >
                <ImageBackground
                  source={{ uri: cardBgUri }}
                  style={styles.cardImage}
                  imageStyle={styles.cardImageStyle}
                >
                  <LinearGradient
                    colors={[
                      'rgba(7, 88, 101, 0.95)',
                      'rgba(13, 127, 141, 0.85)',
                      'rgba(13, 127, 141, 0.35)',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.gradientOverlay}
                  />

                  <View style={styles.cardContent}>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= item.so_sao ? 'star' : 'star-outline'}
                          size={18}
                          color={COLORS.accentGold}
                          style={styles.star}
                        />
                      ))}
                    </View>

                    <Text style={styles.cardTitle}>{item.ten_cap_do}</Text>

                    <Text style={styles.description} numberOfLines={2}>
                      {item.mo_ta_cap_do || 'Phù hợp với thể trạng và sức bền cấp độ này'}
                    </Text>

                    <View style={styles.detailLinkRow}>
                      <Text style={styles.detailLinkText}>Xem chi tiết</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutDifficultyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  goalSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  goalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  locationChipText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  card: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  cardImageStyle: {
    borderRadius: 20,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  star: {
    marginRight: 4,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    lineHeight: 18,
    maxWidth: '75%',
  },
  detailLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  detailLinkText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
