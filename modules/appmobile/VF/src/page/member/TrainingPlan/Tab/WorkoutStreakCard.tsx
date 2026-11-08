import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { COLORS, PASTEL, RADIUS, SOFT_SHADOW } from "../../../../general/theme";

interface Milestone {
  id: string;
  days: number;
  title: string;
  desc: string;
  status: "achieved" | "in_progress" | "locked";
  statusText: string;
  icon: string;
  badgeBg: string;
  badgeColor: string;
  rewardPoints: number;
}

const MILESTONES: Milestone[] = [
  {
    id: "m7",
    days: 7,
    title: "Huy hiệu 7 ngày",
    desc: "Hoàn thành chuỗi 7 ngày tập luyện liên tiếp không nghỉ.",
    status: "achieved",
    statusText: "Đạt được",
    icon: "medal",
    badgeBg: "#ECFDF5",
    badgeColor: "#10B981",
    rewardPoints: 100,
  },
  {
    id: "m14",
    days: 14,
    title: "Huy hiệu 14 ngày",
    desc: "Duy trì kỷ luật thép trong suốt 2 tuần liên tiếp.",
    status: "in_progress",
    statusText: "Còn 7 ngày",
    icon: "shield-checkmark",
    badgeBg: "#FEF3C7",
    badgeColor: "#D97706",
    rewardPoints: 250,
  },
  {
    id: "m30",
    days: 30,
    title: "Huy hiệu 30 ngày",
    desc: "Chiến binh kiên trì! Chinh phục trọn vẹn 1 tháng liên tiếp.",
    status: "locked",
    statusText: "Chưa đạt",
    icon: "trophy",
    badgeBg: "#F3F4F6",
    badgeColor: "#9CA3AF",
    rewardPoints: 500,
  },
];

interface Props {
  currentStreak?: number;
  highestStreak?: number;
  targetStreak?: number;
}

