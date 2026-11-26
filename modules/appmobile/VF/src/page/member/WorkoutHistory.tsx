import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const SUMMARY = [
  { value: '32', label: 'Buổi tập' },
  { value: '48h', label: 'Thời gian' },
  { value: '14.2k', label: 'Kcal đốt' },
];

// Số buổi tập 7 ngày gần nhất, chiều cao cột theo %
const WEEK = [
  { day: 'T2', minutes: 60, percent: 100 },
  { day: 'T3', minutes: 0, percent: 0 },
  { day: 'T4', minutes: 45, percent: 75 },
  { day: 'T5', minutes: 30, percent: 50 },
  { day: 'T6', minutes: 0, percent: 0 },
  { day: 'T7', minutes: 55, percent: 92 },
  { day: 'CN', minutes: 20, percent: 33 },
];

const AI_INSIGHTS = [
  { icon: 'trending-up', title: 'Sức bền tăng 12%', desc: 'Thời gian giữ nhịp tim vùng 3 dài hơn so với tuần trước.', color: COLORS.accentGreen, bg: '#ECFDF5' },
  { icon: 'alert-circle', title: 'Cần chú ý form Squat', desc: 'Góc lưng dưới lệch ~8° ở các rep cuối. Hãy gồng cơ lõi chặt hơn.', color: COLORS.accentOrange, bg: '#FFF1EC' },
];

const SESSIONS = [
  { date: '30', month: 'Th10', title: 'Thân trên & Ngực', duration: '60 phút', kcal: '520 kcal', score: 92 },
  { date: '28', month: 'Th10', title: 'Chân & Mông', duration: '55 phút', kcal: '610 kcal', score: 85 },
  { date: '27', month: 'Th10', title: 'Cardio HIIT', duration: '30 phút', kcal: '380 kcal', score: 78 },
  { date: '25', month: 'Th10', title: 'Bụng & Cơ lõi', duration: '45 phút', kcal: '340 kcal', score: 88 },
];

const WorkoutHistory = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="Lịch sử buổi tập"
        onBack={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation?.navigate?.('MemberTabs'))}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. TỔNG KẾT */}
        <View style={styles.summaryCard}>
          {SUMMARY.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.subText}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* 2. BIỂU ĐỒ TUẦN */}
        <Text style={styles.sectionTitle}>Tuần này</Text>
        <View style={styles.card}>
          <View style={styles.chart}>
            {WEEK.map((item) => (
              <View key={item.day} style={styles.barCol}>
                <Text style={styles.barValue}>{item.minutes ? `${item.minutes}'` : ''}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${item.percent}%` }]} />
                </View>
                <Text style={styles.barDay}>{item.day}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartNote}>5 buổi • 210 phút • đạt 84% mục tiêu tuần</Text>
        </View>

        {/* 3. PHÂN TÍCH AI */}
        <Text style={styles.sectionTitle}>Phân tích AI</Text>
        {AI_INSIGHTS.map((item) => (
          <View key={item.title} style={[styles.insightCard, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={20} color={item.color} />
            <View style={styles.flex}>
              <Text style={styles.insightTitle}>{item.title}</Text>
              <Text style={styles.insightDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* 4. CÁC BUỔI GẦN ĐÂY */}
        <Text style={styles.sectionTitle}>Buổi tập gần đây</Text>
        {SESSIONS.map((item) => (
          <View key={item.date} style={styles.sessionCard}>
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>{item.date}</Text>
              <Text style={styles.monthText}>{item.month}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.sessionTitle}>{item.title}</Text>
              <Text style={styles.subText}>
                {item.duration} • {item.kcal}
              </Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreValue}>{item.score}</Text>
              <Text style={styles.scoreLabel}>điểm AI</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    ...SHADOWS.card,
  },

  // TỔNG KẾT
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 18,
    ...SHADOWS.card,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.borderLight,
  },

  // BIỂU ĐỒ
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
    height: 14,
  },
  barTrack: {
    width: 22,
    height: 110,
    borderRadius: 11,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
    backgroundColor: COLORS.primary,
  },
  barDay: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  chartNote: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 14,
  },

  // PHÂN TÍCH AI
  insightCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  insightTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  insightDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  // BUỔI TẬP
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    ...SHADOWS.card,
  },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  monthText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  sessionTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scoreBadge: {
    alignItems: 'center',
    minWidth: 52,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentGreen,
  },
  scoreLabel: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
});
