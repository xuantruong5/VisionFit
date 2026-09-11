import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";

const SessionHistory = ({ navigation }: any) => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  const filters = [
    "Tất cả",
    "Hoàn thành",
    "Đã hủy",
  ];

  const sessions = [
    {
      id: "1",
      date: "05/09",
      time: "09:00",
      member: "Nguyễn Văn An",
      type: "Strength Training",
      duration: "60 phút",
      status: "Hoàn thành",
      calories: "520 kcal",
    },
    {
      id: "2",
      date: "03/09",
      time: "14:30",
      member: "Trần Minh Anh",
      type: "Cardio",
      duration: "45 phút",
      status: "Hoàn thành",
      calories: "410 kcal",
    },
    {
      id: "3",
      date: "01/09",
      time: "18:00",
      member: "Lê Hoàng Nam",
      type: "Full Body",
      duration: "60 phút",
      status: "Đã hủy",
      calories: "--",
    },
    {
      id: "4",
      date: "30/08",
      time: "09:30",
      member: "Phạm Thu Hà",
      type: "Weight Loss",
      duration: "60 phút",
      status: "Hoàn thành",
      calories: "580 kcal",
    },
    {
      id: "5",
      date: "28/08",
      time: "16:00",
      member: "Võ Minh Khang",
      type: "Upper Body",
      duration: "50 phút",
      status: "Hoàn thành",
      calories: "460 kcal",
    },
    {
      id: "6",
      date: "26/08",
      time: "10:00",
      member: "Nguyễn Hoàng Anh",
      type: "Cardio",
      duration: "45 phút",
      status: "Đã hủy",
      calories: "--",
    },
  ];

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchSearch =
        session.member
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        session.type
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchFilter =
        activeFilter === "Tất cả" ||
        session.status === activeFilter;

      return matchSearch && matchFilter;
    });
  }, [search, activeFilter]);

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Lịch sử buổi tập
          </Text>

          <Text style={styles.headerSubtitle}>
            Theo dõi các buổi tập của bạn
          </Text>
        </View>

        <View style={styles.historyIcon}>
          <Text style={styles.historyIconText}>
            ◷
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>
            ⌕
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm hội viên hoặc buổi tập..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* FILTER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {filters.map((filter) => {
            const active =
              activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                onPress={() =>
                  setActiveFilter(filter)
                }
                style={[
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              32
            </Text>

            <Text style={styles.summaryLabel}>
              Tổng buổi
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              28
            </Text>

            <Text style={styles.summaryLabel}>
              Hoàn thành
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              4
            </Text>

            <Text style={styles.summaryLabel}>
              Đã hủy
            </Text>
          </View>
        </View>

        {/* COUNT */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            LỊCH SỬ
          </Text>

          <Text style={styles.resultCount}>
            {filteredSessions.length} buổi
          </Text>
        </View>

        {/* SESSION LIST */}
        {filteredSessions.map((session, index) => {

          const showDate =
            index === 0 ||
            filteredSessions[index - 1].date !==
              session.date;

          return (
            <View key={session.id}>

              {showDate && (
                <Text style={styles.dateLabel}>
                  {session.date}
                </Text>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.sessionCard}
                onPress={() =>
                  navigation.navigate(
                    "SessionReview",
                    {
                      session,
                    }
                  )
                }
              >

                {/* TIME */}
                <View style={styles.timeBox}>
                  <Text style={styles.timeText}>
                    {session.time}
                  </Text>

                  <Text style={styles.durationText}>
                    {session.duration}
                  </Text>
                </View>

                {/* INFO */}
                <View style={styles.sessionInfo}>

                  <Text style={styles.memberName}>
                    {session.member}
                  </Text>

                  <Text style={styles.trainingType}>
                    {session.type}
                  </Text>

                  <View style={styles.bottomRow}>

                    <Text style={styles.calories}>
                      🔥 {session.calories}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        session.status ===
                          "Đã hủy" &&
                          styles.cancelledBadge,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          session.status ===
                            "Đã hủy" &&
                            styles.cancelledDot,
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          session.status ===
                            "Đã hủy" &&
                            styles.cancelledText,
                        ]}
                      >
                        {session.status}
                      </Text>
                    </View>

                  </View>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>

              </TouchableOpacity>

            </View>
          );
        })}

        {/* EMPTY */}
        {filteredSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              ◷
            </Text>

            <Text style={styles.emptyTitle}>
              Không có buổi tập
            </Text>

            <Text style={styles.emptyText}>
              Không tìm thấy lịch sử phù hợp.
            </Text>
          </View>
        )}

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
    fontSize: 23,
    fontWeight: "800",
    color: "#111827",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },

  historyIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },

  historyIconText: {
    fontSize: 23,
    color: "#111827",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  searchBox: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  searchIcon: {
    fontSize: 25,
    color: "#6B7280",
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },

  filterScroll: {
    marginTop: 14,
    marginBottom: 14,
  },

  filterButton: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  filterTextActive: {
    
  },

  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 17,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    
    fontSize: 22,
    fontWeight: "800",
  },

  summaryLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 5,
  },

  summaryDivider: {
    width: 1,
    height: 35,
    backgroundColor: "#374151",
  },

  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  resultTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.5,
  },

  resultCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  dateLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginTop: 10,
    marginBottom: 8,
  },

  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  timeBox: {
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },

  timeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  durationText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 5,
  },

  sessionInfo: {
    flex: 1,
    marginLeft: 13,
  },

  memberName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  trainingType: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  calories: {
    fontSize: 10,
    color: "#9CA3AF",
    flex: 1,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },

  cancelledBadge: {
    backgroundColor: "#FEF2F2",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 4,
  },

  cancelledDot: {
    backgroundColor: "#EF4444",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#059669",
  },

  cancelledText: {
    color: "#DC2626",
  },

  arrow: {
    fontSize: 26,
    color: "#D1D5DB",
    marginLeft: 8,
  },

  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 55,
    alignItems: "center",
    marginTop: 10,
  },

  emptyIcon: {
    fontSize: 38,
    color: "#9CA3AF",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },

  emptyText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 5,
  },
});

export default SessionHistory;
