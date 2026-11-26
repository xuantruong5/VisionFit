import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../general/api';
import ImageTextGradient from '../../components/ImageTextGradient';
import GenderPillSelector from '../../components/GenderPillSelector';
import { COLORS, SHADOWS } from '../../general/theme';

type Gender = 'male' | 'female';

const WorkoutPlan = ({ navigation, route }: any) => {
  const [selectedGender, setSelectedGender] = useState<Gender>('male');
  const [goals, setGoals] = useState<any[]>([]);
  const [isGoalLoading, setIsGoalLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsGoalLoading(true);
      const response = await apiFitlife.get('/client/chuong-trinh-tap');
      if (response.data.status) {
        setGoals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching workout goals:', error);
    } finally {
      setIsGoalLoading(false);
    }
  };

  const currentGoals = goals.filter((goal) => {
    const g = Number(goal.gioi_tinh_ap_dung);
    return selectedGender === 'male' ? g === 0 : g === 1;
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Bộ chọn giới tính dạng Pill hiện đại */}
      <GenderPillSelector
        selectedGender={selectedGender}
        onSelectGender={(g) => setSelectedGender(g)}
      />

      <View style={styles.goalList}>
        {isGoalLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải chương trình...</Text>
          </View>
        ) : currentGoals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Chưa có chương trình phù hợp</Text>
          </View>
        ) : (
          currentGoals.map((goal) => (
            <TouchableOpacity
              key={goal.id || goal.id_chuong_trinh}
              style={styles.goalCard}
              onPress={() => {
                const existingParams = route?.params || {};
                navigation.navigate('WorkoutLocationScreen', {
                  ...existingParams,
                  goalId: goal.id || goal.id_chuong_trinh,
                  goalName: goal.ten_chuong_trinh,
                  gender: selectedGender === 'male' ? 0 : 1,
                });
              }}
              activeOpacity={0.88}
            >
              <View style={styles.goalImage}>
                <Image
                  source={{
                    uri: goal.anh_dai_dien || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
                  }}
                  style={styles.goalImageStyle}
                  resizeMode="cover"
                />
                <ImageTextGradient />
                <View style={styles.goalCardContent}>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle} numberOfLines={2}>
                      {goal.ten_chuong_trinh}
                    </Text>
                    <View style={styles.goalMetaRow}>
                      {goal.noi_tap && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{goal.noi_tap}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default WorkoutPlan;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  goalList: {
    marginBottom: 10,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  goalCard: {
    width: '100%',
    height: 132,
    marginBottom: 14,
    borderRadius: 26,
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 5,
  },
  goalImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    borderRadius: 26,
    overflow: 'hidden',
  },
  goalImageStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  goalCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  goalInfo: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'center',
  },
  goalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  goalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
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
});
