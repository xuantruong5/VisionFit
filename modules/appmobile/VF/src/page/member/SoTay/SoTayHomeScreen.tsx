import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../../general/theme';

interface SoTayHomeScreenProps {
  navigation: any;
}

const MENU_ITEMS = [
  {
    id: 'exercises',
    title: 'Các bài tập',
    desc: 'Thư viện bài tập theo từng nhóm cơ',
    screen: 'ExerciseCategories',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'nutrition',
    title: 'Dinh dưỡng thể thao',
    desc: 'Thực phẩm bổ sung',
    screen: 'NutritionCategories',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'food_calories',
    title: 'Nguyên liệu & calo',
    desc: 'Tra cứu dinh dưỡng',
    screen: 'FoodCategories',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'encyclopedia',
    title: 'Bách khoa toàn thư',
    desc: 'Kiến thức sức khỏe & luyện tập',
    screen: 'EncyclopediaList',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80',
  },
];

const SHADE = ['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)'];

const SoTayHomeScreen: React.FC<SoTayHomeScreenProps> = ({ navigation }) => {
  const [featured, nutrition, food, encyclopedia] = MENU_ITEMS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Tiêu đề */}
        <Text style={styles.eyebrow}>VISIONFIT</Text>
        <Text style={styles.title}>Sổ tay</Text>
        <Text style={styles.subtitle}>Kiến thức tập luyện và dinh dưỡng trong tầm tay</Text>

        {/* Thẻ nổi bật */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, styles.featuredCard]}
          onPress={() => navigation.navigate(featured.screen)}
        >
          <Image source={{ uri: featured.image }} style={styles.cardImage} resizeMode="cover" />
          <LinearGradient colors={SHADE} locations={[0, 0.45, 1]} style={styles.cardImage} />
          <View style={styles.cardText}>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.cardDesc}>{featured.desc}</Text>
          </View>
        </TouchableOpacity>

        {/* Hai thẻ vuông */}
        <View style={styles.row}>
          {[nutrition, food].map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={[styles.card, styles.halfCard]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
              <LinearGradient colors={SHADE} locations={[0, 0.4, 1]} style={styles.cardImage} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Thẻ ngang */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.wideCard}
          onPress={() => navigation.navigate(encyclopedia.screen)}
        >
          <Image source={{ uri: encyclopedia.image }} style={styles.wideImage} resizeMode="cover" />
          <View style={styles.wideText}>
            <Text style={styles.wideTitle}>{encyclopedia.title}</Text>
            <Text style={styles.wideDesc}>{encyclopedia.desc}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SoTayHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // TIÊU ĐỀ
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },

  // THẺ ẢNH
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.card,
  },
  featuredCard: {
    height: 210,
  },
  halfCard: {
    flex: 1,
    height: 180,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardText: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  cardDesc: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  // THẺ NGANG
  wideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  wideImage: {
    width: 84,
    height: 84,
    borderRadius: 16,
  },
  wideText: {
    flex: 1,
    marginLeft: 14,
  },
  wideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  wideDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
