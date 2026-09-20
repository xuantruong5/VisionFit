import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../../../general/api';

interface NutritionDetailScreenProps {
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

const NutritionDetailScreen: React.FC<NutritionDetailScreenProps> = ({ navigation, route }) => {
  const { product, productId, categoryName, categoryId } = route.params || {};
  const [detail, setDetail] = useState<any>(product || null);
  const [loading, setLoading] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(1);

  const toggleFontSize = () => {
    setFontSizeScale((prev) => (prev === 1 ? 1.2 : prev === 1.2 ? 1.4 : 1));
  };

  useEffect(() => {
    const id = productId || product?.id;
    if (id) {
      fetchDetail(id);
    }
  }, [productId, product?.id]);

  const fetchDetail = async (id: number) => {
    try {
      setLoading(true);
      const res = await apiFitlife.get(`/dinh-duong-the-thao/${id}`);
      if (res.data?.status && res.data?.data) {
        const item = res.data.data;
        setDetail({
          name: item.ten_san_pham,
          image: item.anh_san_pham,
          description: item.noi_dung_chi_tiet || item.mo_ta_ngan,
          ...item,
        });
      }
    } catch (error) {
      console.log('Error fetching product detail, using local data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentProduct = detail || product || {
    name: 'Complex protein',
    image: null,
    description:
      'Complex protein là hỗn hợp các protein từ các nguồn gốc khác nhau, dựa trên whey protein và nhằm mục đích tăng cơ và siết cơ. Complex protein bao gồm các protein có tốc độ đồng hóa trong 2-4 giờ, ví dụ, egg albumin hoặc protein đậu nành và casein với tốc độ đồng hóa lên tới 7 giờ. Do đó, whey protein kích hoạt quá trình đồng hóa và các loại protein khác kéo dài quá trình này trong một thời gian dài nhưng vẫn duy trì mức độ nitơ. Complex protein mang lại cảm giác no lâu và là lựa chọn tuyệt vời khi thực hiện chế độ low-carb, nhằm mục đích đốt cháy mỡ dự trữ.',
  };

  const getImageSource = () => {
    const rawImage = currentProduct.image || currentProduct.anh_san_pham;
    if (rawImage && typeof rawImage === 'string' && (rawImage.startsWith('http://') || rawImage.startsWith('https://'))) {
      return { uri: rawImage };
    }
    const slug = currentProduct.danh_muc_slug || categoryId;
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

        <Text style={styles.headerTitle}>{categoryName || 'Dinh dưỡng'}</Text>

        <TouchableOpacity style={styles.headerIconBtn} onPress={toggleFontSize}>
          <Ionicons name="text-outline" size={22} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {loading && !detail ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0D7F8D" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Hũ sản phẩm lớn ở giữa */}
          <View style={styles.productImageBox}>
            <Image
              source={getImageSource()}
              style={styles.productHeroImage}
              resizeMode="contain"
            />
          </View>

          {/* Tên sản phẩm */}
          <Text style={[styles.productTitle, { fontSize: 20 * fontSizeScale }]}>
            {currentProduct.name || currentProduct.ten_san_pham}
          </Text>

          {/* Nội dung mô tả chi tiết */}
          <Text style={[styles.productDescription, { fontSize: 14 * fontSizeScale }]}>
            {currentProduct.description || currentProduct.noi_dung_chi_tiet}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default NutritionDetailScreen;

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingTop: 16,
    paddingBottom: 50,
  },
  productImageBox: {
    width: '100%',
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  productHeroImage: {
    width: '85%',
    height: '100%',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  productDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
});