const WorkoutStreakCard: React.FC<Props> = ({
  currentStreak = 7,
  highestStreak = 14,
  targetStreak = 14,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const progressPercent = Math.min(
    100,
    Math.round((currentStreak / targetStreak) * 100)
  );

  return (
    <View style={styles.cardContainer}>
      {/* HEADER CARD */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleCol}>
          <View style={styles.iconCircle}>
            <Ionicons name="flame" size={18} color="#FF6B4A" />
          </View>
          <Text style={styles.headerTitle}>Chuỗi ngày tập luyện</Text>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Đang duy trì</Text>
        </View>
      </View>

      {/* HERO BANNER MASCOT & SỐ NGÀY */}
      <LinearGradient
        colors={["#FFF7ED", "#FEF3C7", "#FFFBEB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.decorCircleTop} />
        <View style={styles.decorCircleBottom} />

        <View style={styles.heroContent}>
          {/* Mascot / Ngọn lửa đại diện */}
          <View style={styles.mascotWrapper}>
            <Image
              source={require("../../../../assets/mascot/cat_champion.png")}
              style={styles.mascotImage}
              resizeMode="contain"
            />
            <View style={styles.flameFloatingBadge}>
              <Ionicons name="flame" size={14} color="#FFFFFF" />
            </View>
          </View>

          {/* Số ngày chuỗi lớn */}
          <View style={styles.streakCountRow}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakUnit}>ngày</Text>
          </View>

          <Text style={styles.streakSubtitle}>Chuỗi tập liên tiếp hiện tại</Text>

          {/* Kỷ lục cao nhất */}
          <View style={styles.recordBadge}>
            <Ionicons name="ribbon-outline" size={13} color="#B45309" />
            <Text style={styles.recordText}>
              Kỷ lục cao nhất: <Text style={styles.recordHighlight}>{highestStreak} ngày</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* THANH MỤC TIÊU TIẾP THEO */}
      <View style={styles.targetSection}>
        <View style={styles.targetHeader}>
          <View style={styles.targetTitleRow}>
            <Ionicons name="flag-outline" size={15} color={PASTEL.inkSoft} />
            <Text style={styles.targetLabel}>Mục tiêu tiếp theo:</Text>
            <Text style={styles.targetName}>{targetStreak} ngày liên tiếp</Text>
          </View>
          <Text style={styles.targetFraction}>
            {currentStreak}/{targetStreak} ngày
          </Text>
        </View>

        <View style={styles.targetTrack}>
          <LinearGradient
            colors={[COLORS.primary, "#14B8A6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.targetFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      {/* CỘT MỐC PHẦN THƯỞNG / HUY HIỆU */}
      <View style={styles.milestoneSection}>
        <View style={styles.milestoneSectionHeader}>
          <Text style={styles.milestoneSectionTitle}>Các cột mốc phần thưởng</Text>
          <Text style={styles.milestoneSectionHint}>Nhấn để xem chi tiết</Text>
        </View>

        <View style={styles.milestoneRow}>
          {MILESTONES.map((item) => {
            const isAchieved = item.status === "achieved";
            const isInProgress = item.status === "in_progress";

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.milestoneCard,
                  isAchieved && styles.milestoneCardAchieved,
                  isInProgress && styles.milestoneCardInProgress,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedMilestone(item)}
              >
                {/* Vòng tròn biểu tượng huy hiệu */}
                <View
                  style={[
                    styles.milestoneIconCircle,
                    isAchieved && styles.iconCircleAchieved,
                    isInProgress && styles.iconCircleInProgress,
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={
                      isAchieved
                        ? "#F59E0B"
                        : isInProgress
                        ? COLORS.primary
                        : "#9CA3AF"
                    }
                  />
                  {isAchieved ? (
                    <View style={styles.checkMarkBadge}>
                      <Ionicons name="checkmark-sharp" size={10} color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>

                {/* Tên mốc */}
                <Text style={styles.milestoneDaysText}>{item.days} ngày</Text>

                {/* Badge trạng thái */}
                <View style={[styles.milestonePill, { backgroundColor: item.badgeBg }]}>
                  <Text style={[styles.milestonePillText, { color: item.badgeColor }]}>
                    {item.statusText}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* MODAL CHI TIẾT HUY HIỆU */}
      <Modal
        visible={!!selectedMilestone}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMilestone(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMilestone(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIconWrap}>
              <LinearGradient
                colors={
                  selectedMilestone?.status === "achieved"
                    ? ["#FDE68A", "#F59E0B"]
                    : selectedMilestone?.status === "in_progress"
                    ? [COLORS.primaryLight, COLORS.primary]
                    : ["#F3F4F6", "#9CA3AF"]
                }
                style={styles.modalGradientCircle}
              >
                <Ionicons
                  name={(selectedMilestone?.icon as any) || "trophy"}
                  size={36}
                  color={selectedMilestone?.status === "locked" ? "#6B7280" : "#FFFFFF"}
                />
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>{selectedMilestone?.title}</Text>

            <View style={[styles.modalStatusPill, { backgroundColor: selectedMilestone?.badgeBg }]}>
              <Text style={[styles.modalStatusText, { color: selectedMilestone?.badgeColor }]}>
                {selectedMilestone?.statusText}
              </Text>
            </View>

            <Text style={styles.modalDesc}>{selectedMilestone?.desc}</Text>

            <View style={styles.modalRewardBox}>
              <Ionicons name="sparkles" size={18} color="#D97706" />
              <Text style={styles.modalRewardText}>
                Phần thưởng: <Text style={styles.modalRewardBold}>+{selectedMilestone?.rewardPoints} Điểm VIP</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              activeOpacity={0.85}
              onPress={() => setSelectedMilestone(null)}
            >
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default WorkoutStreakCard;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: PASTEL.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginTop: 0,
    marginBottom: 4,
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
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF1EC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PASTEL.ink,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },

  // HERO BANNER
  heroBanner: {
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  decorCircleTop: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    top: -40,
    right: -20,
  },
  decorCircleBottom: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    bottom: -30,
    left: -20,
  },
  heroContent: {
    alignItems: "center",
    zIndex: 2,
  },
  mascotWrapper: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 4,
  },
  mascotImage: {
    width: 64,
    height: 64,
  },
  flameFloatingBadge: {
    position: "absolute",
    bottom: -2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF6B4A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  streakCountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2,
  },
  streakNumber: {
    fontSize: 38,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: -1,
  },
  streakUnit: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B45309",
  },
  streakSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#78350F",
    marginTop: 2,
  },
  recordBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  recordText: {
    fontSize: 12,
    color: "#78350F",
    fontWeight: "500",
  },
  recordHighlight: {
    fontWeight: "700",
    color: "#B45309",
  },

  // TARGET PROGRESS
  targetSection: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  targetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  targetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  targetLabel: {
    fontSize: 12.5,
    color: PASTEL.inkSoft,
    fontWeight: "500",
  },
  targetName: {
    fontSize: 12.5,
    fontWeight: "700",
    color: PASTEL.ink,
  },
  targetFraction: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.primary,
  },
  targetTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  targetFill: {
    height: "100%",
    borderRadius: RADIUS.pill,
  },

  // MILESTONES
  milestoneSection: {
    marginTop: 16,
  },
  milestoneSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  milestoneSectionTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: PASTEL.ink,
  },
  milestoneSectionHint: {
    fontSize: 11,
    color: PASTEL.inkMuted,
    fontWeight: "500",
  },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  milestoneCard: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  milestoneCardAchieved: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    ...SOFT_SHADOW,
  },
  milestoneCardInProgress: {
    backgroundColor: "#FDFDFD",
    borderColor: "#FDE68A",
  },
  milestoneIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 6,
  },
  iconCircleAchieved: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1.5,
    borderColor: "#F59E0B",
  },
  iconCircleInProgress: {
    backgroundColor: "#E6F0F4",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  checkMarkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  milestoneDaysText: {
    fontSize: 13,
    fontWeight: "700",
    color: PASTEL.ink,
    marginBottom: 4,
  },
  milestonePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  milestonePillText: {
    fontSize: 10.5,
    fontWeight: "700",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 48, 60, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    ...SOFT_SHADOW,
  },
  modalIconWrap: {
    marginBottom: 14,
  },
  modalGradientCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: PASTEL.ink,
    marginBottom: 6,
  },
  modalStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    marginBottom: 12,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalDesc: {
    fontSize: 13.5,
    color: PASTEL.inkSoft,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  modalRewardBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    gap: 8,
    marginBottom: 20,
    width: "100%",
    justifyContent: "center",
  },
  modalRewardText: {
    fontSize: 13,
    color: "#78350F",
  },
  modalRewardBold: {
    fontWeight: "800",
    color: "#B45309",
  },
  modalCloseBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.pill,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

