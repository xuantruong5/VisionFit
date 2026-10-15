import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../../../general/api';

import ImageTextGradient from '../../../../components/ImageTextGradient';

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Danh sách các nguyên liệu và lư...
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

      {/* Danh sách các nhóm thực phẩm */}
      {loading && categories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <ActivityIndicator size="large" color="#0D7F8D" />
          <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Đang tải danh mục thực phẩm...</Text>
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
            activeOpacity={0.88}
            style={styles.foodCatCard}
            onPress={() =>
              navigation.navigate('FoodList', {
                category: item.name,
                categoryId: item.id,
              })
            }
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.foodCatImage}
              imageStyle={styles.cardImageRadius}
              resizeMode="cover"
            >
              <ImageTextGradient />
              <View style={styles.cardContent}>
                <Text style={styles.foodCatTitle}>{item.name}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )}
    </SafeAreaView>
  );
};

export default FoodCategoriesScreen;

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
    textAlign: 'center',
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
  foodCatCard: {
    width: '100%',
    aspectRatio: 2.6,
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  foodCatImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  cardImageRadius: {
    borderRadius: 14,
    resizeMode: 'cover',
  },
  cardContent: {
    justifyContent: 'center',
    paddingLeft: 22,
    paddingRight: 18,
    height: '100%',
  },
  foodCatTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    maxWidth: '85%',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 6,
  },
});
