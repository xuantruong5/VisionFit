import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import LinearGradient from "react-native-linear-gradient";

// ================================
// TYPES
// ================================

type WorkoutDay = {
  id: number;
  dayLabel: string;
  type: string;
  isLocked: boolean;
  progressPercent: number;
};

// ================================
// MOCK DATA
// ================================

const MOCK_DAYS: WorkoutDay[] = [
  { id: 1, dayLabel: "1 ngày tập luyện", type: "toàn thân", isLocked: false, progressPercent: 0 },
  { id: 2, dayLabel: "2 ngày tập luyện", type: "toàn thân", isLocked: true, progressPercent: 0 },
  { id: 3, dayLabel: "3 ngày tập luyện", type: "toàn thân", isLocked: true, progressPercent: 0 },
  { id: 4, dayLabel: "4 ngày tập luyện", type: "toàn thân", isLocked: true, progressPercent: 0 },
  { id: 5, dayLabel: "5 ngày tập luyện", type: "toàn thân", isLocked: true, progressPercent: 0 },
  { id: 6, dayLabel: "6 ngày tập luyện", type: "toàn thân", isLocked: true, progressPercent: 0 },
  { id: 7, dayLabel: "7 ngày tập luyện", type: "nghỉ ngơi", isLocked: true, progressPercent: 0 },
];

