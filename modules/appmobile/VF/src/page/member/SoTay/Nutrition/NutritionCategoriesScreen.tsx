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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../../../general/api';
import { COLORS, SHADOWS } from '../../../../general/theme';

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
          Dinh dưỡng thể thao
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Thanh tìm kiếm */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color={COLORS.primary} style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor={COLORS.textLight}
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách các danh mục */}
      {loading && categories.length === 0 ? (
        <View style={styles.loadingBox}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
          <View style={styles.grid}>
            {filteredCategories.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={styles.categoryRow}
                onPress={() =>
                  navigation.navigate('NutritionProductList', {
                    category: item.name,
                    categoryId: item.id,
                  })
                }
              >
                <View style={styles.thumbTile}>
                  <Image
                    source={getImageSource(item)}
                    style={styles.categoryThumb}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default NutritionCategoriesScreen;

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
  headerPlaceholder: {
    width: 40,
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
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 70,
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryRow: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 14,
    ...SHADOWS.card,
  },
  thumbTile: {
    height: 110,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryThumb: {
    width: '80%',
    height: '85%',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    minHeight: 38,
    gap: 6,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
