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
import LinearGradient from 'react-native-linear-gradient';
import apiFitlife from '../../../../general/api';
import { COLORS, SHADOWS } from '../../../../general/theme';

interface FoodCategoriesScreenProps {
  navigation: any;
}

const FoodCategoriesScreen: React.FC<FoodCategoriesScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiFitlife.get('/so-tay/thuc-pham/categories');
      if (res.data?.status && res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching food categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchText.toLowerCase())
  );

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
          Danh sách các nguyên liệu và lượng calo
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

      {/* Danh sách các nhóm thực phẩm */}
      {loading && categories.length === 0 ? (
        <View style={styles.loadingBox}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Đang tải danh mục thực phẩm...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Nhóm thực phẩm</Text>
          <View style={styles.grid}>
            {filteredCategories.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.88}
                style={styles.foodCatCard}
                onPress={() =>
                  navigation.navigate('FoodList', {
                    category: item.name,
                    categoryId: item.id,
                  })
                }
              >
                <Image source={{ uri: item.image }} style={styles.foodCatImage} resizeMode="cover" />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']}
                  locations={[0, 0.45, 1]}
                  style={styles.cardOverlay}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.foodCatTitle} numberOfLines={2}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default FoodCategoriesScreen;

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
  loadingText: {
    marginTop: 14,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
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
  foodCatCard: {
    width: '48%',
    height: 200,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.card,
  },
  foodCatImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  foodCatTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
