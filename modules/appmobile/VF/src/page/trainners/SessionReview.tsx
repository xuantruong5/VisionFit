import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const DEFAULT_SESSION = {
  member: 'Nguyễn Văn An',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  type: 'Strength Training',
  date: 'Thứ Sáu, 30/10',
  time: '09:00',
  duration: '60 phút',
  calories: '520 kcal',
  rating: 5,
};

const RATING_LABELS = ['Chạm để chọn số sao', 'Cần cải thiện nhiều 😟', 'Chưa đạt mục tiêu 😐', 'Mức độ bình thường 🙂', 'Buổi tập tốt 😄', 'Xuất sắc & đúng giáo án 🔥'];
const DIFFICULTIES = [
  { label: 'Dễ', icon: 'leaf-outline' },
  { label: 'Vừa', icon: 'walk-outline' },
  { label: 'Khó', icon: 'bicycle-outline' },
  { label: 'Rất khó', icon: 'flame-outline' },
];
const QUICK_NOTES = ['Kỹ thuật tốt', 'Cần giữ form', 'Tăng tạ buổi sau', 'Thể lực tiến bộ', 'Cần khởi động kỹ'];

const SessionReview = ({ navigation, route }: any) => {
  const session = { ...DEFAULT_SESSION, ...route?.params?.session };
  const [rating, setRating] = useState(session.rating || 5);
  const [difficulty, setDifficulty] = useState('Vừa');
  const [notes, setNotes] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const info = [
    { icon: 'time', value: session.duration, label: 'Thời lượng' },
    { icon: 'flame', value: session.calories, label: 'Tiêu hao' },
    { icon: 'barbell', value: '8 bài', label: 'Bài tập' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* 1. HEADER GRADIENT */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circleLg} />

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Đánh giá buổi tập</Text>
            <View style={styles.navPlaceholder} />
          </View>

          <View style={styles.memberRow}>
            <Image source={{ uri: session.avatar }} style={styles.avatar} />
            <View style={styles.flex}>
              <Text style={styles.memberName}>{session.member}</Text>
              <Text style={styles.memberSub}>
                {session.type} • {session.date}, {session.time}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            {info.map((item) => (
              <View key={item.label} style={styles.infoBox}>
                <Ionicons name={item.icon} size={16} color="#9EE7E5" />
                <Text style={styles.infoValue}>{item.value}</Text>
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* 2. ĐÁNH GIÁ SAO NỔI */}
        <View style={styles.ratingCard}>
          <Text style={styles.question}>Học viên thể hiện thế nào hôm nay?</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} activeOpacity={0.7} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={38}
                  color={star <= rating ? COLORS.accentGold : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>{RATING_LABELS[rating]}</Text>
        </View>

        <View style={styles.body}>
          {/* 3. CƯỜNG ĐỘ */}
          <Text style={styles.sectionTitle}>Cường độ buổi tập</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((item) => {
              const active = difficulty === item.label;
              return (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.8}
                  onPress={() => setDifficulty(item.label)}
                  style={[styles.diffCard, active && styles.diffCardActive]}>
                  <Ionicons name={item.icon} size={22} color={active ? COLORS.white : COLORS.primary} />
                  <Text style={[styles.diffText, active && styles.diffTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 4. GHI CHÚ */}
          <Text style={styles.sectionTitle}>Ghi chú cho học viên</Text>
          <View style={styles.tagWrap}>
            {QUICK_NOTES.map((tag) => {
              const active = notes.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  activeOpacity={0.8}
                  onPress={() => setNotes(active ? notes.filter((n) => n !== tag) : [...notes, tag])}
                  style={[styles.tag, active && styles.tagActive]}>
                  <Ionicons name={active ? 'checkmark' : 'add'} size={14} color={active ? COLORS.white : COLORS.primary} />
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.commentBox}>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Ghi chú về thể lực, kỹ thuật hoặc bài tập cần chú ý buổi sau..."
              placeholderTextColor={COLORS.textLight}
              multiline
              maxLength={500}
              textAlignVertical="top"
              style={styles.commentInput}
            />
            <Text style={styles.counter}>{comment.length}/500</Text>
          </View>

          {/* 5. LƯU */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.goBack?.()}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
              <Ionicons name="paper-plane" size={18} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Gửi đánh giá cho học viên</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SessionReview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  body: {
    paddingHorizontal: 16,
  },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 52,
    borderRadius: 28,
    marginHorizontal: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  circleLg: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -80,
    right: -60,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  navPlaceholder: {
    width: 40,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  memberName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  memberSub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },

  // SAO
  ratingCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -32,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  question: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  ratingText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.accentGold,
  },

  // SECTION
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },

  // CƯỜNG ĐỘ
  diffRow: {
    flexDirection: 'row',
    gap: 8,
  },
  diffCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  diffCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  diffTextActive: {
    color: COLORS.white,
  },

  // GHI CHÚ
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceTeal,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
  },
  tagActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tagTextActive: {
    color: COLORS.white,
  },
  commentBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    ...SHADOWS.small,
  },
  commentInput: {
    minHeight: 100,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
  },

  // LƯU
  saveBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
