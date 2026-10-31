import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../../../general/theme';

interface FoodDetailScreenProps {
  navigation: any;
  route: any;
}

const FoodDetailScreen: React.FC<FoodDetailScreenProps> = ({ navigation, route }) => {
  const { food, categoryName } = route.params || {};

  const currentFood = food || {
    name: 'Bánh bao lười',
    calories: 177,
    cookingTime: 40,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    nutritionPer100g: {
      kcal: 176.7,
      protein: 14.3,
      fat: 5.1,
      carb: 17.6,
    },
    ingredients: [
      { name: 'Phô mai tươi, 5% chất béo', amount: '50 g' },
      { name: 'Bột gạo, gạo trắng', amount: '20 g' },
      { name: 'Trứng gà, sống', amount: '20 g' },
    ],
    ingredientNote: 'Có thể thay thế bằng các loại trứng khác.',
    tastePreference: {
      title: 'Chất tạo ngọt',
      recommendation: 'Khuyến nghị sử dụng các chất ngọt có nguồn gốc từ sucralose, stevia hoặc erythritol.',
    },
    recipeSteps: [
      'Để làm bánh bao lười, trộn phô mai cottage, trứng và chất tạo ngọt lại với nhau.',
      'Sau đó cho bột gạo vào trộn đều, lăn bột thành hình trụ rồi cắt hoặc ngắt bột thành những viên nhỏ.',
      'Luộc bánh bao khoảng 2-3 phút cho đến khi chúng nổi lên.',
    ],
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.flex}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Ảnh món ăn */}
          <View style={styles.foodImageBox}>
            <Image
              source={{ uri: currentFood.image }}
              style={styles.foodHeroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(7,40,48,0.75)']}
              locations={[0, 0.4, 1]}
              style={styles.heroOverlay}
            />
            <View style={styles.heroCaption}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText} numberOfLines={1}>
                  {categoryName || 'Sữa và các sản phẩm từ sữa...'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sheet}>
            {/* Tên món & Thời gian nấu */}
            <Text style={styles.foodTitle}>{currentFood.name}</Text>
            <View style={styles.timeRow}>
              <View style={styles.timePill}>
                <Text style={styles.timeText}>Thời gian nấu: {currentFood.cookingTime} phút.</Text>
              </View>
            </View>

            {/* Bảng Giá trị dinh dưỡng trên 100g */}
            <Text style={styles.sectionTitle}>Giá trị dinh dưỡng trên 100g</Text>
            <View style={styles.nutritionCard}>
              <View style={[styles.nutritionCol, styles.tintOrange]}>
                <Text style={styles.nutritionVal}>{currentFood.nutritionPer100g?.kcal}</Text>
                <Text style={styles.nutritionLabel}>Kcal</Text>
              </View>

              <View style={[styles.nutritionCol, styles.tintTeal]}>
                <Text style={styles.nutritionVal}>{currentFood.nutritionPer100g?.protein}</Text>
                <Text style={styles.nutritionLabel}>Protein, g</Text>
              </View>

              <View style={[styles.nutritionCol, styles.tintAmber]}>
                <Text style={styles.nutritionVal}>{currentFood.nutritionPer100g?.fat}</Text>
                <Text style={styles.nutritionLabel}>Chất béo, g</Text>
              </View>

              <View style={[styles.nutritionCol, styles.tintViolet]}>
                <Text style={styles.nutritionVal}>{currentFood.nutritionPer100g?.carb}</Text>
                <Text style={styles.nutritionLabel}>Carb, g</Text>
              </View>
            </View>

            {/* Danh sách Nguyên liệu */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleNoMargin}>Nguyên liệu</Text>
            </View>

            <View style={styles.card}>
              {currentFood.ingredients?.map((ing: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={[styles.ingredientRow, idx === 0 && styles.ingredientRowFirst]}
                >
                  <View style={styles.ingDot} />
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <View style={styles.ingRight}>
                    <Text style={styles.ingAmount}>{ing.amount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Ghi chú nguyên liệu */}
            {currentFood.ingredientNote && (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>{currentFood.ingredientNote}</Text>
              </View>
            )}

            {/* Tùy theo khẩu vị */}
            {currentFood.tastePreference && (
              <>
                <Text style={styles.sectionTitle}>Tùy theo khẩu vị</Text>
                <TouchableOpacity activeOpacity={0.8} style={styles.tasteCard}>
                  <View style={styles.flex}>
                    <View style={styles.tasteHeader}>
                      <Text style={styles.tasteTitle}>{currentFood.tastePreference.title}</Text>
                    </View>
                    <Text style={styles.tasteDesc}>{currentFood.tastePreference.recommendation}</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Công thức nấu ăn */}
            <Text style={styles.sectionTitle}>Công thức nấu ăn</Text>
            {currentFood.recipeSteps?.map((step: string, idx: number) => (
              <View key={idx} style={styles.recipeStepCard}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stepBadge}
                >
                  <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                </LinearGradient>
                <Text style={styles.recipeStepText}>{step}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Nút quay lại nổi */}
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FoodDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 24,
  },

  // HERO
  foodImageBox: {
    height: 270,
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
  },
  foodHeroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroCaption: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 38,
    flexDirection: 'row',
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroChipText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 24,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SHEET
  sheet: {
    marginTop: -24,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  foodTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: 22,
  },
  sectionTitleNoMargin: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  nutritionCard: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionCol: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  tintOrange: {
    backgroundColor: '#FFF1EC',
  },
  tintTeal: {
    backgroundColor: COLORS.surfaceTeal,
  },
  tintAmber: {
    backgroundColor: '#FFF7ED',
  },
  tintViolet: {
    backgroundColor: '#F5F3FF',
  },
  nutritionVal: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    ...SHADOWS.card,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  ingredientRowFirst: {
    borderTopWidth: 0,
  },
  ingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  ingName: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ingAmount: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#047857',
    lineHeight: 19,
  },
  tasteCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  tasteIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tasteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tasteDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
  recipeStepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  recipeStepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
});
