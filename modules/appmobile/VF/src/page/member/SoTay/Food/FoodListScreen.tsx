import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FoodListScreenProps {
  navigation: any;
  route: any;
}

const FOOD_ITEMS: { [key: string]: any[] } = {
  dairy: [
    {
      id: 1,
      name: 'Bánh bao lười phô mai tươi',
      calories: 177,
      cookingTime: 40,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      nutritionPer100g: { kcal: 176.7, protein: 14.3, fat: 5.1, carb: 17.6 },
      ingredients: [
        { name: 'Phô mai tươi, 5% chất béo', amount: '50 g' },
        { name: 'Bột gạo, gạo trắng', amount: '20 g' },
        { name: 'Trứng gà, sống', amount: '20 g' },
      ],
      ingredientNote: 'Có thể thay thế bằng các loại trứng khác.',
      tastePreference: {
        title: 'Chất tạo ngọt',
        recommendation: 'Khuyến nghị sử dụng các chất ngọt có nguồn gốc từ sucralose, stevia hoặc erythritol.',
      },
      recipeSteps: [
        'Trộn phô mai cottage, trứng và chất tạo ngọt lại với nhau.',
        'Cho bột gạo vào trộn đều, lăn bột thành hình trụ rồi cắt thành những viên nhỏ.',
        'Luộc bánh bao khoảng 2-3 phút cho đến khi chúng nổi lên.',
      ],
    },
    {
      id: 2,
      name: 'Sữa chua Hy Lạp nguyên chất (Greek Yogurt)',
      calories: 97,
      cookingTime: 5,
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
      nutritionPer100g: { kcal: 97.0, protein: 10.2, fat: 5.0, carb: 3.6 },
      ingredients: [
        { name: 'Sữa chua Hy Lạp không đường', amount: '150 g' },
        { name: 'Hạt chia hữu cơ', amount: '10 g' },
      ],
      ingredientNote: 'Giàu lợi khuẩn probiotic tốt cho hệ tiêu hóa.',
      tastePreference: {
        title: 'Thưởng thức',
        recommendation: 'Ăn kèm một chút mật ong hoặc quả mọng tươi.',
      },
      recipeSteps: [
        'Múc sữa chua ra bát.',
        'Rắc hạt chia lên trên và để 5 phút cho hạt nở đều rồi thưởng thức.',
      ],
    },
  ],
  grains: [
    {
      id: 11,
      name: 'Yến mạch nấu sữa hạnh nhân và chuối',
      calories: 215,
      cookingTime: 10,
      image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
      nutritionPer100g: { kcal: 215.0, protein: 7.5, fat: 4.2, carb: 38.0 },
      ingredients: [
        { name: 'Yến mạch cán dẹt', amount: '50 g' },
        { name: 'Sữa hạnh nhân không đường', amount: '150 ml' },
        { name: 'Chuối chín', amount: '1/2 quả' },
      ],
      ingredientNote: 'Cung cấp carb phức tạp và chất xơ Beta-Glucan giúp no lâu.',
      tastePreference: {
        title: 'Gia vị',
        recommendation: 'Thêm bột quế tự nhiên để kích thích vị giác và ổn định đường huyết.',
      },
      recipeSteps: [
        'Đun nóng sữa hạnh nhân rồi cho yến mạch vào khuấy đều trong 3-5 phút.',
        'Cắt lát chuối xếp lên trên mặt tô và rắc bột quế.',
      ],
    },
    {
      id: 12,
      name: 'Khoai lang mật nướng nồi chiên không dầu',
      calories: 120,
      cookingTime: 30,
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
      nutritionPer100g: { kcal: 120.0, protein: 2.0, fat: 0.2, carb: 28.0 },
      ingredients: [
        { name: 'Khoai lang mật', amount: '150 g' },
      ],
      ingredientNote: 'Nguồn tinh bột hấp thu chậm có chỉ số GI thấp lý tưởng cho gymer.',
      tastePreference: {
        title: 'Cách nướng',
        recommendation: 'Nướng ở 180 độ C trong 25-30 phút để khoai tứa mật ngọt tự nhiên.',
      },
      recipeSteps: [
        'Rửa sạch vỏ khoai và để ráo.',
        'Cho vào nồi chiên không dầu nướng 180 độ C trong 30 phút.',
      ],
    },
  ],
  eggs_cheese: [
    {
      id: 21,
      name: 'Trứng cuộn Omelette phô mai ít béo',
      calories: 168,
      cookingTime: 12,
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
      nutritionPer100g: { kcal: 168.0, protein: 13.5, fat: 11.2, carb: 1.8 },
      ingredients: [
        { name: 'Trứng gà ta', amount: '2 quả' },
        { name: 'Phô mai lát ít béo (Low-fat cheese)', amount: '1 lát' },
        { name: 'Hành tây và ớt chuông cắt hạt lựu', amount: '20 g' },
      ],
      ingredientNote: 'Bữa sáng hoàn hảo giàu protein và choline nuôi dưỡng não bộ.',
      tastePreference: {
        title: 'Mẹo nấu',
        recommendation: 'Đánh bông trứng trước khi chiên để bánh xốp mềm.',
      },
      recipeSteps: [
        'Đánh tan trứng cùng gia vị tiêu, muối.',
        'Xào sơ ớt chuông hành tây rồi đổ trứng vào chảo chống dính.',
        'Đặt phô mai lên giữa và cuộn tròn lại khi trứng vừa chín tới.',
      ],
    },
  ],
  poultry: [
    {
      id: 31,
      name: 'Ức gà áp chảo sốt tiêu đen thảo mộc',
      calories: 145,
      cookingTime: 15,
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',
      nutritionPer100g: { kcal: 145.0, protein: 31.0, fat: 2.5, carb: 0.5 },
      ingredients: [
        { name: 'Ức gà phi lê không da', amount: '150 g' },
        { name: 'Dầu ô liu', amount: '5 ml' },
        { name: 'Tiêu đen, hương thảo (Rosemary)', amount: 'vừa đủ' },
      ],
      ingredientNote: 'Nguồn đạm tinh khiết số 1 trong thực đơn thể hình.',
      tastePreference: {
        title: 'Mẹo mềm thịt',
        recommendation: 'Ngâm ức gà trong nước muối loãng 15 phút trước khi chế biến để thịt không bị khô bã.',
      },
      recipeSteps: [
        'Khứa nhẹ bề mặt ức gà và ướp tiêu đen cùng hương thảo.',
        'Áp chảo lửa vừa mỗi mặt 4-5 phút cho vàng đều.',
      ],
    },
  ],
  vegetables: [
    {
      id: 41,
      name: 'Salad súp lơ xanh (Broccoli) và cà chua bi dầu ô liu',
      calories: 65,
      cookingTime: 8,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      nutritionPer100g: { kcal: 65.0, protein: 3.2, fat: 3.5, carb: 6.0 },
      ingredients: [
        { name: 'Bông cải xanh (Broccoli)', amount: '100 g' },
        { name: 'Cà chua bi', amount: '50 g' },
        { name: 'Dầu ô liu Extra Virgin', amount: '5 ml' },
      ],
      ingredientNote: 'Broccoli chứa Sulforaphane và indole-3-carbinol giúp cân bằng Estrogen tự nhiên.',
      tastePreference: {
        title: 'Nước sốt',
        recommendation: 'Trộn cùng một chút giấm táo hoặc nước cốt chanh tươi.',
      },
      recipeSteps: [
        'Hấp chín tới bông cải xanh trong 3 phút để giữ trọn vitamin.',
        'Trộn đều cùng cà chua bi bổ đôi và dầu ô liu.',
      ],
    },
  ],
  meat_seafood: [
    {
      id: 51,
      name: 'Cá hồi áp chảo sốt chanh bơ tỏi',
      calories: 208,
      cookingTime: 15,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      nutritionPer100g: { kcal: 208.0, protein: 22.0, fat: 13.0, carb: 0.0 },
      ingredients: [
        { name: 'Phi lê cá hồi tươi', amount: '150 g' },
        { name: 'Bơ nhạt', amount: '5 g' },
        { name: 'Tỏi băm & cốt chanh vàng', amount: 'vừa đủ' },
      ],
      ingredientNote: 'Dồi dào axit béo Omega-3 (EPA & DHA) chống viêm và bảo vệ tim mạch.',
      tastePreference: {
        title: 'Độ chín',
        recommendation: 'Nên áp chảo chín vừa (Medium) để thịt cá mềm mọng nước.',
      },
      recipeSteps: [
        'Áp chảo phần da cá hồi trước trong 3 phút cho da giòn rụm.',
        'Lật mặt cá chiên thêm 2 phút rồi rưới sốt bơ tỏi chanh lên trên.',
      ],
    },
  ],
};

const FoodListScreen: React.FC<FoodListScreenProps> = ({ navigation, route }) => {
  const categoryName = route?.params?.category || 'Sữa và các sản phẩm từ sữa...';
  const categoryId = route?.params?.categoryId || 'dairy';
  const [searchText, setSearchText] = useState('');

  const rawItems = FOOD_ITEMS[categoryId] || FOOD_ITEMS.dairy || [];

  const items = rawItems.filter((f: any) =>
    f.name.toLowerCase().includes(searchText.toLowerCase())
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

      {/* Danh sách món ăn kèm Calo */}
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
