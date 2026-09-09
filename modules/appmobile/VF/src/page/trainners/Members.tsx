import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";

const Members = ({ navigation }: any) => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  const members = [
    {
      id: "1",
      name: "Nguyễn Văn An",
      email: "an.nguyen@email.com",
      goal: "Giảm cân",
      sessions: 18,
      totalSessions: 24,
      status: "Đang tập",
    },
    {
      id: "2",
      name: "Trần Minh Anh",
      email: "minhanh@email.com",
      goal: "Tăng cơ",
      sessions: 12,
      totalSessions: 20,
      status: "Đang tập",
    },
    {
      id: "3",
      name: "Lê Hoàng Nam",
      email: "nam.le@email.com",
      goal: "Duy trì",
      sessions: 8,
      totalSessions: 16,
      status: "Tạm nghỉ",
    },
    {
      id: "4",
      name: "Phạm Thu Hà",
      email: "ha.pham@email.com",
      goal: "Giảm cân",
      sessions: 21,
      totalSessions: 24,
      status: "Đang tập",
    },
    {
      id: "5",
      name: "Võ Minh Khang",
      email: "khang.vo@email.com",
      goal: "Tăng cơ",
      sessions: 6,
      totalSessions: 12,
      status: "Tạm nghỉ",
    },
  ];

  const filters = ["Tất cả", "Đang tập", "Tạm nghỉ"];

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchSearch =
        member.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        member.email
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchFilter =
        activeFilter === "Tất cả" ||
        member.status === activeFilter;

      return matchSearch && matchFilter;
    });
  }, [search, activeFilter]);

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Hội viên
          </Text>

          <Text style={styles.headerSubtitle}>
            Quản lý và theo dõi hội viên
          </Text>
        </View>

        <TouchableOpacity style={styles.notification}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm kiếm hội viên..."
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
            const active = activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  active && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* MEMBER COUNT */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredMembers.length} hội viên
          </Text>

          <TouchableOpacity>
            <Text style={styles.sortText}>
              Mới nhất ↓
            </Text>
          </TouchableOpacity>
        </View>

        {/* MEMBER LIST */}
        {filteredMembers.map((member) => {
          const progress =
            (member.sessions / member.totalSessions) * 100;

          return (
            <TouchableOpacity
              key={member.id}
              activeOpacity={0.8}
              style={styles.memberCard}
              onPress={() =>
                navigation.navigate("MemberDetail", {
                  member,
                })
              }
            >

              {/* TOP */}
              <View style={styles.memberTop}>

                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {member.name.charAt(0)}
                  </Text>
                </View>

                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.name}
                  </Text>

                  <Text style={styles.memberEmail}>
                    {member.email}
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </View>

              {/* TAGS */}
              <View style={styles.tagRow}>

                <View style={styles.goalTag}>
                  <Text style={styles.goalIcon}>
                    🎯
                  </Text>

                  <Text style={styles.goalText}>
                    {member.goal}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusTag,
                    member.status === "Tạm nghỉ" &&
                      styles.pauseTag,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      member.status === "Tạm nghỉ" &&
                        styles.pauseDot,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      member.status === "Tạm nghỉ" &&
                        styles.pauseText,
                    ]}
                  >
                    {member.status}
                  </Text>
                </View>

              </View>

              {/* PROGRESS */}
              <View style={styles.progressHeader}>

                <Text style={styles.sessionText}>
                  {member.sessions}/{member.totalSessions} buổi
                </Text>

                <Text style={styles.progressText}>
                  {Math.round(progress)}%
                </Text>

              </View>

              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>

            </TouchableOpacity>
          );
        })}

        {/* EMPTY */}
        {filteredMembers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🔍
            </Text>

            <Text style={styles.emptyTitle}>
              Không tìm thấy hội viên
            </Text>

            <Text style={styles.emptyText}>
              Thử tìm kiếm với tên khác
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
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },

  notification: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationIcon: {
    fontSize: 18,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  searchContainer: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  searchIcon: {
    fontSize: 27,
    color: "#6B7280",
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },

  filterScroll: {
    marginTop: 15,
    marginBottom: 15,
  },

  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  filterButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  countText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  sortText: {
    fontSize: 12,
    color: "#6B7280",
  },

  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  memberTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
  },

  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },

  memberName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  memberEmail: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },

  arrow: {
    fontSize: 28,
    color: "#9CA3AF",
  },

  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  goalTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },

  goalIcon: {
    fontSize: 12,
    marginRight: 4,
  },

  goalText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },

  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  pauseTag: {
    backgroundColor: "#FFF7ED",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 5,
  },

  pauseDot: {
    backgroundColor: "#F59E0B",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },

  pauseText: {
    color: "#D97706",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 7,
  },

  sessionText: {
    fontSize: 12,
    color: "#6B7280",
  },

  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  progressBackground: {
    height: 7,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: 7,
    backgroundColor: "#111827",
    borderRadius: 10,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 70,
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 6,
  },
});

export default Members;