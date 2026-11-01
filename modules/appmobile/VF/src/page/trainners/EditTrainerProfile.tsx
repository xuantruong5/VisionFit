import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80';

const FIELDS = [
  { label: 'Họ và tên', value: 'Nguyễn Trainer', icon: 'person-outline' },
  { label: 'Email', value: 'trainer.nguyen@visionfit.vn', icon: 'mail-outline' },
  { label: 'Số điện thoại', value: '0901 234 567', icon: 'call-outline' },
  { label: 'Cơ sở làm việc', value: 'VisionFit Center - Quận 1', icon: 'location-outline' },
];

const ALL_SPECIALTIES = ['Strength Training', 'Cardio', 'Giảm mỡ', 'Phục hồi chức năng', 'Yoga', 'Boxing', 'Dinh dưỡng'];

const CERTIFICATES = [
  { title: 'NASM Certified Personal Trainer', org: 'NASM • 2021' },
  { title: 'First Aid / CPR / AED', org: 'Red Cross • 2023' },
];

const EditTrainerProfile = ({ navigation }: any) => {
  const [specialties, setSpecialties] = useState(['Strength Training', 'Cardio', 'Giảm mỡ']);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="close" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* ẢNH ĐẠI DIỆN */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: AVATAR }} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.avatarHint}>Chạm để đổi ảnh đại diện</Text>

        {/* THÔNG TIN CÁ NHÂN */}
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        {FIELDS.map((item) => (
          <View key={item.label} style={styles.inputGroup}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.inputRow}>
              <Ionicons name={item.icon} size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} defaultValue={item.value} placeholderTextColor={COLORS.textLight} />
            </View>
          </View>
        ))}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giới thiệu bản thân</Text>
          <TextInput
            style={styles.bio}
            multiline
            textAlignVertical="top"
            defaultValue="5 năm kinh nghiệm huấn luyện sức mạnh và giảm mỡ. Tập trung vào kỹ thuật chuẩn và lộ trình bền vững."
          />
        </View>

        {/* CHUYÊN MÔN */}
        <Text style={styles.sectionTitle}>Chuyên môn</Text>
        <View style={styles.chipWrap}>
          {ALL_SPECIALTIES.map((item) => {
            const active = specialties.includes(item);
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                onPress={() => setSpecialties(active ? specialties.filter((s) => s !== item) : [...specialties, item])}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CHỨNG CHỈ */}
        <Text style={styles.sectionTitle}>Chứng chỉ</Text>
        <View style={styles.card}>
          {CERTIFICATES.map((item) => (
            <View key={item.title} style={[styles.certRow, styles.rowBorder]}>
              <View style={styles.flex}>
                <Text style={styles.certTitle}>{item.title}</Text>
                <Text style={styles.certOrg}>{item.org}</Text>
              </View>
              <Ionicons name="trash-outline" size={18} color={COLORS.textLight} />
            </View>
          ))}
          <TouchableOpacity style={styles.addCert} activeOpacity={0.7}>
            <Ionicons name="add" size={18} color={COLORS.primaryDark} />
            <Text style={styles.addCertText}>Thêm chứng chỉ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.saveText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EditTrainerProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SOFT_SHADOW,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSpace: {
    width: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: 18,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    textAlign: 'center',
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'serif',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
    marginLeft: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    ...SOFT_SHADOW,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: COLORS.textPrimary,
  },
  bio: {
    minHeight: 96,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    ...SOFT_SHADOW,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    ...SOFT_SHADOW,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 16,
    ...SOFT_SHADOW,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  certTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  certOrg: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addCert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  addCertText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
