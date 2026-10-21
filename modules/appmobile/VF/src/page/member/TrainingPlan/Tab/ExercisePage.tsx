import React, { useState, useEffect } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import apiFitlife from "../../../../general/api";

type Exercise = {
  id: number;
  id_bai_tap: number;
  ten_bai_tap: string;
  thoi_gian_phut: number;
  rep_yeu_cau: number;
  set_yeu_cau: number;
  giay_yeu_cau: number;
  muc_ta_toi_thieu: string | number;
  thiet_bi: string;
  video_huong_dan: string;
  video_sai: string;
  huong_dan: string;
  canh_bao: string;
  noi_tap: string;
  mo_ta: string;

  // Các trường phục vụ hiển thị danh sách
  name: string;
  sets: string;
  duration: string;
  image: string;
  time: string;
  video?: string;
  completed: boolean;
};

const ExercisePage = ({ navigation, route }: any) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const idDangKy = route?.params?.id_dang_ky_chuong_trinh;
  const idNgayTap = route?.params?.id_chuong_trinh_bai_tap;
  const [skipping, setSkipping] = useState(false);
 

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const res = await apiFitlife.get(`/client/list-program-exercises/${idNgayTap}`);
      if (res.data.success && Array.isArray(res.data.data)) {
        const dataNgayTap = res.data.data.filter(
          (item: any) =>
            Number(item.id_chuong_trinh_bai_tap) === Number(idNgayTap)
        );

        const danhSachBaiTap: Exercise[] = dataNgayTap.map(
          (item: any) => ({
            id: item.id_bai_tap,
            name: item.ten_bai_tap,
            sets: `${item.set_yeu_cau ?? 0} hiệp x ${item.rep_yeu_cau ?? 0} lần x ${item.muc_ta_toi_thieu ?? 0}`,
            duration: `${item.thoi_gian_phut ?? 0} phút`,
            image: item.anh_bai_tap ?? "",
            video: item.video_huong_dan ?? "",
            completed: false,
            ten_bai_tap: item.ten_bai_tap ?? "",
            thoi_gian_phut: item.thoi_gian_phut ?? 0,
            rep_yeu_cau: item.rep_yeu_cau ?? 0,
            set_yeu_cau: item.set_yeu_cau ?? 0,
            giay_yeu_cau: item.giay_yeu_cau ?? 0,
            muc_ta_toi_thieu: item.muc_ta_toi_thieu ?? "",
            thiet_bi: item.thiet_bi ?? "",
            video_huong_dan: item.video_huong_dan ?? "",
            video_sai: item.video_sai ?? "",
            huong_dan: item.huong_dan ?? "",
            canh_bao: item.canh_bao ?? "",
            noi_tap: item.noi_tap ?? "",
            mo_ta: item.mo_ta ?? "",

          })
        );
          setExercises(danhSachBaiTap);
        } else {
          setExercises([]);
        }
    } catch (error: any) {
      console.log("LỖI API:", error.response?.data ?? error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await apiFitlife.post(`/client/chuong-trinh-bai-tap/${idNgayTap}/bo-qua`, {
        cho_phep_bo_qua: 1,
      });
      navigation.goBack();
    } catch (error) {
      console.log("Lỗi bỏ qua:", error);
    }
  };



  useEffect(() => {
    fetchExercises();
  }, [idDangKy, idNgayTap]);
  const completedCount = exercises.filter((e) => e.completed).length;
  const progressPercent = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;


  const handleExercisePress = (exercise: Exercise) => {
    navigation?.navigate("ReportPage", {
      exercise: {
        id_bai_tap: exercise.id_bai_tap,
        ten_bai_tap: exercise.ten_bai_tap,
        thoi_gian_phut: exercise.thoi_gian_phut,
        rep_yeu_cau: exercise.rep_yeu_cau,
        set_yeu_cau: exercise.set_yeu_cau,
        giay_yeu_cau: exercise.giay_yeu_cau,
        muc_ta_toi_thieu: exercise.muc_ta_toi_thieu,
        thiet_bi: exercise.thiet_bi,
        video_huong_dan: exercise.video_huong_dan,
        video_sai: exercise.video_sai,
        huong_dan: exercise.huong_dan,
        canh_bao: exercise.canh_bao,
        noi_tap: exercise.noi_tap,
        mo_ta: exercise.mo_ta,
      },
    });
  };

  const handleStart = () => {
    console.log("Bắt đầu tập luyện...");
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={() => navigation?.goBack()} >
          <Ionicons name="arrow-back" size={wp("5.5%")} color="#607D8B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài tập </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.moreButton} onPress={handleSkip}disabled={skipping}>
            {skipping ? (
              <ActivityIndicator size="small" color="#607D8B" />
            ) : (
              <Text style={styles.skipText}>Bỏ qua</Text>
            )}
        </TouchableOpacity>
      </View>

      {/* ================= CONTENT ================= */}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
            <Text style={styles.sessionDayLabel}> Ngày tập {route.params?.ngayThu ?? 1} </Text>
            <Text style={styles.sessionType}>{route.params?.dayType ?? "Ngày tập luyện"} </Text>
            <View style={styles.sessionMeta}>
              <Ionicons name="time-outline" size={wp("3.2%")} color="#8FA9B2" />
              <Text style={styles.sessionMetaText}> ~ {route.params?.thoi_gian_phut ?? 0} phút</Text>
              <View style={styles.metaDivider} />
              <Ionicons name="barbell-outline" size={wp("3.2%")} color="#8FA9B2" />
              <Text style={styles.sessionMetaText}>
                10 bài
              </Text>
            </View>
          </View>

          {/* Right: Completed badge */}
          <View style={styles.completedBadge}>
            <Text style={styles.completedCount}>0</Text>
            <Text style={styles.completedLabel}>xong</Text>
          </View>
        </View>

        {/* ================= SECTION TITLE ================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh sách bài tập</Text>
          <Text style={styles.sectionSubtitle}>
            0/10 hoàn thành
          </Text>
        </View>

        {/* ================= EXERCISE LIST ================= */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#18BEC3"
            style={{ marginVertical: 30 }}
          />
        ) : exercises.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#5B7C84", padding: 20 }}>
            Ngày tập này chưa có bài tập.
          </Text>
        ) : (
          <View style={styles.exerciseList}>
            {exercises.map((exercise, index) => (
              <View key={exercise.id}>
                <TouchableOpacity activeOpacity={0.75} style={styles.exerciseItem} onPress={() => handleExercisePress(exercise)}>
                  {/* Image */}
                  <View style={styles.exerciseImageWrapper}>
                    <Image source={{ uri: exercise.image }} style={styles.exerciseImage} resizeMode="contain"/>
                  </View>

                  {/* Info */}
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName} numberOfLines={2}>
                      {exercise.name}
                    </Text>

                    <View style={styles.exerciseTags}>
                      <View style={styles.tagPill}>
                        <Ionicons name="repeat-outline" size={wp("3%")} color="#18BEC3" />
                        <Text style={styles.tagText}>{exercise.sets}</Text>
                      </View>

                      <View style={[styles.tagPill, styles.tagPillGray]}>
                        <Ionicons name="body-outline" size={wp("3%")} color="#8FA9B2"/>
                        <Text style={[styles.tagText, styles.tagTextGray]}>
                          {exercise.duration}
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

                {/* Divider: không hiển thị sau bài cuối */}
                {index < exercises.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* ================= TIPS CARD ================= */}

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={wp("4.5%")} color="#E8A020" />
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
        <TouchableOpacity activeOpacity={0.85} style={[styles.startButton, progressPercent === 100 && styles.startButtonDone,]} onPress={handleStart}>
          <Ionicons name={progressPercent === 100 ? "checkmark-circle" : "play"} size={wp("5%")} color="#FFFFFF" style={styles.startIcon} />
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
    paddingTop: hp("7%"),
  },
  header: {
    height: hp("7%"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp("4%"),
    // backgroundColor: "#FFFFFF",
    // borderBottomWidth: 1,
    borderBottomColor: "#EEF3F5",
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 3,
  },

  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: wp("4.7%"),
    fontWeight: "800",
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
    width: wp("20%"),
    height: wp("12%"),
    borderRadius: wp("8%"),
    // borderWidth: 1.5,
    // borderColor: "#607D8B",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  skipText: {
    fontSize: wp("4.2%"),
    color: "#607D8B",
    fontWeight: "600",
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
    marginBottom: hp("5%"),
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
    paddingBottom: hp("10%"),
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