const WorkoutExercisePlan = ({ navigation, route }: any) => {
  const planName = route?.params?.planName ?? "Giảm cân";

  const handleDayPress = (day: WorkoutDay) => {
    if (day.isLocked) return;
    
    // Navigate to ExercisePage (danh sách bài tập) when clicking an unlocked day
    navigation.navigate("ExercisePage", {
      dayLabel: day.dayLabel,
      dayType: day.type,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ================= MAIN HEADER (MOCK) ================= */}
      <View style={styles.mainHeader}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="time-outline" size={wp("6%")} color="#0D7F8D" />
        </TouchableOpacity>
        <Text style={styles.mainHeaderTitle}>Kế hoạch tập</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="list" size={wp("6%")} color="#0D7F8D" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================= TOP BANNER ================= */}
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=1000" }}
          style={styles.bannerContainer}
          imageStyle={styles.bannerImage}
        >
          {/* Gradient Overlay for better text readability */}
          <LinearGradient
            colors={["rgba(4, 38, 48, 0.4)", "rgba(4, 38, 48, 0.9)"]}
            style={styles.bannerOverlay}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{planName}</Text>
              
              <View style={styles.bannerInfoRow}>
                <Ionicons name="home" size={wp("3.5%")} color="#FFFFFF" />
                <Text style={styles.bannerInfoText}> Tại nhà </Text>
                <View style={styles.starsContainer}>
                  <Ionicons name="star-outline" size={wp("3%")} color="#FFFFFF" />
                  <Ionicons name="star-outline" size={wp("3%")} color="#FFFFFF" />
                  <Ionicons name="star-outline" size={wp("3%")} color="#FFFFFF" />
                </View>
                <Text style={styles.bannerInfoText}> Chưa có kinh nghiệm</Text>
              </View>

              <Text style={styles.bannerHighlightText}>
                24 ngày tập luyện (3 buổi mỗi tuần)
              </Text>
              
              <Text style={styles.bannerInfoText}>
                Tập luyện hoàn tất: 0
              </Text>
            </View>

            <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
              <Ionicons name="share-social" size={wp("4.5%")} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </ImageBackground>

        {/* ================= LIST HEADER ================= */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Ngày tập luyện</Text>
          <TouchableOpacity>
            <Ionicons name="swap-vertical" size={wp("5.5%")} color="#18BEC3" />
          </TouchableOpacity>
        </View>

        {/* ================= LIST OF DAYS ================= */}
        <View style={styles.daysListContainer}>
          {MOCK_DAYS.map((day) => (
            <TouchableOpacity
              key={day.id}
              activeOpacity={0.7}
              style={styles.dayCard}
              onPress={() => handleDayPress(day)}
            >
              <View style={styles.dayCardIconWrapper}>
                {day.isLocked ? (
                  <Ionicons name="lock-closed-outline" size={wp("6%")} color="#FF9EA7" />
                ) : (
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressText}>{day.progressPercent}%</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.dayCardInfo}>
                <Text style={styles.dayLabelText}>{day.dayLabel}</Text>
                <Text style={styles.dayTypeText}>{day.type}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ================= FLOATING BOTTOM NAVIGATION ================= */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNavWrapper}>
          {/* Kế hoạch tập - Active */}
          <TouchableOpacity style={styles.navItemActive}>
            <Ionicons name="barbell-outline" size={wp("6%")} color="#18BEC3" />
            <Text style={styles.navTextActive}>Kế hoạch tập</Text>
          </TouchableOpacity>

          {/* Feed */}
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="albums-outline" size={wp("6%")} color="#404040" />
            <Text style={styles.navText}>Feed</Text>
          </TouchableOpacity>

          {/* Tin nhắn */}
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="chatbubble-outline" size={wp("6%")} color="#404040" />
            <Text style={styles.navText}>Tin nhắn</Text>
          </TouchableOpacity>

          {/* Sổ tay */}
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="book-outline" size={wp("6%")} color="#404040" />
            <Text style={styles.navText}>Sổ tay</Text>
          </TouchableOpacity>

          {/* Thêm */}
          <TouchableOpacity style={styles.navItem}>
            <View>
              <Ionicons name="ellipsis-horizontal" size={wp("6%")} color="#404040" />
              <View style={styles.notificationDot}>
                <Text style={styles.notificationText}>1</Text>
              </View>
            </View>
            <Text style={styles.navText}>Thêm</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: "#FFFFFF",
  },

  // Main Header Top
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp("5%"),
    paddingTop: hp("2%"),
    backgroundColor: "#FFFFFF",
  },
  headerIconBtn: {
    width: wp("11%"),
    height: wp("11%"),
    borderRadius: wp("5.5%"),
    borderWidth: 1,
    borderColor: "#EEF3F5",
    alignItems: "center",
    justifyContent: "center",
  },
  mainHeaderTitle: {
    fontSize: wp("5%"),
    fontWeight: "700",
    color: "#111C1E",
  },

  // Tabs Header (Trang tổng quan | Kế hoạch tập | Chế độ ăn)
  tabsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: hp("3%"),
    marginBottom: hp("2%"),
    paddingHorizontal: wp("2%"),
  },
  tabText: {
    color: "#5B7C84",
    fontSize: wp("3.8%"),
    fontWeight: "500",
  },
  activeTabWrapper: {
    backgroundColor: "#3A5C70", // Dark blue-gray
    paddingVertical: hp("1%"),
    paddingHorizontal: wp("5%"),
    borderRadius: wp("5%"),
  },
  activeTabText: {
    color: "#FFFFFF",
    fontSize: wp("3.8%"),
    fontWeight: "600",
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp("4%"),
    paddingBottom: hp("15%"),
  },

  // Banner
  bannerContainer: {
    width: "100%",
    height: hp("22%"),
    borderRadius: wp("4%"),
    overflow: "hidden",
    marginBottom: hp("3%"),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bannerImage: {
    resizeMode: "cover",
  },
  bannerOverlay: {
    flex: 1,
    padding: wp("5%"),
    justifyContent: "center",
  },
  bannerContent: {
    flex: 1,
    justifyContent: "center",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: wp("5.5%"),
    fontWeight: "700",
    marginBottom: hp("1%"),
  },
  bannerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("0.5%"),
  },
  starsContainer: {
    flexDirection: "row",
    marginLeft: wp("1%"),
  },
  bannerInfoText: {
    color: "#EAF9FB",
    fontSize: wp("3.2%"),
    fontWeight: "400",
  },
  bannerHighlightText: {
    color: "#18BEC3", // Teal highlight
    fontSize: wp("3.2%"),
    fontWeight: "600",
    marginVertical: hp("0.5%"),
  },
  shareButton: {
    position: "absolute",
    bottom: wp("4%"),
    right: wp("4%"),
    width: wp("10%"),
    height: wp("10%"),
    borderRadius: wp("5%"),
    backgroundColor: "rgba(24, 190, 195, 0.8)", // Semi-transparent teal
    alignItems: "center",
    justifyContent: "center",
  },

  // List Header
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp("2%"),
    paddingHorizontal: wp("1%"),
  },
  listHeaderTitle: {
    color: "#5B7C84",
    fontSize: wp("4.2%"),
    fontWeight: "600",
  },

  // Days List
  daysListContainer: {
    gap: hp("1.5%"),
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: wp("3%"),
    padding: wp("4%"),
    borderWidth: 1,
    borderColor: "#EEF3F5",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  dayCardIconWrapper: {
    width: wp("14%"),
    alignItems: "center",
    justifyContent: "center",
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
  progressText: {
    color: "#FF5262",
    fontSize: wp("3.5%"),
    fontWeight: "700",
  },
  dayCardInfo: {
    flex: 1,
    marginLeft: wp("3%"),
  },
  dayLabelText: {
    color: "#5B7C84",
    fontSize: wp("3.5%"),
    marginBottom: hp("0.3%"),
  },
  dayTypeText: {
    color: "#111C1E",
    fontSize: wp("4.2%"),
    fontWeight: "600",
  },

  // Floating Bottom Navigation
  bottomNavContainer: {
    position: "absolute",
    bottom: hp("2%"),
    left: wp("4%"),
    right: wp("4%"),
    alignItems: "center",
  },
  bottomNavWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: wp("8%"),
    height: hp("8.5%"),
    width: "100%",
    paddingHorizontal: wp("2%"),
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    flex: 1.2,
    height: "80%",
    backgroundColor: "#EAF9FB",
    borderRadius: wp("6%"),
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    color: "#404040",
    fontSize: wp("2.5%"),
    marginTop: hp("0.5%"),
    fontWeight: "500",
  },
  navTextActive: {
    color: "#18BEC3",
    fontSize: wp("2.8%"),
    marginTop: hp("0.5%"),
    fontWeight: "700",
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

export default WorkoutExercisePlan;
