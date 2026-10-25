import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, StatusBar, Modal, ScrollView, TextInput, DeviceEventEmitter, Alert, ActivityIndicator, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import Svg, { Circle } from "react-native-svg";
import Video from "react-native-video";
import apiFitlife from "../../../../general/api";
const ReportPage = ({ navigation, route }: any) => {
    // const [time, setTime] = useState(9);
    const [isRunning, setIsRunning] = useState(false);
    const [setCount, setSetCount] = useState(0);
    const exercise = route?.params?.exercise;
    const [showWeight, setShowWeight] = useState(false);
    const [showRep, setShowRep] = useState(false);
    const [showSeconds, setShowSeconds] = useState(false);
    const [showMinutesInput, setShowMinutesInput] = useState(false);
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
            setWorkoutTime((prev) => prev + 1);
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

                Alert.alert("Hoàn thành", "Bạn đã hoàn thành bài tập!");
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
        <View style={styles.container}>
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
                    <Ionicons name="chevron-back" size={wp("6%")} color="#61737B" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    {exercise?.thu_tu ?? 1}/{route?.params?.total_exercises ?? 0} Luyện tập
                </Text>

                <TouchableOpacity style={[styles.headerTimer, isWorkoutRunning && styles.headerTimerRunning,]}
                    activeOpacity={0.8} onPress={() => { if (!isWorkoutRunning) { handleWorkoutPause(); } }} >
                    {isWorkoutRunning ? (
                        <Text style={styles.headerTimerText}>
                            {formatTime(workoutTime)}
                        </Text>
                    ) : (
                        <Text style={styles.headerTimerStartText}>
                            Bắt đầu
                        </Text> 
                    )}
                </TouchableOpacity>
            </View>
            {/* ================= NOTICE ================= */}
            <TouchableOpacity style={styles.noticeBox} activeOpacity={0.85} >
                <View style={styles.noticeIcon}>
                    <Ionicons name="information-circle-outline" size={wp("5.5%")} color="#FFFFFF" />
                </View>
                <Text style={styles.noticeText}>
                    Xem cách diễn vào nhật ký{"\n"}
                    tập luyện
                </Text>
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
                        <Text>Video hướng dẫn bị lỗi</Text>
                    )}
                </View>
                {/* RIGHT BUTTONS */}
                <View style={styles.rightButtons}>
                    <TouchableOpacity style={styles.rightIconButton} onPress={handleReset} >
                        <Ionicons name="refresh" size={wp("5%")} color="#1BC3C8" />
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
                                        thu_tu: exercise?.thu_tu ,
                                    },
                                    categoryName: exercise?.noi_tap || "Bài tập",
                                    total_exercises: route?.params?.total_exercises ?? 0,
                                },
                            });
                        }}
                        activeOpacity={0.8}>
                        <Ionicons name="information" size={wp("5%")} color="#1BC3C8" />
                    </TouchableOpacity>
                </View>
            </View>
            {/* ================= EXERCISE TITLE ================= */}

            <Text style={styles.exerciseTitle}>
                {exercise?.ten_bai_tap || "Bài tập chưa có tên"}
            </Text>

            {exercise?.muc_ta_toi_thieu &&
                exercise.muc_ta_toi_thieu !== "0.00" && (
                    <Text style={styles.exerciseTitle1}>
                        <Text style={{ fontWeight: "bold" }}>
                            Mức tạ khuyến nghị:
                        </Text>
                        {exercise.muc_ta_toi_thieu}
                    </Text>
                )}


            {/* ================= CONTROLS ================= */}
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

                        <Ionicons name={isWorkoutRunning ? "pause" : "play"} size={wp("6.5%")} color="#0EB9BD" />
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
                            <Circle cx={circleSize / 2} cy={circleSize / 2} r={circleRadius} stroke="#FFE0E2" strokeWidth={3} fill="none" />

                            {/* Vòng tiến độ */}
                            {progress > 0 && (
                                <Circle
                                    cx={circleSize / 2}
                                    cy={circleSize / 2}
                                    r={circleRadius}
                                    stroke={progressColor}
                                    strokeWidth={3}
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
                                placeholderTextColor="#A4AFB1"
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
                                placeholderTextColor="#A4AFB1"
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
                            placeholderTextColor="#A4AFB1"
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
                            placeholderTextColor="#A4AFB1"
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
                            placeholderTextColor="#A4AFB1"
                            keyboardType="number-pad"
                            selectTextOnFocus />
                        {showRep && (
                            <Text style={styles.secondUnit}>Rep</Text>
                        )}
                    </View>
                ) : null}
                <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={handleAddSet} disabled={savingProgress} >
                    {savingProgress ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Ionicons name="add" size={wp("8%")} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
        </View>

    );

};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: hp("7%"),
    },

    /* ================= HEADER ================= */
    header: {
        height: hp("7%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: wp("3%"),
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",

    },


    backButton: {
        position: "absolute",
        left: wp("3%"),
        width: wp("10%"),
        height: wp("10%"),
        justifyContent: "center",
        alignItems: "center",
    },


    headerTitle: {
        fontSize: wp("3.7%"),
        fontWeight: "600",
        color: "#282F32",
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
        right: wp("4%"),
        minWidth: wp("20%"),
        height: hp("5%"),
        paddingHorizontal: wp("4%"),
        borderRadius: wp("7%"),
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",

        elevation: 2,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    headerTimerStartText: {
        fontSize: wp("4%"),
        fontWeight: "600",
        color: "#607D8B",
    },
    headerTimerRunning: {
        backgroundColor: "#EAF9FB",
    },
    headerTimerText: {
        fontSize: wp("3.8%"),
        fontWeight: "700",
        color: "#0D7F8D",
    },
    /* ================= NOTICE ================= */
    noticeBox: {
        width: wp("94%"),
        minHeight: hp("6%"),
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#4B9ADE",
        borderRadius: wp("1.5%"),
        marginTop: hp("1.5%"),
        paddingHorizontal: wp("4%"),
        paddingVertical: hp("1.2%"),
    },
    noticeIcon: {
        marginRight: wp("4%"),
    },
    noticeText: {
        color: "#FFFFFF",
        fontSize: wp("3%"),
        fontWeight: "500",
        lineHeight: wp("4%"),
    },

    /* ================= EXERCISE ================= */
    exerciseArea: {
        width: wp("100%"),
        height: hp("35%"),
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },

    exerciseImageArea: {
        width: wp("100%"),
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },

    exerciseImage: {
        width: wp("100%"),
        height: "100%",
    },

    /* RIGHT ICONS */
    rightButtons: {
        position: "absolute",
        right: wp("4%"),
        top: hp("2.5%"),
        alignItems: "center",
    },

    rightIconButton: {
        width: wp("10%"),
        height: wp("10%"),
        borderWidth: 1.5,
        borderColor: "#21C1C5",
        borderRadius: wp("2%"),
        alignItems: "center",
        justifyContent: "center",
        marginBottom: hp("1.2%"),
        backgroundColor: "#FFFFFF",
    },

    /* ================= TITLE ================= */

    exerciseTitle: {
        color: "#32383A",
        fontSize: wp("4%"),
        fontWeight: "500",
        paddingHorizontal: wp("4%"),
        marginTop: hp("0.3%"),
    },
    exerciseTitle1: {
        color: "#32383A",
        fontSize: wp("4%"),
        paddingHorizontal: wp("4%"),
        marginTop: hp("0.3%"),
    },


    /* ================= CONTROLS ================= */

    controlContainer: {
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-around",
        paddingHorizontal: wp("4%"),
        marginTop: hp("2.5%"),
    },


    controlItem: {
        width: wp("26%"),
        alignItems: "center",
    },


    circleNormal: {
        width: wp("19%"),
        height: wp("19%"),
        borderRadius: wp("9.5%"),
        borderWidth: 2.5,
        borderColor: "#13BEC2",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },


    startCircle: {
        width: wp("22%"),
        height: wp("22%"),
        borderRadius: wp("11%"),
        borderWidth: 2.5,
        borderColor: "#14BCC0",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginTop: -wp("1.5%"),
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
        color: "#283235",
        fontSize: wp("5%"),
        fontWeight: "500",
    },

    startText: {
        color: "#11B7BC",
        fontSize: wp("3%"),
        fontWeight: "500",
        marginBottom: hp("0.2%"),
    },


    controlLabel: {
        fontSize: wp("2.5%"),
        color: "#768184",
        marginTop: hp("0.6%"),
    },


    controlSubLabel: {
        fontSize: wp("2.3%"),
        color: "#8A9396",
        marginTop: hp("0.1%"),

    },
    /* ================= SECOND ================= */

    secondArea: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp("3%"),
        marginTop: hp("1.6%"),
        width: "100%",
    },

    secondButton: {
        flex: 1,
        height: hp("5.2%"),
        backgroundColor: "#EDF7F9",
        borderRadius: wp("1.5%"),
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginRight: wp("2%"),
    },

    secondText: {
        color: "#A4AFB1",
        fontSize: wp("3.6%"),
    },

    addButton: {
        width: wp("12%"),
        height: wp("12%"),
        borderRadius: wp("2%"),
        backgroundColor: "#20BEC2",
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
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

    activeNavText: { color: "#18BEC2",},
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
        paddingHorizontal: wp("1%"),
        color: "#283235",
        fontSize: wp("3.6%"),
        textAlign: "right",
    },

    secondUnit: {
        color: "#A4AFB1",
        fontSize: wp("4%"),
        marginLeft: wp("1%"),
        marginRight: 0,
    },
    progressCircle: {
        width: wp("20%"),
        height: wp("20%"),
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

});


export default ReportPage;
