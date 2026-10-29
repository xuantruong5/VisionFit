import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from "react-native";
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
          <ImageBackground
            source={{
              uri:
                program?.anh_dai_dien ||
                "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
            }}
            style={styles.programImage}
            imageStyle={styles.programImageStyle}
          >
            <View style={styles.overlay} />
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
          </ImageBackground>
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

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isLocked ? COLORS.border : COLORS.primary}
                  />
                </View>
              );
            })
          ) : (
            <View style={styles.emptyWorkoutBox}>
              <Ionicons name="calendar-clear-outline" size={32} color={COLORS.textMuted} />
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
    paddingTop: 14,
    paddingBottom: 110,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  noticeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  noticeSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  programCard: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: COLORS.cardBg,
    ...SHADOWS.card,
  },
  programImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  programImageStyle: {
    borderRadius: 20,
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7, 88, 101, 0.75)",
  },
  programContent: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  programBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  programBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
  },
  programTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: 12,
  },
  progressSection: {},
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  progressPercent: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.accentGreen,
    borderRadius: 3,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  workoutList: {
    gap: 10,
    marginBottom: 20,
  },
  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  workoutCardLocked: {
    backgroundColor: COLORS.cardBg,
    opacity: 0.7,
  },
  statusCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCircleActive: {
    backgroundColor: COLORS.primary,
  },
  statusCircleLocked: {
    backgroundColor: COLORS.borderLight,
  },
  workoutInfo: {
    flex: 1,
    marginLeft: 12,
  },
  workoutDay: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  emptyWorkoutBox: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyWorkoutText: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  calendarSection: {
    marginTop: 4,
  },
  calendarTitleRow: {
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  calendarWrapper: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  selectedDateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  selectedDateIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedDateInfo: {
    flex: 1,
  },
  selectedDateLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  selectedDateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
});