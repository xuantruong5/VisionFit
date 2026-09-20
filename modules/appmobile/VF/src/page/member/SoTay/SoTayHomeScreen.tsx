import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageTextGradient from '../../../components/ImageTextGradient';

interface SoTayHomeScreenProps {
  navigation: any;
}

const MENU_ITEMS = [
  {
    id: 'exercises',
    title: 'Các bài tập',
    screen: 'ExerciseCategories',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'nutrition',
    title: 'Dinh dưỡng thể thao',
    screen: 'NutritionCategories',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'food_calories',
    title: 'Danh sách các nguyên liệu và\nlượng calo',
    screen: 'FoodCategories',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'encyclopedia',
    title: 'Bách khoa toàn thư',
    screen: 'EncyclopediaList',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
  },
];

const SoTayHomeScreen: React.FC<SoTayHomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header chuẩn theo style của VisionFit */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <Text style={styles.headerTitle}>Sổ tay</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Danh sách 4 Module chính */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={styles.cardContainer}
            onPress={() => navigation.navigate(item.screen)}
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.cardImage}
              imageStyle={styles.cardImageRadius}
              resizeMode="cover"
            >
              {/* Lớp gradient chuẩn thương hiệu VisionFit */}
              <ImageTextGradient />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SoTayHomeScreen;

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
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0F1',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#11343A',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 16,
    paddingBottom: 110,
  },
  cardContainer: {
    width: '100%',
    aspectRatio: 2.6,
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  cardImageRadius: {
    borderRadius: 14,
  },
  cardContent: {
    justifyContent: 'center',
    paddingLeft: 22,
    paddingRight: 16,
    height: '100%',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
    maxWidth: '85%',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 8,
  },
});
