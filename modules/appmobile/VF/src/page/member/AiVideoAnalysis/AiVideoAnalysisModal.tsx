import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SHADOWS, PASTEL } from '../../../general/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface SampleVideo {
  id: string;
  title: string;
  exerciseName: string;
  score: number;
  rating: string;
  ratingColor: string;
  validReps: string;
  kneeAngle: string;
  spineAngle: string;
  symmetry: string;
  goodPoints: string[];
  improvements: string[];
}

const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    id: 'sample_squat_good',
    title: 'Squat Form Chuẩn Thi Đấu',
    exerciseName: 'Barbell Squat',
    score: 95,
    rating: 'Kỹ thuật xuất sắc',
    ratingColor: '#10B981',
    validReps: '10/10 Reps',
    kneeAngle: '91.2° (Chuẩn song song)',
    spineAngle: '175.4° (Lưng thẳng an toàn)',
    symmetry: '97% (Rất cân bằng)',
    goodPoints: [
      'Độ sâu mông khi hạ tạ rất chuẩn, đùi song song với mặt sàn.',
      'Trọng tâm dồn đều vào gót chân và giữa bàn chân, không bị nhấc gót.',
      'Cột sống luôn duy trì đường cong sinh lý an toàn, không bị cong lưng (butt wink).',
    ],
    improvements: [
      'Giữ nhịp hít sâu trước khi hạ mông và nén hơi chặt cơ bụng (Bracing) để ổn định tạ hơn.',
    ],
  },
  {
    id: 'sample_squat_error',
    title: 'Squat Lỗi Khép Gối & Cong Lưng',
    exerciseName: 'Barbell Squat',
    score: 68,
    rating: 'Cần sửa tư thế',
    ratingColor: '#F59E0B',
    validReps: '6/10 Reps',
    kneeAngle: '78.5° (Chưa đủ độ sâu)',
    spineAngle: '154.2° (Lưng bị gập cong)',
    symmetry: '82% (Lệch bên phải)',
    goodPoints: [
      'Tốc độ hạ tạ có kiểm soát, không bị rơi tự do.',
    ],
    improvements: [
      'Đầu gối có xu hướng khép vào trong (Knee Cave), hãy chủ động ép mở gối theo hướng mũi chân 30 độ.',
      'Lưng dưới bị cong khi hạ sâu, hãy siết chặt cơ bụng và giảm mức tạ 15% để chỉnh form an toàn.',
      'Trọng tâm dồn lệch sang chân phải, cần kích hoạt đều lực 2 chân.',
    ],
  },
  {
    id: 'sample_pushup_good',
    title: 'Hít Đất Nhịp Chuẩn 10 Reps',
    exerciseName: 'Push-Up',
    score: 92,
    rating: 'Kỹ thuật rất tốt',
    ratingColor: '#10B981',
    validReps: '10/10 Reps',
    kneeAngle: '180° (Chân thẳng)',
    spineAngle: '178.0° (Thân người thẳng)',
    symmetry: '96% (Cân đối)',
    goodPoints: [
      'Thân người tạo thành một đường thẳng hoàn hảo từ gáy tới gót chân.',
      'Khuỷu tay mở góc 45 độ so với thân người, bảo vệ khớp vai tối ưu.',
      'Hạ ngực chạm gần mặt sàn đạt biên độ tối đa (Full ROM).',
    ],
    improvements: [
      'Ở 2 rep cuối cùng nhịp thở hơi nhanh, hãy thở dứt khoát bằng miệng khi đẩy lên.',
    ],
  },
  {
    id: 'sample_deadlift',
    title: 'Deadlift Tạ Đòn Khóa Hông',
    exerciseName: 'Deadlift',
    score: 89,
    rating: 'Kỹ thuật tốt',
    ratingColor: '#10B981',
    validReps: '8/8 Reps',
    kneeAngle: '125.0°',
    spineAngle: '174.0° (Khóa lưng chuẩn)',
    symmetry: '94%',
    goodPoints: [
      'Chuyển động bản lề hông (Hip Hinge) rất rõ ràng, dùng lực cơ mông đùi sau.',
      'Thanh đòn di chuyển sát cẳng chân và đùi, tối ưu đường đi của tạ.',
    ],
    improvements: [
      'Lưu ý hạ tạ nhẹ nhàng có kiểm soát tránh thả rơi gây giật khớp vai.',
    ],
  },
];

