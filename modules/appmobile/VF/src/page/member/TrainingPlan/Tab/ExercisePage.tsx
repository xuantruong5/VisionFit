import React, { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

// ================================
// TYPES
// ================================

type Exercise = {
  id: number;
  name: string;
  sets: string;
  duration: string;
  muscle: string;
  image: string;
  completed: boolean;
};

// ================================
// MOCK DATA
// ================================

const EXERCISES: Exercise[] = [
  {
    id: 1,
    name: "Chạy tại chỗ nâng cao gối",
    sets: "3 hiệp x 20 lần",
    duration: "5 ph",
    muscle: "Toàn thân",
    image: "https://cdn-icons-png.flaticon.com/512/3043/3043219.png",
    completed: false,
  },
  {
    id: 2,
    name: "Hít đất trên gối",
    sets: "2 hiệp x 10 lần",
    duration: "4 ph",
    muscle: "Ngực & Tay",
    image: "https://cdn-icons-png.flaticon.com/512/3043/3043257.png",
    completed: false,
  },
  {
    id: 3,
    name: "Kéo giãn cơ Superman",
    sets: "2 hiệp x 15 lần",
    duration: "4 ph",
    muscle: "Lưng & Mông",
    image: "https://cdn-icons-png.flaticon.com/512/3043/3043295.png",
    completed: false,
  },
  {
    id: 4,
    name: "Squat không tạ",
    sets: "2 hiệp x 15 lần",
    duration: "5 ph",
    muscle: "Đùi & Mông",
    image: "https://cdn-icons-png.flaticon.com/512/3043/3043273.png",
    completed: false,
  },
  {
    id: 5,
    name: "Nâng hông nằm ngửa",
    sets: "2 hiệp x 10 lần",
    duration: "4 ph",
    muscle: "Mông & Đùi sau",
    image: "https://cdn-icons-png.flaticon.com/512/3043/3043285.png",
    completed: false,
  },
  {
    id: 6,
    name: "Nhảy Jack chéo",
    sets: "2 hiệp x 20 lần",
    duration: "5 ph",
    muscle: "Toàn thân",
    image: "https://cdn-icons-png.flaticon.com/512/3043/3043247.png",
    completed: false,
  },
  {
    id: 7,
    name: "Plank giữ thẳng người",
    sets: "3 hiệp x 30 giây",
    duration: "5 ph",
    muscle: "Core & Bụng",
    image: "https://cdn-icons-png.flaticon.com/512/3043/3043265.png",
    completed: false,
  },
];

// ================================
// COMPONENT
// ================================

const ExercisePage = ({ navigation, route }: any) => {
  const [exercises, setExercises] = useState<Exercise[]>(EXERCISES);

  const dayLabel = route?.params?.dayLabel ?? "1 ngày tập luyện";
  const dayType = route?.params?.dayType ?? "toàn thân";
  const totalDuration = 37;

  const completedCount = exercises.filter((e) => e.completed).length;
  const progressPercent =
    exercises.length > 0
      ? Math.round((completedCount / exercises.length) * 100)
      : 0;

  // ================================
  // HANDLERS
  // ================================

  const handleExercisePress = (exercise: Exercise) => {
    navigation?.navigate('ReportPage', { exercise });
  };

  const handleStart = () => {
    // Navigate to live workout or next page
    console.log("Bắt đầu tập luyện...");
  };

  // ================================
  // RENDER
  // ================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={wp("5.5%")} color="#607D8B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bài tập ngày</Text>

        <TouchableOpacity activeOpacity={0.7} style={styles.moreButton}>
          <Ionicons
            name="ellipsis-horizontal"
            size={wp("5.5%")}
            color="#607D8B"
          />
        </TouchableOpacity>
      </View>

      {/* ================= CONTENT ================= */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================= SESSION CARD ================= */}

        <View style={styles.sessionCard}>
          {/* Left: Progress circle */}
          <View style={styles.progressCircleWrapper}>
            <View style={styles.progressCircleBg}>
              <View
                style={[
                  styles.progressCircleFill,
                  {
                    borderColor:
                      progressPercent === 100 ? "#18BEC3" : "#FF9EA7",
                  },
                ]}
              />
              <View style={styles.progressCircleCenter}>
                <Text
                  style={[
                    styles.progressText,
                    {
                      color: progressPercent === 100 ? "#18BEC3" : "#FF5262",
                    },
                  ]}
                >
                  {progressPercent}%
                </Text>
              </View>
            </View>
          </View>

          {/* Middle: Info */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionDayLabel}>{dayLabel}</Text>
            <Text style={styles.sessionType}>{dayType}</Text>

            <View style={styles.sessionMeta}>
              <Ionicons name="time-outline" size={wp("3.2%")} color="#8FA9B2" />
              <Text style={styles.sessionMetaText}>~ {totalDuration} phút</Text>

              <View style={styles.metaDivider} />

              <Ionicons
                name="barbell-outline"
                size={wp("3.2%")}
                color="#8FA9B2"
              />
              <Text style={styles.sessionMetaText}>
                {exercises.length} bài
              </Text>
            </View>
          </View>

          {/* Right: Completed badge */}
          <View style={styles.completedBadge}>
            <Text style={styles.completedCount}>{completedCount}</Text>
            <Text style={styles.completedLabel}>xong</Text>
          </View>
        </View>

        {/* ================= SECTION TITLE ================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh sách bài tập</Text>
          <Text style={styles.sectionSubtitle}>
            {completedCount}/{exercises.length} hoàn thành
          </Text>
        </View>

        {/* ================= EXERCISE LIST ================= */}

        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <View key={exercise.id}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.exerciseItem}
                onPress={() => handleExercisePress(exercise)}
              >
                {/* Image */}
                <View style={styles.exerciseImageWrapper}>
                  <Image
                    source={{ uri: exercise.image }}
                    style={styles.exerciseImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Info */}
                <View style={styles.exerciseInfo}>
                  <Text
                    style={styles.exerciseName}
                    numberOfLines={2}
                  >
                    {exercise.name}
                  </Text>

                  <View style={styles.exerciseTags}>
                    <View style={styles.tagPill}>
                      <Ionicons
                        name="repeat-outline"
                        size={wp("3%")}
                        color="#18BEC3"
                      />
                      <Text style={styles.tagText}>{exercise.sets}</Text>
                    </View>

                    <View style={[styles.tagPill, styles.tagPillGray]}>
                      <Ionicons
                        name="body-outline"
                        size={wp("3%")}
                        color="#8FA9B2"
                      />
                      <Text style={[styles.tagText, styles.tagTextGray]}>
                        {exercise.muscle}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Arrow */}
                <Ionicons
                  name="chevron-forward"
                  size={wp("5%")}
                  color="#18BEC3"
                />
              </TouchableOpacity>

              {/* Divider (not after last item) */}
              {index < exercises.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>

        {/* ================= TIPS CARD ================= */}

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons
              name="bulb-outline"
              size={wp("4.5%")}
              color="#E8A020"
            />
            <Text style={styles.tipsTitle}>Lưu ý buổi tập</Text>
          </View>
          <Text style={styles.tipsText}>
            Khởi động kỹ trước khi bắt đầu. Nghỉ giữa hiệp 30–60 giây. Uống đủ
            nước trong suốt buổi tập để duy trì năng lượng tốt nhất.
          </Text>
        </View>

      </ScrollView>

      {/* ================= BOTTOM AREA ================= */}

      <View style={styles.bottomArea}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.startButton,
            progressPercent === 100 && styles.startButtonDone,
          ]}
          onPress={handleStart}
        >
          <Ionicons
            name={progressPercent === 100 ? "checkmark-circle" : "play"}
            size={wp("5%")}
            color="#FFFFFF"
            style={styles.startIcon}
          />
          <Text style={styles.startButtonText}>
            {progressPercent === 100
              ? "HOÀN THÀNH BUỔI TẬP"
              : progressPercent > 0
              ? "TIẾP TỤC TẬP"
              : "BẮT ĐẦU TẬP"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ================================
// STYLES
// ================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6FAFB",
  },

  // =================================================
  // HEADER
  // =================================================

  header: {
    height: hp("7%"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp("4%"),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3F5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: wp("4.2%"),
    fontWeight: "700",
    color: "#111C1E",
  },

  backButton: {
    width: wp("9%"),
    height: wp("9%"),
    borderRadius: wp("4.5%"),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F8F9",
    zIndex: 10,
  },

  moreButton: {
    width: wp("9%"),
    height: wp("9%"),
    borderRadius: wp("4.5%"),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F8F9",
    zIndex: 10,
  },

  // =================================================
  // SCROLL VIEW
  // =================================================

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: wp("4%"),
    paddingTop: hp("2%"),
    paddingBottom: hp("16%"),
  },

  // =================================================
  // SESSION CARD
  // =================================================

  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: wp("4%"),
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("2%"),
    marginBottom: hp("2%"),
    borderWidth: 1,
    borderColor: "#DFF0F3",
    elevation: 3,
    shadowColor: "#0D7F8D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  progressCircleWrapper: {
    marginRight: wp("3.5%"),
  },

  progressCircleBg: {
    width: wp("14%"),
    height: wp("14%"),
    borderRadius: wp("7%"),
    backgroundColor: "#F6FAFB",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  progressCircleFill: {
    position: "absolute",
    width: wp("14%"),
    height: wp("14%"),
    borderRadius: wp("7%"),
    borderWidth: 2.5,
  },

  progressCircleCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  progressText: {
    fontSize: wp("3.5%"),
    fontWeight: "700",
  },

  sessionInfo: {
    flex: 1,
  },

  sessionDayLabel: {
    color: "#8FA9B2",
    fontSize: wp("3%"),
    marginBottom: hp("0.2%"),
  },

  sessionType: {
    color: "#1A2F35",
    fontSize: wp("4%"),
    fontWeight: "700",
    marginBottom: hp("0.5%"),
  },

  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("1%"),
  },

  sessionMetaText: {
    color: "#8FA9B2",
    fontSize: wp("2.9%"),
  },

  metaDivider: {
    width: 1,
    height: hp("1.5%"),
    backgroundColor: "#C9DADE",
    marginHorizontal: wp("1.5%"),
  },

  completedBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF9FB",
    borderRadius: wp("2.5%"),
    paddingHorizontal: wp("2.5%"),
    paddingVertical: hp("0.6%"),
    minWidth: wp("11%"),
  },

  completedCount: {
    color: "#0D7F8D",
    fontSize: wp("4.5%"),
    fontWeight: "800",
  },

  completedLabel: {
    color: "#4AAAB5",
    fontSize: wp("2.5%"),
  },

  // =================================================
  // SECTION HEADER
  // =================================================

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp("1.5%"),
  },

  sectionTitle: {
    color: "#1A2F35",
    fontSize: wp("4%"),
    fontWeight: "700",
  },

  sectionSubtitle: {
    color: "#8FA9B2",
    fontSize: wp("3.2%"),
  },

  // =================================================
  // EXERCISE LIST
  // =================================================

  exerciseList: {
    backgroundColor: "#FFFFFF",
    borderRadius: wp("4%"),
    paddingHorizontal: wp("1%"),
    borderWidth: 1,
    borderColor: "#EEF3F5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: hp("2%"),
  },

  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp("3%"),
    paddingVertical: hp("1.2%"),
  },

  exerciseItemDone: {
    opacity: 0.6,
  },

  checkbox: {
    width: wp("6%"),
    height: wp("6%"),
    borderRadius: wp("3%"),
    borderWidth: 2,
    borderColor: "#BDD8DD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: wp("2.5%"),
    backgroundColor: "#FFFFFF",
  },

  checkboxDone: {
    backgroundColor: "#18BEC3",
    borderColor: "#18BEC3",
  },

  exerciseImageWrapper: {
    width: wp("15%"),
    height: hp("7%"),
    alignItems: "center",
    justifyContent: "center",
    marginRight: wp("2%"),
  },

  exerciseImage: {
    width: "85%",
    height: "85%",
  },

  exerciseImageDone: {
    opacity: 0.4,
  },

  exerciseInfo: {
    flex: 1,
    paddingRight: wp("2%"),
  },

  exerciseName: {
    color: "#1A2F35",
    fontSize: wp("3.4%"),
    fontWeight: "600",
    lineHeight: wp("4.5%"),
    marginBottom: hp("0.5%"),
  },

  exerciseNameDone: {
    color: "#8FA9B2",
    textDecorationLine: "line-through",
  },

  exerciseTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("2%"),
    flexWrap: "wrap",
  },

  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("1%"),
    backgroundColor: "#EAF9FB",
    borderRadius: wp("3%"),
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("0.3%"),
  },

  tagPillGray: {
    backgroundColor: "#F2F8F9",
  },

  tagText: {
    color: "#18BEC3",
    fontSize: wp("2.7%"),
    fontWeight: "500",
  },

  tagTextGray: {
    color: "#8FA9B2",
  },

  durationBadge: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: wp("10%"),
  },

  durationText: {
    color: "#5B7C84",
    fontSize: wp("3%"),
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF3F5",
    marginLeft: wp("14%"),
  },

  // =================================================
  // TIPS CARD
  // =================================================

  tipsCard: {
    backgroundColor: "#FFFDF0",
    borderRadius: wp("3.5%"),
    padding: wp("4%"),
    borderWidth: 1,
    borderColor: "#F5E8C0",
    marginBottom: hp("2%"),
  },

  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("2%"),
    marginBottom: hp("0.8%"),
  },

  tipsTitle: {
    color: "#C07010",
    fontSize: wp("3.5%"),
    fontWeight: "700",
  },

  tipsText: {
    color: "#7A5A20",
    fontSize: wp("3.2%"),
    lineHeight: wp("4.8%"),
  },

  // =================================================
  // BOTTOM AREA
  // =================================================

  bottomArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: wp("4%"),
    paddingTop: hp("1.5%"),
    paddingBottom: hp("3%"),
    borderTopWidth: 1,
    borderTopColor: "#EEF3F5",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },

  startButton: {
    width: "100%",
    height: hp("7%"),
    backgroundColor: "#18BEC3",
    borderRadius: wp("3%"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp("2%"),
    elevation: 4,
    shadowColor: "#0D7F8D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  startButtonDone: {
    backgroundColor: "#0D9E6B",
  },

  startIcon: {
    marginRight: wp("1%"),
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: wp("4.2%"),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default ExercisePage;
