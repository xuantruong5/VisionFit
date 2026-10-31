import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

const MemberHome = ({ navigation }: any) => {
  const quickActions = [
    {
      id: 'plan',
      title: 'Kế Hoạch Tập Luyện',
      desc: 'Lộ trình cá nhân hóa, bài tập & tiến độ',
      icon: 'barbell-outline',
      color: '#0D7F8D',
      bg: '#EAF9FB',
      onPress: () => navigation.navigate('Kế Hoạch Tập'),
    },
    {
      id: 'pt',
      title: 'Huấn Luyện Viên (PT)',
      desc: 'Tìm kiếm & đặt lịch cùng HLV chuyên nghiệp',
      icon: 'people-outline',
      color: '#10B981',
      bg: '#ECFDF5',
      onPress: () => navigation.navigate('PTListScreen'),
    },
    {
      id: 'sotay',
      title: 'Sổ Tay Dinh Dưỡng & Bài Tập',
      desc: 'Tra cứu calo, thực đơn & thư viện động tác',
      icon: 'book-outline',
      color: '#FF9800',
      bg: '#FFF7ED',
      onPress: () => navigation.navigate('Sổ Tay'),
    },
    {
      id: 'feed',
      title: 'Cộng Đồng SportFeed',
      desc: 'Chia sẻ khoảnh khắc, giao lưu cùng gymer',
      icon: 'globe-outline',
      color: '#3B82F6',
      bg: '#EFF6FF',
      onPress: () => navigation.navigate('Cộng Đồng'),
    },
    {
      id: 'packages',
      title: 'Gói Tập Của Tôi',
      desc: 'Quản lý thời hạn thẻ & dịch vụ đã đăng ký',
      icon: 'card-outline',
      color: '#8B5CF6',
      bg: '#F5F3FF',
      onPress: () => navigation.navigate('MyPackagesScreen'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Hero Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.decorCircle} />
          <View style={styles.decorCircleSmall} />

          <View style={styles.headerRow}>
            {navigation?.canGoBack?.() ? (
              <TouchableOpacity
                style={styles.glassBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.white} />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>VisionFit Member</Text>
            <View style={styles.vipBadge}>
              <Ionicons name="diamond" size={12} color={COLORS.accentGold} />
              <Text style={styles.vipText}>VIP</Text>
            </View>
          </View>

          <View style={styles.heroTextCol}>
            <Text style={styles.heroGreeting}>Chào mừng trở lại! 👋</Text>
            <Text style={styles.heroTitle}>Sẵn sàng cho buổi tập hôm nay?</Text>
            <Text style={styles.heroSubtitle}>
              Kỷ luật là cầu nối giữa mục tiêu và thành tựu thể chất.
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Hub Navigation Cards */}
        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Khám phá dịch vụ</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{quickActions.length}</Text>
            </View>
          </View>
          <View style={styles.grid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.card}
                onPress={action.onPress}
                activeOpacity={0.85}
              >
                <View style={[styles.iconCircle, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <View style={styles.cardTextCol}>
                  <Text style={styles.cardTitle}>{action.title}</Text>
                  <Text style={styles.cardDesc}>{action.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
    borderRadius: 28,
    marginHorizontal: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -60,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: -40,
    left: -30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  vipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  heroTextCol: {
    gap: 6,
  },
  heroGreeting: {
    color: '#9EE7E5',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default MemberHome;
