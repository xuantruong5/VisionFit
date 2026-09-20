import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../../../general/api';

import ImageTextGradient from '../../../../components/ImageTextGradient';

interface EncyclopediaListScreenProps {
  navigation: any;
}

const FALLBACK_ENCYCLOPEDIA = [
  {
    id: 1,
    tieu_de: 'Anabolic Steroid (Steroid đồng hóa) là gì?',
    chu_de: 'Dược lý & Hormone',
    anh_bia: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Steroid đồng hóa là các loại thuốc bắt chước tác dụng của hormone sinh dục nam testosterone trong cơ thể.',
  },
  {
    id: 2,
    tieu_de: 'Bài tập khu cơ (Bài tập chuyên biệt)',
    chu_de: 'Phương pháp tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Cách tác động trực tiếp vào các bó cơ nhỏ giúp hoàn thiện vẻ đẹp cân đối cơ thể.',
  },
  {
    id: 3,
    tieu_de: 'Béo bụng: Nguyên nhân và cách giảm mỡ hiệu quả',
    chu_de: 'Dinh dưỡng & Giảm mỡ',
    anh_bia: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Hiểu rõ sự khác biệt giữa mỡ dưới da và mỡ nội tạng để áp dụng chế độ tập luyện hiệu quả.',
  },
  {
    id: 4,
    tieu_de: 'Bạn thuộc tạng người nào:\nEctomorph (gầy), Mesomorph\n(cơ bắp), Endomorph (béo)?',
    chu_de: 'Tạng người & Thể chất',
    anh_bia: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Nhận biết đặc điểm thể trạng di truyền của bạn để tối ưu hóa giáo án tập và thực đơn.',
  },
  {
    id: 5,
    tieu_de: 'Carbohydrate đơn giản và\ncarbohydrate phức tạp là gì?',
    chu_de: 'Dinh dưỡng',
    anh_bia: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Phân biệt 2 loại đường bột để nạp năng lượng thông minh trước và sau buổi tập.',
  },
  {
    id: 6,
    tieu_de: 'Cellulite (Sần vỏ cam): Cơ chế và giải pháp khắc phục',
    chu_de: 'Sức khỏe & Làm đẹp',
    anh_bia: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Hiện tượng sần vỏ cam ở đùi và mông xuất phát từ đâu và giải pháp khắc phục.',
  },
  {
    id: 7,
    tieu_de: 'Creatine Monohydrate: Tác dụng và cách nạp hiệu quả nhất',
    chu_de: 'Thực phẩm bổ sung',
    anh_bia: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Creatine giúp tái tạo năng lượng ATP tăng sức mạnh tức thì và phì đại tế bào cơ.',
  },
  {
    id: 8,
    tieu_de: 'DOMS (Đau mỏi cơ sau tập): Nguyên nhân và cách hồi phục nhanh',
    chu_de: 'Phục hồi & Y học thể thao',
    anh_bia: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Cơn đau nhức cơ bắp sau 24-48 giờ và cách giải tỏa đau mỏi khoa học.',
  },
  {
    id: 9,
    tieu_de: 'Nguyên lý Progressive Overload: Chìa khóa phát triển cơ bắp',
    chu_de: 'Phương pháp tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Tăng tiến áp lực tập luyện là nguyên tắc bắt buộc để cơ bắp liên tục bứt phá.',
  },
  {
    id: 10,
    tieu_de: 'BMR và TDEE: Cách tính chuẩn để tăng cơ giảm mỡ chính xác',
    chu_de: 'Dinh dưỡng & Chuyển hóa',
    anh_bia: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Nắm vững lượng calo tiêu thụ hàng ngày để thiết lập thực đơn không bao giờ thất bại.',
  },
  {
    id: 11,
    tieu_de: 'Cardio LISS vs Cardio HIIT: Lựa chọn nào tối ưu đốt mỡ?',
    chu_de: 'Phương pháp tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'So sánh chi tiết ưu nhược điểm của Cardio vùng nhịp tim 2 và ngắt quãng cường độ cao.',
  },
  {
    id: 12,
    tieu_de: 'Cơ lõi (Core) là gì và tại sao gập bụng không đủ?',
    chu_de: 'Giải phẫu & Kỹ thuật',
    anh_bia: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Hiểu đúng về chức năng chống chuyển động của hệ cơ lõi bảo vệ cột sống thắt lưng.',
  },
  {
    id: 13,
    tieu_de: 'Intermittent Fasting (Nhịn ăn gián đoạn 16/8): Cơ chế thực tế',
    chu_de: 'Dinh dưỡng',
    anh_bia: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Kích hoạt cơ chế tự thực bào và kiểm soát đường huyết thông minh qua nhịn ăn 16/8.',
  },
  {
    id: 14,
    tieu_de: 'Giấc ngủ và Hormone tăng trưởng (GH): Bí quyết hồi phục',
    chu_de: 'Phục hồi & Sức khỏe',
    anh_bia: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Cơ bắp phát triển trong giấc ngủ sâu NREM khi hormone HGH được tiết ra mạnh mẽ nhất.',
  },
  {
    id: 15,
    tieu_de: 'Kỹ thuật Valsalva Maneuver: Cách hít thở nén khí ổ bụng',
    chu_de: 'Kỹ thuật tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Kỹ thuật nén khí tạo trụ vững bảo vệ cột sống trong các bài Squat và Deadlift nặng.',
  },
  {
    id: 16,
    tieu_de: 'Whey Protein: Phân biệt Concentrate, Isolate và Hydrolyzed',
    chu_de: 'Thực phẩm bổ sung',
    anh_bia: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Hiểu rõ các dòng Whey Protein trên thị trường để lựa chọn sản phẩm phù hợp với cơ địa.',
  },
  {
    id: 17,
    tieu_de: 'BCAA và EAA: Bản chất axit amin thiết yếu và khi nào cần bổ sung?',
    chu_de: 'Thực phẩm bổ sung',
    anh_bia: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Sự khác biệt giữa 3 axit amin chuỗi nhánh và 9 axit amin thiết yếu trong việc chống teo cơ.',
  },
  {
    id: 18,
    tieu_de: 'Hypertrophy (Phì đại cơ bắp): 3 cơ chế khoa học kích thích tăng cơ',
    chu_de: 'Khoa học cơ bắp & Sinh lý học',
    anh_bia: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Nghiên cứu của Tiến sĩ Brad Schoenfeld về 3 trụ cột kích hoạt sự phát triển sợi cơ.',
  },
  {
    id: 19,
    tieu_de: 'Deload Week (Tuần xả tải): Bí quyết vượt qua ngưỡng chững (Plateau)',
    chu_de: 'Phương pháp tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Nghỉ ngơi có chiến lược giúp phục hồi hệ thần kinh và khớp xương mà không bị mất cơ.',
  },
  {
    id: 20,
    tieu_de: 'RPE và RIR: Quản lý cường độ tập luyện chuẩn khoa học',
    chu_de: 'Phương pháp tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Thang đo cảm nhận nỗ lực (RPE) và số rep dự trữ (RIR) giúp tự điều chỉnh tải trọng.',
  },
  {
    id: 21,
    tieu_de: 'Pre-Workout & Caffeine: Tác động sinh lý và cách dùng không bị lờn thuốc',
    chu_de: 'Thực phẩm bổ sung',
    anh_bia: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Cơ chế tác động của Pre-workout đến sự tập trung và cách chu kỳ hóa thông minh.',
  },
  {
    id: 22,
    tieu_de: 'Mind-Muscle Connection: Bí quyết kết nối Thần kinh - Cơ bắp',
    chu_de: 'Kỹ thuật tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Tập trung suy nghĩ vào cơ bắp mục tiêu giúp tăng kích hoạt sợi cơ thêm 15-25%.',
  },
  {
    id: 23,
    tieu_de: 'Đau gối khi Squat và hiện tượng sụp gối (Knee Valgus): Cách xử lý',
    chu_de: 'Phục hồi & Phòng ngừa chấn thương',
    anh_bia: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Nguyên nhân gây đau gối khi gánh tạ và các bài tập củng cố cơ mông nhỡ, cổ chân.',
  },
  {
    id: 24,
    tieu_de: 'Hội chứng Chèn ép khớp vai (Shoulder Impingement) khi đẩy ngực',
    chu_de: 'Phục hồi & Phòng ngừa chấn thương',
    anh_bia: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Bảo vệ nhóm chóp xoay và kỹ thuật rút xương bả vai khi Bench Press.',
  },
  {
    id: 25,
    tieu_de: 'Tập luyện đến ngưỡng thất bại (Training to Failure): Lợi ích & Rủi ro',
    chu_de: 'Phương pháp tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Khi nào nên tập tới ngưỡng thất bại và khi nào nên dừng lại để phục hồi tốt.',
  },
  {
    id: 26,
    tieu_de: 'Giảm mỡ cục bộ (Spot Reduction): Huyền thoại và Sự thật khoa học',
    chu_de: 'Khoa học & Thần thoại',
    anh_bia: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Tại sao gập bụng nghìn cái không làm tan mỡ bụng và cơ chế huy động mỡ thực sự.',
  },
  {
    id: 27,
    tieu_de: 'Nước và Điện giải: Tác động đến sự co cơ và ngăn ngừa chuột rút',
    chu_de: 'Dinh dưỡng & Sinh lý học',
    anh_bia: 'https://images.unsplash.com/photo-1559839914-ba2a201c1f51?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Mất nước chỉ 2% có thể làm giảm 15% sức mạnh nâng tạ. Vai trò của Natri, Kali, Magie.',
  },
  {
    id: 28,
    tieu_de: 'Carb Cycling (Xoay vòng tinh bột): Chiến lược giảm mỡ giữ cơ đỉnh cao',
    chu_de: 'Dinh dưỡng nâng cao',
    anh_bia: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Luân phiên ngày High Carb và Low Carb để tối ưu hóa Insulin và đốt mỡ hiệu quả.',
  },
  {
    id: 29,
    tieu_de: 'Deadlift: Phân biệt Conventional, Sumo và Romanian Deadlift (RDL)',
    chu_de: 'Kỹ thuật tập luyện',
    anh_bia: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Mỗi biến thể Deadlift tác động vào nhóm cơ nào và cách chọn theo khung xương.',
  },
  {
    id: 30,
    tieu_de: 'Hormone Testosterone tự nhiên: 7 cách tăng cường không dùng thuốc',
    chu_de: 'Dược lý & Sinh lý nam',
    anh_bia: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Testosterone quyết định sức mạnh, cơ bắp và sự nam tính. Cách kích hoạt tự nhiên.',
  },
  {
    id: 31,
    tieu_de: 'Giãn cơ tĩnh (Static) & Giãn cơ động (Dynamic): Sử dụng đúng lúc',
    chu_de: 'Phục hồi & Khởi động',
    anh_bia: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Sai lầm giãn cơ tĩnh trước tập làm giảm sức mạnh và cách khởi động chuẩn.',
  },
  {
    id: 32,
    tieu_de: 'Cửa sổ đồng hóa (Anabolic Window): Có bắt buộc nạp Protein ngay?',
    chu_de: 'Dinh dưỡng & Huyền thoại',
    anh_bia: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Khoa học hiện đại đã chứng minh khái niệm cửa sổ 30 phút sau tập không hề khắt khe.',
  },
  {
    id: 33,
    tieu_de: 'Tập luyện và Chu kỳ kinh nguyệt: Điều chỉnh giáo án theo từng pha Hormone',
    chu_de: 'Thể hình nữ & Sinh lý học',
    anh_bia: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
    tom_tat: 'Hiểu rõ sự biến thiên Estrogen và Progesterone giúp nữ gymer tập luyện hiệu quả.',
  },
];

