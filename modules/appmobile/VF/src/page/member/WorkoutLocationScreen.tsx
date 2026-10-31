import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageTextGradient from '../../components/ImageTextGradient';
import LinearGradient from 'react-native-linear-gradient';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';

const WorkoutLocationScreen = ({ navigation, route }: any) => {
  const { goalId, goalName, gender } = (route.params as any) || {};

  const [noiTapList, setNoiTapList] = useState<{ id: number; ten_noi_tap: string; mo_ta: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  // Ảnh chất lượng cao chuẩn fitness
  const gymImageMale = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80';
  const gymImageFemale = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80';
  const homeImageMale = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80';
  const homeImageFemale = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80';

  const gymImage = Number(gender) === 1 ? gymImageFemale : gymImageMale;
  const homeImage = Number(gender) === 1 ? homeImageFemale : homeImageMale;

  useEffect(() => {
    const getNoiTap = async () => {
      if (!goalId) {
        setNoiTapList([]);
        setLoading(false);
        return;
      }

      try {
        const response = await apiFitlife.get(`/client/chuong-trinh-tap/${goalId}/noi-tap`);
        if (response.data.status) {
          setNoiTapList(response.data.data);
        } else {
          setNoiTapList([]);
        }
      } catch (error) {
        console.log('Lỗi lấy nơi tập:', error);
        Alert.alert('Thông báo', 'Không thể tải danh sách nơi tập.');
      } finally {
        setLoading(false);
      }
    };

    getNoiTap();
  }, [goalId]);

  const handleSelectLocation = (noiTap: { id: number; ten_noi_tap: string; mo_ta: string | null }) => {
    navigation.navigate('WorkoutDifficultyScreen', {
      ...(route.params as any || {}),
      goalId,
      goalName,
      gender,
      id_noi_tap: noiTap.id,
      ten_noi_tap: noiTap.ten_noi_tap,
    });
  };

  const getLocationImage = (noiTap: string) => {
    const location = noiTap.toLowerCase();
    if (location.includes('nhà') || location.includes('home')) {
      return homeImage;
    }
    return gymImage;
  };

  const getLocationIcon = (noiTap: string) => {
    const location = noiTap.toLowerCase();
    if (location.includes('nhà') || location.includes('home')) {
      return 'home-outline';
    }
    return 'business-outline';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Tập luyện ở đâu"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner thông tin chương trình đã chọn */}
        {goalName && (
          <View style={styles.selectedGoalBanner}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goalIconContainer}
            >
              <Ionicons name="barbell" size={20} color={COLORS.white} />
            </LinearGradient>
            <View style={styles.goalTextContainer}>
              <Text style={styles.goalLabel}>Chương trình đã chọn</Text>
              <Text style={styles.goalTitle} numberOfLines={1}>
                {goalName}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionSubtitle}>
          Chọn không gian tập luyện phù hợp với điều kiện của bạn:
        </Text>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Đang tải danh sách nơi tập...</Text>
            </View>
          ) : noiTapList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconTile}>
                <Ionicons name="location-outline" size={30} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>Chưa có nơi tập nào phù hợp.</Text>
            </View>
          ) : (
            noiTapList.map((noiTap) => (
              <TouchableOpacity
                key={noiTap.id}
                style={styles.cardContainer}
                activeOpacity={0.88}
                onPress={() => handleSelectLocation(noiTap)}
              >
                <View style={styles.cardImage}>
                  <Image
                    source={{ uri: getLocationImage(noiTap.ten_noi_tap) }}
                    style={styles.cardImageStyle}
                    resizeMode="cover"
                  />
                  <ImageTextGradient />

                  <View style={styles.overlay}>
                    <View style={styles.locationHeaderRow}>
                      <View style={styles.iconCircle}>
                        <Ionicons
                          name={getLocationIcon(noiTap.ten_noi_tap)}
                          size={22}
                          color={COLORS.white}
                        />
                      </View>
                    </View>

                    <Text style={styles.cardText}>
                      {noiTap.ten_noi_tap}
                    </Text>
                    {noiTap.mo_ta ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {noiTap.mo_ta}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  selectedGoalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    ...SHADOWS.card,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 3,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  content: {
    gap: 16,
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
    paddingVertical: 36,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  emptyIconTile: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardContainer: {
    width: '100%',
    height: 172,
    borderRadius: 26,
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    borderRadius: 26,
    overflow: 'hidden',
  },
  cardImageStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 18,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardDesc: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
