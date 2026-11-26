import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { COLORS, PASTEL, RADIUS, SOFT_SHADOW } from "../../../../general/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DayWorkout {
  dayName: string;
  count: number;
  isToday?: boolean;
}

const DEFAULT_DAYS: DayWorkout[] = [
  { dayName: "Thứ 2", count: 1 },
  { dayName: "Thứ 3", count: 1 },
  { dayName: "Thứ 4", count: 0 },
  { dayName: "Thứ 5", count: 1 },
  { dayName: "Thứ 6", count: 0 },
  { dayName: "Thứ 7", count: 1 },
  { dayName: "Chủ nhật", count: 1, isToday: true },
];

interface Props {
  weekSessionsCount?: number;
  completedDaysCount?: number;
  dailyData?: DayWorkout[];
  initialExpanded?: boolean;
}

const WorkoutFrequencyCard: React.FC<Props> = ({
  weekSessionsCount = 5,
  completedDaysCount = 5,
  dailyData = DEFAULT_DAYS,
  initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const maxPerDay = 1;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  return (
    <View style={styles.cardContainer}>
      {/* HEADER CARD - NHẤN VÀO ĐỂ ĐÓNG/MỞ */}
      <TouchableOpacity
        style={styles.headerRow}
        activeOpacity={0.75}
        onPress={toggleExpand}
      >
        <View style={styles.headerTitleCol}>
          <View style={styles.iconCircle}>
            <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Tần suất tập luyện</Text>
          <View style={styles.weekTagPill}>
            <Text style={styles.weekTagText}>Tuần này</Text>
          </View>
        </View>

        {/* NÚT THU GỌN / XEM CHI TIẾT */}
        <View style={styles.togglePill}>
          <Text style={styles.toggleText}>{isExpanded ? "Thu gọn" : "Chi tiết"}</Text>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* 2 CHỈ SỐ TỔNG KẾT LUÔN HIỂN THỊ (GỌN GÀNG) */}
      <View style={styles.summaryStatsRow}>
        {/* Ô 1: Buổi tập tuần này */}
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>
            {weekSessionsCount}
          </Text>
          <Text style={styles.statLabel}>Buổi tập tuần này</Text>
          <View style={[styles.statIndicatorDot, { backgroundColor: COLORS.primary }]} />
        </View>

        {/* Vách ngăn */}
        <View style={styles.statDivider} />

        {/* Ô 2: Ngày đã tập */}
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: PASTEL.ink }]}>
            {completedDaysCount}
          </Text>
          <Text style={styles.statLabel}>Ngày đã tập</Text>
          <View style={[styles.statIndicatorDot, { backgroundColor: "#10B981" }]} />
        </View>
      </View>

      {/* PHẦN CHI TIẾT THEO NGÀY - ĐÓNG / MỞ THEO Ý USER */}
      {isExpanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>Số buổi tập theo ngày</Text>
            <Text style={styles.breakdownSub}>Mục tiêu: 1 buổi/ngày</Text>
          </View>

          <View style={styles.dayList}>
            {dailyData.map((item, index) => {
              const hasWorkout = item.count > 0;
              const fillPercent = hasWorkout ? Math.min(100, (item.count / maxPerDay) * 100) : 0;

              return (
                <View key={index} style={styles.dayRow}>
                  {/* Tên thứ trong tuần */}
                  <View style={styles.dayLabelWrap}>
                    <Text style={[styles.dayLabelText, item.isToday && styles.todayLabelText]}>
                      {item.dayName}
                    </Text>
                    {item.isToday ? (
                      <View style={styles.todaySmallBadge}>
                        <Text style={styles.todaySmallText}>Hôm nay</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Thanh tiến độ ngang */}
                  <View style={styles.barTrack}>
                    {hasWorkout ? (
                      <LinearGradient
                        colors={[COLORS.primary, "#14B8A6"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.barFill, { width: `${fillPercent}%` }]}
                      />
                    ) : (
                      <View style={styles.barEmptyTrack} />
                    )}
                  </View>

                  {/* Số lượng buổi */}
                  <View style={styles.countBadgeWrap}>
                    <Text
                      style={[
                        styles.countText,
                        hasWorkout ? styles.countTextActive : styles.countTextZero,
                      ]}
                    >
                      {item.count} buổi
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* GỢI Ý KHOA HỌC */}
          <View style={styles.footerNote}>
            <Ionicons name="information-circle-outline" size={15} color={PASTEL.inkSoft} />
            <Text style={styles.footerNoteText}>
              Duy trì 4 - 5 buổi/tuần giúp tối ưu phát triển cơ bắp và phục hồi.
            </Text>
          </View>
        </View>
      ) : (
        /* HINT KHI ĐANG THU GỌN */
        <TouchableOpacity
          style={styles.collapsedHint}
          activeOpacity={0.7}
          onPress={toggleExpand}
        >
          <Text style={styles.collapsedHintText}>Xem chi tiết biểu đồ 7 ngày trong tuần</Text>
          <Ionicons name="chevron-down" size={13} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default WorkoutFrequencyCard;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: PASTEL.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginTop: 12,
    ...SOFT_SHADOW,
    borderWidth: 1,
    borderColor: "#EEF6F8",
  },

  // HEADER
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitleCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PASTEL.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: PASTEL.ink,
  },
  weekTagPill: {
    backgroundColor: "#F0FDFA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  weekTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  toggleText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // SUMMARY STATS
  summaryStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  statValue: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: PASTEL.inkSoft,
    marginTop: 2,
  },
  statIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#E2E8F0",
  },

  // COLLAPSED HINT
  collapsedHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  collapsedHintText: {
    fontSize: 11.5,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // EXPANDED CONTENT
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: PASTEL.ink,
  },
  breakdownSub: {
    fontSize: 11,
    color: PASTEL.inkMuted,
    fontWeight: "500",
  },
  dayList: {
    gap: 10,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayLabelWrap: {
    width: 66,
  },
  dayLabelText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: PASTEL.inkSoft,
  },
  todayLabelText: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  todaySmallBadge: {
    backgroundColor: "#E6F0F4",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  todaySmallText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.primary,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: RADIUS.pill,
  },
  barEmptyTrack: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  countBadgeWrap: {
    width: 50,
    alignItems: "flex-end",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  countTextActive: {
    color: PASTEL.ink,
    fontWeight: "700",
  },
  countTextZero: {
    color: PASTEL.inkMuted,
  },

  // FOOTER NOTE
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    gap: 8,
    marginTop: 14,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 11.5,
    color: PASTEL.inkSoft,
    lineHeight: 16,
  },
});
