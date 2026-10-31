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

interface EncyclopediaDetailScreenProps {
  navigation: any;
  route: any;
}

const EncyclopediaDetailScreen: React.FC<EncyclopediaDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { articleId, initialArticle } = route.params || {};
  const [article, setArticle] = useState<any>(initialArticle || null);
  const [loading, setLoading] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(1);

  const toggleFontSize = () => {
    setFontSizeScale((prev) => (prev === 1 ? 1.2 : prev === 1.2 ? 1.4 : 1));
  };

  useEffect(() => {
    if (articleId) {
      fetchDetail(articleId);
    }
  }, [articleId]);

  const fetchDetail = async (id: number) => {
    try {
      setLoading(true);
      const res = await apiFitlife.get(`/bach-khoa-toan-thu/${id}`);
      if (res.data?.status && res.data?.data) {
        setArticle(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching article detail, using initial/fallback:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentArticle = article || {
    tieu_de: 'Anabolic Steroid (Steroid đồng hóa) là gì?',
    chu_de: 'Dược lý & Hormone',
    anh_bia: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    noi_dung:
      "Steroid đồng hóa (anabolic) là các loại thuốc dược lý bắt chước tác dụng của hormone sinh dục nam testosterone và dihydrotestosterone.\n\nSteroid đồng hóa làm tăng tốc độ tổng hợp protein trong tế bào, dẫn đến sự phì đại rõ rệt của mô cơ (toàn bộ quá trình này được gọi là đồng hóa), đó là lý do tại sao chúng được sử dụng rộng rãi trong thể hình.\n\nCơ chế hoạt động của steroid đồng hóa khác với hormone peptide: một khi vào máu, các phân tử steroid được phân phối khắp cơ thể, nơi chúng tương tác với các tế bào của cơ xương, tuyến bã nhờn, nang lông, một số vùng của não và một số tuyến nội tiết.\n\nSteroid đồng hóa tan trong chất béo, cho phép chúng xâm nhập vào màng tế bào, vốn được cấu tạo từ chất béo.\n\nBên trong tế bào, steroid đồng hóa tương tác (liên kết) với các thụ thể androgen trong nhân và tế bào chất. Các thụ thể androgen được kích hoạt sẽ truyền tín hiệu vào nhân tế bào, dẫn đến sự thay đổi biểu hiện gen hoặc kích hoạt các quá trình gửi tín hiệu đến các bộ phận khác của tế bào.\n\nĐiều này kích thích sự tổng hợp của tất cả các loại protein, bao gồm myosin và actin (các thành phần chính của cơ bắp), dẫn đến sự gia tăng sức mạnh và kích thước cơ bắp đáng kể.",
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.flex}>
        {loading && !article ? (
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
            {/* Ảnh bìa */}
            {currentArticle.anh_bia && (
              <View style={styles.imageBox}>
                <Image
                  source={{ uri: currentArticle.anh_bia }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)', 'rgba(7,40,48,0.7)']}
                  locations={[0, 0.4, 1]}
                  style={styles.heroOverlay}
                />
              </View>
            )}

            <View style={[styles.sheet, !currentArticle.anh_bia && styles.sheetNoHero]}>
              {/* Chủ đề tag nếu có */}
              {currentArticle.chu_de && (
                <View style={styles.topicBadge}>
                  <Text style={styles.topicBadgeText}>{currentArticle.chu_de}</Text>
                </View>
              )}

              {/* Tiêu đề bài viết */}
              <Text style={[styles.articleTitle, { fontSize: 20 * fontSizeScale }]}>
                {currentArticle.tieu_de}
              </Text>

              <View style={styles.sourceRow}>
                <Text style={styles.sourceText}>Bách khoa toàn thư</Text>
              </View>

              {/* Nội dung chi tiết */}
              <View style={styles.bodyCard}>
                <Text style={[styles.articleBody, { fontSize: 14.5 * fontSizeScale }]}>
                  {currentArticle.noi_dung}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Thanh nút nổi */}
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.glassBtn}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassBtn} activeOpacity={0.8} onPress={toggleFontSize}>
            <Ionicons name="text-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EncyclopediaDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
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
  sheetNoHero: {
    marginTop: 0,
    paddingTop: 70,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  imageBox: {
    height: 270,
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    lineHeight: 28,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sourceIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  articleBody: {
    fontSize: 14.5,
    color: COLORS.textSecondary,
    lineHeight: 25,
    letterSpacing: 0.15,
  },
});
