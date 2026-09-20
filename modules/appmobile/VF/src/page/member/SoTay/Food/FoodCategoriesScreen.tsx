import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ImageTextGradient from '../../../../components/ImageTextGradient';

interface FoodCategoriesScreenProps {
  navigation: any;
}

const FOOD_CATEGORIES = [
  {
    id: 'dairy',
    name: 'Sữa và các sản phẩm từ sữa, sữa chua, phô mai cottage',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'grains',
    name: 'Ngũ cốc, cháo, khoai tây chiên',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'eggs_cheese',
    name: 'Trứng, phô mai, phô mai chế biến',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poultry',
    name: 'Thịt gà và thịt gia cầm khác, thịt gà xay, phụ phẩm',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'vegetables',
    name: 'Rau, rau xanh, ô liu',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'meat_seafood',
    name: 'Thịt đỏ, cá và hải sản',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
];

const FoodCategoriesScreen: React.FC<FoodCategoriesScreenProps> = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');

  const filteredCategories = FOOD_CATEGORIES.filter((cat) =>
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
