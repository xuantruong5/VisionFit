import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../../../general/api';
import { COLORS, SHADOWS } from '../../../../general/theme';

interface FoodListScreenProps {
  navigation: any;
  route: any;
}

const FoodListScreen: React.FC<FoodListScreenProps> = ({ navigation, route }) => {
  const categoryName = route?.params?.category || 'Sữa và các sản phẩm từ sữa...';
  const categoryId = route?.params?.categoryId || 'dairy';
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFoodItems();
  }, [categoryId]);

  const fetchFoodItems = async (keyword = '') => {
    setLoading(true);
    try {
      const res = await apiFitlife.get('/so-tay/thuc-pham', {
        params: {
          category: categoryId,
          q: keyword || undefined,
        },
      });

      if (res.data?.status && res.data?.data) {
        const mapped = res.data.data.map((row: any) => {
          let ingList = [];
          if (typeof row.nguyen_lieu === 'string') {
            ingList = row.nguyen_lieu.split('\n').filter(Boolean).map((line: string) => {
              const parts = line.split('(');
              return {
                name: parts[0]?.trim() || line,
                amount: parts[1] ? parts[1].replace(')', '').trim() : 'theo ý thích',
              };
            });
          }

          let steps = [];
          if (typeof row.huong_dan_nau === 'string') {
            steps = row.huong_dan_nau.split('\n').filter(Boolean);
          }

          return {
            id: row.id,
            name: row.ten_mon_an,
            calories: Math.round(row.calo),
            cookingTime: row.thoi_gian_nau || 15,
            image: row.anh_dai_dien,
            nutritionPer100g: {
              kcal: row.calo,
              protein: row.protein,
              fat: row.fat,
              carb: row.carb,
            },
            ingredients: ingList.length > 0 ? ingList : [
              { name: 'Nguyên liệu tươi chọn lọc', amount: `${row.khoi_luong_gram || 200}g` }
            ],
            ingredientNote: row.mo_ta,
            tastePreference: {
              title: 'Khẩu vị & Dinh dưỡng',
              recommendation: `Cung cấp ${row.protein}g protein và ${row.calo} Kcal tối ưu cho thể hình.`,
            },
            recipeSteps: steps.length > 0 ? steps : [row.huong_dan_nau || 'Chế biến sạch sẽ và dùng khi còn nóng.'],
          };
        });
        setItems(mapped);
      }
    } catch (error) {
      console.log('Error fetching food items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    fetchFoodItems(text);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryName}
        </Text>

        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Thanh tìm kiếm */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color={COLORS.primary} style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor={COLORS.textLight}
            value={searchText}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách món ăn kèm Calo */}
      {loading && items.length === 0 ? (
        <View style={styles.stateBox}>
          <View style={styles.stateIcon}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.stateText}>Đang tải danh sách món ăn...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.stateBox}>
          <View style={styles.stateIcon}>
            <Ionicons name="restaurant-outline" size={34} color={COLORS.primary} />
          </View>
          <Text style={styles.stateTitle}>Không tìm thấy món ăn nào</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.foodRow}
              onPress={() =>
                navigation.navigate('FoodDetail', {
                  food: item,
                  categoryName: categoryName,
                })
              }
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.foodThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.foodThumb, styles.foodThumbPlaceholder]}>
                  <Ionicons name="restaurant" size={24} color={COLORS.accentOrange} />
                </View>
              )}
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.foodMetaRow}>
                  <Text style={styles.foodCalories}>{item.calories} kcal</Text>
                  <Text style={styles.foodMeta}>  •  {item.cookingTime} phút</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default FoodListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  searchBox: {
    height: 50,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    ...SHADOWS.card,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 70,
  },
  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 14,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  stateTitle: {
    marginTop: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 10,
    paddingBottom: 24,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  foodThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    marginRight: 12,
  },
  foodThumbPlaceholder: {
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfo: {
    flex: 1,
    paddingRight: 8,
  },
  foodName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  foodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  kcalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  foodCalories: {
    fontSize: 11.5,
    color: COLORS.accentOrange,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  foodMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
