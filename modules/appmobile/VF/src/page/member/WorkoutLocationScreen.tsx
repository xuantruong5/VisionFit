import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageTextGradient from '../../components/ImageTextGradient';
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
            <View style={styles.goalIconContainer}>
              <Ionicons name="barbell" size={20} color={COLORS.primary} />
            </View>
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
              <Ionicons name="location-outline" size={44} color={COLORS.textMuted} />
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
                <ImageBackground
                  source={{ uri: getLocationImage(noiTap.ten_noi_tap) }}
                  style={styles.cardImage}
                  imageStyle={styles.cardImageStyle}
                >
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
                      <View style={styles.arrowCircle}>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
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
                </ImageBackground>
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
    paddingTop: 14,
    paddingBottom: 40,
  },
  selectedGoalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
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
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
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
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  cardContainer: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
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
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 4,
  },
});
