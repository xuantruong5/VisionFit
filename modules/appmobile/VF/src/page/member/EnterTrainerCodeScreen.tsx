import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, StatusBar, Alert, ActivityIndicator, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

const MOCK_TRAINERS: Record<string, any> = {
  'PT-HOANGNAM-88': {
    code: 'PT-HOANGNAM-88',
    name: 'Nguyễn Hoàng Nam',
    title: 'Senior Personal Trainer',
    experience: '5 năm kinh nghiệm',
    specialties: ['Tăng cơ', 'Sức mạnh', 'Giảm mỡ'],
    rating: '4.9',
    reviews: 128,
    gym: 'VisionFit Center - Quận 1, TP.HCM',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    bio: 'Chứng chỉ NASM CPT quốc tế. Chuyên xây dựng giáo trình cá nhân hóa và chỉnh form biomechanics.',
  },
  'PT-MINHANH-99': {
    code: 'PT-MINHANH-99',
    name: 'Trần Minh Anh',
    title: 'Fitness & Cardio Coach',
    experience: '4 năm kinh nghiệm',
    specialties: ['Cardio', 'Giảm mỡ nhanh', 'Dinh dưỡng'],
    rating: '4.9',
    reviews: 95,
    gym: 'VisionFit Elite - Quận 3, TP.HCM',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Chuyên gia phục hồi thể lực và cải thiện vóc dáng nữ giới với chế độ ăn Eat Clean kết hợp kháng lực.',
  },
};

const EnterTrainerCodeScreen = ({ navigation }: any) => {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [trainerFound, setTrainerFound] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleCheckCode = () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert('Chưa nhập mã', 'Vui lòng nhập mã giới thiệu của Huấn luyện viên.');
      return;
    }
    setChecking(true);
    setHasSearched(false);

    setTimeout(() => {
      setChecking(false);
      setHasSearched(true);
      if (MOCK_TRAINERS[cleanCode]) {
        setTrainerFound(MOCK_TRAINERS[cleanCode]);
      } else {
        setTrainerFound(null);
      }
    }, 600);
  };

  const handleSelectTrainer = () => {
    if (!trainerFound) return;
    Alert.alert(
      'Liên kết thành công!',
      `Bạn đã chọn HLV ${trainerFound.name} làm người đồng hành. Lịch tập của bạn có thể được tự động đồng bộ theo HLV.`,
      [
        {
          text: 'Về trang chủ',
          onPress: () => navigation.navigate('MemberHome' as never),
        },
        {
          text: 'Cấu hình lịch tập ngay',
          onPress: () => navigation.navigate('ChangeWorkoutScheduleScreen' as never),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhập Mã Huấn Luyện Viên</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* HERO BANNER */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="barcode-outline" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.bannerTitle}>Kết Nối Cùng HLV Của Bạn</Text>
          <Text style={styles.bannerSub}>
            Nhập mã định danh riêng do Huấn luyện viên cung cấp để được xếp lịch tập riêng và theo dõi tiến độ sát sao.
          </Text>
        </LinearGradient>

        {/* INPUT BOX */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Mã giới thiệu Huấn Luyện Viên</Text>
          <View style={styles.inputRow}>
            <Ionicons name="key-outline" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.textInput}
              placeholder="VD: PT-HOANGNAM-88"
              placeholderTextColor={COLORS.textLight}
              value={code}
              onChangeText={(text) => {
                setCode(text.toUpperCase());
                setHasSearched(false);
              }}
              autoCapitalize="characters"
            />
            {code.length > 0 && (
              <TouchableOpacity onPress={() => { setCode(''); setHasSearched(false); setTrainerFound(null); }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* GỢI Ý MÃ THỬ NGHIỆM */}
          <View style={styles.sampleCodesRow}>
            <Text style={styles.sampleHint}>Gợi ý mã thử:</Text>
            <TouchableOpacity onPress={() => { setCode('PT-HOANGNAM-88'); setHasSearched(false); }}>
              <Text style={styles.sampleCodeTag}>PT-HOANGNAM-88</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setCode('PT-MINHANH-99'); setHasSearched(false); }}>
              <Text style={styles.sampleCodeTag}>PT-MINHANH-99</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.checkBtn} onPress={handleCheckCode} activeOpacity={0.85} disabled={checking}>
            {checking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={17} color="#FFFFFF" />
                <Text style={styles.checkBtnText}>KIỂM TRA MÃ HLV</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* KẾT QUẢ TÌM KIẾM */}
        {hasSearched && !trainerFound && (
          <View style={styles.notFoundBox}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.accentRed} />
            <Text style={styles.notFoundTitle}>Không tìm thấy Huấn Luyện Viên</Text>
            <Text style={styles.notFoundText}>
              Mã "{code}" không tồn tại hoặc HLV đã tạm ngưng nhận học viên. Vui lòng kiểm tra lại với HLV của bạn.
            </Text>
          </View>
        )}

        {trainerFound && (
          <View style={styles.trainerCard}>
            <View style={styles.trainerHeader}>
              <Image source={{ uri: trainerFound.avatar }} style={styles.trainerAvatar} />
              <View style={styles.trainerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.trainerName}>{trainerFound.name}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.trainerTitle}>{trainerFound.title}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{trainerFound.rating}</Text>
                  <Text style={styles.ratingCount}>({trainerFound.reviews} đánh giá)</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.expText}>{trainerFound.experience}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.trainerBio}>{trainerFound.bio}</Text>

            <View style={styles.specialtiesWrap}>
              {trainerFound.specialties.map((item: string) => (
                <View key={item} style={styles.specialtyPill}>
                  <Text style={styles.specialtyText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.gymRow}>
              <Ionicons name="location-outline" size={15} color={COLORS.textMuted} />
              <Text style={styles.gymText}>{trainerFound.gym}</Text>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSelectTrainer} activeOpacity={0.85}>
              <Ionicons name="person-add" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>XÁC NHẬN CHỌN HLV NÀY</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EnterTrainerCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSpace: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  banner: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.glow,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  bannerSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 19,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceTeal,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textPrimary,
  },
  sampleCodesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 16,
  },
  sampleHint: {
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  sampleCodeTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.surfaceTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  checkBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  notFoundBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  notFoundTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accentRed,
    marginTop: 8,
    marginBottom: 4,
  },
  notFoundText: {
    fontSize: 12.5,
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 18,
  },
  trainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    ...SHADOWS.card,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  trainerHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  trainerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
  },
  trainerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  trainerTitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ratingCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dotSeparator: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  expText: {
    fontSize: 11.5,
    color: COLORS.primary,
    fontWeight: '700',
  },
  trainerBio: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  specialtyPill: {
    backgroundColor: COLORS.surfaceTeal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  specialtyText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.primary,
  },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  gymText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    gap: 8,
    ...SHADOWS.glow,
  },
  confirmBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
});

