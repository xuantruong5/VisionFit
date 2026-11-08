import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import apiFitlife from "../../../../general/api";
import { COLORS, PASTEL, RADIUS, SOFT_SHADOW } from "../../../../general/theme";
import WorkoutStreakCard from "./WorkoutStreakCard";
import WorkoutFrequencyCard from "./WorkoutFrequencyCard";

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [program, setProgram] = useState<any>(null);
  const [trainingDates, setTrainingDates] = useState<string[]>([]);
  const [tongNgayDaHoanThanh, setTongNgayDaHoanThanh] = useState(0);
  const [tongNgayTap, setTongNgayTap] = useState(0);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getListPrograms = async () => {
    try {
      const res = await apiFitlife.get("/client/list-programs");
      if (res.data.success && res.data.data.length > 0) {
        setProgram(res.data.data[0]);
        const dates = res.data.data
          .map((item: any) => item.ngay_tap)
          .filter((date: any) => typeof date === "string");
        setTrainingDates(dates);
      } else {
        setProgram(null);
        setTrainingDates([]);
      }
    } catch (error) {
      console.log("Lỗi lấy chương trình tập:", error);
    }
  };

  const getHuanLuyenTiepTheo = async () => {
    try {
      const res = await apiFitlife.get("/client/huan-luyen-tiep-theo");
      if (res.data.success) {
        const data = res.data.data;
        setTongNgayDaHoanThanh(Number(data.tong_ngay_da_hoan_thanh || 0));
        setTongNgayTap(Number(data.tong_ngay_tap || 0));
        setWorkouts(Array.isArray(data.huan_luyen_tiep_theo) ? data.huan_luyen_tiep_theo : []);
      }
    } catch (error: any) {
      console.log("Lỗi lấy huấn luyện tiếp theo:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getListPrograms();
    getHuanLuyenTiepTheo();
  }, []);

  LocaleConfig.locales["vi"] = {
    monthNames: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
    monthNamesShort: ["Th 1", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "Th 8", "Th 9", "Th 10", "Th 11", "Th 12"],
    dayNames: ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
    dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
    today: "Hôm nay",
  };
  LocaleConfig.defaultLocale = "vi";

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const markedDates: any = {};
  trainingDates.forEach((date) => {
    markedDates[date] = { marked: true, dotColor: COLORS.primary };
  });
  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: COLORS.primary,
    selectedTextColor: COLORS.white,
  };

  const progressPercent =
    tongNgayTap > 0 ? Math.round((tongNgayDaHoanThanh / tongNgayTap) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. CHUỖI NGÀY TẬP LUYỆN & THÀNH TÍCH (ĐẨY LÊN ĐẦU TIÊN) */}
        <WorkoutStreakCard currentStreak={7} highestStreak={14} targetStreak={14} />

        {/* 2. TẦN SUẤT TẬP LUYỆN (THU GỌN / ĐÓNG MỞ THEO Ý USER) */}
        <WorkoutFrequencyCard weekSessionsCount={5} completedDaysCount={5} />

        {/* Mẹo tập luyện */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Theo dõi buổi tập mỗi ngày</Text>
          <Text style={styles.noticeSub}>
            Hoàn thành đầy đủ các hiệp để hệ thống tự động ghi nhận tiến độ
          </Text>
        </View>

        {/* Chương trình hiện tại */}
        <View style={styles.programCard}>
          <Image
            source={{
              uri:
                program?.anh_dai_dien ||
                "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
            }}
            style={styles.programImage}
            resizeMode="cover"
          />
          <View style={styles.programBody}>
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: PASTEL.tealSoft }]}>
                <Text style={[styles.chipText, { color: PASTEL.teal }]}>
                  {program?.ten_noi_tap || "Tại gym"}
                </Text>
              </View>
              <View style={[styles.chip, { backgroundColor: PASTEL.butter }]}>
                <Text style={[styles.chipText, { color: PASTEL.butterInk }]}>
                  {program?.ten_cap_do || "Trung cấp"}
                </Text>
              </View>
            </View>

            <Text style={styles.programTitle}>
              {program?.ten_chuong_trinh || "Chương trình luyện tập"}
            </Text>

            <View style={styles.progressRow}>
              <View style={styles.flex}>
                <Text style={styles.progressLabel}>
                  Tiến độ {tongNgayDaHoanThanh}/{tongNgayTap} ngày
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
          </View>
        </View>

        {/* Buổi tập tiếp theo - khối tối */}
        <View style={styles.darkBlock}>
          <View style={styles.darkHeader}>
            <Text style={styles.darkTitle}>Buổi tập tiếp theo</Text>
            <Text style={styles.darkCount}>
              {tongNgayDaHoanThanh}/{tongNgayTap}
            </Text>
          </View>

          {workouts.length > 0 ? (
            workouts.map((item) => {
              const isLocked = Number(item.tinh_trang) === 0;
              return (
                <View key={item.id} style={[styles.workoutRow, isLocked && styles.workoutRowLocked]}>
                  <View style={[styles.workoutIcon, isLocked && styles.workoutIconLocked]}>
                    <Ionicons
                      name={isLocked ? "lock-closed-outline" : "play"}
                      size={16}
                      color={isLocked ? PASTEL.inkMuted : PASTEL.teal}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.workoutTitle} numberOfLines={1}>
                      {item.ten_ngay_tap}
                    </Text>
                    <Text style={styles.workoutDay}>Ngày thứ {item.ngay_thu}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.darkEmpty}>Chưa có lịch buổi tập tiếp theo.</Text>
          )}
        </View>

        {/* Lịch tập luyện */}
        <View style={styles.calendarHeaderRow}>
          <Text style={styles.sectionTitle}>Lịch tập trong tháng</Text>
          <TouchableOpacity
            style={styles.changeScheduleQuickBtn}
            onPress={() => navigation.navigate("ChangeWorkoutScheduleScreen")}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
            <Text style={styles.changeScheduleQuickText}>Đổi lịch tập</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWrapper}>
          <Calendar
            current={today}
            firstDay={1}
            enableSwipeMonths={true}
            markedDates={markedDates}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            dayComponent={({ date, state, marking, onPress }: any) => {
              if (!date) return <View style={styles.dayCell} />;
              const isSelected = !!marking?.selected;
              const hasTraining = !!marking?.marked;
              const isToday = state === "today";
              const isOther = state === "disabled";
              return (
                <TouchableOpacity activeOpacity={0.8} onPress={() => onPress?.(date)} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayCircle,
                      hasTraining && styles.dayCircleTraining,
                      isToday && styles.dayCircleToday,
                      isSelected && styles.dayCircleSelected,
                      isOther && styles.dayCircleOther,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        hasTraining && styles.dayNumberTraining,
                        isSelected && styles.dayNumberSelected,
                      ]}
                    >
                      {date.day}
                    </Text>
                  </View>
                  {hasTraining && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            }}
            theme={{
              backgroundColor: PASTEL.surface,
              calendarBackground: PASTEL.surface,
              textSectionTitleColor: PASTEL.inkMuted,
              monthTextColor: PASTEL.ink,
              textMonthFontSize: 17,
              textMonthFontWeight: "400",
              arrowColor: PASTEL.ink,
            }}
          />

          {/* Ngày đang chọn */}
          <View style={styles.selectedRow}>
            <Text style={styles.selectedLabel}>Ngày đang chọn</Text>
            <Text style={styles.selectedValue}>{selectedDate}</Text>
            <View
              style={[
                styles.statusPill,
                trainingDates.includes(selectedDate) ? styles.statusPillActive : null,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  trainingDates.includes(selectedDate) ? styles.statusPillTextActive : null,
                ]}
              >
                {trainingDates.includes(selectedDate) ? "Có lịch tập" : "Nghỉ ngơi"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // MẸO
  noticeCard: {
    backgroundColor: PASTEL.butter,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  noticeTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: PASTEL.ink,
  },
  noticeSub: {
    fontSize: 12.5,
    color: PASTEL.inkSoft,
    marginTop: 3,
    lineHeight: 18,
  },

  // CHƯƠNG TRÌNH
  programCard: {
    backgroundColor: PASTEL.surface,
    borderRadius: RADIUS.lg,
    padding: 8,
    marginTop: 14,
    ...SOFT_SHADOW,
  },
  programImage: {
    width: "100%",
    height: 150,
    borderRadius: 22,
  },
  programBody: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  programTitle: {
    fontSize: 22,
    fontWeight: "400",
    color: PASTEL.ink,
    marginTop: 10,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
    marginTop: 14,
  },
  progressLabel: {
    fontSize: 12.5,
    color: PASTEL.inkSoft,
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: PASTEL.track,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: PASTEL.teal,
  },
  progressPercent: {
    fontSize: 30,
    fontWeight: "300",
    color: PASTEL.ink,
    lineHeight: 34,
  },

  // KHỐI TỐI
  darkBlock: {
    backgroundColor: PASTEL.tealSoft,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginTop: 14,
  },
  darkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  darkTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: PASTEL.ink,
  },
  darkCount: {
    fontSize: 30,
    fontWeight: "300",
    color: PASTEL.teal,
  },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 9,
  },
  workoutRowLocked: {
    opacity: 0.55,
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PASTEL.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutIconLocked: {
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: PASTEL.ink,
  },
  workoutDay: {
    fontSize: 12,
    color: PASTEL.inkSoft,
    marginTop: 2,
  },
  darkEmpty: {
    fontSize: 13.5,
    color: PASTEL.inkSoft,
    paddingVertical: 10,
  },

  // LỊCH
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: PASTEL.ink,
  },
  changeScheduleQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: PASTEL.tealSoft,
    borderWidth: 1,
    borderColor: "rgba(15, 84, 104, 0.2)",
  },
  changeScheduleQuickText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 5,
  },
  calendarWrapper: {
    backgroundColor: PASTEL.surface,
    borderRadius: RADIUS.lg,
    padding: 10,
    overflow: "hidden",
    ...SOFT_SHADOW,
  },
  dayCell: {
    width: 40,
    height: 46,
    alignItems: "center",
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: PASTEL.track,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleTraining: {
    borderColor: PASTEL.track,
  },
  dayCircleToday: {
    borderColor: PASTEL.teal,
  },
  dayCircleSelected: {
    backgroundColor: PASTEL.dark,
    borderColor: PASTEL.dark,
  },
  dayCircleOther: {
    opacity: 0.35,
    borderStyle: "dashed",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: PASTEL.ink,
  },
  dayNumberTraining: {
    color: PASTEL.ink,
  },
  dayNumberSelected: {
    color: PASTEL.surface,
    fontWeight: "700",
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: PASTEL.teal,
    marginTop: 3,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PASTEL.surfaceSoft,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    marginTop: 6,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  selectedLabel: {
    fontSize: 12.5,
    color: PASTEL.inkMuted,
  },
  selectedValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: PASTEL.ink,
  },
  statusPill: {
    backgroundColor: PASTEL.track,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  statusPillActive: {
    backgroundColor: PASTEL.mint,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: PASTEL.inkSoft,
  },
  statusPillTextActive: {
    color: PASTEL.mintInk,
  },
});
