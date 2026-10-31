import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const OVERVIEW = [
  { icon: 'barbell', value: '32', label: 'Ca dạy', color: COLORS.primary, bg: COLORS.surfaceTeal },
  { icon: 'checkmark-done', value: '11.3tr', label: 'Đã nhận', color: COLORS.accentGreen, bg: '#ECFDF5' },
  { icon: 'hourglass', value: '1.2tr', label: 'Chờ duyệt', color: COLORS.accentGold, bg: '#FFF7ED' },
];

// Chiều cao cột theo % so với tháng cao nhất
const CHART = [
  { month: 'T5', value: '8.2', percent: 55 },
  { month: 'T6', value: '9.6', percent: 65 },
  { month: 'T7', value: '8.9', percent: 60 },
  { month: 'T8', value: '11.4', percent: 82 },
  { month: 'T9', value: '10.8', percent: 76 },
  { month: 'T10', value: '12.5', percent: 100 },
];

const TRANSACTIONS = [
  { id: '1', date: '30/10', member: 'Nguyễn Văn An', type: 'Personal Training', amount: '+500.000 ₫', pending: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: '2', date: '29/10', member: 'Trần Minh Anh', type: 'Personal Training', amount: '+500.000 ₫', pending: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: '3', date: '28/10', member: 'Phạm Thu Hà', type: 'Giảm cân chuyên sâu', amount: '+400.000 ₫', pending: true, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { id: '4', date: '26/10', member: 'Võ Minh Khang', type: 'Personal Training', amount: '+500.000 ₫', pending: false, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' },
];

const Income = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. HEADER GRADIENT + TỔNG THU NHẬP */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circleLg} />
          <View style={styles.circleSm} />

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Thu nhập</Text>
            <TouchableOpacity style={styles.glassBtn} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthPill}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.white} />
            <Text style={styles.monthPillText}>Tháng 10/2026</Text>
            <Ionicons name="chevron-down" size={13} color={COLORS.white} />
          </View>
          <Text style={styles.amount}>12.500.000 ₫</Text>
          <View style={styles.growthBadge}>
            <Ionicons name="trending-up" size={14} color="#6EE7B7" />
            <Text style={styles.growthText}>+15.7% so với tháng trước</Text>
          </View>
        </LinearGradient>

        {/* 2. TỔNG QUAN NỔI */}
        <View style={styles.overviewCard}>
          {OVERVIEW.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.overviewItem}>
                <View style={[styles.overviewIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={styles.overviewValue}>{item.value}</Text>
                <Text style={styles.subText}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.body}>
          {/* 3. BIỂU ĐỒ */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Doanh thu 6 tháng</Text>
            <Text style={styles.unitText}>Đơn vị: triệu ₫</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.chart}>
              {CHART.map((item, index) => {
                const current = index === CHART.length - 1;
                return (
                  <View key={item.month} style={styles.barCol}>
                    {current ? (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>{item.value}</Text>
                      </View>
                    ) : (
                      <Text style={styles.barValue}>{item.value}</Text>
                    )}
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={current ? ['#22B8C8', COLORS.primaryDark] : [COLORS.borderFocus, COLORS.borderFocus]}
                        style={[styles.barFill, { height: `${item.percent}%` }]}
                      />
                    </View>
                    <Text style={[styles.barMonth, current && styles.barMonthCurrent]}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 4. GIAO DỊCH */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </View>
          {TRANSACTIONS.map((item) => (
            <View key={item.id} style={styles.txCard}>
              <Image source={{ uri: item.avatar }} style={styles.txAvatar} />
              <View style={styles.flex}>
                <Text style={styles.txTitle}>{item.member}</Text>
                <Text style={styles.subText}>
                  {item.type} • {item.date}
                </Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, item.pending && { color: COLORS.accentGold }]}>{item.amount}</Text>
                <View style={[styles.txBadge, item.pending && styles.txBadgePending]}>
                  <Text style={[styles.txBadgeText, item.pending && { color: COLORS.accentGold }]}>
                    {item.pending ? 'Chờ duyệt' : 'Đã nhận'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Income;

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
  subText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 60,
    borderRadius: 28,
    marginHorizontal: 12,
    marginTop: 6,
    alignItems: 'center',
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
  circleSm: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -30,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
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
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 22,
  },
  monthPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  amount: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 10,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  growthText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6EE7B7',
  },

  // TỔNG QUAN
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -36,
    borderRadius: 20,
    paddingVertical: 14,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  overviewValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.borderLight,
  },

  // SECTION & CARD
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  unitText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
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
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  tooltip: {
    backgroundColor: COLORS.textPrimary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    marginBottom: 6,
  },
  tooltipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.white,
  },
  barTrack: {
    width: 26,
    height: 130,
    borderRadius: 9,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 9,
  },
  barMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 8,
  },
  barMonthCurrent: {
    fontWeight: '800',
    color: COLORS.primary,
  },

  // GIAO DỊCH
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  txAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accentGreen,
  },
  txBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  txBadgePending: {
    backgroundColor: '#FFF7ED',
  },
  txBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.accentGreen,
  },
});
