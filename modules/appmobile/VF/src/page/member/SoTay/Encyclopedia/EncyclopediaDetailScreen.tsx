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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bách khoa toàn thư</Text>

        <TouchableOpacity style={styles.headerIconBtn} onPress={toggleFontSize}>
          <Ionicons name="text-outline" size={22} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {loading && !article ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0D7F8D" />
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
            </View>
          )}

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

          {/* Nội dung chi tiết */}
          <Text style={[styles.articleBody, { fontSize: 14.5 * fontSizeScale }]}>
            {currentArticle.noi_dung}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default EncyclopediaDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  headerIconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
  },
  scrollContainer: {
    paddingTop: 12,
    paddingBottom: 60,
  },
  imageBox: {
    width: '100%',
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4F8',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  topicBadgeText: {
    color: '#0D7F8D',
    fontSize: 12,
    fontWeight: '700',
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 28,
  },
  articleBody: {
    fontSize: 14.5,
    color: '#374151',
    lineHeight: 25,
    letterSpacing: 0.15,
  },
});
