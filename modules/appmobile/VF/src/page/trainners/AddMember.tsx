import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const CANDIDATES = [
  { id: '1', name: 'Đỗ Thanh Tùng', phone: '0912 *** 456', goal: 'Tăng cơ', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Hoàng Mai Linh', phone: '0987 *** 123', goal: 'Giảm cân', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Bùi Quốc Huy', phone: '0903 *** 789', goal: 'Duy trì', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
];

const PACKAGES = [
  { id: '12', name: 'Gói PT 12 buổi', price: '5.400.000 ₫', note: '450k/buổi' },
  { id: '24', name: 'Gói PT 24 buổi', price: '10.080.000 ₫', note: '420k/buổi • Phổ biến' },
  { id: '36', name: 'Gói PT 36 buổi', price: '14.400.000 ₫', note: '400k/buổi • Tiết kiệm nhất' },
];

const AddMember = ({ navigation }: any) => {
  const [selected, setSelected] = useState('1');
  const [pkg, setPkg] = useState('24');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="close" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm học viên</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* TÌM KIẾM */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc số điện thoại..."
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        {/* CHỌN HỘI VIÊN */}
        <Text style={styles.sectionTitle}>Hội viên chưa có HLV</Text>
        <View style={styles.card}>
          {CANDIDATES.map((item, index) => {
            const active = selected === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelected(item.id)}
                style={[styles.memberRow, index < CANDIDATES.length - 1 && styles.rowBorder]}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.flex}>
                  <Text style={styles.memberName}>{item.name}</Text>
                  <Text style={styles.memberSub}>
                    {item.phone} • {item.goal}
                  </Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CHỌN GÓI PT */}
        <Text style={styles.sectionTitle}>Gói huấn luyện</Text>
        {PACKAGES.map((item) => {
          const active = pkg === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => setPkg(item.id)}
              style={[styles.pkgCard, active && styles.pkgCardActive]}>
              <View style={styles.flex}>
                <Text style={styles.pkgName}>{item.name}</Text>
                <Text style={styles.pkgNote}>{item.note}</Text>
              </View>
              <Text style={styles.pkgPrice}>{item.price}</Text>
            </TouchableOpacity>
          );
        })}

        {/* MỜI QUA MÃ */}
        <View style={styles.inviteCard}>
          <View style={styles.flex}>
            <Text style={styles.inviteTitle}>Hoặc gửi mã mời</Text>
            <Text style={styles.inviteSub}>Học viên nhập mã trong app để kết nối với bạn</Text>
          </View>
          <View style={styles.codePill}>
            <Text style={styles.codeText}>VF-NT28</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.saveText}>Thêm vào danh sách</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddMember;

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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    marginTop: 16,
    ...SOFT_SHADOW,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 14,
    ...SOFT_SHADOW,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  memberSub: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pkgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.transparent,
    ...SOFT_SHADOW,
  },
  pkgCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  pkgName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pkgNote: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pkgPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24,
    padding: 16,
    marginTop: 14,
  },
  inviteTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inviteSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  codePill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
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
