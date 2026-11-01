import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
        {/* Header gradient giống trang Đoạn chat */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.circleLg} />
          <View style={styles.circleSm} />
          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.headerSub}>Kiến thức tập luyện & dinh dưỡng</Text>
              <Text style={styles.headerTitle}>Sổ tay</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="book" size={20} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.headerDesc}>
            Tra cứu bài tập, dinh dưỡng và kiến thức sức khỏe mọi lúc bạn cần.
          </Text>
        </LinearGradient>

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
    paddingTop: 6,
    paddingBottom: 24,
  },
  flex: {
    flex: 1,
  },

  // TIÊU ĐỀ
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    borderRadius: 28,
    overflow: 'hidden',
  },
  circleLg: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -80,
    right: -60,
  },
  circleSm: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -50,
    left: -30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  headerDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 10,
    maxWidth: '85%',
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  headerStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  headerStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // THẺ ẢNH
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.card,
  },
  featuredCard: {
    height: 200,
    marginTop: 16,
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
