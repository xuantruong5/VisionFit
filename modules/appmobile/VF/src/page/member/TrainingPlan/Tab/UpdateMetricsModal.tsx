import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../../../general/theme';
import apiFitlife from '../../../../general/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpdated?: (data: any) => void;
  currentHeight?: number;
  currentWeight?: number;
  currentActivity?: number;
}

const ACTIVITY_OPTIONS = [
  { id: 1, title: 'Ít vận động', desc: 'Làm việc văn phòng, ít đi lại' },
  { id: 2, title: 'Vận động nhẹ', desc: 'Tập nhẹ 1-3 ngày/tuần' },
  { id: 3, title: 'Vận động vừa', desc: 'Tập 3-5 ngày/tuần' },
  { id: 4, title: 'Vận động nhiều', desc: 'Tập nặng 6-7 ngày/tuần' },
];

export const UpdateMetricsModal: React.FC<Props> = ({
  visible,
  onClose,
  onUpdated,
  currentHeight = 170,
  currentWeight = 65,
  currentActivity = 2,
}) => {
  const [height, setHeight] = useState<string>(String(currentHeight || '170'));
  const [weight, setWeight] = useState<string>(String(currentWeight || '65'));
  const [activity, setActivity] = useState<number>(currentActivity || 2);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any>(null);

  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setHeight(String(currentHeight || '170'));
      setWeight(String(currentWeight || '65'));
      setActivity(currentActivity || 2);
      setResultData(null);
    }
  }, [visible, currentHeight, currentWeight, currentActivity]);

  // Tính nháp BMI nhanh theo thời gian thực
  const hNum = parseFloat(height);
  const wNum = parseFloat(weight);
  const calculatedBmi =
    hNum > 0 && wNum > 0
      ? (wNum / Math.pow(hNum / 100, 2)).toFixed(1)
      : '—';

  // Ước tính BMR & TDEE tham khảo nhanh
  const estimatedBmr =
    hNum > 0 && wNum > 0
      ? Math.round(10 * wNum + 6.25 * hNum - 5 * 25 + 5)
      : 0;

  const activityMultipliers: Record<number, number> = {
    1: 1.2,
    2: 1.375,
    3: 1.55,
    4: 1.725,
  };
  const estimatedTdee =
    estimatedBmr > 0
      ? Math.round(estimatedBmr * (activityMultipliers[activity] || 1.375))
      : 0;

  const getBmiCategory = (bmiVal: string | number) => {
    const val = typeof bmiVal === 'number' ? bmiVal : parseFloat(bmiVal);
    if (isNaN(val) || val <= 0) return { text: 'Chưa xác định', color: COLORS.textMuted };
    if (val < 18.5) return { text: 'Thiếu cân', color: '#F59E0B' };
    if (val < 24.9) return { text: 'Cân đối chuẩn', color: '#10B981' };
    if (val < 29.9) return { text: 'Thừa cân nhẹ', color: '#F97316' };
    return { text: 'Béo phì', color: '#EF4444' };
  };

  const handleSave = async () => {
    if (!height.trim() || isNaN(hNum) || hNum < 50 || hNum > 250) {
      Alert.alert('Lỗi nhập liệu', 'Chiều cao phải từ 50cm đến 250cm.');
      return;
    }
    if (!weight.trim() || isNaN(wNum) || wNum < 10 || wNum > 300) {
      Alert.alert('Lỗi nhập liệu', 'Cân nặng phải từ 10kg đến 300kg.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        chieu_cao_cm: hNum,
        can_nang_kg: wNum,
        muc_tieu_hoat_dong: activity,
      };

      const res = await apiFitlife.post('/client/luu-ho-so-ban-dau', payload);

      if (res.data?.success) {
        setResultData(res.data.data);
        if (onUpdated) {
          onUpdated(res.data.data);
        }
        // Tự động lướt xuống mượt mà để xem ngay toàn bộ kết quả phân tích
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      } else {
        Alert.alert('Thông báo', res.data?.message || 'Không thể lưu chỉ số.');
      }
    } catch (err: any) {
      console.log('Lỗi cập nhật chỉ số:', err.response?.data || err.message);
      Alert.alert(
        'Lỗi cập nhật',
        err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chỉ số thể trạng.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatText = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(' • ');
    if (typeof val === 'object') {
      return Object.entries(val)
        .map(([k, items]) => `${k}: ${Array.isArray(items) ? items.join(', ') : items}`)
        .join(' | ');
    }
    return String(val);
  };

  const resultBmi = resultData?.chi_so_dinh_duong?.bmi || calculatedBmi;
  const resultBmiCat = getBmiCategory(resultBmi);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="sparkles" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Cập nhật thể trạng 2 ngày</Text>
                <Text style={styles.headerSubtitle}>Tối ưu hóa calo & kế hoạch bài tập AI</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* THÔNG BÁO CHU KỲ 2 NGÀY */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoBannerText}>
                Cập nhật định kỳ sau 2 ngày giúp AI tính chính xác mức thâm hụt calo và tải trọng tập luyện lý tưởng.
              </Text>
            </View>

            {/* FORM NHẬP CHIỀU CAO & CÂN NẶNG */}
            <View style={styles.inputRow}>
              {/* CHIỀU CAO */}
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Chiều cao</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="170"
                    placeholderTextColor={COLORS.textMuted}
                    maxLength={5}
                  />
                  <Text style={styles.inputUnit}>cm</Text>
                </View>
              </View>

              {/* CÂN NẶNG */}
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Cân nặng</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="65"
                    placeholderTextColor={COLORS.textMuted}
                    maxLength={5}
                  />
                  <Text style={styles.inputUnit}>kg</Text>
                </View>
              </View>
            </View>

            {/* MỨC ĐỘ VẬN ĐỘNG HÀNG NGÀY */}
            <Text style={styles.sectionTitle}>Mức độ vận động hàng ngày</Text>
            <View style={styles.activityList}>
              {ACTIVITY_OPTIONS.map((item) => {
                const isSelected = activity === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.activityCard,
                      isSelected && styles.activityCardSelected,
                    ]}
                    onPress={() => setActivity(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.activityRadio}>
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <View style={styles.activityInfo}>
                      <Text
                        style={[
                          styles.activityTitle,
                          isSelected && styles.activityTitleSelected,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.activityDesc}>{item.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* NÚT CẬP NHẬT & PHÂN TÍCH AI */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <View style={styles.submittingRow}>
                    <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>AI đang phân tích thể trạng & dinh dưỡng...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Cập nhật & Phân tích AI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* KHỐI KẾT QUẢ HIỂN THỊ NGAY SAU BUTTON & LƯỚT XUỐNG XEM LUÔN */}
            {resultData && (
              <View style={styles.resultSection}>
                {/* TIÊU ĐỀ KẾT QUẢ THÀNH CÔNG */}
                <View style={styles.resultHeaderCard}>
                  <View style={styles.successIconBadge}>
                    <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultHeaderTitle}>Đã tính toán chỉ số & khuyến cáo AI</Text>
                    <Text style={styles.resultHeaderSub}>
                      Đồng bộ vào kế hoạch tập và chế độ dinh dưỡng thành công
                    </Text>
                  </View>
                </View>

                {/* BẢNG 4 CHỈ SỐ VÀNG: BMI, BMR, TDEE, CALO MỤC TIÊU */}
                <View style={styles.metricsGrid}>
                  {/* BMI */}
                  <View style={styles.gridCard}>
                    <View style={styles.gridCardTop}>
                      <Ionicons name="body-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.gridCardLabel}>Chỉ số BMI</Text>
                    </View>
                    <Text style={styles.gridCardVal}>{resultBmi}</Text>
                    <View style={[styles.gridBadge, { backgroundColor: resultBmiCat.color + '20' }]}>
                      <Text style={[styles.gridBadgeText, { color: resultBmiCat.color }]}>
                        {resultBmiCat.text}
                      </Text>
                    </View>
                  </View>

                  {/* BMR */}
                  <View style={styles.gridCard}>
                    <View style={styles.gridCardTop}>
                      <Ionicons name="flame-outline" size={16} color="#3B82F6" />
                      <Text style={styles.gridCardLabel}>BMR Cơ Bản</Text>
                    </View>
                    <Text style={styles.gridCardVal}>
                      {resultData.chi_so_dinh_duong?.bmr || estimatedBmr}
                    </Text>
                    <Text style={styles.gridUnit}>kcal/ngày (nghỉ ngơi)</Text>
                  </View>

                  {/* TDEE */}
                  <View style={styles.gridCard}>
                    <View style={styles.gridCardTop}>
                      <Ionicons name="fitness-outline" size={16} color="#F59E0B" />
                      <Text style={styles.gridCardLabel}>TDEE Tiêu Hao</Text>
                    </View>
                    <Text style={styles.gridCardVal}>
                      {resultData.chi_so_dinh_duong?.tdee || estimatedTdee}
                    </Text>
                    <Text style={styles.gridUnit}>kcal/ngày (vận động)</Text>
                  </View>

                  {/* CALO MỤC TIÊU */}
                  <View style={styles.gridCard}>
                    <View style={styles.gridCardTop}>
                      <Ionicons name="sparkles" size={16} color="#10B981" />
                      <Text style={styles.gridCardLabel}>Calo Mục Tiêu</Text>
                    </View>
                    <Text style={[styles.gridCardVal, { color: '#10B981' }]}>
                      {resultData.chi_so_dinh_duong?.kcal_muc_tieu || '—'}
                    </Text>
                    <Text style={styles.gridUnit}>kcal nạp khuyến nghị</Text>
                  </View>
                </View>

                {/* THANH PHÂN BỔ MACROS (PROTEIN, CARB, FAT) */}
                {(resultData.chi_so_dinh_duong?.protein || resultData.chi_so_dinh_duong?.carb) && (
                  <View style={styles.macroCard}>
                    <Text style={styles.macroTitle}>Phân bổ dinh dưỡng đa lượng khuyến nghị:</Text>
                    <View style={styles.macroRow}>
                      <View style={[styles.macroPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <Text style={[styles.macroPillLabel, { color: '#1D4ED8' }]}>Đạm (Protein)</Text>
                        <Text style={[styles.macroPillVal, { color: '#1E40AF' }]}>
                          {resultData.chi_so_dinh_duong?.protein}g
                        </Text>
                      </View>
                      <View style={[styles.macroPill, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                        <Text style={[styles.macroPillLabel, { color: '#B45309' }]}>Tinh bột (Carb)</Text>
                        <Text style={[styles.macroPillVal, { color: '#92400E' }]}>
                          {resultData.chi_so_dinh_duong?.carb}g
                        </Text>
                      </View>
                      <View style={[styles.macroPill, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <Text style={[styles.macroPillLabel, { color: '#B91C1C' }]}>Chất béo (Fat)</Text>
                        <Text style={[styles.macroPillVal, { color: '#991B1B' }]}>
                          {resultData.chi_so_dinh_duong?.fat}g
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* BẢNG KHUYẾN CÁO TỪ AI (RECOMMENDATION SERVICE) */}
                {resultData.khuyen_cao && (
                  <View style={styles.aiRecommendationCard}>
                    <View style={styles.aiCardHeader}>
                      <Ionicons name="bulb-outline" size={20} color="#D97706" />
                      <Text style={styles.aiCardTitle}>Khuyến cáo & Định hướng AI VisionFit</Text>
                    </View>

                    {resultData.khuyen_cao.danh_gia_the_trang && (
                      <View style={styles.recItem}>
                        <Ionicons name="body-outline" size={16} color="#6B7280" style={styles.recIcon} />
                        <Text style={styles.aiCardText}>
                          <Text style={styles.boldText}>Đánh giá thể trạng: </Text>
                          {formatText(resultData.khuyen_cao.danh_gia_the_trang)}
                        </Text>
                      </View>
                    )}

                    {resultData.khuyen_cao.dinh_huong_dinh_duong && (
                      <View style={styles.recItem}>
                        <Ionicons name="restaurant-outline" size={16} color="#6B7280" style={styles.recIcon} />
                        <Text style={styles.aiCardText}>
                          <Text style={styles.boldText}>Định hướng dinh dưỡng: </Text>
                          {formatText(resultData.khuyen_cao.dinh_huong_dinh_duong)}
                        </Text>
                      </View>
                    )}

                    {resultData.khuyen_cao.goi_y_thuc_pham && (
                      <View style={styles.recItemCol}>
                        <View style={styles.recItemHeader}>
                          <Ionicons name="nutrition-outline" size={16} color="#D97706" style={styles.recIcon} />
                          <Text style={styles.boldText}>Gợi ý thực phẩm theo nhóm:</Text>
                        </View>
                        {typeof resultData.khuyen_cao.goi_y_thuc_pham === 'object' && !Array.isArray(resultData.khuyen_cao.goi_y_thuc_pham) ? (
                          <View style={styles.foodGroupList}>
                            {Object.entries(resultData.khuyen_cao.goi_y_thuc_pham).map(([cat, items]: [string, any]) => (
                              <Text key={cat} style={styles.foodGroupText}>
                                • <Text style={styles.foodCatLabel}>{cat}: </Text>
                                {Array.isArray(items) ? items.join(', ') : String(items)}
                              </Text>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.aiCardText}>
                            {formatText(resultData.khuyen_cao.goi_y_thuc_pham)}
                          </Text>
                        )}
                      </View>
                    )}

                    {resultData.khuyen_cao.dinh_huong_tap_luyen && (
                      <View style={styles.recItem}>
                        <Ionicons name="barbell-outline" size={16} color="#6B7280" style={styles.recIcon} />
                        <Text style={styles.aiCardText}>
                          <Text style={styles.boldText}>Kế hoạch tập luyện: </Text>
                          {formatText(resultData.khuyen_cao.dinh_huong_tap_luyen)}
                        </Text>
                      </View>
                    )}

                    {resultData.khuyen_cao.viec_can_thuc_hien && (
                      <View style={styles.recItemCol}>
                        <View style={styles.recItemHeader}>
                          <Ionicons name="checkbox-outline" size={16} color="#10B981" style={styles.recIcon} />
                          <Text style={styles.boldText}>Việc cần thực hiện:</Text>
                        </View>
                        {Array.isArray(resultData.khuyen_cao.viec_can_thuc_hien) ? (
                          <View style={styles.actionList}>
                            {resultData.khuyen_cao.viec_can_thuc_hien.map((act: string, idx: number) => (
                              <Text key={idx} style={styles.actionItemText}>
                                {idx + 1}. {act}
                              </Text>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.aiCardText}>
                            {formatText(resultData.khuyen_cao.viec_can_thuc_hien)}
                          </Text>
                        )}
                      </View>
                    )}

                    {resultData.khuyen_cao.chi_so_can_theo_doi && (
                      <View style={styles.recItemCol}>
                        <View style={styles.recItemHeader}>
                          <Ionicons name="analytics-outline" size={16} color="#3B82F6" style={styles.recIcon} />
                          <Text style={styles.boldText}>Chỉ số cần theo dõi:</Text>
                        </View>
                        <Text style={styles.aiCardText}>
                          {Array.isArray(resultData.khuyen_cao.chi_so_can_theo_doi)
                            ? resultData.khuyen_cao.chi_so_can_theo_doi.join(' • ')
                            : formatText(resultData.khuyen_cao.chi_so_can_theo_doi)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* NÚT HOÀN TẤT & ĐÓNG */}
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneBtnText}>Hoàn tất & Đóng</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    padding: 0,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  activityList: {
    gap: 10,
    marginBottom: 18,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  activityCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FB',
  },
  activityRadio: {
    marginRight: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  activityTitleSelected: {
    color: COLORS.primary,
  },
  activityDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  // NÚT SUBMIT
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // KHỐI KẾT QUẢ PHÂN TÍCH SAU NÚT
  resultSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  resultHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  successIconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  resultHeaderSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  // LƯỚI 4 CHỈ SỐ VÀNG
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  gridCardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  gridCardVal: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  gridUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  gridBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // MACROS PILLS
  macroCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  macroTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  macroPillVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  // KHUYẾN CÁO AI
  aiRecommendationCard: {
    backgroundColor: '#FEFDF8',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#B45309',
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recItemCol: {
    marginBottom: 10,
  },
  recItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  foodGroupList: {
    paddingLeft: 12,
    gap: 3,
  },
  foodGroupText: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  foodCatLabel: {
    fontWeight: '700',
    color: '#1F2937',
  },
  actionList: {
    paddingLeft: 12,
    gap: 3,
  },
  actionItemText: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  recIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  aiCardText: {
    flex: 1,
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textDark,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default UpdateMetricsModal;
