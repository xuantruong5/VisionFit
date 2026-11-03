import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';

// Dữ liệu mẫu (Frontend Mock Data) - sẽ thay bằng API sau
const MEMBERS = [
  { id: '1', name: 'Nguyễn Văn An', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Trần Minh Anh', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Lê Hoàng Nam', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Phạm Thu Hà', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
];

const DAYS = [
  { day: 'CN', date: 1 },
  { day: 'T2', date: 2 },
  { day: 'T3', date: 3 },
  { day: 'T4', date: 4 },
  { day: 'T5', date: 5 },
  { day: 'T6', date: 6 },
  { day: 'T7', date: 7 },
];

const TIMES = ['06:00', '07:30', '09:00', '14:30', '16:00', '18:00', '19:30'];
const DURATIONS = ['30 phút', '45 phút', '60 phút', '90 phút'];
const TYPES = ['Tăng cơ', 'Giảm mỡ', 'Cardio', 'Full Body', 'Phục hồi'];
const PLACES = ['Phòng Gym A', 'Phòng Gym B', 'Khu Cardio', 'Online'];

const CreateSchedule = ({ navigation }: any) => {
  const [member, setMember] = useState('1');
  const [date, setDate] = useState(1);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('60 phút');
  const [type, setType] = useState('Tăng cơ');
  const [place, setPlace] = useState('Phòng Gym A');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="close" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo ca dạy mới</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 1. HỌC VIÊN */}
        <Text style={styles.sectionTitle}>Học viên</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
          {MEMBERS.map((item) => {
            const active = member === item.id;
            return (
              <TouchableOpacity key={item.id} activeOpacity={0.8} onPress={() => setMember(item.id)} style={styles.memberItem}>
                <View style={[styles.avatarRing, active && styles.avatarRingActive]}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                </View>
                <Text style={[styles.memberName, active && styles.memberNameActive]} numberOfLines={1}>
                  {item.name.split(' ').slice(-1)[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. NGÀY */}
        <Text style={styles.sectionTitle}>Ngày · Tháng 11</Text>
        <View style={styles.dayStrip}>
          {DAYS.map((item) => {
            const active = date === item.date;
            return (
              <TouchableOpacity key={item.date} activeOpacity={0.8} onPress={() => setDate(item.date)} style={styles.dayItem}>
                <Text style={styles.dayLabel}>{item.day}</Text>
                <View style={[styles.dayCircle, active && styles.dayCircleActive]}>
                  <Text style={[styles.dayText, active && styles.textWhite]}>{item.date}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. GIỜ & THỜI LƯỢNG */}
        <Text style={styles.sectionTitle}>Giờ bắt đầu</Text>
        <View style={styles.chipWrap}>
          {TIMES.map((item) => (
            <TouchableOpacity key={item} activeOpacity={0.8} onPress={() => setTime(item)} style={[styles.chip, time === item && styles.chipActive]}>
              <Text style={[styles.chipText, time === item && styles.textWhite]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Thời lượng</Text>
        <View style={styles.segment}>
          {DURATIONS.map((item) => (
            <TouchableOpacity key={item} activeOpacity={0.8} onPress={() => setDuration(item)} style={[styles.segmentItem, duration === item && styles.chipActive]}>
              <Text style={[styles.chipText, duration === item && styles.textWhite]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. LOẠI BUỔI TẬP & NƠI TẬP */}
        <Text style={styles.sectionTitle}>Loại buổi tập</Text>
        <View style={styles.chipWrap}>
          {TYPES.map((item) => (
            <TouchableOpacity key={item} activeOpacity={0.8} onPress={() => setType(item)} style={[styles.chip, type === item && styles.chipActive]}>
              <Text style={[styles.chipText, type === item && styles.textWhite]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Nơi tập</Text>
        <View style={styles.chipWrap}>
          {PLACES.map((item) => (
            <TouchableOpacity key={item} activeOpacity={0.8} onPress={() => setPlace(item)} style={[styles.chip, place === item && styles.chipActive]}>
              <Text style={[styles.chipText, place === item && styles.textWhite]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. GHI CHÚ */}
        <Text style={styles.sectionTitle}>Ghi chú</Text>
        <TextInput
          style={styles.note}
          placeholder="Nội dung buổi tập, lưu ý cho học viên..."
          placeholderTextColor={COLORS.textLight}
          multiline
          textAlignVertical="top"
        />

        {/* 6. TÓM TẮT */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Tóm tắt</Text>
          <Text style={styles.summaryText}>
            {MEMBERS.find((m) => m.id === member)?.name} · {type}
          </Text>
          <Text style={styles.summarySub}>
            Ngày {date}/11 lúc {time} · {duration} · {place}
          </Text>
        </View>
      </ScrollView>

      {/* NÚT LƯU */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.saveText}>Lưu ca dạy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateSchedule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  textWhite: {
    color: COLORS.white,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSpace: {
    width: 44,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 22,
    marginBottom: 12,
  },

  // HỌC VIÊN
  memberRow: {
    gap: 14,
  },
  memberItem: {
    alignItems: 'center',
    width: 64,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.transparent,
  },
  avatarRingActive: {
    borderColor: COLORS.primary,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  memberName: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },
  memberNameActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  // NGÀY
  dayStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.white,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // CHIPS
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    ...SOFT_SHADOW,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 5,
    gap: 4,
    ...SOFT_SHADOW,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // GHI CHÚ & TÓM TẮT
  note: {
    minHeight: 100,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    fontSize: 14,
    color: COLORS.textPrimary,
    ...SOFT_SHADOW,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24,
    padding: 16,
    marginTop: 22,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  summarySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontWeight: '600',
  },

  // FOOTER
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  saveBtn: {
    height: 54,
    borderRadius: 999,
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
