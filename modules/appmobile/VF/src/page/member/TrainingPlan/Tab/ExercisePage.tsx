import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

type Exercise = {
  id: number;
  name: string;
  sets: string;
  image: string;
};

type WorkoutPageProps = {
  onBack?: () => void;
  onSkip?: () => void;
  onStart?: () => void;
  onExercisePress?: (exercise: Exercise) => void;
};

const ExercisePage: React.FC<WorkoutPageProps> = ({
  onBack,
  onSkip,
  onStart,
  onExercisePress,
}) => {
  // ================================
  // DATA BÀI TẬP
  // ================================

  const exercises: Exercise[] = [
    {
      id: 1,
      name: "Bài tập chạy tại chỗ",
      sets: "3x20",
      image:
        "https://cdn-icons-png.flaticon.com/512/3043/3043219.png",
    },
    {
      id: 2,
      name: "Bài tập hít đất với đầu gối chống xuống sàn",
      sets: "2x10",
      image:
        "https://cdn-icons-png.flaticon.com/512/3043/3043257.png",
    },
    {
      id: 3,
      name: "Bài tập kéo giãn cơ superman",
      sets: "2x15",
      image:
        "https://cdn-icons-png.flaticon.com/512/3043/3043295.png",
    },
    {
      id: 4,
      name: "Bài tập squat truyền thống không sử dụng tạ",
      sets: "2x15",
      image:
        "https://cdn-icons-png.flaticon.com/512/3043/3043273.png",
    },
    {
      id: 5,
      name: "Bài tập mông đùi nâng hông lên khi nằm ngửa trên sàn",
      sets: "2x10",
      image:
        "https://cdn-icons-png.flaticon.com/512/3043/3043285.png",
    },
    {
      id: 6,
      name: "Bài tập nhảy Jack chéo",
      sets: "2x20",
      image:
        "https://cdn-icons-png.flaticon.com/512/3043/3043247.png",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
   //     backgroundColor="#FFFFFF"
      />

      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons
            name="arrow-back"
            size={wp("5.5%")}
            color="#607D8B"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bài tập</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.skipButton}
          onPress={onSkip}
        >
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CONTENT ================= */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================= PROGRESS CARD ================= */}

        <View style={styles.progressCard}>
          {/* 0% */}

          <View style={styles.progressCircle}>
            <Text style={styles.progressNumber}>0%</Text>
          </View>

          {/* INFORMATION */}

          <View style={styles.progressInformation}>
            <Text style={styles.trainingDay}>
              1 ngày tập luyện
            </Text>

            <Text style={styles.trainingType}>
              toàn thân
            </Text>
          </View>

          {/* TIME */}

          <Text style={styles.trainingTime}>
            ~ 37ph
          </Text>
        </View>

        {/* ================= EXERCISE LIST ================= */}

        <View style={styles.exerciseList}>
          {exercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              activeOpacity={0.75}
              style={styles.exerciseItem}
              onPress={() => onExercisePress?.(exercise)}
            >
              {/* IMAGE */}

              <View style={styles.exerciseImageWrapper}>
                <Image
                  source={{ uri: exercise.image }}
                  style={styles.exerciseImage}
                  resizeMode="contain"
                />
              </View>

              {/* CONTENT */}

              <View style={styles.exerciseInformation}>
                <Text
                  style={styles.exerciseName}
                  numberOfLines={2}
                >
                  {exercise.name}
                </Text>

                <Text style={styles.exerciseSets}>
                  {exercise.sets}
                </Text>
              </View>

              {/* ARROW */}

              <Ionicons
                name="chevron-forward"
                size={wp("5%")}
                color="#13BCC1"
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ================= BOTTOM AREA ================= */}

      <View style={styles.bottomArea}>
        {/* START BUTTON */}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.startButton}
          onPress={onStart}
        >
          <Text style={styles.startButtonText}>
            BẮT ĐẦU TẬP
          </Text>
        </TouchableOpacity>

        {/* ================= BOTTOM NAVIGATION ================= */}

        <View style={styles.bottomNavigation}>
          {/* KẾ HOẠCH TẬP */}

          <TouchableOpacity style={styles.navItem}>
            <Ionicons
              name="barbell-outline"
              size={wp("5.4%")}
              color="#17BFC3"
            />

            <Text
              style={[
                styles.navText,
                styles.activeNavText,
              ]}
            >
              Kế hoạch tập
            </Text>
          </TouchableOpacity>

          {/* FOOD */}

          <TouchableOpacity style={styles.navItem}>
            <Ionicons
              name="fast-food-outline"
              size={wp("5.4%")}
              color="#404040"
            />

            <Text style={styles.navText}>
              Food
            </Text>
          </TouchableOpacity>

          {/* TIN NHẮN */}

          <TouchableOpacity style={styles.navItem}>
            <Ionicons
              name="chatbubble-outline"
              size={wp("5.2%")}
              color="#404040"
            />

            <Text style={styles.navText}>
              Tin nhắn
            </Text>
          </TouchableOpacity>

          {/* SỔ TAY */}

          <TouchableOpacity style={styles.navItem}>
            <Ionicons
              name="book-outline"
              size={wp("5.4%")}
              color="#404040"
            />

            <Text style={styles.navText}>
              Sổ tay
            </Text>
          </TouchableOpacity>

          {/* THÊM */}

          <TouchableOpacity style={styles.navItem}>
            <View>
              <Ionicons
                name="ellipsis-horizontal"
                size={wp("5.4%")}
                color="#404040"
              />

              <View style={styles.notificationDot}>
                <Text style={styles.notificationText}>
                  1
                </Text>
              </View>
            </View>

            <Text style={styles.navText}>
              Thêm
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // =================================================
  // MAIN
  // =================================================

  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    borderBottomColor: "#F2F2F2",
  },

  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: wp("4.1%"),
    fontWeight: "700",
    color: "#111111",
  },

  backButton: {
    width: wp("9%"),
    height: wp("9%"),
    borderRadius: wp("4.5%"),
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,

    zIndex: 10,
  },

  skipButton: {
    paddingHorizontal: wp("3%"),
    paddingVertical: hp("1%"),
    zIndex: 10,
  },

  skipText: {
    color: "#527181",
    fontSize: wp("3.7%"),
    fontWeight: "500",
  },

  // =================================================
  // SCROLL VIEW
  // =================================================

  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingHorizontal: wp("4%"),
    paddingTop: hp("1%"),
    paddingBottom: hp("20%"),
  },

  // =================================================
  // PROGRESS CARD
  // =================================================

  progressCard: {
    minHeight: hp("9%"),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",

    borderRadius: wp("2.5%"),
    paddingHorizontal: wp("3%"),
    marginBottom: hp("1.5%"),

    borderWidth: 1,
    borderColor: "#EFEFEF",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  progressCircle: {
    width: wp("12%"),
    height: wp("12%"),
    borderRadius: wp("6%"),

    borderWidth: 2,
    borderColor: "#FF9EA7",

    alignItems: "center",
    justifyContent: "center",
  },

  progressNumber: {
    color: "#FF5262",
    fontSize: wp("3.5%"),
    fontWeight: "600",
  },

  progressInformation: {
    flex: 1,
    marginLeft: wp("3.5%"),
  },

  trainingDay: {
    color: "#7D959F",
    fontSize: wp("3.1%"),
    marginBottom: hp("0.3%"),
  },

  trainingType: {
    color: "#1C1C1C",
    fontSize: wp("3.7%"),
    fontWeight: "500",
  },

  trainingTime: {
    color: "#606060",
    fontSize: wp("3%"),
  },

  // =================================================
  // EXERCISE LIST
  // =================================================

  exerciseList: {
    marginTop: hp("0.5%"),
  },

  exerciseItem: {
    minHeight: hp("10.2%"),
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: wp("2%"),
    paddingVertical: hp("0.6%"),

    backgroundColor: "#FFFFFF",
  },

  exerciseImageWrapper: {
    width: wp("18%"),
    height: hp("8%"),
    alignItems: "center",
    justifyContent: "center",
  },

  exerciseImage: {
    width: "85%",
    height: "85%",
  },

  exerciseInformation: {
    flex: 1,
    paddingHorizontal: wp("2.5%"),
  },

  exerciseName: {
    color: "#292929",
    fontSize: wp("3.3%"),
    lineHeight: wp("4.3%"),
    fontWeight: "500",
  },

  exerciseSets: {
    color: "#546F7D",
    fontSize: wp("3%"),
    marginTop: hp("0.35%"),
  },

  // =================================================
  // BOTTOM
  // =================================================

  bottomArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "#FFFFFF",

    paddingHorizontal: wp("4%"),
    paddingBottom: hp("1%"),
  },

  // =================================================
  // START BUTTON
  // =================================================

  startButton: {
    width: "100%",
    height: hp("7%"),

    backgroundColor: "#18BEC3",
    borderRadius: wp("2%"),

    alignItems: "center",
    justifyContent: "center",

    marginBottom: hp("1%"),
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: wp("4.3%"),
    fontWeight: "700",
  },

  // =================================================
  // BOTTOM NAVIGATION
  // =================================================

  bottomNavigation: {
    height: hp("8%"),

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    backgroundColor: "#FFFFFF",

    borderRadius: wp("7%"),

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 7,

    elevation: 9,
  },

  navItem: {
    flex: 1,
    height: "100%",

    alignItems: "center",
    justifyContent: "center",
  },

  navText: {
    color: "#353535",
    fontSize: wp("2.25%"),
    marginTop: hp("0.3%"),
  },

  activeNavText: {
    color: "#18BEC3",
    fontWeight: "500",
  },

  notificationDot: {
    position: "absolute",

    right: -wp("2%"),
    top: -wp("1.5%"),

    minWidth: wp("4.5%"),
    height: wp("4.5%"),

    borderRadius: wp("2.3%"),

    backgroundColor: "#FF7784",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  notificationText: {
    color: "#FFFFFF",
    fontSize: wp("2.2%"),
    fontWeight: "700",
  },
});

export default ExercisePage;