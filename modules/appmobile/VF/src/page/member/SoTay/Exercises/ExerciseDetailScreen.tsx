import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ExerciseDetailScreenProps {
  navigation: any;
  route: any;
}

const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({ navigation, route }) => {
  const { exercise, categoryName } = route.params || {};
  const [activeTab, setActiveTab] = useState<'info' | 'muscles' | 'history' | 'progress'>('info');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');
  const [showOnDashboard, setShowOnDashboard] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(true);

  const toggleFontSize = () => {
    setFontSizeScale((prev) => (prev === 1 ? 1.2 : prev === 1.2 ? 1.4 : 1));
  };

  const currentExercise = exercise || {
    name: 'Bài fly ép ngực với máy',
    englishName: 'Seated cable fly',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    description:
      'Tiếng Anh là Seated cable fly. Đây là một bài tập giúp bạn tập trung phát triển hai nhóm cơ ngực lớn một cách riêng biệt. Chuyển động của bài tập này là tự nhiên đối với các cơ ngực lớn vì chức năng chính của chúng là dùng để kết hợp hai tay lại với nhau. Tùy theo độ nghiêng khi chuyển động mà trọng tâm lực sẽ tác động lên ngực trên, ngực giữa hay ngực dưới nhiều hơn.',
    musclesDistribution: [
      { name: 'Ngực', percent: 80, color: '#EF4444' },
      { name: 'Cơ delta trước', percent: 45, color: '#8B5CF6' },
      { name: 'Đầu xương đòn của cơ ngực lớn', percent: 70, color: '#3B82F6' },
      { name: 'Đầu ức sườn của cơ ngực lớn', percent: 85, color: '#EF4444' },
      { name: 'Cơ ngực bé', percent: 60, color: '#10B981' },
    ],
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={toggleFontSize}>
            <Ionicons name="text-outline" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>{categoryName || 'Ngực'}</Text>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isBookmarked ? '#0D7F8D' : '#374151'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="play-outline" size={24} color="#0D7F8D" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Tabs: Thông tin, Cơ bắp, Lịch sử, Tiến độ */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'info' && styles.tabItemActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Thông tin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'muscles' && styles.tabItemActive]}
          onPress={() => setActiveTab('muscles')}
        >
          <Text style={[styles.tabText, activeTab === 'muscles' && styles.tabTextActive]}>
            Cơ bắp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Lịch sử
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'progress' && styles.tabItemActive]}
          onPress={() => setActiveTab('progress')}
        >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
            Tiến độ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung theo Tab */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= TAB 1: THÔNG TIN ================= */}
        {activeTab === 'info' && (
          <View>
            {/* Hình ảnh/Minh họa bài tập */}
            <View style={styles.imageBox}>
              <Image
                source={{ uri: currentExercise.image }}
                style={styles.exerciseHeroImage}
                resizeMode="contain"
              />
            </View>

            {/* Tên bài tập */}
            <Text style={[styles.exerciseNameText, { fontSize: 20 * fontSizeScale }]}>
              {currentExercise.name}
            </Text>

            {/* Mô tả chi tiết */}
            <Text style={[styles.bodyDescription, { fontSize: 14 * fontSizeScale }]}>
              {currentExercise.description}
            </Text>

            {/* Hướng dẫn */}
            <Text style={styles.sectionHeaderTitle}>Hướng dẫn</Text>
            <View style={styles.guideStep}>
              <Text style={styles.stepNum}>1.</Text>
              <Text style={[styles.stepText, { fontSize: 14 * fontSizeScale }]}>
                Điều chỉnh ghế ngồi sao cho tay cầm ngang tầm giữa ngực. Lưng và đầu áp sát vào đệm tựa.
              </Text>
            </View>
            <View style={styles.guideStep}>
              <Text style={styles.stepNum}>2.</Text>
              <Text style={[styles.stepText, { fontSize: 14 * fontSizeScale }]}>
                Hít vào, từ từ ép hai tay cầm về phía trước ngực với khuỷu tay hơi cong nhẹ tự nhiên.
              </Text>
            </View>
            <View style={styles.guideStep}>
              <Text style={styles.stepNum}>3.</Text>
              <Text style={[styles.stepText, { fontSize: 14 * fontSizeScale }]}>
                Giữ siết cơ ngực 1 giây ở điểm ép chặt nhất, sau đó thở ra và từ từ mở rộng hai tay về vị trí ban đầu.
              </Text>
            </View>
          </View>
        )}

        {/* ================= TAB 2: CƠ BẮP ================= */}
        {activeTab === 'muscles' && (
          <View>
            {/* Minh họa giải phẫu cơ thể */}
            <View style={styles.muscleIllustrationBox}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
                }}
                style={styles.bodyAnatomyImage}
                resizeMode="cover"
              />
            </View>

            {/* Thang đo mức tải trọng */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>1-19%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
                <Text style={styles.legendText}>20-49%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#818CF8' }]} />
                <Text style={styles.legendText}>50-79%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>80-100%</Text>
              </View>
            </View>

            {/* Danh sách phân bổ tải trọng cơ */}
            <Text style={styles.sectionHeaderTitle}>Phân bổ tải trọng cơ</Text>

            {currentExercise.musclesDistribution?.map((item: any, idx: number) => (
              <View key={idx} style={styles.muscleBarItem}>
                <View style={styles.muscleBarHeader}>
                  <Text style={styles.muscleBarName}>{item.name}</Text>
                  <Text style={styles.muscleBarPercent}>{item.percent}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${item.percent}%`,
                        backgroundColor: item.color || '#0D7F8D',
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 3: LỊCH SỬ ================= */}
        {activeTab === 'history' && (
          <View style={styles.emptyStateBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={64} color="#9ED9DF" />
            </View>
            <Text style={styles.emptyTitle}>Lịch sử hiện đang trống</Text>
            <Text style={styles.emptySubtitle}>
              Tại đây bạn sẽ thấy lịch sử các hiệp đã hoàn thành và trọng lượng đã nâng
            </Text>
          </View>
        )}

        {/* ================= TAB 4: TIẾN ĐỘ ================= */}
        {activeTab === 'progress' && (
          <View>
            {/* Bộ lọc Ngày - Tuần - Tháng */}
            <View style={styles.timeFilterPill}>
              <TouchableOpacity
                style={[styles.pillBtn, timeFilter === 'day' && styles.pillBtnActive]}
                onPress={() => setTimeFilter('day')}
              >
                <Text style={[styles.pillBtnText, timeFilter === 'day' && styles.pillBtnTextActive]}>
                  Ngày
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillBtn, timeFilter === 'week' && styles.pillBtnActive]}
                onPress={() => setTimeFilter('week')}
              >
                <Text style={[styles.pillBtnText, timeFilter === 'week' && styles.pillBtnTextActive]}>
                  Tuần
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillBtn, timeFilter === 'month' && styles.pillBtnActive]}
                onPress={() => setTimeFilter('month')}
              >
                <Text style={[styles.pillBtnText, timeFilter === 'month' && styles.pillBtnTextActive]}>
                  Tháng
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.profileText}>Hồ sơ: -</Text>

            {/* Empty chart display */}
            <View style={styles.chartEmptyBox}>
              <Ionicons name="ban-outline" size={60} color="#CBD5E1" />
              <Text style={styles.chartEmptyText}>Không có dữ liệu</Text>
            </View>

            {/* Ghi chú */}
            <View style={styles.infoNoteRow}>
              <Ionicons name="information-circle-outline" size={20} color="#0D7F8D" />
              <Text style={styles.infoNoteText}>
                Các giá trị trong biểu đồ thể hiện mức tạ nặng nhất nâng được ở mỗi bài tập trong buổi tập
              </Text>
            </View>

            {/* Tùy chọn cài đặt */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Hiển thị trên Trang tổng quan</Text>
              <Switch
                value={showOnDashboard}
                onValueChange={setShowOnDashboard}
                trackColor={{ false: '#E2E8F0', true: '#0D7F8D' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingLabel}>
                  Hiển thị tất cả dữ liệu từ tất cả các chương trình tập luyện
                </Text>
              </View>
              <Switch
                value={showAllPrograms}
                onValueChange={setShowAllPrograms}
                trackColor={{ false: '#E2E8F0', true: '#00A896' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.infoNoteRow}>
              <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" />
              <Text style={styles.subNoteText}>
                Widget này hiển thị dữ liệu từ tất cả các chương trình đào tạo của bạn
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExerciseDetailScreen;

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
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#11343A',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabItemActive: {
    backgroundColor: '#264653',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 12,
    paddingBottom: 50,
  },
  imageBox: {
    width: '100%',
    height: 250,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  exerciseHeroImage: {
    width: '90%',
    height: '90%',
  },
  exerciseNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  bodyDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  guideStep: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 10,
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D7F8D',
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  muscleIllustrationBox: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 14,
  },
  bodyAnatomyImage: {
    width: '100%',
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  muscleBarItem: {
    marginBottom: 14,
  },
  muscleBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  muscleBarName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  muscleBarPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D7F8D',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EBF8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  timeFilterPill: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  pillBtnActive: {
    backgroundColor: '#264653',
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
  },
  profileText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
  },
  chartEmptyBox: {
    height: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  chartEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '500',
  },
  infoNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 18,
    paddingRight: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  subNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
