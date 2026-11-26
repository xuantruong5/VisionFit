import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
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
      <StatusBar barStyle="dark-content" />
      <View style={styles.flex}>
        {loading && !detail ? (
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
            {/* Hũ sản phẩm lớn ở giữa */}
            <LinearGradient
              colors={[COLORS.surfaceTeal, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.productImageBox}
            >
              <View style={styles.heroCircle} />
              <Image
                source={getImageSource()}
                style={styles.productHeroImage}
                resizeMode="contain"
              />
            </LinearGradient>

            <View style={styles.sheet}>
              <View style={styles.topicBadge}>
                <Text style={styles.topicBadgeText}>{categoryName || 'Dinh dưỡng'}</Text>
              </View>

              {/* Tên sản phẩm */}
              <Text style={[styles.productTitle, { fontSize: 20 * fontSizeScale }]}>
                {currentProduct.name || currentProduct.ten_san_pham}
              </Text>

              {/* Nội dung mô tả chi tiết */}
              <View style={styles.bodyCard}>
                <Text style={[styles.productDescription, { fontSize: 14 * fontSizeScale }]}>
                  {currentProduct.description || currentProduct.noi_dung_chi_tiet}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Thanh nút nổi */}
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.lightBtn}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.lightBtn} activeOpacity={0.8} onPress={toggleFontSize}>
            <Ionicons name="text-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NutritionDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceTeal,
  },
  flex: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lightBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  sheet: {
    marginTop: -24,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  topicBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
  },
  topicBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  bodyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOWS.card,
  },
  productImageBox: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  productHeroImage: {
    width: '70%',
    height: '100%',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
});