const EncyclopediaListScreen: React.FC<EncyclopediaListScreenProps> = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [articles, setArticles] = useState<any[]>(FALLBACK_ENCYCLOPEDIA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async (query = '') => {
    try {
      setLoading(true);
      const res = await apiFitlife.get('/bach-khoa-toan-thu', {
        params: query ? { q: query } : {},
      });
      if (res.data?.status && res.data?.data && res.data.data.length > 0) {
        setArticles(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching encyclopedia articles, using fallback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      fetchArticles();
    } else {
      const localFiltered = FALLBACK_ENCYCLOPEDIA.filter((a) =>
        a.tieu_de.toLowerCase().includes(text.toLowerCase())
      );
      setArticles(localFiltered);
      fetchArticles(text);
    }
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

      {/* Danh sách các bài viết */}
      {loading && articles.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0D7F8D" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {articles.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              style={styles.articleCard}
              onPress={() =>
                navigation.navigate('EncyclopediaDetail', {
                  articleId: item.id,
                  initialArticle: item,
                })
              }
            >
              <ImageBackground
                source={{ uri: item.anh_bia }}
                style={styles.articleCardImage}
                imageStyle={styles.cardImageRadius}
                resizeMode="cover"
              >
                <ImageTextGradient />
                <View style={styles.cardContent}>
                  <Text style={styles.articleCardTitle}>{item.tieu_de}</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default EncyclopediaListScreen;

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
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  articleCard: {
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
  articleCardImage: {
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
  articleCardTitle: {
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
