import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiFitlife from '../../general/api';

import AppHeader from '../../components/AppHeader';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

// Định nghĩa các tùy chọn
const ACTIVITY_LEVELS = [
  { id: 1.2, title: 'Ít vận động', desc: 'Làm việc văn phòng, ít đi lại' },
  { id: 1.375, title: 'Vận động nhẹ', desc: 'Tập nhẹ 1-3 ngày/tuần' },
  { id: 1.55, title: 'Vận động vừa', desc: 'Tập 3-5 ngày/tuần' },
  { id: 1.725, title: 'Vận động nhiều', desc: 'Tập nặng 6-7 ngày/tuần' },
];

const GOALS = [
  { id: 'giam_can', title: 'Giảm mỡ & Cân nặng', icon: 'flame-outline' },
  { id: 'tang_co', title: 'Tăng cơ bắp (Hypertrophy)', icon: 'barbell-outline' },
  { id: 'giu_dang', title: 'Duy trì vóc dáng & Sức khỏe', icon: 'heart-outline' },
  { id: 'tang_suc_ben', title: 'Cải thiện sức bền & Thể lực', icon: 'bicycle-outline' },
];

const WORKOUT_LOCATIONS = [
  { id: 'phong_gym', title: 'Phòng Gym đầy đủ tạ', icon: 'business-outline' },
  { id: 'tai_nha', title: 'Tại nhà (Dụng cụ đơn giản/Bodyweight)', icon: 'home-outline' },
];

const DIET_TYPES = [
  'Bình thường (Ăn đa dạng)',
  'Eat Clean',
  'Giảm tinh bột (Low-carb/Keto)',
  'Ăn chay (Vegetarian)',
  'Thuần chay (Vegan)',
];

const ALLERGIES_LIST = [
  'Hải sản',
  'Sữa bò / Lactose',
  'Đậu phộng / Hạt',
  'Trứng gà',
  'Gluten',
  'Đồ cay nóng',
];

const BUDGET_LEVELS = [
  { id: 'tiet_kiem', title: 'Tiết kiệm', desc: '< 50k / ngày (Sinh viên, bình dân)' },
  { id: 'vua_phai', title: 'Vừa phải', desc: '50k - 100k / ngày (Đầy đủ đạm, rau củ)' },
  { id: 'thoai_mai', title: 'Thoải mái', desc: '> 100k / ngày (Thực phẩm cao cấp, whey...)' },
];

