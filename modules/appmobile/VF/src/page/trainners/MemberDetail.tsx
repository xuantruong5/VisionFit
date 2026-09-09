import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

const MemberDetail = ({ navigation, route }: any) => {
  const member = route?.params?.member || {
    name: "Nguyễn Văn An",
    email: "an.nguyen@email.com",
    age: 25,
    height: 172,
    weight: 68,
    bmi: 23.0,
    goal: "Giảm cân",
    targetWeight: 62,
    sessions: 18,
    totalSessions: 24,
    calories: "8,450",
    trainingTime: "14h 30m",
  };

  const sessionHistory = [
    {
      date: "05/09",
      title: "Strength Training",
      duration: "60 phút",
      status: "Hoàn thành",
    },
    {
      date: "03/09",
      title: "Cardio",
      duration: "45 phút",
      status: "Hoàn thành",
    },
    {
      date: "01/09",
      title: "Full Body",
      duration: "60 phút",
      status: "Hoàn thành",
    },
    {
      date: "29/08",
      title: "Upper Body",
      duration: "50 phút",
      status: "Hoàn thành",
    },
  ];

  const progress =
    (member.sessions / member.totalSessions) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết hội viên</Text>

        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* PROFILE */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {member.name.charAt(0)}
            </Text>
          </View>

          <Text style={styles.memberName}>{member.name}</Text>

          <Text style={styles.memberEmail}>
            {member.email}
          </Text>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              Đang tập luyện
            </Text>
          </View>
        </View>

        {/* BASIC INFORMATION */}
        <Text style={styles.sectionTitle}>
          THÔNG TIN CƠ BẢN
        </Text>

        <View style={styles.grid}>
          <InfoCard
            value={member.age}
            label="Tuổi"
          />

          <InfoCard
            value={`${member.height} cm`}
            label="Chiều cao"
          />

          <InfoCard
            value={`${member.weight} kg`}
            label="Cân nặng"
          />

          <InfoCard
            value={member.bmi}
            label="BMI"
          />
        </View>

        {/* TRAINING PROGRESS */}
        <Text style={styles.sectionTitle}>
          TIẾN ĐỘ TẬP LUYỆN
        </Text>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>
              Buổi tập
            </Text>

            <Text style={styles.progressValue}>
              {member.sessions} / {member.totalSessions}
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <Text style={styles.progressPercent}>
            {Math.round(progress)}% hoàn thành
          </Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🔥</Text>

              <View>
                <Text style={styles.statValue}>
                  {member.calories}
                </Text>
                <Text style={styles.statLabel}>
                  Calories
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱</Text>

              <View>
                <Text style={styles.statValue}>
                  {member.trainingTime}
                </Text>
                <Text style={styles.statLabel}>
                  Thời gian
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* GOAL */}
        <Text style={styles.sectionTitle}>
          MỤC TIÊU
        </Text>

        <View style={styles.goalCard}>
          <View style={styles.goalIcon}>
            <Text>🎯</Text>
          </View>

          <View style={styles.goalContent}>
            <Text style={styles.goalTitle}>
              {member.goal}
            </Text>

            <Text style={styles.goalDescription}>
              Mục tiêu cân nặng
            </Text>

            <View style={styles.weightRow}>
              <Text style={styles.currentWeight}>
                {member.weight} kg
              </Text>

              <Text style={styles.arrow}>→</Text>

              <Text style={styles.targetWeight}>
                {member.targetWeight} kg
              </Text>
            </View>
          </View>
        </View>

        {/* SESSION HISTORY */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>
            LỊCH SỬ BUỔI TẬP
          </Text>

          <TouchableOpacity>
            <Text style={styles.viewAll}>
              Xem tất cả
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          {sessionHistory.map((session, index) => (
            <View
              key={index}
              style={[
                styles.sessionItem,
                index === sessionHistory.length - 1 &&
                  styles.lastSession,
              ]}
            >
              <View style={styles.dateBox}>
                <Text style={styles.dateText}>
                  {session.date}
                </Text>
              </View>

              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>
                  {session.title}
                </Text>

                <Text style={styles.sessionDuration}>
                  {session.duration}
                </Text>
              </View>

              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>
                  ✓
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* BUTTONS */}
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            + Tạo buổi tập
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            💬 Nhắn tin với hội viên
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoCard = ({
  value,
  label,
}: {
  value: any;
  label: string;
}) => {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  header: {
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  backText: {
    fontSize: 36,
    color: "#111827",
    lineHeight: 40,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  moreButton: {
    width: 40,
    alignItems: "center",
  },

  moreText: {
    fontSize: 28,
    color: "#6B7280",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },

  memberName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
  },

  memberEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },

  statusText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  infoCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  infoValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  infoLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#9CA3AF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  progressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  progressBackground: {
    height: 9,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    marginTop: 12,
  },

  progressFill: {
    height: 9,
    backgroundColor: "#111827",
    borderRadius: 10,
  },

  progressPercent: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },

  statRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  statIcon: {
    fontSize: 22,
    marginRight: 10,
  },

  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  statLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },

  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    marginBottom: 24,
  },

  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  goalContent: {
    flex: 1,
  },

  goalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  goalDescription: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 3,
  },

  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  currentWeight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  arrow: {
    marginHorizontal: 10,
    color: "#9CA3AF",
  },

  targetWeight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  viewAll: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },

  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  lastSession: {
    borderBottomWidth: 0,
  },

  dateBox: {
    width: 48,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },

  dateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },

  sessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  sessionDuration: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },

  completedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },

  completedText: {
    color: "#10B981",
    fontWeight: "700",
  },

  primaryButton: {
    backgroundColor: "#111827",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryButton: {
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  secondaryButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default MemberDetail;