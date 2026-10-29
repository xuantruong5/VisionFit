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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiFitlife from '../../general/api';

import AppHeader from '../../components/AppHeader';
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
        <View style={styles.aiBanner}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            <Text style={styles.aiBadgeText}>VisionFit AI Advisor</Text>
          </View>
          <Text style={styles.aiBannerTitle}>Thiết lập hồ sơ thể lực & dinh dưỡng</Text>
          <Text style={styles.aiBannerSubtitle}>
            Tất cả thông tin cơ thể, mục tiêu và thói quen ăn uống được gom tại đây để AI tính toán TDEE và đề xuất lộ trình tối ưu nhất.
          </Text>
        </View>

        {/* PHẦN 1: THÔNG TIN CƠ THỂ (GỘP GIỚI TÍNH + TUỔI + CHIỀU CAO + CÂN NẶNG) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-circle-outline" size={20} color="#0D7F8D" />
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
                color={gender === 'male' ? '#FFFFFF' : '#0D7F8D'}
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
                color={gender === 'female' ? '#FFFFFF' : '#0D7F8D'}
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
                placeholderTextColor="#A5C4C8"
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
                placeholderTextColor="#A5C4C8"
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
                placeholderTextColor="#A5C4C8"
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
                color={activityLevel === act.id ? '#0D7F8D' : '#8FA4A7'}
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
            <Ionicons name="flag-outline" size={20} color="#0D7F8D" />
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
                  color={goal === g.id ? '#0D7F8D' : '#71949A'}
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
                color={location === loc.id ? '#0D7F8D' : '#8FA4A7'}
              />
              <Text style={[styles.optionTitle, { marginLeft: 10, flex: 1 }, location === loc.id && styles.optionTitleActive]}>
                {loc.title}
              </Text>
              {location === loc.id && (
                <Ionicons name="checkmark-circle" size={20} color="#0D7F8D" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* PHẦN 3: SỞ THÍCH ĂN UỐNG & DỊ ỨNG */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="restaurant-outline" size={20} color="#0D7F8D" />
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
                    color={selected ? '#E63946' : '#557A80'}
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
            <Ionicons name="cash-outline" size={20} color="#0D7F8D" />
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
                color={budget === bg.id ? '#0D7F8D' : '#8FA4A7'}
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
            placeholderTextColor="#9EB3B6"
            multiline
            numberOfLines={4}
            value={specialNotes}
            onChangeText={setSpecialNotes}
          />
        </View>

        {/* NÚT SUBMIT / TIẾP TỤC */}
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.88}
          onPress={handleStartAnalysis}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.submitBtnText}>Gửi cho AI Phân Tích & Đề Xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL MÔ PHỎNG QUÁ TRÌNH PHÂN TÍCH VÀ KẾT QUẢ AI */}
      <Modal visible={isAnalyzing || analysisResult !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isAnalyzing ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="large" color="#0D7F8D" />
                <Text style={styles.modalLoadingTitle}>VisionFit AI Đang Phân Tích...</Text>
                <Text style={styles.modalLoadingSub}>
                  Đang tính toán BMR, TDEE, phân bổ lượng Macro và lọc các bài tập phù hợp với thể trạng của bạn...
                </Text>
              </View>
            ) : (
              <View>
                <View style={styles.modalHeader}>
                  <View style={styles.successIconBox}>
                    <Ionicons name="checkmark-done" size={26} color="#0D7F8D" />
                  </View>
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
                    <Text style={[styles.calcValue, { color: '#0D7F8D', fontWeight: 'bold' }]}>
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
    backgroundColor: '#F3F9FA',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EEF0',
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
    color: '#0F3035',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  aiBanner: {
    backgroundColor: '#0D7F8D',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  aiBannerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  aiBannerSubtitle: {
    fontSize: 13,
    color: '#D8F3F7',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E3EFF0',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F6F7',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D7F8D',
    marginLeft: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#344E52',
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  genderBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C6E3E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFDFD',
  },
  genderBtnActive: {
    backgroundColor: '#0D7F8D',
    borderColor: '#0D7F8D',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7F8D',
    marginLeft: 6,
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricInputBox: {
    flex: 1,
    backgroundColor: '#F5FAFA',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D8EBEC',
  },
  metricLabel: {
    fontSize: 11,
    color: '#65868B',
    marginBottom: 2,
  },
  metricInput: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F3035',
    paddingVertical: 2,
  },
  selectOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0EDED',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  selectOptionActive: {
    borderColor: '#0D7F8D',
    backgroundColor: '#F0F9FA',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A464A',
  },
  optionTitleActive: {
    color: '#0D7F8D',
  },
  optionDesc: {
    fontSize: 12,
    color: '#71949A',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0EDED',
    backgroundColor: '#FAFDFD',
    alignItems: 'center',
  },
  gridCardActive: {
    borderColor: '#0D7F8D',
    backgroundColor: '#EBF7F9',
  },
  gridCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B6B70',
    textAlign: 'center',
    marginTop: 6,
  },
  gridCardTextActive: {
    color: '#0D7F8D',
    fontWeight: '700',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0E5E7',
    backgroundColor: '#FAFDFD',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagItemActive: {
    borderColor: '#0D7F8D',
    backgroundColor: '#E7F6F8',
  },
  tagItemDanger: {
    borderColor: '#F8B4B9',
    backgroundColor: '#FDECEE',
  },
  tagText: {
    fontSize: 13,
    color: '#416368',
  },
  tagTextActive: {
    color: '#0D7F8D',
    fontWeight: '600',
  },
  tagTextDanger: {
    color: '#E63946',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#F5FAFA',
    borderWidth: 1,
    borderColor: '#D8EBEC',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#13353A',
    textAlignVertical: 'top',
    minHeight: 85,
  },
  submitBtn: {
    backgroundColor: '#0D7F8D',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#0D7F8D',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 20, 25, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    elevation: 10,
  },
  modalLoadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalLoadingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D7F8D',
    marginTop: 14,
  },
  modalLoadingSub: {
    fontSize: 12,
    color: '#65868B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E7F6F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F3035',
  },
  calcBox: {
    backgroundColor: '#F4FAFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCEEEE',
    marginBottom: 14,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 13,
    color: '#4B6B70',
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#13353A',
  },
  macroSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2EFF0',
  },
  macroBadge: {
    alignItems: 'center',
    flex: 1,
  },
  macroBadgeTitle: {
    fontSize: 11,
    color: '#6C8C91',
  },
  macroBadgeVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D7F8D',
    marginTop: 2,
  },
  resultSuggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#28464A',
    marginBottom: 4,
  },
  resultSuggestionText: {
    fontSize: 13,
    color: '#496B70',
    lineHeight: 19,
    marginBottom: 18,
  },
  closeModalBtn: {
    backgroundColor: '#0D7F8D',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
