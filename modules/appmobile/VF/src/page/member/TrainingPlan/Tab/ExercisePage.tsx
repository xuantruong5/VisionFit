import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar, StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator, DeviceEventEmitter, Alert, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import apiFitlife from "../../../../general/api";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { COLORS, SHADOWS } from "../../../../general/theme";

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
  thu_tu: number;
  total_exercises: number;
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
  const idLichTap = route?.params?.id_lich_tap;
  const [skipping, setSkipping] = useState(false);
  const workoutStartRef = useRef<Date | null>(null);

  // đồng hồ khi bắt đầu 
  const [isTraining, setIsTraining] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  // Tổng thời gian nghỉ, tính bằng giây
  const [totalRestSeconds, setTotalRestSeconds] = useState(0);
  const [showTimeSummary, setShowTimeSummary] = useState(false);

  // Thời điểm bắt đầu nghỉ
  const restStartRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // tổng số bài tập 
  const [totalExercises, setTotalExercises] = useState<number>(0);

  // gán api bắt đầu 
  const [idBuoiTap, setIdBuoiTap] = useState<number | null>(null);
  const [progressByExercise, setProgressByExercise] = useState<Record<number, number>>({});
  const [progressStatusByExercise, setProgressStatusByExercise] = useState<Record<number, number>>({});
  const [endingSession, setEndingSession] = useState(false);




  const fetchExercises = async () => {
    try {
      setLoading(true);
      const res = await apiFitlife.get(`/client/list-program-exercises/${idNgayTap}`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setTotalExercises(Number(res.data.total_exercises ?? 0));
        const dataNgayTap = res.data.data.filter(
          (item: any) =>
            Number(item.id_chuong_trinh_bai_tap) === Number(idNgayTap)
        );

        const danhSachBaiTap: Exercise[] = dataNgayTap.map(
          (item: any) => ({
            id: Number(item.id_bai_tap ?? item.id),
            id_bai_tap: Number(item.id_bai_tap ?? item.id),
            name: item.ten_bai_tap,
            sets: `${item.set_yeu_cau ?? 0} hiệp x ${item.rep_yeu_cau ?? 0} lần x ${String(item.muc_ta_toi_thieu ?? "0").match(/\d+(?:\.\d+)?/)?.[0] ?? "0"} kg`,
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
            thu_tu: Number(item.thu_tu ?? 0),
            total_exercises: Number(res.data.total_exercises ?? 0),
          }))
          .sort((a: any, b: any) => a.thu_tu - b.thu_tu);
        setExercises(danhSachBaiTap);
        console.log(
          "DANH SÁCH BÀI TẬP SAU KHI MAP:",
          danhSachBaiTap.map((e) => ({
            id: e.id,
            id_bai_tap: e.id_bai_tap,
            ten_bai_tap: e.ten_bai_tap,
            thu_tu: e.thu_tu,
          }))
        );
      } else {
        setExercises([]);
      }
    } catch (error: any) {
      console.log("LỖI API:", error.response?.data ?? error.message);
    } finally {
      setLoading(false);
    }
  };


  const taoBuoiTap = async () => {
    console.log("ExercisePage route.params:", route?.params);
    const idLichTap = route?.params?.id_lich_tap;
    console.log("id_lich_tap:", idLichTap);
    console.log("id_chuong_trinh_bai_tap:", idNgayTap);

    if (!idLichTap || !idNgayTap) {
      Alert.alert(
        "Thiếu dữ liệu",
        "Không tìm thấy id_lich_tap hoặc id_chuong_trinh_bai_tap."
      );
      return null;
    }

    // 1. Tạo buổi tập
    const resBatDau = await apiFitlife.post(
      "/client/buoi-tap/bat-dau",
      {
        id_lich_tap: Number(idLichTap),
        id_chuong_trinh_bai_tap: Number(idNgayTap),
      }
    );

    const buoiTap = resBatDau.data?.data?.buoi_tap;
    const idMoi = Number(
      resBatDau.data?.data?.id_buoi_tap ?? buoiTap?.id
    );

    if (!resBatDau.data?.success || !idMoi) {
      throw new Error("Không tạo được buổi tập.");
    }

    // 2. Khởi tạo tiến độ cho các bài của buổi tập
    const resTienDo = await apiFitlife.post(
      `/client/buoi-tap/${idMoi}/khoi-tao-tien-do`
    );

    if (!resTienDo.data?.success) {
      throw new Error(
        resTienDo.data?.message ?? "Không khởi tạo được tiến độ."
      );
    }

    // 3. Ánh xạ ID bài tập -> ID bản ghi tiến độ
    const danhSachTienDo = resTienDo.data?.data?.danh_sach_tien_do ?? [];

    const progressMap: Record<number, number> = {};
    const statusMap: Record<number, number> = {};

    danhSachTienDo.forEach((item: any) => {
      const idBaiTap = Number(item.id_bai_tap);
      progressMap[idBaiTap] = Number(item.id_tien_do_bai_tap);
      statusMap[idBaiTap] = Number(item.tinh_trang ?? 0);
    });

    console.log("PROGRESS MAP:", progressMap);
    console.log("PROGRESS STATUS MAP:", statusMap);

    setIdBuoiTap(idMoi);
    setProgressByExercise(progressMap);
    setProgressStatusByExercise(statusMap);

    return {
      idBuoiTap: idMoi,
      progressMap,
      statusMap,
    };
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








  // API lấy dữ liệu phần trăm hoàn thành
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const progressColor = progressPercent <= 0 ? "#FF5262" : progressPercent <= 50 ? "#FFE08A" : "#18BEC3";

  const [exerciseProgress, setExerciseProgress] = useState<
    { id_bai_tap: number; phan_tram_hoan_thanh: number; tinh_trang: number; }[]>([]);

  // Tách API thành hàm để gọi lại khi quay về màn hình
  const getLatestProgress = useCallback(async () => 
  {
      if (!idLichTap || !idNgayTap) {
        return;
      }

      try {
        const response = await apiFitlife.get(
          "/client/buoi-tap/phan-tram-hoan-thanh",
          {
            params: {
              id_lich_tap: Number(idLichTap),
              id_chuong_trinh_bai_tap: Number(idNgayTap),
            },
          }
        );

        console.log("API TIẾN ĐỘ BUỔI TẬP:", response.data);

        if (response.data?.success) {
          const data = response.data.data;

          setProgressPercent(
            Number(data?.phan_tram_hoan_thanh) || 0
          );

          setCompletedCount(
            Number(data?.so_bai_hoan_thanh) || 0
          );

          setTotalCount(
            Number(data?.tong_so_bai) || 0
          );

          setExerciseProgress(
            Array.isArray(data?.danh_sach_bai_tap)
              ? data.danh_sach_bai_tap
              : []
          );

          // Cập nhật map trạng thái để giao diện dùng dữ liệu mới
          const newStatusMap: Record<number, number> = {};

          (data?.danh_sach_bai_tap ?? []).forEach((item: any) => {
            newStatusMap[Number(item.id_bai_tap)] =
              Number(item.tinh_trang ?? 0);
          });

          setProgressStatusByExercise(newStatusMap);
        }
      } catch (error: any) {
        console.log(
          "LỖI LẤY TIẾN ĐỘ TẬP LUYỆN:",
          error.response?.data ?? error.message
        );
      }
    }, [idLichTap, idNgayTap]);

  
  useFocusEffect(
    useCallback(() => {
      if (!idNgayTap) {
        setLoading(false);
        return;
      }

      fetchExercises();
      getLatestProgress();
    }, [idNgayTap, getLatestProgress])
  );





  const handleExercisePress = (exercise: Exercise) => {
    // Trường hợp chưa bắt đầu tập: chỉ xem bài tập
    if (!idBuoiTap) {
      navigation.navigate("ReportPage", {
        id_buoi_tap: idBuoiTap,
        id_tien_do_bai_tap: null,

        // BỔ SUNG 2 DÒNG NÀY
        id_lich_tap: idLichTap,
        id_chuong_trinh_bai_tap: idNgayTap,
        elapsedSeconds,
        isTraining: false,
        total_exercises: totalExercises,
        isPreview: true, // Chế độ xem trước, không ghi nhận tiến độ
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
          thu_tu: exercise.thu_tu,
        },
      });

      return;
    }

    // Trường hợp đã bắt đầu tập: giữ nguyên logic hiện tại
    const idTienDo = progressByExercise[Number(exercise.id_bai_tap)];

    if (!idTienDo) {
      Alert.alert(
        "Lỗi tiến độ",
        "Không tìm thấy bản ghi tiến độ của bài tập này."
      );
      return;
    }

    navigation.navigate("ReportPage", {
      id_buoi_tap: idBuoiTap,
      id_tien_do_bai_tap: idTienDo,
      id_lich_tap: idLichTap,
      id_chuong_trinh_bai_tap: idNgayTap,
      elapsedSeconds,
      isTraining,
      total_exercises: totalExercises,
      isPreview: false,
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
        thu_tu: exercise.thu_tu,
      },
    });
  };








  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!isTraining) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTraining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };


  const ketThucBuoiTap = async (quayVeKeHoach = false) => {
    if (!idBuoiTap || endingSession) return;
    setEndingSession(true);
    let restSeconds = totalRestSeconds;
    if (restStartRef.current !== null) {
      restSeconds += Math.floor(
        (Date.now() - restStartRef.current) / 1000
      );
    }
    try {
      const res = await apiFitlife.post(
        `/client/buoi-tap/${idBuoiTap}/ket-thuc`,
        { tong_thoi_gian_nghi: restSeconds }
      );
      if (!res.data?.success) {
        throw new Error(
          res.data?.message ?? "Không thể kết thúc buổi tập."
        );
      }

      setIsTraining(false);
      setHasStarted(false);
      setShowTimeSummary(true);
      setTotalRestSeconds(restSeconds);
      restStartRef.current = null;

      DeviceEventEmitter.emit("workout-session-finish");

      // Hoàn thành tất cả bài: quay về kế hoạch, không hỏi thêm.
      if (quayVeKeHoach) {
        navigation.navigate("headerPage", {
          // initialTab: "WorkoutExercisePlan",
          screen: "WorkoutExercisePlan",
        });
        return;
      }

      const data = res.data.data;

      Alert.alert(
        "Thành công",
        data?.da_mo_ngay_tiep_theo
          ? `Đã kết thúc buổi tập. Ngày tập ${data.ngay_tiep_theo.ngay_thu} đã được mở.`
          : `Đã kết thúc buổi tập. Hoàn thành ${data?.phan_tram_hoan_thanh ?? 0
          }%.`
      );
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message ??
        error.message ??
        "Không thể kết thúc buổi tập."
      );
    } finally {
      setEndingSession(false);
    }
  };




  const handleStart = async () => {
    // Kết thúc buổi tập đang diễn ra
    if (hasStarted) {
      if (!idBuoiTap || endingSession) return;

      try {
        // Lấy trạng thái tiến độ mới nhất từ backend
        const response = await apiFitlife.get(
          "/client/buoi-tap/phan-tram-hoan-thanh",
          {
            params: {
              id_lich_tap: Number(idLichTap),
              id_chuong_trinh_bai_tap: Number(idNgayTap),
            },
          }
        );

        const danhSachTienDo =
          response.data?.data?.danh_sach_bai_tap ?? [];

        // Kiểm tra tất cả bài tập của ngày hiện tại đã hoàn thành chưa
        const tatCaDaHoanThanh =
          exercises.length > 0 &&
          exercises.every((exercise) => {
            const tienDo = danhSachTienDo.find(
              (item: any) =>
                Number(item.id_bai_tap) ===
                Number(exercise.id_bai_tap)
            );

            return Number(tienDo?.tinh_trang) === 2;
          });
        if (tatCaDaHoanThanh) {
          await ketThucBuoiTap(true);
        } else {
          await ketThucBuoiTap(false);
        }
      } catch (error: any) {
        Alert.alert(
          "Lỗi",
          error.response?.data?.message ??
          "Không thể kiểm tra tiến độ bài tập."
        );
      }

      return;
    }

    // Bắt đầu phiên tập mới
    const sortedExercises = [...exercises].sort(
      (a, b) => Number(a.thu_tu) - Number(b.thu_tu)
    );

    if (sortedExercises.length === 0) {
      Alert.alert("Thông báo", "Danh sách bài tập đang trống.");
      return;
    }

    try {
      // Tạo phiên tập và lấy tiến độ đã lưu từ BE
      const session = await taoBuoiTap();

      if (!session) return;

      // Tìm bài chưa hoàn thành đầu tiên theo thứ tự
      const baiTiepTheo = sortedExercises.find(
        (exercise) =>
          Number(session.statusMap[Number(exercise.id_bai_tap)] ?? 0) !== 2
      );

      // Nếu mọi bài đã hoàn thành, đóng phiên vừa tạo để không
      // để lại một phiên đang tập nhưng người dùng không thực sự tập.
      if (!baiTiepTheo) {
        try {
          await apiFitlife.post(
            `/client/buoi-tap/${session.idBuoiTap}/ket-thuc`,
            { tong_thoi_gian_nghi: 0 }
          );
        } catch (error) {
          console.log("Lỗi đóng phiên tập rỗng:", error);
        }

        setIdBuoiTap(null);

        Alert.alert(
          "Đã hoàn thành",
          "Bạn đã hoàn thành tất cả bài tập trong ngày này."
        );
        return;
      }

      const idTienDo =
        session.progressMap[Number(baiTiepTheo.id_bai_tap)];

      if (!idTienDo) {
        Alert.alert(
          "Lỗi tiến độ",
          `Không tìm thấy tiến độ của bài tập ${baiTiepTheo.ten_bai_tap}.`
        );
        return;
      }

      // Khởi tạo đồng hồ của phiên hiện tại
      workoutStartRef.current = new Date();
      setElapsedSeconds(0);
      setTotalRestSeconds(0);
      setShowTimeSummary(false);
      setHasStarted(true);
      setIsTraining(true);
      restStartRef.current = null;

      // Mở bài chưa hoàn thành đầu tiên
      navigation.navigate("ReportPage", {
        id_buoi_tap: session.idBuoiTap,
        id_tien_do_bai_tap: idTienDo,
        id_lich_tap: route.params?.id_lich_tap,
        id_chuong_trinh_bai_tap: route.params?.id_chuong_trinh_bai_tap,
        elapsedSeconds: 0,
        isTraining: true,
        total_exercises: totalExercises,
        exercise: {
          id_bai_tap: baiTiepTheo.id_bai_tap,
          ten_bai_tap: baiTiepTheo.ten_bai_tap,
          thoi_gian_phut: baiTiepTheo.thoi_gian_phut,
          rep_yeu_cau: baiTiepTheo.rep_yeu_cau,
          set_yeu_cau: baiTiepTheo.set_yeu_cau,
          giay_yeu_cau: baiTiepTheo.giay_yeu_cau,
          muc_ta_toi_thieu: baiTiepTheo.muc_ta_toi_thieu,
          thiet_bi: baiTiepTheo.thiet_bi,
          video_huong_dan: baiTiepTheo.video_huong_dan,
          video_sai: baiTiepTheo.video_sai,
          huong_dan: baiTiepTheo.huong_dan,
          canh_bao: baiTiepTheo.canh_bao,
          noi_tap: baiTiepTheo.noi_tap,
          mo_ta: baiTiepTheo.mo_ta,
          thu_tu: baiTiepTheo.thu_tu,
        },
      });
    } catch (error: any) {
      Alert.alert(
        "Không thể bắt đầu",
        error.response?.data?.message ??
        error.message ??
        "Có lỗi khi tạo buổi tập."
      );
    }
  };


  // nhận tạm nghỉ từ trang ReportPage xang 
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "workout-training-change",
      (running: boolean) => {
        if (running) {
          // Tiếp tục tập: kết thúc khoảng nghỉ
          if (restStartRef.current !== null) {
            const restDuration = Math.floor(
              (Date.now() - restStartRef.current) / 1000
            );

            setTotalRestSeconds((prev) => prev + restDuration);
            restStartRef.current = null;
          }

          setIsTraining(true);
        } else {
          // Tạm nghỉ: chỉ ghi nhận thời điểm bắt đầu nghỉ
          if (restStartRef.current === null) {
            restStartRef.current = Date.now();
          }

          setIsTraining(false);
        }
      }
    );

    return () => subscription.remove();
  }, []);



  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.body}>
      {/* ================= HEADER GRADIENT ================= */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.circleLg} />
        <View style={styles.circleSm} />

        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.glassButton}
            onPress={() => navigation?.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerSub}>Kế hoạch tập luyện</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>Bài tập hôm nay</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.moreButton, hasStarted && styles.moreButtonActive]}
            onPress={handleSkip}
            disabled={skipping || hasStarted}
          >
            {skipping ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : hasStarted ? (
              <View style={styles.timerRow}>
                <View style={styles.timerDot} />
                <Text style={styles.timerText}>
                  {formatTime(elapsedSeconds)}
                </Text>
              </View>
            ) : (
              <Text style={styles.skipText}>Bỏ qua</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ================= SESSION CARD (nổi) ================= */}
      <View style={styles.sessionCard}>
        {/* Left: Progress circle */}
        <View style={styles.progressCircleWrapper}>
          <View style={styles.progressCircleBg}>
            <View
              style={[styles.progressCircleFill, { borderColor: progressColor, },]} />
            <View style={styles.progressCircleCenter}>
              <Text style={[styles.progressText, { color: progressColor, },]}>
                {progressPercent}%
              </Text>
            </View>
          </View>
        </View>

        {/* Middle: Info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionDayLabel}>Ngày tập {route.params?.ngayThu ?? 1}</Text>
          <Text style={styles.sessionType} numberOfLines={1}>{route.params?.dayType ?? "Ngày tập luyện"}</Text>
          <View style={styles.sessionMeta}>
            <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.sessionMetaText}>~ {route.params?.thoi_gian_phut ?? 0} phút</Text>
            <View style={styles.metaDivider} />
            <Ionicons name="barbell-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.sessionMetaText}>
              {totalExercises} bài
            </Text>
          </View>
        </View>

        {/* Right: Completed badge */}
        <View style={styles.completedBadge}>
          <Text style={styles.completedCount}>{completedCount}</Text>
          <Text style={styles.completedLabel}>bài xong</Text>
        </View>
      </View>

      {/* ================= CONTENT ================= */}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ================= SECTION TITLE ================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh sách bài tập</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionSubtitle}>
              {completedCount}/{totalCount} hoàn thành
            </Text>
          </View>
        </View>

        {/* ================= EXERCISE LIST ================= */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : exercises.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Ionicons name="barbell-outline" size={34} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              Ngày tập này chưa có bài tập.
            </Text>
          </View>
        ) : (
          <View style={styles.exerciseList}>
            {exercises.map((exercise, index) => (
              <View key={exercise.id}>
                <TouchableOpacity activeOpacity={0.75} style={styles.exerciseItem} onPress={() => handleExercisePress(exercise)}>
                  {/* Image */}
                  <View style={styles.exerciseImageWrapper}>
                    <Image source={{ uri: exercise.image }} style={styles.exerciseImage} resizeMode="contain" />
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderText}>{index + 1}</Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName} numberOfLines={2}>
                      {exercise.name}
                    </Text>

                    <View style={styles.exerciseTags}>
                      <View style={styles.tagPill}>
                        <Ionicons name="repeat-outline" size={11} color={COLORS.primary} />
                        <Text style={styles.tagText}>{exercise.sets}</Text>
                      </View>

                      <View style={[styles.tagPill, styles.tagPillGray]}>
                        <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
                        <Text style={[styles.tagText, styles.tagTextGray]}>
                          {exercise.duration}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {/* Phần trăm hoàn thành */}
                  {(() => {
                    const progress = exerciseProgress.find((item) => Number(item.id_bai_tap) === Number(exercise.id_bai_tap));
                    const percent = Number(progress?.phan_tram_hoan_thanh ?? 0);
                    if (percent <= 0) return null;
                    const exerciseColor = percent <= 50 ? "#E6A94A" : "#18BEC3";
                    return (
                      <Text style={[styles.exercisePercent, { color: exerciseColor }]}>
                        {percent}%
                      </Text>
                    );
                  })()}
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
            <View style={styles.tipsIcon}>
              <Ionicons name="bulb-outline" size={18} color="#E8A020" />
            </View>
            <Text style={styles.tipsTitle}>Lưu ý buổi tập</Text>
          </View>
          <Text style={styles.tipsText}>
            Khởi động kỹ trước khi bắt đầu. Nghỉ giữa hiệp 30–60 giây. Uống đủ
            nước trong suốt buổi tập để duy trì năng lượng tốt nhất.
          </Text>
        </View>

        {/* nhap tinh thoi gian  */}
        {showTimeSummary && (
          <View style={styles.timeSummary}>
            <View style={styles.timeSummaryItem}>
              <View style={[styles.timeSummaryIcon, { backgroundColor: COLORS.surfaceTeal }]}>
                <Ionicons
                  name="barbell-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.timeSummaryLabel}>
                Tổng thời gian tập
              </Text>
              <Text style={styles.timeSummaryValue}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>

            <View style={styles.timeSummaryDivider} />

            <View style={styles.timeSummaryItem}>
              <View style={[styles.timeSummaryIcon, { backgroundColor: "#FFF7ED" }]}>
                <Ionicons
                  name="pause-circle-outline"
                  size={20}
                  color="#E8A020"
                />
              </View>
              <Text style={styles.timeSummaryLabel}>
                Tổng thời gian nghỉ
              </Text>
              <Text style={[styles.timeSummaryValue, { color: "#E8A020" }]}>
                {formatTime(totalRestSeconds)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================= BOTTOM AREA ================= */}

      <View style={styles.bottomArea}>
        <TouchableOpacity activeOpacity={0.85} style={[styles.startButton, isTraining && styles.startButtonStop,]} onPress={handleStart} >
          <LinearGradient
            colors={isTraining ? ["#F05252", "#C62828"] : [COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startGradient}
          >
            <Ionicons name={isTraining ? "stop-circle" : "play"} size={20} color="#FFFFFF" style={styles.startIcon} />
            <Text style={styles.startButtonText}>
              {endingSession ? "ĐANG LƯU..." : isTraining ? "KẾT THÚC TẬP" : "BẮT ĐẦU TẬP"}
            </Text>
          </LinearGradient>
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
  body: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // =================================================
  // HEADER
  // =================================================
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 50,
    borderRadius: 28,
    marginHorizontal: 12,
    marginTop: 6,
    overflow: "hidden",
  },
  circleLg: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -90,
    right: -60,
  },
  circleSm: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -50,
    left: -30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.white,
    marginTop: 2,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  moreButton: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  moreButtonActive: {
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  skipText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
  },
  timerText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
  },

  // =================================================
  // SCROLL VIEW
  // =================================================

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },

  // =================================================
  // SESSION CARD
  // =================================================

  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: -34,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 2,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },

  progressCircleWrapper: {
    marginRight: 14,
  },

  progressCircleBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  progressCircleFill: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
  },

  progressCircleCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  progressText: {
    fontSize: 14,
    fontWeight: "800",
  },

  sessionInfo: {
    flex: 1,
  },

  sessionDayLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },

  sessionType: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },

  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  sessionMetaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
  },

  completedBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceTeal,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 54,
  },

  completedCount: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "800",
  },

  completedLabel: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    fontWeight: "600",
  },

  // =================================================
  // SECTION HEADER
  // =================================================

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },

  sectionBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  sectionSubtitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  loader: {
    marginVertical: 30,
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // =================================================
  // EXERCISE LIST
  // =================================================

  exerciseList: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
    marginBottom: 16,
  },

  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
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
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  exerciseImage: {
    width: "82%",
    height: "82%",
  },

  orderBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  orderText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },

  exerciseImageDone: {
    opacity: 0.4,
  },

  exerciseInfo: {
    flex: 1,
    paddingRight: 6,
  },

  exerciseName: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 6,
  },

  exerciseNameDone: {
    color: "#8FA9B2",
    textDecorationLine: "line-through",
  },

  exerciseTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },

  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  tagPillGray: {
    backgroundColor: COLORS.borderLight,
  },

  tagText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  tagTextGray: {
    color: COLORS.textMuted,
  },

  exercisePercent: {
    fontSize: 13,
    fontWeight: "800",
    minWidth: 38,
    textAlign: "right",
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
    backgroundColor: COLORS.borderLight,
    marginLeft: 78,
    marginRight: 12,
  },

  // =================================================
  // TIPS CARD
  // =================================================

  tipsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F5E8C0",
    marginBottom: 16,
  },

  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  tipsIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#F5E8C0",
    alignItems: "center",
    justifyContent: "center",
  },

  tipsTitle: {
    color: "#B45309",
    fontSize: 15,
    fontWeight: "800",
  },

  tipsText: {
    color: "#7A5A20",
    fontSize: 13,
    lineHeight: 20,
  },

  // =================================================
  // BOTTOM AREA
  // =================================================

  bottomArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    elevation: 10,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  startButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
    ...SHADOWS.glow,
  },

  startGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  startButtonDone: {
    backgroundColor: "#0D9E6B",
  },

  startIcon: {
    marginRight: 2,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  startButtonStop: {
    shadowColor: "#C62828",
  },
  timeSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },

  timeSummaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },

  timeSummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  timeSummaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.borderLight,
  },

  timeSummaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  timeSummaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },

});

export default ExercisePage;
