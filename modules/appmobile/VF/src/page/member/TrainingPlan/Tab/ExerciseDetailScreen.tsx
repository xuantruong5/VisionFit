import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Switch, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ExerciseDetailScreenProps {
  navigation: any;
  route: any;
}

const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({ navigation, route }) => {
  const { exercise } = route.params || {};
  const [activeTab, setActiveTab] = useState<'info' | 'muscles' | 'history' | 'progress'>('info');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [videoMode, setVideoMode] = useState<'correct' | 'wrong'>('correct');
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');
  const [showOnDashboard, setShowOnDashboard] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(true);

  const toggleFontSize = () => {
    setFontSizeScale((prev) => (prev === 1 ? 1.2 : prev === 1.2 ? 1.4 : 1));
  };
  const currentExercise = {
    ...exercise,
    name: exercise?.ten_bai_tap,
    description: exercise?.mo_ta,
    video: exercise?.video_huong_dan,
    instructions: exercise?.huong_dan,
    warnings: exercise?.canh_bao,
  };
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={toggleFontSize}>
            <Ionicons name="text-outline" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>Thông Tin Chi Tiết</Text>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsBookmarked(!isBookmarked)}>
            <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={isBookmarked ? '#0D7F8D' : '#374151'}/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="play-outline" size={24} color="#0D7F8D" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Tabs: Thông tin, Cơ bắp, Lịch sử, Tiến độ */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'info' && styles.tabItemActive]} onPress={() => setActiveTab('info')} >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Thông tin
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'muscles' && styles.tabItemActive]} onPress={() => setActiveTab('muscles')}>
          <Text style={[styles.tabText, activeTab === 'muscles' && styles.tabTextActive]}>
            Cơ bắp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]} onPress={() => setActiveTab('history')} >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Lịch sử
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === 'progress' && styles.tabItemActive]} onPress={() => setActiveTab('progress')} >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
            Tiến độ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung theo Tab */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* ================= TAB 1: THÔNG TIN ================= */}
        {activeTab === 'info' && (
          <View>
            {/* Bộ chọn Video đúng / Video sai */}
            {currentExercise.video_sai ? (
              <View style={styles.videoModeToggleRow}>
                <TouchableOpacity style={[ styles.videoModeToggleBtn, videoMode === 'correct' && styles.videoModeToggleBtnCorrect, ]} onPress={() => setVideoMode('correct')} activeOpacity={0.8}>
                  <Ionicons name="checkmark-circle" size={16} color={videoMode === 'correct' ? '#FFFFFF' : '#10B981'} />
                  <Text style={[ styles.videoModeToggleText, videoMode === 'correct' && styles.videoModeToggleTextActive, ]} >
                    Video đúng (Kỹ thuật chuẩn)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.videoModeToggleBtn, videoMode === 'wrong' && styles.videoModeToggleBtnWrong,]} onPress={() => setVideoMode('wrong')} activeOpacity={0.8}>
                  <Ionicons name="close-circle" size={16} color={videoMode === 'wrong' ? '#FFFFFF' : '#EF4444'} />
                  <Text style={[ styles.videoModeToggleText, videoMode === 'wrong' && styles.videoModeToggleTextActive,]}>
                    Video sai (Lỗi thường gặp)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {/* Hình ảnh/Minh họa bài tập (GIF Animation) */}
            <View style={styles.imageBox}>
              {(
                videoMode === 'correct'
                  ? currentExercise.video_huong_dan
                  : currentExercise.video_sai
              ) ? (
                <Image source={{ uri: videoMode === 'correct' ? currentExercise.video_huong_dan : currentExercise.video_sai, }}
                  style={styles.exerciseHeroImage} resizeMode="contain" onError={() => console.log('Video hướng dẫn bị lỗi')} />
              ) : (
                <Text>Video hướng dẫn bị lỗi</Text>
              )}

              <View style={[ styles.videoBadge, videoMode === 'correct' ? styles.videoBadgeCorrect : styles.videoBadgeWrong,]} >
                <Ionicons name={videoMode === 'correct' ? 'checkmark' : 'alert-outline'} size={12} color="#FFFFFF"/>
                <Text style={styles.videoBadgeText}>
                  {videoMode === 'correct' ? 'Động tác đúng' : 'Lỗi sai cần tránh'}
                </Text>
              </View>
            </View>

            {/* Tên bài tập */}
            <Text style={[ styles.exerciseNameText, { fontSize: 20 * fontSizeScale }, ]} >
              {currentExercise.name}
            </Text>

            {/* Mô tả chi tiết */}
            <Text style={[styles.bodyDescription, { fontSize: 14 * fontSizeScale }]} >
              {currentExercise.description}
            </Text>

       
            {/* Hướng dẫn */}
            <Text style={styles.sectionHeaderTitle}>Hướng dẫn</Text>

            {currentExercise.instructions ? (
              currentExercise.instructions
                .split(/[.,]/)
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
                .map((item: string, index: number) => (
                  <View key={index} style={styles.instructionCard}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[ styles.instructionText,{ fontSize: 14 * fontSizeScale }, ]} >
                      {item}.
                    </Text>
                  </View>
                ))
            ) : null}
            {/* Cảnh báo */}
            {currentExercise.warnings ? (
              <>
                <View style={styles.warningTitleRow}>
                  <Ionicons name="warning" size={24} color="#F4778A" />
                  <Text style={styles.warningTitle}>CẢNH BÁO!</Text>
                </View>

                <View style={styles.warningCard}>
                  {currentExercise.warnings
                    .replace(/\\n/g, '\n')
                    .split(/\n|•/)
                    .map((item: string) => item.trim())
                    .filter((item: string) => item.length > 0)
                    .map((item: string, index: number) => (
                      <View key={index} style={styles.warningItem}>
                        <View style={styles.warningDot} />

                        <Text style={[styles.warningItemText, { fontSize: 14 * fontSizeScale }, ]} >
                          {item.replace(/[.]$/, '')}.
                        </Text>
                      </View>
                    ))}
                </View>
              </>
            ) : null}

            {/* Thiết bị và nơi tập */}
            <View style={styles.exerciseTags}>
              {currentExercise.thiet_bi ? (
                <View style={[styles.exerciseTag, styles.equipmentTag]}>
                  <Text style={styles.exerciseTagText}>
                    {currentExercise.thiet_bi}
                  </Text>
                </View>
              ) : null}

              {(currentExercise.noi_tap || '')
                .split(',')
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
                .map((item: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.exerciseTag,
                      item.toLowerCase() === 'gym'
                        ? styles.gymTag
                        : styles.homeTag,
                    ]}
                  >
                    <Text style={styles.exerciseTagText}>{item}</Text>
                  </View>
                ))}
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
              <TouchableOpacity style={[styles.pillBtn, timeFilter === 'day' && styles.pillBtnActive]} onPress={() => setTimeFilter('day')}>
                <Text style={[styles.pillBtnText, timeFilter === 'day' && styles.pillBtnTextActive]}>
                  Ngày
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pillBtn, timeFilter === 'week' && styles.pillBtnActive]} onPress={() => setTimeFilter('week')}>
                <Text style={[styles.pillBtnText, timeFilter === 'week' && styles.pillBtnTextActive]}>
                  Tuần
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pillBtn, timeFilter === 'month' && styles.pillBtnActive]}onPress={() => setTimeFilter('month')} >
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
              <Switch value={showOnDashboard} onValueChange={setShowOnDashboard} trackColor={{ false: '#E2E8F0', true: '#0D7F8D' }} thumbColor="#FFFFFF"/>
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingLabel}>
                  Hiển thị tất cả dữ liệu từ tất cả các chương trình tập luyện
                </Text>
              </View>
              <Switch value={showAllPrograms} onValueChange={setShowAllPrograms} trackColor={{ false: '#E2E8F0', true: '#00A896' }} thumbColor="#FFFFFF"/>
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
    // backgroundColor: '#F4FAFB',
  },
  header: {
    height: 64,
    // backgroundColor: '#FFFFFF',
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
    borderRadius: 16,
    backgroundColor: '#EDF5F6',
  },
  tabItemActive: {
    backgroundColor: '#0D7F8D',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71949A',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 12,
    paddingBottom: 170,
  },
  imageBox: {
    width: '100%',
    height: 300,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  exerciseHeroImage: {
    width: '100%',
    height: '100%',
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
  videoModeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  videoModeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  videoModeToggleBtnCorrect: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  videoModeToggleBtnWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  videoModeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  videoModeToggleTextActive: {
    color: '#FFFFFF',
  },
  videoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoBadgeCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  videoBadgeWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    color: '#991B1B',
    lineHeight: 20,
  },
  // Hướng dẫn từng bước
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F6FC',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  instructionNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  instructionNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64839D',
  },

  instructionText: {
    flex: 1,
    color: '#333333',
    lineHeight: 24,
  },

  // Tiêu đề cảnh báo
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },

  warningTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F4778A',
  },

  // Khung cảnh báo màu trắng
  warningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },

  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  warningDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F4778A',
    marginTop: 7,
    marginRight: 14,
  },

  warningItemText: {
    flex: 1,
    color: '#555B65',
    lineHeight: 23,
  },

  // Thẻ thiết bị và nơi tập
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  exerciseTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },

  equipmentTag: {
    backgroundColor: '#FFF1DF',
  },

  gymTag: {
    backgroundColor: '#E5F1FC',
  },

  homeTag: {
    backgroundColor: '#E7F6E5',
  },

  exerciseTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#536D83',
  },
});
