import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Calendar, LocaleConfig } from "react-native-calendars";
import apiFitlife from "../../../../general/api";
import { COLORS, SHADOWS } from "../../../../general/theme";

const DashboardScreen = () => {
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
        {/* Banner mẹo tập luyện */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconCircle}>
            <Ionicons name="sparkles" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.noticeTextContainer}>
            <Text style={styles.noticeTitle}>Theo dõi buổi tập mỗi ngày</Text>
            <Text style={styles.noticeSub}>
              Hoàn thành đầy đủ các hiệp để hệ thống tự động ghi nhận tiến độ
            </Text>
          </View>
        </View>

        {/* Card chương trình hiện tại */}
        <View style={styles.programCard}>
          <View style={styles.programImage}>
            <Image
              source={{
                uri:
                  program?.anh_dai_dien ||
                  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
              }}
              style={styles.programImageStyle}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(13,127,141,0.55)", "rgba(7,88,101,0.92)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.overlay}
            />
            <View style={styles.circleDeco} />
            <View style={styles.programContent}>
              <View style={styles.badgeRow}>
                <View style={styles.programBadge}>
                  <Ionicons name="barbell-outline" size={13} color={COLORS.white} />
                  <Text style={styles.programBadgeText}>
                    {program?.ten_noi_tap || "Tại gym"}
                  </Text>
                </View>
                <View style={styles.programBadge}>
                  <Ionicons name="speedometer-outline" size={13} color={COLORS.white} />
                  <Text style={styles.programBadgeText}>
                    {program?.ten_cap_do || "Trung cấp"}
                  </Text>
                </View>
              </View>

              <Text style={styles.programTitle}>
                {program?.ten_chuong_trinh || "Chương trình luyện tập"}
              </Text>

              {/* Tiến độ hoàn thành */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressText}>
                    Tiến độ: {tongNgayDaHoanThanh}/{tongNgayTap} ngày
                  </Text>
                  <Text style={styles.progressPercent}>{progressPercent}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Huấn luyện tiếp theo */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Buổi tập tiếp theo</Text>
        </View>

        <View style={styles.workoutList}>
          {workouts.length > 0 ? (
            workouts.map((item) => {
              const isLocked = Number(item.tinh_trang) === 0;
              return (
                <View
                  key={item.id}
                  style={[styles.workoutCard, isLocked && styles.workoutCardLocked]}
                >
                  <View
                    style={[
                      styles.statusCircle,
                      isLocked ? styles.statusCircleLocked : styles.statusCircleActive,
                    ]}
                  >
                    <Ionicons
                      name={isLocked ? "lock-closed" : "play"}
                      size={16}
                      color={isLocked ? COLORS.textMuted : COLORS.white}
                    />
                  </View>

                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutDay}>Ngày thứ {item.ngay_thu}</Text>
                    <Text style={styles.workoutTitle} numberOfLines={1}>
                      {item.ten_ngay_tap}
                    </Text>
                  </View>

                </View>
              );
            })
          ) : (
            <View style={styles.emptyWorkoutBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-clear-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyWorkoutText}>Chưa có lịch buổi tập tiếp theo.</Text>
            </View>
          )}
        </View>

        {/* Lịch tập luyện */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarTitleRow}>
            <Text style={styles.calendarTitle}>Lịch tập luyện trong tháng</Text>
          </View>

          <View style={styles.calendarWrapper}>
            <Calendar
              current={today}
              firstDay={1}
              enableSwipeMonths={true}
              markedDates={markedDates}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              theme={{
                backgroundColor: COLORS.white,
                calendarBackground: COLORS.white,
                textSectionTitleColor: COLORS.textMuted,
                dayTextColor: COLORS.textPrimary,
                todayTextColor: COLORS.primary,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                monthTextColor: COLORS.textPrimary,
                textMonthFontSize: 16,
                textMonthFontWeight: "700",
                textDayFontSize: 14,
                textDayFontWeight: "500",
                arrowColor: COLORS.primary,
              }}
            />
          </View>

          {/* Ngày đang chọn */}
          <View style={styles.selectedDateCard}>
            <View style={styles.selectedDateIconCircle}>
              <Ionicons name="calendar" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.selectedDateInfo}>
              <Text style={styles.selectedDateLabel}>Ngày đang chọn:</Text>
              <Text style={styles.selectedDateValue}>{selectedDate}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  noticeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  noticeSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 17,
  },
  programCard: {
    width: "100%",
    height: 196,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.card,
    shadowOpacity: 0.14,
    elevation: 6,
  },
  programImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  programImageStyle: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  circleDeco: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -70,
    right: -50,
  },
  programContent: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  programBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  programBadgeText: {
    color: COLORS.white,
    fontSize: 11.5,
    fontWeight: "700",
  },
  programTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 27,
    marginBottom: 14,
  },
  progressSection: {},
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  progressText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  progressPercent: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#5EEAD4",
    borderRadius: 4,
  },
  sectionHeaderRow: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  workoutList: {
    gap: 10,
  },
  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  workoutCardLocked: {
    backgroundColor: COLORS.cardBg,
    opacity: 0.65,
  },
  statusCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCircleActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  statusCircleLocked: {
    backgroundColor: COLORS.borderLight,
  },
  workoutInfo: {
    flex: 1,
    marginLeft: 12,
  },
  workoutDay: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronWrapLocked: {
    backgroundColor: COLORS.borderLight,
  },
  emptyWorkoutBox: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWorkoutText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  calendarSection: {
    marginTop: 24,
  },
  calendarTitleRow: {
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  calendarWrapper: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  selectedDateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  selectedDateIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedDateInfo: {
    flex: 1,
  },
  selectedDateLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  selectedDateValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
