import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, StatusBar, Modal, ScrollView, TextInput, DeviceEventEmitter, Alert, ActivityIndicator, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import Svg, { Circle } from "react-native-svg";
import Video from "react-native-video";
import apiFitlife from "../../../../general/api";
import { COLORS, SHADOWS } from "../../../../general/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
const ReportPage = ({ navigation, route }: any) => {
    // const [time, setTime] = useState(9);
    const [isRunning, setIsRunning] = useState(false);
    const [setCount, setSetCount] = useState(0);
    const exercise = route?.params?.exercise;
    const idLichTap = route?.params?.id_lich_tap;
    const idChuongTrinhBaiTap =route?.params?.id_chuong_trinh_bai_tap;
  
    const [showWeight, setShowWeight] = useState(false);
    const [showRep, setShowRep] = useState(false);
    const [showSeconds, setShowSeconds] = useState(false);
    const [showMinutesInput, setShowMinutesInput] = useState(false);

    // ghi chú cho hiệp 
    const [showSetNote, setShowSetNote] = useState(false);
    const [setNote, setSetNote] = useState("");





    // của dấu cộng 
    const [savedMinutes, setSavedMinutes] = useState<string | null>(null);
    // check giay va rep 
    // Kiểm tra thông số bài tập
    const mucTa = String(exercise?.muc_ta_toi_thieu ?? "").match(/\d+(\.\d+)?/)?.[0] ?? "0";
    // thay đổi số và nhập số mới 
    const [weightValue, setWeightValue] = useState(String(mucTa));
    const [repValue, setRepValue] = useState(String(exercise?.rep_yeu_cau ?? 0));
    const [secondsValue, setSecondsValue] = useState(String(exercise?.giay_yeu_cau ?? 0));
    const [minutesValue, setMinutesValue] = useState(String(exercise?.thoi_gian_phut ?? 0));
    const hasWeight = Number(mucTa) > 0;
    const hasRep = Number(exercise?.rep_yeu_cau) > 0;
    const hasSet = Number(exercise?.set_yeu_cau) > 0;
    const hasDuration = Number(exercise?.thoi_gian_phut) > 0;
    const hasSecondsValue = Number(exercise?.giay_yeu_cau) > 0;
    // Chỉ hiện Giây khi không có Rep và có số giây yêu cầu
    const hasSeconds = !hasRep && hasSecondsValue;
    // Có mức tạ và Rep thì hiện hai ô Kilogram + Rep
    const hasWeightAndRep = hasWeight && hasRep;
    const showMinutes = !hasRep && !hasSet && !hasSeconds && hasDuration;
    // Cấu hình vòng tròn tiến độ
    const circleSize = wp("19%");
    const circleRadius = circleSize / 2 - 3;
    const circumference = 2 * Math.PI * circleRadius;
    // Tính tiến độ theo Set hoặc Phút
    const progressTarget = hasSet ? Number(exercise?.set_yeu_cau || 1) : Number(exercise?.thoi_gian_phut || 1);
    const progressValue = hasSet ? setCount : showMinutes ? Number(savedMinutes ?? 0) : 0;
    const progress = Math.min(Math.max(progressValue / progressTarget, 0), 1);
    // Đổi màu theo tiến độ
    const progressColor = progress >= 1 && progressValue > 0 ? "#13BEC2" : progress > 0 ? "#FFB957" : "#FFB7BC";
    const [time, setTime] = useState(0);


    // kết nối api hoàn thành %

    const idBuoiTap = route?.params?.id_buoi_tap;
    const idTienDo = route?.params?.id_tien_do_bai_tap;
    const [savingProgress, setSavingProgress] = useState(false);
    const [completingExercise, setCompletingExercise] = useState(false);






    // Đồng bộ thời gian ban đầu từ ExercisePage và tạm dừng và bắt đầu lại 
    const [workoutTime, setWorkoutTime] = useState(route?.params?.elapsedSeconds ?? 0);
    const [isWorkoutRunning, setIsWorkoutRunning] = useState(route?.params?.isTraining ?? false);
    useEffect(() => {
        setWorkoutTime(route?.params?.elapsedSeconds ?? 0);
    }, [route?.params?.elapsedSeconds]);
    // Đồng hồ tổng chỉ chạy khi đang tập
    useEffect(() => {
        if (!isWorkoutRunning) return;
        const timer = setInterval(() => {
            setWorkoutTime((prev: number) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isWorkoutRunning]);
    // Tạm dừng hoặc tiếp tục đồng hồ ở cả hai trang
    const handleWorkoutPause = () => {
        const nextRunning = !isWorkoutRunning;
        setIsWorkoutRunning(nextRunning);
        DeviceEventEmitter.emit("workout-training-change", nextRunning
        );
    };
    const formatTime = (seconds: number) => {
        const minute = Math.floor(seconds / 60);
        const second = seconds % 60;
        return `${minute}:${second.toString().padStart(2, "0")}`;
    };

    const handleReset = () => {
        setTime(20);
        setIsRunning(false);
        setSetCount(0);
    };


    
    
    const kiemTraTatCaBaiHoanThanh = async () => 
    {
        try {
            // Không kiểm tra tiến độ ở chế độ xem trước.
            if (route?.params?.isPreview === true) {
                console.log("Đang xem trước bài tập, bỏ qua kiểm tra tiến độ.");
                return false;
            }

            // Đọc ID từ params của ReportPage.
            const idLichTap = Number(route?.params?.id_lich_tap);
            const idChuongTrinhBaiTap = Number(
                route?.params?.id_chuong_trinh_bai_tap
            );

            if (
                !Number.isFinite(idLichTap) ||
                idLichTap <= 0 ||
                !Number.isFinite(idChuongTrinhBaiTap) ||
                idChuongTrinhBaiTap <= 0
            ) {
                console.log("Thiếu ID trong ReportPage:", {
                    params: route?.params,
                    idLichTap,
                    idChuongTrinhBaiTap,
                });
                return false;
            }

            const res = await apiFitlife.get(
                "/client/buoi-tap/phan-tram-hoan-thanh",
                {
                    params: {
                        id_lich_tap: idLichTap,
                        id_chuong_trinh_bai_tap: idChuongTrinhBaiTap,
                    },
                }
            );

            console.log(
                "DỮ LIỆU TIẾN ĐỘ BÀI TẬP:",
                JSON.stringify(res.data, null, 2)
            );

            const danhSach = res.data?.data?.danh_sach_bai_tap;

            if (!Array.isArray(danhSach) || danhSach.length === 0) {
                console.log("Không tìm thấy danh sách bài tập:", danhSach);
                return false;
            }

            const allCompleted = danhSach.every(
                (item: any) => Number(item.tinh_trang) === 2
            );

            console.log(
                "Trạng thái các bài:",
                danhSach.map((item: any) => ({
                    id: item.id_bai_tap,
                    tinh_trang: item.tinh_trang,
                }))
            );

            console.log("TẤT CẢ BÀI ĐÃ HOÀN THÀNH:", allCompleted);

            return allCompleted;
        } catch (error: any) {
            console.log(
                "LỖI KIỂM TRA TIẾN ĐỘ:",
                error?.response?.data || error.message
            );
            return false;
        }
    };






    const handleAddSet = async () => {
        console.log("DEBUG TIẾN ĐỘ:", {
            idBuoiTap,
            idTienDo,
            idBaiTap: exercise?.id_bai_tap,
            tenBaiTap: exercise?.ten_bai_tap,
            thuTu: exercise?.thu_tu,
        });

        if (!idBuoiTap || !idTienDo) {
            Alert.alert("Lỗi", "Thiếu ID buổi tập hoặc ID tiến độ bài tập.");
            return;
        }

        if (savingProgress || completingExercise) return;

        const targetSets = Number(exercise?.set_yeu_cau ?? 0);
        const targetMinutes = Number(exercise?.thoi_gian_phut ?? 0);

        // Xác định tiến độ kế tiếp
        const nextSetCount = hasSet
            ? Math.min(setCount + 1, targetSets)
            : setCount;

        const currentMinutes = Number(savedMinutes ?? 0);

        // Mỗi lần bấm +, cộng số phút người dùng nhập
        const minutesToAdd = Number(minutesValue || 0);

        const nextSavedMinutes = showMinutes
            ? Math.min(currentMinutes + minutesToAdd, targetMinutes)
            : currentMinutes;

        // Không cho cộng khi đã đạt mục tiêu
        if (hasSet && setCount >= targetSets) {
            Alert.alert("Thông báo", "Bạn đã hoàn thành đủ số set.");
            return;
        }

        if (showMinutes && currentMinutes >= targetMinutes) {
            Alert.alert("Thông báo", "Bạn đã hoàn thành đủ số phút.");
            return;
        }

        if (showMinutes && minutesToAdd <= 0) {
            Alert.alert("Thông báo", "Vui lòng nhập số phút hợp lệ.");
            return;
        }

        const payload = {
            so_set_thuc_te: nextSetCount,
            so_rep_thuc_te: Number(repValue || 0),
            so_phut_thuc_te: showMinutes
                ? nextSavedMinutes
                : Number(minutesValue || 0),
            thoi_gian_thuc_te_giay: hasSeconds
                ? Number(secondsValue || 0)
                : showMinutes
                    ? nextSavedMinutes * 60
                    : 0,
            trong_luong_ta_thuc_te: Number(weightValue || 0),
        };

        try {
            setSavingProgress(true);

            // Bước 1: Lưu tiến độ
            const res = await apiFitlife.post(
                `/client/buoi-tap/${idBuoiTap}/tien-do/${idTienDo}`,
                payload
            );

            if (!res.data?.success) {
                throw new Error(
                    res.data?.message ?? "Không cập nhật được tiến độ."
                );
            }

            // Cập nhật giao diện sau khi API lưu thành công
            if (hasSet) {
                setSetCount(nextSetCount);
            }

            if (showMinutes) {
                setSavedMinutes(String(nextSavedMinutes));
            }

            // Bước 2: Kiểm tra đã đạt mục tiêu chưa
            const isCompleted = hasSet
                ? nextSetCount >= targetSets
                : showMinutes
                    ? nextSavedMinutes >= targetMinutes
                    : false;

            // Bước 3: Đạt mục tiêu thì gọi API hoàn thành

            if (isCompleted) {
                setCompletingExercise(true);

                const completeRes = await apiFitlife.post(
                    `/client/buoi-tap/${idBuoiTap}/tien-do/${idTienDo}/hoan-thanh`
                );

                if (!completeRes.data?.success) {
                    throw new Error(
                        completeRes.data?.message ??
                        "Lưu tiến độ được nhưng chưa thể hoàn thành bài tập."
                    );
                }

                // Kiểm tra xem tất cả bài tập trong ngày đã hoàn thành chưa
                const allCompleted = await kiemTraTatCaBaiHoanThanh();

                if (allCompleted) {
                    Alert.alert(
                        "🎉 Hoàn thành buổi tập!",
                        "Bạn đã hoàn thành tất cả bài tập trong buổi tập này. Bạn có muốn kết thúc buổi tập không?",
                        [
                            {
                                text: "Tiếp tục",
                                style: "cancel",
                            },
                            {
                                text: "Kết thúc tập",
                                onPress: () => {
                                    navigation.goBack();
                                },
                            },
                        ]
                    );
                } else {
                    Alert.alert(
                        "Hoàn thành",
                        "Bạn đã hoàn thành bài tập này!",
                        [
                            {
                                text: "OK",
                                onPress: () => {
                                    navigation.goBack();
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                }
            }

        } catch (error: any) {
            Alert.alert(
                "Lỗi lưu tiến độ",
                error.response?.data?.message ??
                error.message ??
                "Không thể lưu kết quả bài tập."
            );
        } finally {
            setSavingProgress(false);
            setCompletingExercise(false);
        }
    };



    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate("MemberTabs");
                        }
                    }} >
                    <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    {exercise?.thu_tu ?? 1}/{route?.params?.total_exercises ?? 0} Luyện tập
                </Text>

                <TouchableOpacity style={[styles.headerTimer, isWorkoutRunning && styles.headerTimerRunning,]}
                    activeOpacity={0.8} onPress={() => { if (!isWorkoutRunning) { handleWorkoutPause(); } }} >
                    {isWorkoutRunning ? (
                        <View style={styles.timerRow}>
                        <View style={styles.timerDot} />
                        <Text style={styles.headerTimerText}>
                            {formatTime(workoutTime)}
                        </Text>
                        </View>
                    ) : (
                        <Text style={styles.headerTimerStartText}>
                            Bắt đầu
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ================= NOTICE ================= */}
                <TouchableOpacity style={styles.noticeBox} activeOpacity={0.85} >
                    <View style={styles.noticeIcon}>
                        <Ionicons name="information-circle-outline" size={20} color={COLORS.accentBlue} />
                    </View>
                    <Text style={styles.noticeText}>
                        Hướng dẫn ghi nhận hiệp tập & thời gian nghỉ
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.accentBlue} />
                </TouchableOpacity>

                {/* ================= EXERCISE IMAGE ================= */}
                <View style={styles.exerciseArea}>
                    <View style={styles.exerciseImageArea}>
                        {exercise?.video_huong_dan ? (
                            exercise.video_huong_dan.toLowerCase().endsWith(".gif") ? (
                                <Image source={{ uri: exercise.video_huong_dan }} style={styles.exerciseImage} resizeMode="contain" onError={() => console.log("Video hướng dẫn bị lỗi")} />
                            ) : (
                                <Video source={{ uri: exercise.video_huong_dan }} style={styles.exerciseImage} resizeMode="contain" repeat paused={false} muted onError={() => console.log("Video hướng dẫn bị lỗi")} />
                            )
                        ) : (
                            <View style={styles.mediaFallback}>
                                <Ionicons name="videocam-off-outline" size={34} color={COLORS.primary} />
                                <Text style={styles.mediaFallbackText}>Video hướng dẫn bị lỗi</Text>
                            </View>
                        )}
                    </View>
                    {/* RIGHT BUTTONS */}
                    <View style={styles.rightButtons}>
                        <TouchableOpacity style={styles.rightIconButton} onPress={handleReset} >
                            <Ionicons name="refresh" size={19} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rightIconButton}
                            onPress={() => {
                                navigation.getParent()?.navigate("Kế Hoạch Tập", {
                                    screen: "ExerciseDetail",
                                    params: {
                                        exercise: {
                                            ...exercise,
                                            name: exercise?.ten_bai_tap,
                                            description: exercise?.mo_ta,
                                            video_huong_dan: exercise?.video_huong_dan,
                                            video_sai: exercise?.video_sai,
                                            huong_dan: exercise?.huong_dan,
                                            canh_bao: exercise?.canh_bao,
                                            noi_tap: exercise?.noi_tap,
                                            muc_ta_toi_thieu: exercise?.muc_ta_toi_thieu,
                                            rep_yeu_cau: exercise?.rep_yeu_cau,
                                            set_yeu_cau: exercise?.set_yeu_cau,
                                            giay_yeu_cau: exercise?.giay_yeu_cau,
                                            thu_tu: exercise?.thu_tu,
                                        },
                                        categoryName: exercise?.noi_tap || "Bài tập",
                                        total_exercises: route?.params?.total_exercises ?? 0,
                                    },
                                });
                            }}
                            activeOpacity={0.8}>
                            <Ionicons name="information" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* ================= EXERCISE TITLE ================= */}

                <Text style={styles.exerciseTitle}>
                    {exercise?.ten_bai_tap || "Bài tập chưa có tên"}
                </Text>

                {exercise?.muc_ta_toi_thieu &&
                    exercise.muc_ta_toi_thieu !== "0.00" && (
                        <View style={styles.weightChip}>
                            <Ionicons name="barbell-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.exerciseTitle1}>
                                <Text style={styles.weightChipLabel}>
                                    Mức tạ khuyến nghị:{" "}
                                </Text>
                                {exercise.muc_ta_toi_thieu}
                            </Text>
                        </View>
                    )}


                {/* ================= CONTROLS ================= */}
                <View style={styles.controlCard}>
                <View style={styles.controlContainer}>
                    {/* GIÂY YÊU CẦU HOẶC SỐ LẦN LẶP */}
                    <TouchableOpacity style={styles.controlItem} activeOpacity={0.8}
                        onPress={() => {
                            if (hasWeightAndRep) {
                                setShowWeight(true);
                                setShowRep(true);
                            } else if (hasSeconds) {
                                setShowSeconds(true);
                                setTime(Number(exercise?.giay_yeu_cau));
                                setIsRunning(false);
                            } else if (hasRep) {
                                setShowRep(true);
                            }
                        }}>
                        <View style={styles.circleNormal}>
                            <Text style={styles.circleNumber}>
                                {hasSeconds ? exercise?.giay_yeu_cau : exercise?.rep_yeu_cau ?? 0}
                            </Text>
                        </View>

                        <Text style={styles.controlLabel}>
                            {hasSeconds ? "Giây" : "Rep"}
                        </Text>

                        <Text style={styles.controlSubLabel}>
                            {hasSeconds || hasRep ? "yêu cầu" : ""}
                        </Text>
                    </TouchableOpacity>
                    {/* START / TẠM NGHỈ */}
                    <View style={styles.controlItem}>
                        <TouchableOpacity style={styles.startCircle} activeOpacity={0.8} onPress={handleWorkoutPause}>

                            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startGradient}>
                                <Ionicons name={isWorkoutRunning ? "pause" : "play"} size={28} color={COLORS.white} />
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.controlLabel}>
                            Tạm Nghỉ
                        </Text>
                    </View>

                    {/* SET HOẶC THỜI GIAN PHÚT */}
                    <TouchableOpacity style={styles.controlItem} activeOpacity={0.8}
                        onPress={() => {
                            if (hasSet) {
                                setSetCount(0);
                            } else if (showMinutes) {
                                setShowMinutesInput(true);
                                setTime(Number(exercise?.thoi_gian_phut) * 60);
                                setIsRunning(false);
                            }
                        }} >
                        <View style={styles.progressCircle}>
                            <Svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`} >
                                {/* Vòng nền */}
                                <Circle cx={circleSize / 2} cy={circleSize / 2} r={circleRadius} stroke={COLORS.borderLight} strokeWidth={4} fill="none" />

                                {/* Vòng tiến độ */}
                                {progress > 0 && (
                                    <Circle
                                        cx={circleSize / 2}
                                        cy={circleSize / 2}
                                        r={circleRadius}
                                        stroke={progressColor}
                                        strokeWidth={4}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        strokeDashoffset={circumference * (1 - progress)}
                                        rotation={-90}
                                        origin={`${circleSize / 2}, ${circleSize / 2}`} />
                                )}
                            </Svg>

                            {/* Số hiển thị giữa vòng tròn */}
                            <View style={styles.progressText}>
                                <Text style={styles.circleNumber}>
                                    {hasSet
                                        ? `${setCount}/${exercise?.set_yeu_cau}`
                                        : showMinutes
                                            ? `${savedMinutes ?? 0}/${exercise?.thoi_gian_phut}`
                                            : "0"}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.controlLabel}>
                            {hasSet ? "Set" : showMinutes ? "Phút" : ""}
                        </Text>

                        <Text style={styles.controlSubLabel}>
                            {hasSet || showMinutes ? "tập" : ""}
                        </Text>
                    </TouchableOpacity>
                </View>


                {/* ================= SECOND INPUT ================= */}

                <View style={styles.secondArea}>
                    {hasWeightAndRep ? (
                        <>
                            {/* Ô chỉnh sửa mức tạ */}
                            <View style={styles.secondButton}>
                                <TextInput
                                    style={styles.secondInput}
                                    value={showWeight ? weightValue : ""}
                                    onChangeText={setWeightValue}
                                    placeholderTextColor={COLORS.textLight}
                                    keyboardType="decimal-pad"
                                    selectTextOnFocus />
                                {showWeight && (
                                    <Text style={styles.secondUnit}>kg</Text>
                                )}
                            </View>

                            {/* Ô chỉnh sửa số Rep */}
                            <View style={styles.secondButton}>
                                <TextInput
                                    style={styles.secondInput}
                                    value={showRep ? repValue : ""}
                                    onChangeText={setRepValue}
                                    placeholderTextColor={COLORS.textLight}
                                    keyboardType="number-pad"
                                    selectTextOnFocus />
                                {showRep && (
                                    <Text style={styles.secondUnit}>Rep</Text>
                                )}
                            </View>
                        </>
                    ) : hasSeconds ? (
                        <View style={styles.secondButton}>
                            <TextInput
                                style={styles.secondInput}
                                value={showSeconds ? secondsValue : ""}
                                onChangeText={setSecondsValue}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="number-pad"
                                selectTextOnFocus />
                            {showSeconds && (
                                <Text style={styles.secondUnit}>Giây</Text>
                            )}
                        </View>
                    ) : showMinutes ? (
                        <View style={styles.secondButton}>
                            <TextInput
                                style={styles.secondInput}
                                value={showMinutesInput ? minutesValue : ""}
                                onChangeText={setMinutesValue}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="number-pad"
                                selectTextOnFocus />
                            {showMinutesInput && (
                                <Text style={styles.secondUnit}>Phút</Text>
                            )}
                        </View>
                    ) : hasRep ? (
                        <View style={styles.secondButton}>
                            <TextInput
                                style={styles.secondInput}
                                value={showRep ? repValue : ""}
                                onChangeText={setRepValue}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="number-pad"
                                selectTextOnFocus />
                            {showRep && (
                                <Text style={styles.secondUnit}>Rep</Text>
                            )}
                        </View>
                    ) : null}
                    <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={handleAddSet} disabled={savingProgress} >
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addGradient}>
                        {savingProgress ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Ionicons name="add" size={28} color="#FFFFFF" />
                        )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                </View>

                {!showSetNote ? (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.addSetNoteButton}
                        onPress={() => setShowSetNote(true)}
                    >
                        <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.addSetNoteText}>
                            Thêm ghi chú cho hiệp
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.setNoteContainer}>
                        <Text style={styles.setNoteLabel}>
                            Ghi chú cho hiệp
                        </Text>

                        <TextInput
                            style={styles.setNoteInput}
                            value={setNote}
                            onChangeText={setSetNote}
                            placeholder="Nhập nội dung bình luận"
                            placeholderTextColor={COLORS.textLight}
                            multiline
                            autoFocus
                        />
                    </View>
                )}


                {/* LỊCH SỬ TẬP LUYỆN */}
                <View style={styles.historyContainer}>
                    <View style={styles.historyHeader}>
                        <View style={styles.historyTitleRow}>
                            <View style={styles.historyIcon}>
                                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                            </View>
                            <Text style={styles.historyTitle}>Lịch sử</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.historyChartButton}
                            activeOpacity={0.7}
                            onPress={() => Alert.alert("Thông báo", "Chức năng biểu đồ đang được phát triển")}
                        >
                            <Text style={styles.historyChartText}>Biểu đồ</Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={COLORS.primary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Thứ 6 */}
                    <View style={styles.historyDateGroup}>
                        <Text style={styles.historyDateTitle}>Thứ 6, 23/10/26</Text>

                        {[
                            { set: 2, duration: "8 phút", time: "00:33" },
                            { set: 1, duration: "8 phút", time: "00:27" },
                        ].map((item, index) => (
                            <View style={styles.historyRow} key={index}>
                                <View style={styles.historyLeft}>
                                    <Text style={styles.historySet}>#{item.set}</Text>
                                    <Text style={styles.historyDuration}>
                                        {item.duration}
                                    </Text>
                                </View>

                                <Text style={styles.historyTime}>{item.time}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Thứ 5 */}
                    <View style={styles.historyDateGroup}>
                        <Text style={styles.historyDateTitle}>Thứ 5, 22/10/26</Text>

                        {[
                            { set: 3, duration: "8 phút", time: "20:13" },
                            { set: 2, duration: "8 phút", time: "20:08" },
                            { set: 1, duration: "8 phút", time: "20:08" },
                        ].map((item, index) => (
                            <View style={styles.historyRow} key={index}>
                                <View style={styles.historyLeft}>
                                    <Text style={styles.historySet}>#{item.set}</Text>
                                    <Text style={styles.historyDuration}>
                                        {item.duration}
                                    </Text>
                                </View>

                                <Text style={styles.historyTime}>{item.time}</Text>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>

    );

};


const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 24,
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
        backgroundColor: COLORS.accentGreen,
    },
    mediaFallback: {
        alignItems: "center",
        gap: 8,
    },
    mediaFallbackText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textMuted,
    },
    weightChip: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        marginHorizontal: 16,
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
    },
    weightChipLabel: {
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    controlCard: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    startGradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    addGradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    historyTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    historyIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },

    /* ================= HEADER ================= */
    header: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },


    backButton: {
        position: "absolute",
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: COLORS.primarySoft,
        justifyContent: "center",
        alignItems: "center",
    },


    headerTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    // headerTimer: {
    //     position: "absolute",
    //     right: wp("4%"),
    //     paddingHorizontal: wp("4%"),
    //     paddingVertical: hp("0.7%"),
    //     borderRadius: wp("5%"),
    //     backgroundColor: "#ace6ed",
    // },
    headerTimer: {
        position: "absolute",
        right: 16,
        minWidth: 76,
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        ...SHADOWS.glow,
    },
    headerTimerStartText: {
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.white,
    },
    headerTimerRunning: {
        backgroundColor: COLORS.surfaceTeal,
        borderWidth: 1,
        borderColor: COLORS.borderFocus,
        shadowOpacity: 0,
        elevation: 0,
    },
    headerTimerText: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.primary,
    },
    /* ================= NOTICE ================= */
    noticeBox: {
        marginHorizontal: 16,
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF6FD",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#D3E7F8",
        marginTop: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 10,
    },
    noticeIcon: {
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
    },
    noticeText: {
        flex: 1,
        color: "#1F5F96",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 18,
    },

    /* ================= EXERCISE ================= */
    exerciseArea: {
        marginHorizontal: 16,
        marginTop: 16,
        height: hp("33%"),
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        ...SHADOWS.card,
    },

    exerciseImageArea: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },

    exerciseImage: {
        width: "100%",
        height: "100%",
    },

    /* RIGHT ICONS */
    rightButtons: {
        position: "absolute",
        right: 12,
        top: 12,
        alignItems: "center",
        gap: 8,
    },

    rightIconButton: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.95)",
        ...SHADOWS.small,
    },

    /* ================= TITLE ================= */

    exerciseTitle: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: "800",
        paddingHorizontal: 16,
        marginTop: 18,
    },
    exerciseTitle1: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: "800",
    },


    /* ================= CONTROLS ================= */

    controlContainer: {
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-around",
    },


    controlItem: {
        width: "31%",
        alignItems: "center",
    },


    circleNormal: {
        width: wp("19%"),
        height: wp("19%"),
        borderRadius: wp("9.5%"),
        borderWidth: 3,
        borderColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.surfaceTeal,
    },


    startCircle: {
        width: 82,
        height: 82,
        borderRadius: 41,
        overflow: "hidden",
        marginTop: -5,
        ...SHADOWS.glow,
    },


    setCircle: {
        width: wp("19%"),
        height: wp("19%"),
        borderRadius: wp("9.5%"),
        borderWidth: 2.5,
        borderColor: "#FFB7BC",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },


    circleNumber: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: "800",
    },

    startText: {
        color: "#11B7BC",
        fontSize: wp("3%"),
        fontWeight: "500",
        marginBottom: hp("0.2%"),
    },


    controlLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textSecondary,
        marginTop: 8,
    },


    controlSubLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    /* ================= SECOND ================= */

    secondArea: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        width: "100%",
    },

    secondButton: {
        flex: 1,
        height: 48,
        backgroundColor: COLORS.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },

    secondText: {
        color: "#A4AFB1",
        fontSize: wp("3.6%"),
    },

    addButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        overflow: "hidden",
        flexShrink: 0,
        ...SHADOWS.glow,
    },


    /* ================= BOTTOM NAV ================= */

    bottomNavigation: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: hp("7.5%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        borderTopWidth: 1,
        borderTopColor: "#E7ECEE",
        backgroundColor: "#FFFFFF",
    },
    navItem: {
        flex: 1,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },


    activeNavIcon: {
        paddingHorizontal: wp("4.5%"),
        paddingVertical: hp("0.2%"),
        backgroundColor: "#E7F7F8",
        borderRadius: wp("5%"),
    },

    navText: {
        marginTop: hp("0.2%"),
        fontSize: wp("2.2%"),
        color: "#727F83",
    },

    activeNavText: { color: "#18BEC2", },
    moreContainer: { position: "relative", },
    notificationBadge: {
        position: "absolute",
        top: -hp("0.5%"),
        right: -wp("2%"),
        width: wp("3.8%"),
        height: wp("3.8%"),
        borderRadius: wp("1.9%"),
        backgroundColor: "#FF6070",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#FFFFFF",
    },
    badgeText: {
        color: "#FFFFFF",
        fontSize: wp("1.8%"),
        fontWeight: "700",
    },
    /* ================= MODAL INFO STYLES ================= */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: wp("6%"),
        borderTopRightRadius: wp("6%"),
        paddingHorizontal: wp("5%"),
        paddingTop: hp("2.5%"),
        paddingBottom: hp("3.5%"),
        maxHeight: hp("78%"),
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: hp("1.5%"),
        borderBottomWidth: 1,
        borderBottomColor: "#F0F3F4",
    },
    modalHeaderTitleGroup: {
        flexDirection: "row",
        alignItems: "center",
    },
    modalHeaderIcon: {
        width: wp("8.5%"),
        height: wp("8.5%"),
        borderRadius: wp("4.25%"),
        backgroundColor: "#E8FAF9",
        alignItems: "center",
        justifyContent: "center",
        marginRight: wp("2.5%"),
    },
    modalHeaderTitle: {
        fontSize: wp("4.3%"),
        fontWeight: "700",
        color: "#182022",
    },
    modalCloseButton: {
        padding: wp("1.5%"),
    },
    modalBody: {
        marginVertical: hp("1.5%"),
    },
    modalExerciseName: {
        fontSize: wp("4.8%"),
        fontWeight: "700",
        color: "#283235",
        marginBottom: hp("1.2%"),
    },
    modalBadgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: hp("2%"),
    },
    modalBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F4F7F8",
        paddingHorizontal: wp("3%"),
        paddingVertical: hp("0.7%"),
        borderRadius: wp("4%"),
        marginRight: wp("2%"),
        marginBottom: hp("0.8%"),
    },
    modalBadgeText: {
        fontSize: wp("3%"),
        fontWeight: "600",
        color: "#4A5558",
        marginLeft: wp("1.5%"),
    },
    modalSection: {
        marginBottom: hp("1.8%"),
    },
    modalSectionTitle: {
        fontSize: wp("3.7%"),
        fontWeight: "700",
        color: "#283235",
        marginBottom: hp("1.2%"),
    },
    modalStepItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: hp("1.4%"),
    },
    stepNumberBadge: {
        width: wp("6%"),
        height: wp("6%"),
        borderRadius: wp("3%"),
        backgroundColor: "#1BC3C8",
        alignItems: "center",
        justifyContent: "center",
        marginRight: wp("3%"),
        marginTop: hp("0.2%"),
    },
    stepNumberText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: wp("3%"),
    },
    stepDescText: {
        flex: 1,
        fontSize: wp("3.3%"),
        color: "#4B565A",
        lineHeight: wp("4.8%"),
    },
    modalWarningBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ECFDF5",
        padding: wp("3.5%"),
        borderRadius: wp("3%"),
        borderWidth: 1,
        borderColor: "#A7F3D0",
        marginTop: hp("0.5%"),
        marginBottom: hp("1%"),
    },
    modalWarningTitle: {
        fontSize: wp("3.3%"),
        fontWeight: "700",
        color: "#065F46",
    },
    modalWarningDesc: {
        fontSize: wp("3%"),
        color: "#047857",
        marginTop: hp("0.3%"),
        lineHeight: wp("4.3%"),
    },
    modalSubmitButton: {
        backgroundColor: "#1BC3C8",
        paddingVertical: hp("1.6%"),
        borderRadius: wp("3%"),
        alignItems: "center",
        justifyContent: "center",
        marginTop: hp("0.5%"),
    },
    modalSubmitText: {
        color: "#FFFFFF",
        fontSize: wp("3.8%"),
        fontWeight: "700",
    },
    secondInput: {
        flex: 0,
        minWidth: wp("10%"),
        maxWidth: wp("30%"),
        paddingVertical: 0,
        paddingHorizontal: 4,
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: "700",
        textAlign: "right",
    },

    secondUnit: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 4,
        marginRight: 0,
    },
    progressCircle: {
        width: wp("19%"),
        height: wp("19%"),
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },

    progressText: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
    },
    secondSection: {
        width: "100%",
    },

    addSetNoteButton: {
        marginTop: 14,
        marginHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        paddingHorizontal: 14,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primaryLight,
    },

    addSetNoteText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.primary,
    },

    setNoteContainer: {
        marginTop: 14,
        marginHorizontal: 16,
        padding: 14,
        backgroundColor: COLORS.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },

    setNoteLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textSecondary,
        marginBottom: 6,
    },

    setNoteInput: {
        width: "100%",
        minHeight: 80,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
        textAlignVertical: "top",
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },

    historyContainer: {
        marginTop: 24,
        marginHorizontal: 16,
        marginBottom: 16,
    },

    historyHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    historyTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    historyChartButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 12,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
    },

    historyChartText: {
        fontSize: 12.5,
        fontWeight: "700",
        color: COLORS.primary,
    },

    historyDateGroup: {
        overflow: "hidden",
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },

    historyDateTitle: {
        backgroundColor: COLORS.surfaceTeal,
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: "800",
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    historyRow: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },

    historyLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    historySet: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: "800",
    },

    historyDuration: {
        fontSize: 13.5,
        color: COLORS.textSecondary,
    },

    historyTime: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textMuted,
    },


});


export default ReportPage;
