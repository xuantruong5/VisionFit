import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import LinearGradient from "react-native-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import apiFitlife from "../../../../general/api";
const WorkoutExercisePlan = ({ navigation: propNav, route }: any) => {
  const navHook = useNavigation<any>();
  const navigation = propNav || navHook;
  const [program, setProgram] = useState<any>(null);
  const [apiData, setApiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isReversed, setIsReversed] = useState(false);
  const [progressByDay, setProgressByDay] = useState<Record<number, number>>({});
  const [tongNgayDaHoanThanh, setTongNgayDaHoanThanh] = useState(0);
  const [tongNgayTap, setTongNgayTap] = useState(0);

  const getProgramExercises = async () => {
    setLoading(true);
    try {
      const res = await apiFitlife.get("/client/list-program-exercises");
      if (!res.data.success || !Array.isArray(res.data.data)) {
        setProgram(null);
        setApiData([]);
        setProgressByDay({});
        return;
      }
      const days = res.data.data;

      // Hiển thị danh sách ngay khi API chính trả về
      setApiData(days);
      setProgram(days.length > 0 ? days[0] : null);

      // Mặc định 0% để giao diện không phải đợi API tiến độ
      const initialProgress: Record<number, number> = {};

      days.forEach((day: any) => {
        const id = Number(day.id_chuong_trinh_bai_tap);

        if (id > 0) {
          initialProgress[id] = 0;
        }
      });

      setProgressByDay(initialProgress);

      // Không await: không chặn trạng thái loading
      getProgressByDay(days).catch((error) => {
        console.log("Lỗi tải tiến độ:", error);
      });
    } catch (error) {
      console.log("Lỗi lấy chương trình tập:", error);
      setProgram(null);
      setApiData([]);
      setProgressByDay({});
    } finally {
      setLoading(false);
    }
  };
  const getCompletedDays = async () => {
    try {
      const res = await apiFitlife.get("/client/huan-luyen-tiep-theo");

      if (res.data?.success) {
        const data = res.data.data;
        setTongNgayDaHoanThanh( Number(data?.tong_ngay_da_hoan_thanh ?? 0) );
        setTongNgayTap( Number(data?.tong_ngay_tap ?? 0));
      }
    } catch (error: any) {
      console.log(
        "Lỗi lấy tiến độ huấn luyện:",
        error.response?.data ?? error.message
      );
    }
  };




  const getProgressByDay = async (days: any[]) => {
    try {
      if (days.length === 0) {
        setProgressByDay({});
        return;
      }
      const ids = [
        ...new Set(
          days
            .map((day: any) =>
              Number(day.id_chuong_trinh_bai_tap)
            )
            .filter((id: number) => Number.isFinite(id) && id > 0)
        ),
      ];

      if (ids.length === 0) {
        setProgressByDay({});
        return;
      }

      const res = await apiFitlife.get(
        "/client/buoi-tap/phan-tram-hoan-thanh-tat-ca",
        {
          params: {
            ids,
          },
        }
      );

      console.log("API phần trăm hoàn thành:", res.data);

      if (!res.data.success || !Array.isArray(res.data.data)) {
        return;
      }

      const progressMap: Record<number, number> = {};
      ids.forEach((id) => {
        progressMap[id] = 0;
      });

      res.data.data.forEach((item: any) => {
        const id = Number(item.id_chuong_trinh_bai_tap);
        const percent = Number(item.phan_tram_hoan_thanh ?? 0);

        if (Number.isFinite(id) && id > 0) {
          progressMap[id] = Math.max(
            0,
            Math.min(100, percent)
          );
        }
      });

      setProgressByDay(progressMap);
    } catch (error: any) {
      console.log(
        "Lỗi lấy phần trăm hoàn thành:",
        error.response?.data ?? error.message
      );
    }
  };




  useFocusEffect(
    useCallback(() => {
      getProgramExercises();
      getCompletedDays();
    }, [])
  );



  const handleDayPress = (day: any) => {
    if (day.isLocked) return;
    navigation.navigate("ExercisePage", {
      dayLabel: day.dayLabel,
      dayType: day.type,
      ngayThu: day.ngayThu,
      id_chuong_trinh_bai_tap: day.id,
      id_dang_ky_chuong_trinh: program?.id_dang_ky_chuong_trinh,
      id_chuong_trinh: program?.id_chuong_trinh,

    });
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ================= TOP BANNER ================= */}
        <ImageBackground source={{ uri: program?.anh_dai_dien }} style={styles.bannerContainer} imageStyle={styles.bannerImage} >
          {/* Gradient Overlay for better text readability */}
          <LinearGradient
            colors={["rgba(4, 38, 48, 0.4)", "rgba(4, 38, 48, 0.9)"]}
            style={styles.bannerOverlay}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{program?.ten_chuong_trinh ?? "Chương trình tập"}</Text>

              <View style={styles.bannerInfoRow}>
                <Ionicons name="home" size={wp("3.5%")} color="#FFFFFF" />
                <Text style={styles.bannerInfoText}> {program?.ten_noi_tap ?? "Chưa xác định"} </Text>
                <View style={styles.starsContainer}>
                  <Ionicons name="star-outline" size={wp("3%")} color="#FFFFFF" />
                  <Ionicons name="star-outline" size={wp("3%")} color="#FFFFFF" />
                  <Ionicons name="star-outline" size={wp("3%")} color="#FFFFFF" />
                </View>
                <Text style={styles.bannerInfoText}> {" "}{program?.ten_cap_do ?? "Chưa xác định"}</Text>
              </View>

              <Text style={styles.bannerHighlightText}>
                {program?.so_ngay ?? 0} ngày tập luyện
                {" "}({program?.so_buoi_moi_tuan ?? 0} buổi mỗi tuần)
              </Text>

              <Text style={styles.bannerInfoText}>
                Tập luyện hoàn tất: {tongNgayDaHoanThanh}/{tongNgayTap} ngày
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
          <TouchableOpacity onPress={() => setIsReversed(prev => !prev)}>
            <Ionicons name="swap-vertical" size={wp("5.5%")} color="#18BEC3" />
          </TouchableOpacity>
        </View>

        {/* ================= LIST OF DAYS ================= */}
        <View style={styles.daysListContainer}>
          {loading ? (
            <Text style={{ textAlign: "center", color: "#18BEC3" }}>
              Đang tải ngày tập...
            </Text>
          ) : apiData.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#5B7C84" }}>
              Chưa có ngày tập luyện.
            </Text>
          ) : (
            (isReversed ? [...apiData].reverse() : apiData).map((day: any) => {
              const isUnlocked = Number(day.tinh_trang) === 1;
              return (
                <TouchableOpacity
                  key={day.id_chuong_trinh_bai_tap}
                  style={styles.dayCard}
                  activeOpacity={isUnlocked ? 0.7 : 1}
                  onPress={() => {
                    if (!isUnlocked) return;
                    const params = {
                      ngayThu: day.ngay_thu,
                      dayType: day.ten_ngay_tap,
                      thoi_gian_phut: day.thoi_gian_phut,
                      id_chuong_trinh_bai_tap: day.id_chuong_trinh_bai_tap,
                      id_dang_ky_chuong_trinh: day.id_dang_ky_chuong_trinh,
                      id_chuong_trinh: day.id_chuong_trinh,
                      id_lich_tap: day.id_lich_tap, // BỔ SUNG DÒNG NÀY
                    };
                    // console.log("===== DỮ LIỆU GỬI SANG ExercisePage =====");
                    // console.log("Ngày tập:", day);
                    // console.log("Params:", JSON.stringify(params, null, 2));
                    navigation.navigate("ExercisePage", params);
                  }}
                >
                  {/* Chỉ icon thay đổi theo trạng thái */}
                  <View style={styles.dayCardIconWrapper}>
                    {isUnlocked ? (
                      (() => {
                        const progress = progressByDay[Number(day.id_chuong_trinh_bai_tap)] ?? 0;
                        const progressColor = progress <= 0 ? "#FF5262"
                          : progress < 50
                            ? "#F4C542"
                            : "#18BEC3";
                        return (
                          <View style={[ styles.progressCircle, { borderColor: progressColor }, ]} >
                            <Text style={[ styles.progressText,  { color: progressColor }, ]} >
                              {progress}%
                            </Text>
                          </View>
                        );
                      })()
                    ) : (
                      <View style={styles.lockCircle}>
                        <Ionicons name="lock-closed-outline" size={wp("6%")} color="#FF9EA7" style={{ opacity: 0.5 }} />
                      </View>
                    )}
                  </View>

                  {/* Nội dung card giữ nguyên độ sáng */}
                  <View style={styles.dayCardInfo}>
                    <Text style={styles.dayLabelText}>
                      {day.ngay_thu} ngày tập luyện
                    </Text>
                    <Text style={styles.dayTypeText}>
                      {day.ten_ngay_tap}
                    </Text>
                    <Text style={styles.sessionText}>
                      Buổi tập thứ {day.buoi_thuc_te}
                    </Text>
                    <Text style={styles.dateText}>
                      {day.thu_tap} · {day.ngay_tap_hien_thi}
                    </Text>
                  </View>
                  {isUnlocked && (
                    <View style={{ width: wp("3%"), height: wp("3%"), borderRadius: wp("1.5%"), backgroundColor: "#18BEC3", }} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 10
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
    borderRadius: wp("4%"),
    padding: wp("4%"),
    minHeight: hp("13%"),
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },

  dayCardLocked: {
    opacity: 0.65,
    backgroundColor: "#FCFCFC",
  },

  dayCardIconWrapper: {
    width: wp("17%"),
    alignItems: "center",
    justifyContent: "center",
  },

  progressCircle: {
    width: wp("13%"),
    height: wp("13.2%"),
    borderRadius: wp("6%"),
    borderWidth: 2,
    borderColor: "#FFB0B7",
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
    justifyContent: "center",
  },

  dayLabelText: {
    color: "#7293AF",
    fontSize: wp("4%"),
    marginBottom: hp("0.7%"),
  },

  dayTypeText: {
    color: "#222222",
    fontSize: wp("4.5%"),
    fontWeight: "700",
  },
  sessionText: {
    color: "#18BEC3",
    fontSize: wp("3.5%"),
    fontWeight: "400",
    marginTop: hp("0.5%"),
  },

  dateText: {
    color: "#777777",
    fontSize: wp("3.5%"),
    fontWeight: "400",
    marginTop: hp("0.5%"),
  },


  activeDot: {
    width: wp("3%"),
    height: wp("3%"),
    borderRadius: wp("1.5%"),
    backgroundColor: "#18BEC3",
    marginLeft: wp("2%"),
  },
  lockCircle: {
    width: wp("12%"),
    height: wp("12%"),
    borderRadius: wp("6%"),
    borderWidth: 2,
    borderColor: "#FF9EA7",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.65,
  },




});

export default WorkoutExercisePlan;
