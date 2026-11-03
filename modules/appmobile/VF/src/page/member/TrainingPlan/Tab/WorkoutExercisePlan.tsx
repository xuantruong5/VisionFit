import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import apiFitlife from "../../../../general/api";
import { PASTEL, RADIUS, SOFT_SHADOW } from "../../../../general/theme";

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

  // check quyền đăng ký gói chưa 
  const [checkingDayId, setCheckingDayId] = useState<number | null>(null);

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

  const handlePressDay = async (day: any) => {
    // Chưa mở khóa thì không cho nhấn
    if (Number(day.tinh_trang) !== 1) return;
    const idDangKy = Number(day.id_dang_ky_chuong_trinh);
    const idChuongTrinhBaiTap = Number(day.id_chuong_trinh_bai_tap);
    if (!idDangKy || !idChuongTrinhBaiTap) {
      Alert.alert("Thông báo", "Không tìm thấy thông tin đăng ký chương trình.");
      return;
    }
    try {
      setCheckingDayId(idChuongTrinhBaiTap);
      // Gọi API kiểm tra quyền tập
      const res = await apiFitlife.post("/client/check-quyen-tap", {
        id_dang_ky_chuong_trinh: idDangKy,
        id_chuong_trinh_bai_tap: idChuongTrinhBaiTap,
      });
      const data = res.data?.data;
      // Backend không cho phép tập
      if (!data?.duoc_phep_tap) {
        Alert.alert(
          "Yêu cầu đăng ký gói tập",
          res.data?.message || "Bạn cần đăng ký gói tập để tiếp tục.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                // Đóng thông báo, ở lại màn hình hiện tại
              },
            },
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("WorkoutSelectionScreen" as never);
              },
            },
          ],
          { cancelable: true }
        );
        return;
      }
      // Được phép tập thì chuyển sang ExercisePage
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

    } catch (error: any) {
      console.log(
        "Lỗi kiểm tra quyền tập:",
        error.response?.data ?? error.message
      );

      Alert.alert(
        "Thông báo",
        error.response?.data?.message || "Không thể kiểm tra quyền tập. Vui lòng thử lại."
      );
    } finally {
      setCheckingDayId(null);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} >
        {/* Tóm tắt chương trình */}
        <View style={styles.summaryCard}>
          <Image source={{ uri: program?.anh_dai_dien || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",}}
            style={styles.summaryImage} resizeMode="cover"/>
          <View style={styles.flex}>
            <Text style={styles.summaryTitle} numberOfLines={2}>
              {program?.ten_chuong_trinh ?? "Chương trình tập"}
            </Text>
            <Text style={styles.summaryMeta}>
              {program?.so_ngay ?? 0} ngày · {program?.so_buoi_moi_tuan ?? 0} buổi/tuần
            </Text>
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: PASTEL.tealSoft }]}>
                <Text style={[styles.chipText, { color: PASTEL.teal }]} numberOfLines={1}>
                  {program?.ten_noi_tap ?? "Chưa xác định"}
                </Text>
              </View>
              <View style={[styles.chip, { backgroundColor: PASTEL.butter }]}>
                <Text style={[styles.chipText, { color: PASTEL.butterInk }]} numberOfLines={1}>
                  {program?.ten_cap_do ?? "Trung cấp"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.summaryCount}>
            <Text style={styles.summaryCountValue}>{tongNgayDaHoanThanh}</Text>
            <Text style={styles.summaryCountTotal}>/{tongNgayTap}</Text>
          </View>
        </View>

        {/* Tiêu đề danh sách */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Ngày tập luyện</Text>
          <TouchableOpacity style={styles.sortButton} onPress={() => setIsReversed((prev) => !prev)} activeOpacity={0.7}>
            <Ionicons name="swap-vertical" size={15} color={PASTEL.ink} />
            <Text style={styles.sortButtonText}>{isReversed ? "Giảm dần" : "Tăng dần"}</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách ngày tập */}
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={PASTEL.teal} />
            <Text style={styles.stateText}>Đang tải lịch tập...</Text>
          </View>
        ) : apiData.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Chưa có ngày tập luyện nào.</Text>
          </View>
        ) : (
          (isReversed ? [...apiData].reverse() : apiData).map((day: any) => {
            const isUnlocked = Number(day.tinh_trang) === 1;
            const progress = progressByDay[Number(day.id_chuong_trinh_bai_tap)] ?? 0;
            const ring =
              progress >= 100
                ? { bg: PASTEL.mint, ink: PASTEL.mintInk }
                : progress > 0
                ? { bg: PASTEL.butter, ink: PASTEL.butterInk }
                : { bg: PASTEL.tealSoft, ink: PASTEL.teal };

            return (
              <TouchableOpacity key={day.id_chuong_trinh_bai_tap}
                style={[styles.dayCard, !isUnlocked && styles.dayCardLocked]} activeOpacity={isUnlocked ? 0.8 : 1} onPress={() => handlePressDay(day)}
                disabled={!isUnlocked || checkingDayId !== null} >
                {isUnlocked ? (
                  <View style={[styles.statusCircle, { backgroundColor: ring.bg }]}>
                    <Text style={[styles.statusText, { color: ring.ink }]}>{progress}%</Text>
                  </View>
                ) : (
                  <View style={[styles.statusCircle, styles.statusCircleLocked]}>
                    <Ionicons name="lock-closed-outline" size={18} color={PASTEL.inkMuted} />
                  </View>
                )}

                <View style={styles.flex}>
                  <Text style={styles.dayLabel}>Ngày thứ {day.ngay_thu}</Text>
                  <Text style={styles.dayTitle} numberOfLines={1}>
                    {day.ten_ngay_tap}
                  </Text>
                  <Text style={styles.dayMeta}>
                    Buổi {day.buoi_thuc_te} · {day.thu_tap || "Thứ 2"} · {day.ngay_tap_hien_thi || "Hôm nay"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default WorkoutExercisePlan;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // TÓM TẮT
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: PASTEL.surface,
    borderRadius: RADIUS.lg,
    padding: 10,
    paddingRight: 16,
    ...SOFT_SHADOW,
  },
  summaryImage: {
    width: 92,
    height: 104,
    borderRadius: 22,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "500",
    color: PASTEL.ink,
  },
  summaryMeta: {
    fontSize: 12.5,
    color: PASTEL.inkSoft,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  summaryCount: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  summaryCountValue: {
    fontSize: 30,
    fontWeight: "300",
    color: PASTEL.ink,
  },
  summaryCountTotal: {
    fontSize: 14,
    color: PASTEL.inkMuted,
    marginBottom: 5,
  },

  // TIÊU ĐỀ DANH SÁCH
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: PASTEL.ink,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PASTEL.surface,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: RADIUS.pill,
    ...SOFT_SHADOW,
  },
  sortButtonText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: PASTEL.ink,
  },

  // NGÀY TẬP
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: PASTEL.surface,
    borderRadius: 24,
    padding: 12,
    paddingRight: 16,
    marginBottom: 10,
    ...SOFT_SHADOW,
  },
  dayCardLocked: {
    backgroundColor: PASTEL.surfaceSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  statusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCircleLocked: {
    backgroundColor: PASTEL.track,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  dayLabel: {
    fontSize: 12,
    color: PASTEL.inkMuted,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: PASTEL.ink,
    marginTop: 2,
  },
  dayMeta: {
    fontSize: 12,
    color: PASTEL.inkSoft,
    marginTop: 3,
  },

  // TRẠNG THÁI
  stateBox: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  stateText: {
    fontSize: 13.5,
    color: PASTEL.inkSoft,
  },
});
