import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator, StatusBar } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import apiFitlife from "../../../../general/api";
import { COLORS, SHADOWS } from "../../../../general/theme";

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
      setApiData(days);
      setProgram(days.length > 0 ? days[0] : null);

      const initialProgress: Record<number, number> = {};
      days.forEach((day: any) => {
        const id = Number(day.id_chuong_trinh_bai_tap);
        if (id > 0) {
          initialProgress[id] = 0;
        }
      });
      setProgressByDay(initialProgress);

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
        setTongNgayDaHoanThanh(Number(data?.tong_ngay_da_hoan_thanh ?? 0));
        setTongNgayTap(Number(data?.tong_ngay_tap ?? 0));
      }
    } catch (error: any) {
      console.log("Lỗi lấy tiến độ huấn luyện:", error.response?.data ?? error.message);
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
            .map((day: any) => Number(day.id_chuong_trinh_bai_tap))
            .filter((id: number) => Number.isFinite(id) && id > 0)
        ),
      ];

      if (ids.length === 0) {
        setProgressByDay({});
        return;
      }

      const res = await apiFitlife.get("/client/buoi-tap/phan-tram-hoan-thanh-tat-ca", {
        params: { ids },
      });

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
          progressMap[id] = Math.max(0, Math.min(100, percent));
        }
      });

      setProgressByDay(progressMap);
    } catch (error: any) {
      console.log("Lỗi lấy phần trăm hoàn thành:", error.response?.data ?? error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getProgramExercises();
      getCompletedDays();
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TOP BANNER */}
        <View style={styles.bannerWrapper}>
          <ImageBackground
            source={{
              uri:
                program?.anh_dai_dien ||
                "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
            }}
            style={styles.bannerContainer}
            imageStyle={styles.bannerImage}
          >
            <LinearGradient
              colors={["rgba(7, 88, 101, 0.6)", "rgba(7, 88, 101, 0.95)"]}
              style={styles.bannerOverlay}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>
                  {program?.ten_chuong_trinh ?? "Chương trình tập"}
                </Text>

                <View style={styles.bannerInfoRow}>
                  <View style={styles.badge}>
                    <Ionicons name="location-outline" size={12} color={COLORS.white} />
                    <Text style={styles.badgeText}>
                      {program?.ten_noi_tap ?? "Chưa xác định"}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Ionicons name="speedometer-outline" size={12} color={COLORS.white} />
                    <Text style={styles.badgeText}>
                      {program?.ten_cap_do ?? "Trung cấp"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.bannerHighlightText}>
                  {program?.so_ngay ?? 0} ngày ({program?.so_buoi_moi_tuan ?? 0} buổi/tuần) • Đã xong:{" "}
                  {tongNgayDaHoanThanh}/{tongNgayTap} ngày
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* LIST HEADER */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Danh sách ngày tập luyện</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setIsReversed((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={16} color={COLORS.primary} />
            <Text style={styles.sortButtonText}>{isReversed ? "Giảm dần" : "Tăng dần"}</Text>
          </TouchableOpacity>
        </View>

        {/* LIST OF DAYS */}
        <View style={styles.daysListContainer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Đang tải lịch tập...</Text>
            </View>
          ) : apiData.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="barbell-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Chưa có ngày tập luyện nào.</Text>
            </View>
          ) : (
            (isReversed ? [...apiData].reverse() : apiData).map((day: any) => {
              const isUnlocked = Number(day.tinh_trang) === 1;
              const progress = progressByDay[Number(day.id_chuong_trinh_bai_tap)] ?? 0;
              const progressColor =
                progress >= 100 ? COLORS.accentGreen : progress > 0 ? COLORS.accentGold : COLORS.primary;

              return (
                <TouchableOpacity
                  key={day.id_chuong_trinh_bai_tap}
                  style={[styles.dayCard, !isUnlocked && styles.dayCardLocked]}
                  activeOpacity={isUnlocked ? 0.8 : 1}
                  onPress={() => {
                    if (!isUnlocked) return;
                    const params = {
                      ngayThu: day.ngay_thu,
                      dayType: day.ten_ngay_tap,
                      thoi_gian_phut: day.thoi_gian_phut,
                      id_chuong_trinh_bai_tap: day.id_chuong_trinh_bai_tap,
                      id_dang_ky_chuong_trinh: day.id_dang_ky_chuong_trinh,
                      id_chuong_trinh: day.id_chuong_trinh,
                      id_lich_tap: day.id_lich_tap,
                    };
                    navigation.navigate("ExercisePage", params);
                  }}
                >
                  {/* Status Circle */}
                  <View style={styles.dayCardIconWrapper}>
                    {isUnlocked ? (
                      <View style={[styles.progressCircle, { borderColor: progressColor }]}>
                        <Text style={[styles.progressText, { color: progressColor }]}>
                          {progress}%
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.lockCircle}>
                        <Ionicons name="lock-closed" size={18} color={COLORS.textMuted} />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.dayCardInfo}>
                    <Text style={styles.dayLabelText}>Ngày thứ {day.ngay_thu}</Text>
                    <Text style={styles.dayTypeText} numberOfLines={1}>
                      {day.ten_ngay_tap}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.sessionText}>Buổi {day.buoi_thuc_te}</Text>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Text style={styles.dateText}>
                        {day.thu_tap || "Thứ 2"} · {day.ngay_tap_hien_thi || "Hôm nay"}
                      </Text>
                    </View>
                  </View>

                  {/* Chevron Right */}
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isUnlocked ? COLORS.primary : COLORS.border}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkoutExercisePlan;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  bannerWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    ...SHADOWS.card,
  },
  bannerContainer: {
    width: "100%",
    height: 160,
  },
  bannerImage: {
    resizeMode: "cover",
  },
  bannerOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: "flex-end",
  },
  bannerContent: {},
  bannerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  bannerInfoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
  },
  bannerHighlightText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  listHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  daysListContainer: {
    gap: 12,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  dayCardLocked: {
    opacity: 0.65,
    backgroundColor: COLORS.borderLight,
  },
  dayCardIconWrapper: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 11,
    fontWeight: "700",
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dayLabelText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  dayTypeText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  sessionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dotSeparator: {
    marginHorizontal: 5,
    color: COLORS.textMuted,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