export const AiVideoAnalysisModal: React.FC<Props> = ({ visible, onClose }) => {
  const [selectedVideo, setSelectedVideo] = useState<SampleVideo>(SAMPLE_VIDEOS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(true);

  // Chọn video từ thiết bị
  const handlePickVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const customResult: SampleVideo = {
          id: 'user_uploaded_' + Date.now(),
          title: file.fileName || 'Video tải từ thiết bị',
          exerciseName: 'Bài tập tùy chỉnh',
          score: 88,
          rating: 'Kỹ thuật tốt',
          ratingColor: '#10B981',
          validReps: '8/10 Reps',
          kneeAngle: '92.0° (Chuẩn)',
          spineAngle: '172.5° (An toàn)',
          symmetry: '95% (Cân bằng)',
          goodPoints: [
            'Hệ thống AI nhận diện thành công 17 điểm khớp cơ thể (Full Body Keypoints).',
            'Biên độ chuyển động (ROM) đạt yêu cầu, kiểm soát cơ bắp tốt.',
            'Tư thế đầu cổ và ánh nhìn tự nhiên, không bị gập cổ.',
          ],
          improvements: [
            'Duy trì nhịp độ (Tempo) ổn định hơn: 2 giây hạ và 1 giây đẩy lên.',
            'Siết chặt cơ core trong suốt quá trình thực hiện động tác.',
          ],
        };

        setSelectedVideo(customResult);
        triggerAnalysis();
      }
    } catch (e) {
      console.log('Lỗi chọn video:', e);
      Alert.alert('Thông báo', 'Không thể mở thư viện video.');
    }
  };

  const triggerAnalysis = () => {
    setIsAnalyzing(true);
    setHasAnalyzed(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiBadge}>
                <Ionicons name="videocam" size={17} color="#FFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Phân tích động tác AI</Text>
                <Text style={styles.headerSubtitle}>Computer Vision • Pose Estimation</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* ===================== MỤC 1: GỬI VIDEO ===================== */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionNumberCircle}>
                <Text style={styles.sectionNumberText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Gửi video</Text>
            </View>

            <View style={styles.uploadCard}>
              {/* NÚT TẢI VIDEO TỪ MÁY */}
              <TouchableOpacity style={styles.uploadMainBtn} onPress={handlePickVideo} activeOpacity={0.85}>
                <LinearGradient
                  colors={[COLORS.primary, '#0A3E4F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.uploadGradient}
                >
                  <View style={styles.uploadIconWrap}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.uploadMainTitle}>Tải video từ thiết bị</Text>
                    <Text style={styles.uploadMainSub}>Hỗ trợ MP4, MOV (Thời lượng 5s - 60s)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </TouchableOpacity>

              {/* CHỌN VIDEO MẪU ĐỂ GỬI NHANH */}
              <Text style={styles.samplePromptText}>Hoặc chọn video bài tập mẫu:</Text>
              <View style={styles.sampleGrid}>
                {SAMPLE_VIDEOS.map((s) => {
                  const isCurrent = selectedVideo?.id === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.sampleCard, isCurrent && styles.sampleCardActive]}
                      onPress={() => setSelectedVideo(s)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.sampleCardTop}>
                        <Ionicons
                          name={isCurrent ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={isCurrent ? COLORS.primary : COLORS.textMuted}
                        />
                        <View style={[styles.scoreBadge, { backgroundColor: s.ratingColor + '18' }]}>
                          <Text style={[styles.scoreBadgeText, { color: s.ratingColor }]}>
                            {s.score}đ
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.sampleTitle, isCurrent && styles.sampleTitleActive]} numberOfLines={2}>
                        {s.title}
                      </Text>
                      <Text style={styles.sampleExerciseName}>{s.exerciseName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* THÔNG TIN VIDEO ĐANG CHỌN & NÚT GỬI PHÂN TÍCH */}
              <View style={styles.selectedVideoBanner}>
                <Ionicons name="videocam" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedVideoLabel}>Video đang chọn:</Text>
                  <Text style={styles.selectedVideoTitle} numberOfLines={1}>
                    {selectedVideo.title}
                  </Text>
                </View>
                <View style={styles.readyBadge}>
                  <Text style={styles.readyBadgeText}>Sẵn sàng</Text>
                </View>
              </View>

              {/* NÚT BẤM GỬI PHÂN TÍCH */}
              <TouchableOpacity
                style={styles.submitAnalysisBtn}
                onPress={triggerAnalysis}
                disabled={isAnalyzing}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isAnalyzing ? ['#94A3B8', '#64748B'] : [COLORS.accentGold || '#E9A23B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.submitBtnText}>
                    {isAnalyzing ? 'ĐANG PHÂN TÍCH VIDEO...' : 'GỬI VIDEO VÀO PHÂN TÍCH'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ===================== MỤC 2: KẾT QUẢ PHÂN TÍCH ===================== */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <View style={[styles.sectionNumberCircle, { backgroundColor: '#10B981' }]}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Kết quả phân tích</Text>
            </View>

            {isAnalyzing ? (
              <View style={styles.analyzingCard}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.analyzingTitle}>AI Vision đang quét từng khung hình...</Text>
                <Text style={styles.analyzingSub}>
                  Đang bóc tách 17 khớp xương, đo góc chuyển động gối và độ thẳng cột sống.
                </Text>
              </View>
            ) : hasAnalyzed ? (
              <View style={styles.resultContainer}>
                {/* THẺ ĐIỂM SỐ KỸ THUẬT (FORM SCORE) */}
                <View style={styles.scoreHeroCard}>
                  <View style={styles.scoreCircleCol}>
                    <View style={[styles.scoreCircle, { borderColor: selectedVideo.ratingColor }]}>
                      <Text style={[styles.scoreBigNumber, { color: selectedVideo.ratingColor }]}>
                        {selectedVideo.score}
                      </Text>
                      <Text style={styles.scoreOutOf}>/100</Text>
                    </View>
                  </View>

                  <View style={styles.scoreInfoCol}>
                    <Text style={[styles.ratingTitle, { color: selectedVideo.ratingColor }]}>
                      {selectedVideo.rating}
                    </Text>
                    <View style={styles.quickStatRow}>
                      <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                      <Text style={styles.quickStatText}>
                        Số Reps chuẩn: <Text style={styles.boldText}>{selectedVideo.validReps}</Text>
                      </Text>
                    </View>
                    <View style={styles.quickStatRow}>
                      <Ionicons name="speedometer-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.quickStatText}>
                        Độ cân bằng: <Text style={styles.boldText}>{selectedVideo.symmetry}</Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* BẢNG CHỈ SỐ GÓC KHỚP */}
                <View style={styles.anglesGrid}>
                  <View style={styles.angleCard}>
                    <Text style={styles.angleLabel}>Góc khớp gối</Text>
                    <Text style={styles.angleVal}>{selectedVideo.kneeAngle}</Text>
                  </View>
                  <View style={styles.angleCard}>
                    <Text style={styles.angleLabel}>Góc cột sống (Lưng)</Text>
                    <Text style={styles.angleVal}>{selectedVideo.spineAngle}</Text>
                  </View>
                </View>

                {/* ĐIỂM LÀM TỐT */}
                <View style={styles.feedbackCard}>
                  <View style={styles.feedbackCardHeader}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={[styles.feedbackHeaderTitle, { color: '#065F46' }]}>
                      Điểm làm tốt (Correct Form)
                    </Text>
                  </View>
                  {selectedVideo.goodPoints.map((pt, idx) => (
                    <Text key={idx} style={styles.feedbackItem}>
                      • {pt}
                    </Text>
                  ))}
                </View>

                {/* LỖI CẦN CHỈNH SỬA */}
                <View style={[styles.feedbackCard, styles.improvementCard]}>
                  <View style={styles.feedbackCardHeader}>
                    <Ionicons name="alert-circle" size={18} color="#D97706" />
                    <Text style={[styles.feedbackHeaderTitle, { color: '#92400E' }]}>
                      Lỗi cần chỉnh sửa (AI Correction)
                    </Text>
                  </View>
                  {selectedVideo.improvements.map((pt, idx) => (
                    <Text key={idx} style={styles.feedbackItem}>
                      • {pt}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.card,
  },
  uploadMainBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  uploadIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadMainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  uploadMainSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  samplePromptText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  sampleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  sampleCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  sampleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FA',
  },
  sampleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sampleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 16,
    marginBottom: 4,
  },
  sampleTitleActive: {
    color: COLORS.primary,
  },
  sampleExerciseName: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  selectedVideoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  selectedVideoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  selectedVideoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  readyBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  submitAnalysisBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  analyzingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.card,
  },
  analyzingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 14,
  },
  analyzingSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resultContainer: {
    gap: 12,
  },
  scoreHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.card,
    gap: 16,
  },
  scoreCircleCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  scoreBigNumber: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  scoreOutOf: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  scoreInfoCol: {
    flex: 1,
    gap: 4,
  },
  ratingTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  quickStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStatText: {
    fontSize: 12,
    color: COLORS.textDark,
  },
  boldText: {
    fontWeight: '700',
  },
  anglesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  angleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  angleLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  angleVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  feedbackCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  improvementCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  feedbackItem: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 4,
  },
});

export default AiVideoAnalysisModal;
