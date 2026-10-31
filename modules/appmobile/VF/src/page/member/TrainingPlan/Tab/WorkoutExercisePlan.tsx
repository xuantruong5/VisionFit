import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar } from "react-native";
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
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TOP BANNER */}
        <View style={styles.bannerWrapper}>
          <View style={styles.bannerContainer}>
            <Image
              source={{
                uri:
                  program?.anh_dai_dien ||
                  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
              }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(13,127,141,0.55)", "rgba(7,88,101,0.95)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.bannerOverlay}
            >
              <View style={styles.bannerCircle} />
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

                <View style={styles.bannerHighlightRow}>
                <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.bannerHighlightText}>
                  {program?.so_ngay ?? 0} ngày ({program?.so_buoi_moi_tuan ?? 0} buổi/tuần) • Đã xong:{" "}
                  {tongNgayDaHoanThanh}/{tongNgayTap} ngày
                </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
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
              <View style={styles.emptyIcon}>
                <Ionicons name="barbell-outline" size={34} color={COLORS.primary} />
              </View>
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  bannerWrapper: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.card,
    shadowOpacity: 0.14,
    elevation: 6,
  },
  bannerContainer: {
    width: "100%",
    height: 172,
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: "flex-end",
  },
  bannerCircle: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -70,
    right: -50,
  },
  bannerContent: {},
  bannerTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 10,
  },
  bannerInfoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11.5,
    fontWeight: "700",
  },
  bannerHighlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerHighlightText: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "600",
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  listHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "700",
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
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  dayCardLocked: {
    opacity: 0.6,
    backgroundColor: COLORS.white,
    elevation: 0,
    shadowOpacity: 0,
  },
  dayCardIconWrapper: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "800",
  },
  lockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dayLabelText: {
    color: COLORS.primary,
    fontSize: 11.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dayTypeText: {
    color: COLORS.textPrimary,
    fontSize: 15.5,
    fontWeight: "800",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  sessionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: COLORS.textLight,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  chevronWrapLocked: {
    backgroundColor: COLORS.borderLight,
  },
});
