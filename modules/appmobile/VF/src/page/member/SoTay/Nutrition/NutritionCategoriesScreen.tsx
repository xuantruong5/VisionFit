import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../../../general/api';

interface NutritionCategoriesScreenProps {
  navigation: any;
}

const NUTRITION_ASSETS: Record<string, any> = {
  protein: require('../../../../assets/nutrition/protein.jpg'),
  gainer: require('../../../../assets/nutrition/gainer.jpg'),
  creatine: require('../../../../assets/nutrition/creatine.jpg'),
  amino_acids: require('../../../../assets/nutrition/amino_acids.jpg'),
  fat_burner: require('../../../../assets/nutrition/fat_burner.jpg'),
  lcarnitine: require('../../../../assets/nutrition/lcarnitine.jpg'),
  vitamins: require('../../../../assets/nutrition/vitamins.jpg'),
  specialized: require('../../../../assets/nutrition/specialized.jpg'),
  joints: require('../../../../assets/nutrition/joints.jpg'),
};

const FALLBACK_CATEGORIES = [
  {
    id: 'protein',
    name: 'Protein',
    image: null,
  },
  {
    id: 'gainer',
    name: 'Gainer',
    image: null,
  },
  {
    id: 'creatine',
    name: 'Creatine',
    image: null,
  },
  {
    id: 'amino_acids',
    name: 'Axit amin',
    image: null,
  },
  {
    id: 'fat_burner',
    name: 'Sản phẩm giảm cân',
    image: null,
  },
  {
    id: 'lcarnitine',
    name: 'L-Carnitine',
    image: null,
  },
  {
    id: 'vitamins',
    name: 'Vitamin và khoáng chất',
    image: null,
  },
  {
    id: 'specialized',
    name: 'Sản phẩm chuyên dụng',
    image: null,
  },
  {
    id: 'joints',
    name: 'Sản phẩm cho khớp và dây chằng',
    image: null,
  },
];

const NutritionCategoriesScreen: React.FC<NutritionCategoriesScreenProps> = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiFitlife.get('/dinh-duong-the-thao/categories');
      if (res.data?.status && res.data?.data && res.data.data.length > 0) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching nutrition categories, using fallback:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getImageSource = (item: any) => {
    if (item.id && NUTRITION_ASSETS[item.id]) {
      return NUTRITION_ASSETS[item.id];
    }
    if (item.image) {
      return { uri: item.image };
    }
    return NUTRITION_ASSETS.protein;
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

        <Text style={styles.headerTitle}>Dinh dưỡng thể thao</Text>

        <View style={{ width: 36 }} />
      </View>

      {/* Thanh tìm kiếm */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách các danh mục */}
      {loading && categories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0D7F8D" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredCategories.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              style={styles.categoryRow}
              onPress={() =>
                navigation.navigate('NutritionProductList', {
                  category: item.name,
                  categoryId: item.id,
                })
              }
            >
              <Image
                source={getImageSource(item)}
                style={styles.categoryThumb}
                resizeMode="contain"
              />
              <Text style={styles.categoryName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#00C4CC" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default NutritionCategoriesScreen;

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
    fontSize: 20,
    fontWeight: '700',
    color: '#11343A',
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
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
  categoryThumb: {
    width: 52,
    height: 52,
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
