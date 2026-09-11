import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";

const Schedule = ({ navigation }: any) => {
  const [selectedDate, setSelectedDate] = useState(7);

  const weekDays = [
    { day: "T2", date: 31, month: "prev" },
    { day: "T3", date: 1, month: "current" },
    { day: "T4", date: 2, month: "current" },
    { day: "T5", date: 3, month: "current" },
    { day: "T6", date: 4, month: "current" },
    { day: "T7", date: 5, month: "current" },
    { day: "CN", date: 6, month: "current" },

    { day: "T2", date: 7, month: "current" },
    { day: "T3", date: 8, month: "current" },
    { day: "T4", date: 9, month: "current" },
    { day: "T5", date: 10, month: "current" },
    { day: "T6", date: 11, month: "current" },
    { day: "T7", date: 12, month: "current" },
    { day: "CN", date: 13, month: "current" },

    { day: "T2", date: 14, month: "current" },
    { day: "T3", date: 15, month: "current" },
    { day: "T4", date: 16, month: "current" },
    { day: "T5", date: 17, month: "current" },
    { day: "T6", date: 18, month: "current" },
    { day: "T7", date: 19, month: "current" },
    { day: "CN", date: 20, month: "current" },

    { day: "T2", date: 21, month: "current" },
    { day: "T3", date: 22, month: "current" },
    { day: "T4", date: 23, month: "current" },
    { day: "T5", date: 24, month: "current" },
    { day: "T6", date: 25, month: "current" },
    { day: "T7", date: 26, month: "current" },
    { day: "CN", date: 27, month: "current" },

    { day: "T2", date: 28, month: "current" },
    { day: "T3", date: 29, month: "current" },
    { day: "T4", date: 30, month: "current" },
    { day: "T5", date: 1, month: "next" },
    { day: "T6", date: 2, month: "next" },
    { day: "T7", date: 3, month: "next" },
    { day: "CN", date: 4, month: "next" },
  ];

  const schedules = [
    {
      id: "1",
      date: 7,
      time: "09:00",
      member: "Nguyễn Văn An",
      type: "Strength Training",
      duration: "60 phút",
      status: "Sắp tới",
    },
    {
      id: "2",
      date: 7,
      time: "14:30",
      member: "Trần Minh Anh",
      type: "Cardio",
      duration: "45 phút",
      status: "Hoàn thành",
    },
    {
      id: "3",
      date: 7,
      time: "18:00",
      member: "Lê Hoàng Nam",
      type: "Full Body",
      duration: "60 phút",
      status: "Sắp tới",
    },
    {
      id: "4",
      date: 8,
      time: "10:00",
      member: "Phạm Thu Hà",
      type: "Weight Loss",
      duration: "60 phút",
      status: "Sắp tới",
    },
  ];

  const todaySchedules = useMemo(() => {
    return schedules.filter(
      (schedule) => schedule.date === selectedDate
    );
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Lịch tập
          </Text>

          <Text style={styles.headerSubtitle}>
            Quản lý lịch tập của bạn
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addHeaderButton}
          onPress={() =>
            navigation.navigate("CreateSchedule")
          }
        >
          <Text style={styles.addHeaderText}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* MONTH HEADER */}
        <View style={styles.monthHeader}>
          <TouchableOpacity style={styles.monthArrow}>
            <Text style={styles.arrowText}>
              ‹
            </Text>
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            THÁNG 9, 2026
          </Text>

          <TouchableOpacity style={styles.monthArrow}>
            <Text style={styles.arrowText}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* CALENDAR */}
        <View style={styles.calendarCard}>

          <View style={styles.weekHeader}>
            {weekDays.slice(0, 7).map((item) => (
              <View
                key={item.day}
                style={styles.weekDay}
              >
                <Text
                  style={[
                    styles.weekDayText,
                    item.day === "CN" &&
                      styles.sundayText,
                  ]}
                >
                  {item.day}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {weekDays.map((item, index) => {
              const selected =
                item.date === selectedDate &&
                item.month === "current";

              const hasSchedule =
                schedules.some(
                  (schedule) =>
                    schedule.date === item.date &&
                    item.month === "current"
                );

              return (
                <TouchableOpacity
                  key={`${item.date}-${index}`}
                  style={styles.dateCell}
                  disabled={item.month !== "current"}
                  onPress={() =>
                    setSelectedDate(item.date)
                  }
                >
                  <View
                    style={[
                      styles.dateCircle,
                      selected &&
                        styles.selectedDate,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        item.month !== "current" &&
                          styles.otherMonthText,
                        selected &&
                          styles.selectedDateText,
                      ]}
                    >
                      {item.date}
                    </Text>
                  </View>

                  {hasSchedule && (
                    <View
                      style={[
                        styles.eventDot,
                        selected &&
                          styles.selectedEventDot,
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

        </View>

        {/* SELECTED DATE */}
        <View style={styles.todayHeader}>
          <View>
            <Text style={styles.todayLabel}>
              {selectedDate === 7
                ? "HÔM NAY"
                : "LỊCH TẬP"}
            </Text>

            <Text style={styles.dateTitle}>
              {selectedDate} THÁNG 9
            </Text>
          </View>

          <View style={styles.sessionCount}>
            <Text style={styles.sessionCountText}>
              {todaySchedules.length} buổi
            </Text>
          </View>
        </View>

        {/* SCHEDULE LIST */}
        {todaySchedules.map((schedule) => (
          <TouchableOpacity
            key={schedule.id}
            style={styles.scheduleCard}
            activeOpacity={0.8}
          >

            {/* TIME */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {schedule.time}
              </Text>

              <View style={styles.timeLine} />
            </View>

            {/* INFO */}
            <View style={styles.scheduleInfo}>

              <View style={styles.scheduleTop}>
                <Text style={styles.memberName}>
                  {schedule.member}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    schedule.status === "Hoàn thành" &&
                      styles.completedBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      schedule.status === "Hoàn thành" &&
                        styles.completedDot,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      schedule.status === "Hoàn thành" &&
                        styles.completedText,
                    ]}
                  >
                    {schedule.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.trainingType}>
                {schedule.type}
              </Text>

              <View style={styles.durationRow}>
                <Text style={styles.durationIcon}>
                  ◷
                </Text>

                <Text style={styles.durationText}>
                  {schedule.duration}
                </Text>
              </View>

            </View>

            <Text style={styles.cardArrow}>
              ›
            </Text>

          </TouchableOpacity>
        ))}

        {/* EMPTY STATE */}
        {todaySchedules.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              📅
            </Text>

            <Text style={styles.emptyTitle}>
              Không có lịch tập
            </Text>

            <Text style={styles.emptyText}>
              Ngày này chưa có buổi tập nào.
            </Text>
          </View>
        )}

        {/* CREATE BUTTON */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() =>
            navigation.navigate("CreateSchedule")
          }
        >
          <Text style={styles.createButtonText}>
            + Tạo lịch tập
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },

  addHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  addHeaderText: {
    
    fontSize: 26,
    lineHeight: 27,
    fontWeight: "400",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  arrowText: {
    fontSize: 27,
    color: "#374151",
    lineHeight: 28,
  },

  monthTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 14,
    marginBottom: 22,
  },

  weekHeader: {
    flexDirection: "row",
    marginBottom: 7,
  },

  weekDay: {
    width: "14.285%",
    alignItems: "center",
  },

  weekDayText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
  },

  sundayText: {
    color: "#EF4444",
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dateCell: {
    width: "14.285%",
    height: 49,
    alignItems: "center",
    justifyContent: "center",
  },

  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedDate: {
    backgroundColor: "#111827",
  },

  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  selectedDateText: {
    
  },

  otherMonthText: {
    color: "#D1D5DB",
  },

  eventDot: {
    position: "absolute",
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#111827",
  },

  selectedEventDot: {
    backgroundColor: "#FFFFFF",
  },

  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  todayLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },

  dateTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 3,
  },

  sessionCount: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },

  sessionCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  scheduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  timeContainer: {
    width: 57,
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "flex-start",
  },

  timeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },

  timeLine: {
    width: 1,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 9,
  },

  scheduleInfo: {
    flex: 1,
    marginLeft: 8,
  },

  scheduleTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  memberName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },

  completedBadge: {
    backgroundColor: "#ECFDF5",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
    marginRight: 4,
  },

  completedDot: {
    backgroundColor: "#10B981",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#D97706",
  },

  completedText: {
    color: "#059669",
  },

  trainingType: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 6,
  },

  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  durationIcon: {
    fontSize: 13,
    color: "#9CA3AF",
    marginRight: 5,
  },

  durationText: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  cardArrow: {
    fontSize: 25,
    color: "#D1D5DB",
    marginLeft: 8,
  },

  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 40,
    marginBottom: 15,
  },

  emptyIcon: {
    fontSize: 35,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  emptyText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 5,
  },

  createButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  createButtonText: {
    
    fontSize: 14,
    fontWeight: "700",
  },
});

export default Schedule;
