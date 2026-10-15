import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../../../general/api';

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryName}
        </Text>

        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="filter-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Thanh tìm kiếm */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách món ăn kèm Calo */}
      {loading && items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <ActivityIndicator size="large" color="#0D7F8D" />
          <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Đang tải danh sách món ăn...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <Ionicons name="restaurant-outline" size={48} color="#9CA3AF" />
          <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 15 }}>Không tìm thấy món ăn nào</Text>
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
              activeOpacity={0.7}
              style={styles.foodRow}
              onPress={() =>
                navigation.navigate('FoodDetail', {
                  food: item,
                  categoryName: categoryName,
                })
              }
            >
              <Text style={styles.foodName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.foodRightGroup}>
                <Text style={styles.foodCalories}>{item.calories} Kcal</Text>
                <Ionicons name="chevron-forward" size={18} color="#00C4CC" />
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
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E8F0F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  foodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
    paddingRight: 10,
  },
  foodRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foodCalories: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