const AiConsultationScreen = ({ navigation, route }: any) => {
  // 1. Chỉ số cơ thể & Vận động (gộp cả Giới tính + Tuổi + Chiều cao + Cân nặng)
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState(1.375);

  // 2. Mục tiêu & Địa điểm
  const [goal, setGoal] = useState('tang_co');
  const [location, setLocation] = useState('phong_gym');
  const [daysPerWeek, setDaysPerWeek] = useState('4');

  // 3. Chế độ ăn & Dị ứng
  const [dietType, setDietType] = useState('Eat Clean');
  const [allergies, setAllergies] = useState<string[]>([]);

  // 4. Ngân sách & Ghi chú tự do
  const [budget, setBudget] = useState('vua_phai');
  const [specialNotes, setSpecialNotes] = useState('');

  // Trạng thái modal mô phỏng AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Tự động kiểm tra và điền thông tin người dùng nếu đã có sẵn trong API/AsyncStorage
  useEffect(() => {
    loadExistingUserInfo();
  }, []);

  const loadExistingUserInfo = async () => {
    try {
      // 1. Kiểm tra thông tin từ params truyền sang (nếu có)
      if (route?.params) {
        if (route.params.gender) {
          setGender(route.params.gender === 'Nữ' || route.params.gender === 1 ? 'female' : 'male');
        }
        if (route.params.chieu_cao_cm) setHeight(String(route.params.chieu_cao_cm));
        if (route.params.can_nang_kg) setWeight(String(route.params.can_nang_kg));
        if (route.params.tuoi) setAge(String(route.params.tuoi));
      }

      // 2. Kiểm tra nếu có lưu user trong AsyncStorage
      const savedUserStr = await AsyncStorage.getItem('user_info');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u.gioi_tinh !== undefined) setGender(Number(u.gioi_tinh) === 1 ? 'female' : 'male');
        if (u.chieu_cao_cm) setHeight(String(u.chieu_cao_cm));
        if (u.can_nang_kg) setWeight(String(u.can_nang_kg));
        if (u.ngay_sinh) {
          const birthYear = new Date(u.ngay_sinh).getFullYear();
          const curYear = new Date().getFullYear();
          if (!isNaN(birthYear) && curYear > birthYear) {
            setAge(String(curYear - birthYear));
          }
        }
      }

      // 3. Thử gọi API lấy profile (nếu đã login token) - bọc try catch an toàn không lo lỗi
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const res = await apiFitlife.get('/client/profile');
          const data = res.data?.data || res.data?.client;
          if (data) {
            if (data.gioi_tinh !== undefined) setGender(Number(data.gioi_tinh) === 1 ? 'female' : 'male');
            if (data.chieu_cao_cm) setHeight(String(data.chieu_cao_cm));
            if (data.can_nang_kg) setWeight(String(data.can_nang_kg));
            if (data.ngay_sinh) {
              const birthYear = new Date(data.ngay_sinh).getFullYear();
              const curYear = new Date().getFullYear();
              if (!isNaN(birthYear) && curYear > birthYear) {
                setAge(String(curYear - birthYear));
              }
            }
          }
        } catch {
          // Bỏ qua nếu endpoint chưa có hoặc chưa đăng nhập, để trống cho user tự nhập
        }
      }
    } catch (err) {
      console.log('Lỗi đọc thông tin cơ thể trước đó (bỏ qua):', err);
    }
  };

  const toggleAllergy = (item: string) => {
    if (allergies.includes(item)) {
      setAllergies(allergies.filter(a => a !== item));
    } else {
      setAllergies([...allergies, item]);
    }
  };

  const handleStartAnalysis = () => {
    if (!age.trim() || !height.trim() || !weight.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Tuổi, Chiều cao và Cân nặng để AI phân tích!');
      return;
    }

    const payload = {
      gender: gender === 'male' ? 0 : 1, // 0: Nam, 1: Nữ
      genderLabel: gender === 'male' ? 'Nam' : 'Nữ',
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      activityLevel,
      goal,
      location,
      daysPerWeek: Number(daysPerWeek),
      dietType,
      allergies,
      budget,
      specialNotes,
    };

    console.log('--- DỮ LIỆU ĐÃ GOM ĐỦ CHUẨN BỊ GỬI AI ---', payload);

    // Mở popup mô phỏng AI phân tích (frontend-only)
    setIsAnalyzing(true);
    setTimeout(() => {
      // Công thức tính BMR & TDEE giả lập để minh họa
      const w = Number(weight);
      const h = Number(height);
      const a = Number(age);
      const bmr = gender === 'male' 
        ? 10 * w + 6.25 * h - 5 * a + 5 
        : 10 * w + 6.25 * h - 5 * a - 161;
      const tdee = Math.round(bmr * activityLevel);

      let targetKcal = tdee;
      if (goal === 'giam_can') targetKcal = tdee - 400;
      else if (goal === 'tang_co') targetKcal = tdee + 300;

      const protein = Math.round(w * 2);
      const fat = Math.round((targetKcal * 0.25) / 9);
      const carb = Math.round((targetKcal - (protein * 4 + fat * 9)) / 4);

      setAnalysisResult({
        tdee,
        targetKcal,
        protein,
        fat,
        carb,
        suggestion: goal === 'tang_co'
          ? 'Lộ trình gợi ý: Tập trung các bài compound tạ tự do 4 buổi/tuần, bổ sung ức gà/trứng và duy trì dư thừa calo nhẹ.'
          : 'Lộ trình gợi ý: Kết hợp kháng lực và cardio ngắt quãng, ăn thâm hụt calo kiểm soát tinh bột.',
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      {/* HEADER */}
      <AppHeader
        title="Hồ Sơ & Yêu Cầu AI"
        onBack={() => (navigation?.canGoBack() ? navigation.goBack() : null)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNER GIỚI THIỆU */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiBanner}
        >
          <View style={styles.bannerCircleLg} />
          <View style={styles.bannerCircleSm} />
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={16} color={COLORS.white} />
            <Text style={styles.aiBadgeText}>VisionFit AI Advisor</Text>
          </View>
          <Text style={styles.aiBannerTitle}>Thiết lập hồ sơ thể lực & dinh dưỡng</Text>
          <Text style={styles.aiBannerSubtitle}>
            Tất cả thông tin cơ thể, mục tiêu và thói quen ăn uống được gom tại đây để AI tính toán TDEE và đề xuất lộ trình tối ưu nhất.
          </Text>
        </LinearGradient>

        {/* PHẦN 1: THÔNG TIN CƠ THỂ (GỘP GIỚI TÍNH + TUỔI + CHIỀU CAO + CÂN NẶNG) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconTile, styles.iconTileTeal]}>
              <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>1. Thông tin cơ thể & Sinh hoạt</Text>
          </View>

          {/* Chọn giới tính */}
          <Text style={styles.fieldLabel}>Giới tính sinh học</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
              onPress={() => setGender('male')}
            >
              <Ionicons
                name="male"
                size={18}
                color={gender === 'male' ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                Nam
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
              onPress={() => setGender('female')}
            >
              <Ionicons
                name="female"
                size={18}
                color={gender === 'female' ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                Nữ
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3 Chỉ số */}
          <View style={styles.metricsRow}>
            <View style={styles.metricInputBox}>
              <Text style={styles.metricLabel}>Tuổi</Text>
              <TextInput
                style={styles.metricInput}
                keyboardType="numeric"
                placeholder="-- (năm)"
                placeholderTextColor={COLORS.textLight}
                value={age}
                onChangeText={setAge}
                maxLength={3}
              />
            </View>
            <View style={styles.metricInputBox}>
              <Text style={styles.metricLabel}>Chiều cao (cm)</Text>
              <TextInput
                style={styles.metricInput}
                keyboardType="numeric"
                placeholder="-- (cm)"
                placeholderTextColor={COLORS.textLight}
                value={height}
                onChangeText={setHeight}
                maxLength={3}
              />
            </View>
            <View style={styles.metricInputBox}>
              <Text style={styles.metricLabel}>Cân nặng (kg)</Text>
              <TextInput
                style={styles.metricInput}
                keyboardType="numeric"
                placeholder="-- (kg)"
                placeholderTextColor={COLORS.textLight}
                value={weight}
                onChangeText={setWeight}
                maxLength={3}
              />
            </View>
          </View>

          {/* Cường độ vận động */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Mức độ vận động hàng ngày</Text>
          {ACTIVITY_LEVELS.map(act => (
            <TouchableOpacity
              key={act.id}
              style={[
                styles.selectOptionCard,
                activityLevel === act.id && styles.selectOptionActive,
              ]}
              onPress={() => setActivityLevel(act.id)}
            >
              <Ionicons
                name={activityLevel === act.id ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={activityLevel === act.id ? COLORS.primary : COLORS.textLight}
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.optionTitle, activityLevel === act.id && styles.optionTitleActive]}>
                  {act.title}
                </Text>
                <Text style={styles.optionDesc}>{act.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* PHẦN 2: MỤC TIÊU & ĐỊA ĐIỂM */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconTile, styles.iconTileOrange]}>
              <Ionicons name="flag-outline" size={20} color={COLORS.accentOrange} />
            </View>
            <Text style={styles.sectionTitle}>2. Mục tiêu & Địa điểm tập</Text>
          </View>

          <Text style={styles.fieldLabel}>Mục tiêu chính của bạn</Text>
          <View style={styles.gridContainer}>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.gridCard, goal === g.id && styles.gridCardActive]}
                onPress={() => setGoal(g.id)}
              >
                <Ionicons
                  name={g.icon as any}
                  size={24}
                  color={goal === g.id ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[styles.gridCardText, goal === g.id && styles.gridCardTextActive]}>
                  {g.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Nơi bạn tập luyện thường xuyên</Text>
          {WORKOUT_LOCATIONS.map(loc => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.selectOptionCard, location === loc.id && styles.selectOptionActive]}
              onPress={() => setLocation(loc.id)}
            >
              <Ionicons
                name={loc.icon as any}
                size={20}
                color={location === loc.id ? COLORS.primary : COLORS.textLight}
              />
              <Text style={[styles.optionTitle, { marginLeft: 10, flex: 1 }, location === loc.id && styles.optionTitleActive]}>
                {loc.title}
              </Text>
              {location === loc.id && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* PHẦN 3: SỞ THÍCH ĂN UỐNG & DỊ ỨNG */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconTile, styles.iconTileGreen]}>
              <Ionicons name="restaurant-outline" size={20} color={COLORS.accentGreen} />
            </View>
            <Text style={styles.sectionTitle}>3. Chế độ dinh dưỡng & Dị ứng</Text>
          </View>

          <Text style={styles.fieldLabel}>Chế độ ăn ưa thích</Text>
          <View style={styles.tagWrap}>
            {DIET_TYPES.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.tagItem, dietType === d && styles.tagItemActive]}
                onPress={() => setDietType(d)}
              >
                <Text style={[styles.tagText, dietType === d && styles.tagTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Thực phẩm dị ứng / Kiêng cử (chọn nhiều)</Text>
          <View style={styles.tagWrap}>
            {ALLERGIES_LIST.map(al => {
              const selected = allergies.includes(al);
              return (
                <TouchableOpacity
                  key={al}
                  style={[styles.tagItem, selected && styles.tagItemDanger]}
                  onPress={() => toggleAllergy(al)}
                >
                  <Ionicons
                    name={selected ? 'close-circle' : 'add-outline'}
                    size={15}
                    color={selected ? COLORS.accentRed : COLORS.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.tagText, selected && styles.tagTextDanger]}>{al}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PHẦN 4: NGÂN SÁCH & YÊU CẦU ĐẶC BIỆT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconTile, styles.iconTileGold]}>
              <Ionicons name="cash-outline" size={20} color={COLORS.accentGold} />
            </View>
            <Text style={styles.sectionTitle}>4. Ngân sách & Ghi chú tự do</Text>
          </View>

          <Text style={styles.fieldLabel}>Mức chi phí ăn uống dự kiến</Text>
          {BUDGET_LEVELS.map(bg => (
            <TouchableOpacity
              key={bg.id}
              style={[styles.selectOptionCard, budget === bg.id && styles.selectOptionActive]}
              onPress={() => setBudget(bg.id)}
            >
              <Ionicons
                name={budget === bg.id ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={budget === bg.id ? COLORS.primary : COLORS.textLight}
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.optionTitle, budget === bg.id && styles.optionTitleActive]}>
                  {bg.title}
                </Text>
                <Text style={styles.optionDesc}>{bg.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
            Yêu cầu thêm cho AI (Chấn thương, bệnh lý, thời gian rảnh...)
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ví dụ: Tôi bị đau khớp gối nhẹ, không ăn được sữa bò, thời gian tập chỉ rảnh buổi tối sau 8h..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            value={specialNotes}
            onChangeText={setSpecialNotes}
          />
        </View>

        {/* NÚT SUBMIT / TIẾP TỤC */}
        <TouchableOpacity
          style={styles.submitBtnWrap}
          activeOpacity={0.88}
          onPress={handleStartAnalysis}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            <Ionicons name="sparkles" size={20} color={COLORS.white} style={styles.submitIcon} />
            <Text style={styles.submitBtnText}>Gửi cho AI Phân Tích & Đề Xuất</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL MÔ PHỎNG QUÁ TRÌNH PHÂN TÍCH VÀ KẾT QUẢ AI */}
      <Modal visible={isAnalyzing || analysisResult !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isAnalyzing ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.modalLoadingTitle}>VisionFit AI Đang Phân Tích...</Text>
                <Text style={styles.modalLoadingSub}>
                  Đang tính toán BMR, TDEE, phân bổ lượng Macro và lọc các bài tập phù hợp với thể trạng của bạn...
                </Text>
              </View>
            ) : (
              <View>
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.successIconBox}
                  >
                    <Ionicons name="checkmark-done" size={26} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={styles.modalTitle}>Kết Quả AI Đề Xuất Sơ Bộ</Text>
                </View>

                {/* Khối Macro */}
                <View style={styles.calcBox}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Năng lượng tiêu hao (TDEE):</Text>
                    <Text style={styles.calcValue}>{analysisResult?.tdee} kcal</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Calo mục tiêu đề xuất:</Text>
                    <Text style={[styles.calcValue, { color: COLORS.primary, fontWeight: 'bold' }]}>
                      {analysisResult?.targetKcal} kcal/ngày
                    </Text>
                  </View>
                  <View style={styles.macroSplitRow}>
                    <View style={styles.macroBadge}>
                      <Text style={styles.macroBadgeTitle}>Protein</Text>
                      <Text style={styles.macroBadgeVal}>{analysisResult?.protein}g</Text>
                    </View>
                    <View style={styles.macroBadge}>
                      <Text style={styles.macroBadgeTitle}>Carb</Text>
                      <Text style={styles.macroBadgeVal}>{analysisResult?.carb}g</Text>
                    </View>
                    <View style={styles.macroBadge}>
                      <Text style={styles.macroBadgeTitle}>Fat</Text>
                      <Text style={styles.macroBadgeVal}>{analysisResult?.fat}g</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.resultSuggestionTitle}>Gợi ý từ AI:</Text>
                <Text style={styles.resultSuggestionText}>{analysisResult?.suggestion}</Text>

                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setAnalysisResult(null)}
                >
                  <Text style={styles.closeModalBtnText}>Hoàn tất xem thử</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AiConsultationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  aiBanner: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  bannerCircleLg: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -50,
  },
  bannerCircleSm: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -20,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 13,
    marginBottom: 12,
  },
  aiBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  aiBannerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
    lineHeight: 25,
  },
  aiBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 12,
  },
  sectionIconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileTeal: {
    backgroundColor: COLORS.surfaceTeal,
  },
  iconTileOrange: {
    backgroundColor: '#FFF1EC',
  },
  iconTileGreen: {
    backgroundColor: '#ECFDF5',
  },
  iconTileGold: {
    backgroundColor: '#FFF7ED',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  genderBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  genderBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  genderTextActive: {
    color: COLORS.white,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricInputBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  metricInput: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    paddingVertical: 2,
  },
  selectOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  selectOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceTeal,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  optionTitleActive: {
    color: COLORS.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  gridCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceTeal,
  },
  gridCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  gridCardTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceTeal,
  },
  tagItemDanger: {
    borderColor: '#F8B4B9',
    backgroundColor: '#FEF2F2',
  },
  tagText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tagTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tagTextDanger: {
    color: COLORS.accentRed,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  submitBtnWrap: {
    borderRadius: 16,
    marginTop: 4,
    ...SHADOWS.glow,
  },
  submitBtn: {
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 31, 38, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    elevation: 10,
  },
  modalLoadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalLoadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 14,
  },
  modalLoadingSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  calcBox: {
    backgroundColor: COLORS.surfaceTeal,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  macroSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  macroBadge: {
    alignItems: 'center',
    flex: 1,
  },
  macroBadgeTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  macroBadgeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  resultSuggestionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  resultSuggestionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 18,
  },
  closeModalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
});
