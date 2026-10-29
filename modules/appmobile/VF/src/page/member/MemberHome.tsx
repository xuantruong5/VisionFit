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
import AppHeader from '../../components/AppHeader';
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
      <AppHeader
        title="VisionFit Member"
        showBack={navigation?.canGoBack?.()}
        onBack={() => navigation.goBack()}
        badgeText="VIP"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroGreeting}>Chào mừng trở lại! 👋</Text>
            <Text style={styles.heroTitle}>Sẵn sàng cho buổi tập hôm nay?</Text>
            <Text style={styles.heroSubtitle}>
              Kỷ luật là cầu nối giữa mục tiêu và thành tựu thể chất.
            </Text>
          </View>
        </View>

        {/* Quick Hub Navigation Cards */}
        <Text style={styles.sectionTitle}>Khám phá dịch vụ</Text>
        <View style={styles.grid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.card}
              onPress={action.onPress}
              activeOpacity={0.85}
            >
              <View style={[styles.iconCircle, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>{action.title}</Text>
                <Text style={styles.cardDesc}>{action.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  heroBanner: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    ...SHADOWS.card,
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
    marginLeft: 4,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});

export default MemberHome;
