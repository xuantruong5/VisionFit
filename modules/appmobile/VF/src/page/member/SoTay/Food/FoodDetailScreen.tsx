import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryName || 'Sữa và các sản phẩm từ sữa...'}
        </Text>

        <View style={{ width: 36 }} />
      </View>

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
        </View>

        {/* Tên món & Thời gian nấu */}
        <Text style={styles.foodTitle}>{currentFood.name}</Text>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={18} color="#64748B" />
          <Text style={styles.timeText}>Thời gian nấu: {currentFood.cookingTime} phút.</Text>
        </View>

        {/* Bảng Giá trị dinh dưỡng trên 100g */}
        <Text style={styles.sectionTitle}>Giá trị dinh dưỡng trên 100g</Text>
        <View style={styles.nutritionCard}>
          <View style={styles.nutritionCol}>
            <Text style={styles.nutritionVal}>{currentFood.nutritionPer100g?.kcal}</Text>
            <Text style={styles.nutritionLabel}>Kcal</Text>
          </View>

          <View style={styles.nutritionCol}>
            <Text style={styles.nutritionVal}>{currentFood.nutritionPer100g?.protein}</Text>
            <Text style={styles.nutritionLabel}>Protein, g</Text>
          </View>

          <View style={styles.nutritionCol}>
            <Text style={styles.nutritionVal}>{currentFood.nutritionPer100g?.fat}</Text>
            <Text style={styles.nutritionLabel}>Chất béo, g</Text>
          </View>

          <View style={styles.nutritionCol}>
            <Text style={styles.nutritionVal}>{currentFood.nutritionPer100g?.carb}</Text>
            <Text style={styles.nutritionLabel}>Carb, g</Text>
          </View>
        </View>

        {/* Danh sách Nguyên liệu */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleNoMargin}>Nguyên liệu</Text>
          <Ionicons name="information-circle-outline" size={18} color="#0D7F8D" />
        </View>

        {currentFood.ingredients?.map((ing: any, idx: number) => (
          <TouchableOpacity key={idx} activeOpacity={0.7} style={styles.ingredientRow}>
            <Text style={styles.ingName}>{ing.name}</Text>
            <View style={styles.ingRight}>
              <Text style={styles.ingAmount}>{ing.amount}</Text>
              <Ionicons name="chevron-forward" size={16} color="#00C4CC" />
            </View>
          </TouchableOpacity>
        ))}

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
              <View style={styles.tasteHeader}>
                <Text style={styles.tasteTitle}>{currentFood.tastePreference.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="#00C4CC" />
              </View>
              <Text style={styles.tasteDesc}>{currentFood.tastePreference.recommendation}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Công thức nấu ăn */}
        <Text style={styles.sectionTitle}>Công thức nấu ăn</Text>
        {currentFood.recipeSteps?.map((step: string, idx: number) => (
          <View key={idx} style={styles.recipeStepCard}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{idx + 1}</Text>
            </View>
            <Text style={styles.recipeStepText}>{step}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FoodDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FAFB',
  },
  header: {
    height: 64,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0F1',
  },
  headerIconBtn: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#11343A',
    paddingHorizontal: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 12,
    paddingBottom: 50,
  },
  foodImageBox: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  foodHeroImage: {
    width: '100%',
    height: '100%',
  },
  foodTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    marginTop: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: 18,
  },
  sectionTitleNoMargin: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  nutritionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  nutritionCol: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  ingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingAmount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  noteBox: {
    backgroundColor: '#F0FDF9',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  noteText: {
    fontSize: 13,
    color: '#0F766E',
    lineHeight: 18,
  },
  tasteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tasteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tasteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  tasteDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  recipeStepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0D7F8D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D7F8D',
  },
  recipeStepText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
});
