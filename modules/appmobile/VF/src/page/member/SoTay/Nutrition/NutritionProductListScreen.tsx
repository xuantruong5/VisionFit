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

interface NutritionProductListScreenProps {
  navigation: any;
  route: any;
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

const FALLBACK_NUTRITION_PRODUCTS: { [key: string]: any[] } = {
  protein: [
    {
      id: 1,
      name: 'Complex protein',
      image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80',
      description: 'Complex protein là hỗn hợp các protein từ các nguồn gốc khác nhau, dựa trên whey protein và nhằm mục đích tăng cơ và siết cơ. Complex protein bao gồm các protein có tốc độ đồng hóa trong 2-4 giờ, ví dụ, egg albumin hoặc protein đậu nành và casein với tốc độ đồng hóa lên tới 7 giờ.',
    },
    {
      id: 2,
      name: 'Matrix Protein',
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=400&q=80',
      description: 'Matrix Protein là công thức kết hợp đa tầng protein siêu tinh khiết, cung cấp axit amin trải dài suốt cả ngày lẫn đêm để nuôi dưỡng tế bào cơ tối đa.',
    },
    {
      id: 3,
      name: 'Protein bò (Beef Protein)',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      description: 'Chiết xuất từ 100% thịt bò thủy phân không chứa lactose, giàu creatine tự nhiên và các chuỗi amino acid nồng độ cao giúp gia tăng sức mạnh vượt trội.',
    },
    {
      id: 4,
      name: 'Protein casein',
      image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=400&q=80',
      description: 'Dòng protein hấp thu chậm lý tưởng dùng trước khi ngủ, giải phóng axit amin liên tục trong 6-8 giờ để chống dị hóa cơ bắp ban đêm.',
    },
    {
      id: 5,
      name: 'Whey protein isolate',
      image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80',
      description: 'Dòng đạm tinh khiết bậc nhất đã loại bỏ hầu như hoàn toàn đường lactose, chất béo và tạp chất, tốc độ hấp thu cực nhanh và siêu tinh gọn.',
    },
  ],
  gainer: [
    {
      id: 11,
      name: 'Mass Gainer cao năng lượng (High Calorie)',
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=400&q=80',
      description: 'Sản phẩm hỗ trợ tăng cân nhanh chóng cho người gầy kinh niên (Ectomorph), cung cấp trên 1000 calo và 50g protein mỗi khẩu phần.',
    },
    {
      id: 12,
      name: 'Lean Gainer tăng cơ nạc hạn chế tăng mỡ',
      image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80',
      description: 'Tỷ lệ Carb : Protein lý tưởng 2:1 từ yến mạch và khoai lang, giúp tăng cơ bắp nạc sạch sẽ mà không tích trữ mỡ thừa.',
    },
  ],
  creatine: [
    {
      id: 21,
      name: 'Creatine Monohydrate vi hạt (Micronized)',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      description: 'Dạng creatine tinh khiết nhất được nghiền mịn thành kích thước siêu nhỏ, tan ngay trong nước và hấp thu nhanh vào tế bào cơ.',
    },
    {
      id: 22,
      name: 'Creatine HCL (Creatine Hydrochloride)',
      image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&q=80',
      description: 'Creatine liên kết với muối hydrochloride giúp tăng độ hòa tan gấp 38 lần, không gây cảm giác đầy bụng hay tích nước dưới da.',
    },
  ],
  amino_acids: [
    {
      id: 31,
      name: 'BCAA tỷ lệ 2:1:1 cao cấp',
      image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=400&q=80',
      description: 'Cung cấp tỷ lệ vàng Leucine : Isoleucine : Valine giúp chống dị hóa teo cơ trong suốt buổi tập cường độ cao.',
    },
    {
      id: 32,
      name: 'EAA 9 axit amin thiết yếu',
      image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&q=80',
      description: 'Trọn bộ 9 loại axit amin mà cơ thể không tự tổng hợp được, thúc đẩy quá trình tổng hợp protein tối đa.',
    },
  ],
  fat_burner: [
    {
      id: 41,
      name: 'Viên đốt mỡ sinh nhiệt (Thermogenic Fat Burner)',
      image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&q=80',
      description: 'Kích thích sinh nhiệt tự nhiên, tăng tốc độ trao đổi chất cơ bản và giải phóng axit béo dự trữ thành năng lượng.',
    },
  ],
  lcarnitine: [
    {
      id: 51,
      name: 'L-Carnitine L-Tartrate dạng lỏng',
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=400&q=80',
      description: 'Chiếc xe vận chuyển axit béo vào ty thể tế bào để đốt cháy thành năng lượng ATP, tối ưu hóa khi tập cardio.',
    },
  ],
  vitamins: [
    {
      id: 61,
      name: 'Multivitamin & Khoáng chất chuyên sâu cho Vận động viên',
      image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=400&q=80',
      description: 'Cung cấp đầy đủ Vitamin A, C, D3, E, K2 cùng Kẽm, Magie và Selen giúp tăng cường miễn dịch và tối ưu hóa chuyển hóa năng lượng.',
    },
  ],
  specialized: [
    {
      id: 71,
      name: 'Pre-Workout tăng sức mạnh & Pump cơ',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      description: 'Chứa Citrulline Malate, Beta-Alanine và Caffeine giúp bùng nổ sức mạnh, tăng lưu lượng máu và tập trung cao độ.',
    },
  ],
  joints: [
    {
      id: 81,
      name: 'Glucosamine, Chondroitin & MSM bảo vệ sụn khớp',
      image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&q=80',
      description: 'Tái tạo chất nhờn sụn khớp, giảm viêm đau khớp gối và vai khi gánh nâng tạ nặng thường xuyên.',
    },
  ],
};

const NutritionProductListScreen: React.FC<NutritionProductListScreenProps> = ({
  navigation,
  route,
}) => {
  const categoryName = route?.params?.category || 'Protein';
  const categoryId = route?.params?.categoryId || 'protein';
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const fetchProducts = async (query = '') => {
    try {
      setLoading(true);
      const res = await apiFitlife.get('/dinh-duong-the-thao', {
        params: {
          category: categoryId,
          q: query,
        },
      });

      if (res.data?.status && res.data?.data && res.data.data.length > 0) {
        // Map backend fields: ten_san_pham -> name, anh_san_pham -> image, noi_dung_chi_tiet -> description
        const mapped = res.data.data.map((item: any) => ({
          id: item.id,
          name: item.ten_san_pham,
          image: item.anh_san_pham,
          description: item.noi_dung_chi_tiet || item.mo_ta_ngan,
          ...item,
        }));
        setProducts(mapped);
      } else {
        fallbackLocal(query);
      }
    } catch (error) {
      console.log('Error fetching nutrition products, using fallback:', error);
      fallbackLocal(query);
    } finally {
      setLoading(false);
    }
  };

  const fallbackLocal = (query = '') => {
    const rawList = FALLBACK_NUTRITION_PRODUCTS[categoryId] || FALLBACK_NUTRITION_PRODUCTS.protein || [];
    if (!query) {
      setProducts(rawList);
    } else {
      setProducts(rawList.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())));
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      fetchProducts();
    } else {
      fetchProducts(text);
    }
  };

  const getImageSource = (item: any) => {
    const rawImage = item.image || item.anh_san_pham;
    if (rawImage && typeof rawImage === 'string' && (rawImage.startsWith('http://') || rawImage.startsWith('https://'))) {
      return { uri: rawImage };
    }
    const slug = item.danh_muc_slug || categoryId;
    if (slug && NUTRITION_ASSETS[slug]) {
      return NUTRITION_ASSETS[slug];
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

        <Text style={styles.headerTitle}>{categoryName}</Text>

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

      {/* Danh sách các sản phẩm */}
      {loading && products.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0D7F8D" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {products.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              style={styles.productRow}
              onPress={() =>
                navigation.navigate('NutritionDetail', {
                  productId: item.id,
                  product: item,
                  categoryName: categoryName,
                  categoryId: categoryId,
                })
              }
            >
              <Image
                source={getImageSource(item)}
                style={styles.productThumb}
                resizeMode="contain"
              />
              <Text style={styles.productName}>{item.name || item.ten_san_pham}</Text>
              <Ionicons name="chevron-forward" size={20} color="#00C4CC" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default NutritionProductListScreen;

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
  productRow: {
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
  productThumb: {
    width: 52,
    height: 52,
    marginRight: 16,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
