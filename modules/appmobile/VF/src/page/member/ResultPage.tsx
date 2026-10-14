import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Modal, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Gesture, GestureDetector, } from "react-native-gesture-handler";
import { PieChart } from "react-native-gifted-charts";

import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
const ResultPage = () => {
    // phóng to mô hình người và xoay 
    const [showBodyModal, setShowBodyModal] = useState(false);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const pinch = Gesture.Pinch().onUpdate(e => { scale.value = Math.min(4, Math.max(0.5, scale.value * e.scale)); });
    const rotate = Gesture.Rotation().onUpdate(e => { rotation.value += e.rotation; });
    const gesture = Gesture.Simultaneous(pinch, rotate);
    const animatedBodyStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: `${rotation.value}rad` },], }));

    // dữ liệu cứng cho biểu đồ 
    const muscleDistribution = [
        {
            value: 43.54,
            color: "#8E44AD",
            label: "Chân",
        },
        {
            value: 23.48,
            color: "#5797D2",
            label: "Mông",
        },
        {
            value: 3.28,
            color: "#4B5054",
            label: "Ngực",
        },
        {
            value: 4.79,
            color: "#F39A0B",
            label: "Vai",
        },
        {
            value: 6.76,
            color: "#F06C78",
            label: "Tay",
        },
    ];
    // bài tập 
    const exercises = [
        {
            id: 1,
            name: "Chạy bộ trên máy",
            type: "Phút",
            value: 16,
            image: {
                uri: "https://cdn.hstatic.net/files/200001165929/file/20230816_dq2yqj1q.jpg"
            },
        },
        {
            id: 2,
            name: "Bài tập giãn cơ ngực",
            type: "Giây",
            value: 60,
            image: {
                uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBS1KPmCUpJMFq1XA4ug_NXpNAji-mSNryl6_j7eEhIG7ddhskOF75gLE&s=10"
            },
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.circleButton}>
                        <Ionicons name="close" size={34} color="#55738C" />
                    </TouchableOpacity>
                    {/* LOGO FITNESS ONLINE */}
                    <View style={styles.logoContainer}>
                        {/* Sau này thay View này bằng Image logo */}
                        {/* <Image
                            source={require("../../assets/logo.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        /> */}
                        <Text style={styles.logoText}>
                            VisionFit
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.circleButton}>
                        <Ionicons name="share-outline" size={31} color="#55738C" />
                    </TouchableOpacity>
                </View>
                {/* TITLE */}
                <Text style={styles.title}>Kết quả tập luyện</Text>
                <Text style={styles.date}>
                    ngày 23 tháng 9, 2026, 15:08
                </Text>
                {/* WORKOUT SUMMARY */}
                <View style={styles.summaryCard}>
                    <View>
                        <Text style={styles.smallText}>
                            1 ngày tập luyện
                        </Text>
                        <Text style={styles.workoutName}>
                            thân trên
                        </Text>
                    </View>
                    {/* PROGRESS CIRCLE */}
                    <View style={styles.progressCircle}>
                        <Text style={styles.progressText}>
                            18%
                        </Text>
                    </View>
                </View>
                {/* QUOTE */}
                <Text style={styles.quote}>
                    Khổng Tử đã nói rằng ngọc không giũa không
                    sáng, con người trải qua thất bại mới thành
                    công.
                </Text>

                {/* DURATION + REST */}
                <View style={styles.row}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoValue}>
                            2:05
                        </Text>
                        <Text style={styles.infoLabel}>
                            Thời lượng tập luyện
                        </Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoValue}>
                            0:00
                        </Text>
                        <Text style={styles.infoLabel}>
                            Nghỉ trung bình
                        </Text>
                    </View>
                </View>

                {/* STATISTICS */}
                <View style={styles.statisticsCard}>
                    {/* CALORIES */}
                    <View style={styles.statItem}>
                        <Ionicons name="flame-outline" size={26} color="#F7D9B2" />
                        <Text style={styles.questionMark}>?</Text>
                        <Text style={styles.statLabel}>
                            Calo
                        </Text>
                    </View>
                    {/* STEPS */}
                    <View style={styles.statItem}>
                        <Ionicons name="footsteps-outline" size={26} color="#DCE3E8" />
                        <View style={styles.lockCircle}>
                            <Ionicons name="lock-closed-outline" size={29} color="#FF6969" />
                        </View>
                        <Text style={styles.statLabel}>
                            Bước
                        </Text>
                    </View>

                    {/* HEART RATE */}
                    <View style={styles.statItem}>
                        <Ionicons name="heart-outline" size={27} color="#F6D8E1" />
                        <Text style={styles.questionMark}>?</Text>
                        <Text style={styles.statLabel}>
                            Nhịp tim
                        </Text>
                    </View>
                </View>
                {/* MỤC TIÊU */}
                <View style={styles.goalSection}>
                    <Text style={styles.goalTitle}>Mục tiêu</Text>
                    {/* REP */}
                    <View style={styles.goalItem}>
                        <View style={[styles.goalCircle, styles.redCircle]}>
                            <Text style={styles.redText}>0%</Text>
                        </View>
                        <View style={styles.goalContent}>
                            <Text style={styles.goalName}>Rep thực hiện</Text>
                            <Text style={styles.goalDescription}>
                                0 reps của 150 reps dự kiến
                            </Text>
                        </View>
                    </View>
                    {/* WEIGHT */}
                    <View style={styles.goalItem}>
                        <View style={[styles.goalCircle, styles.redCircle]}>
                            <Text style={styles.redText}>0%</Text>
                        </View>
                        <View style={styles.goalContent}>
                            <Text style={styles.goalName}>Mức tạ nâng được</Text>
                            <Text style={styles.goalDescription}>
                                0 kg của 1.320 kg dự kiến
                            </Text>
                        </View>
                    </View>
                    {/* CARDIO */}
                    <View style={styles.goalItem}>
                        <View style={[styles.goalCircle, styles.greenCircle]}>
                            <Text style={styles.greenText}>89%</Text>
                        </View>

                        <View style={styles.goalContent}>
                            <Text style={styles.goalName}>Cardio</Text>
                            <Text style={styles.goalDescription}>
                                16 phút của 18 phút dự kiến
                            </Text>
                        </View>
                    </View>
                    {/* TIME */}
                    <View style={styles.goalItem}>
                        <View style={[styles.goalCircle, styles.orangeCircle]}>
                            <Text style={styles.orangeText}>46%</Text>
                        </View>

                        <View style={styles.goalContent}>
                            <Text style={styles.goalName}>Giây</Text>
                            <Text style={styles.goalDescription}>
                                60 giây của 130 giây dự kiến
                            </Text>
                        </View>
                    </View>
                </View>
                {/* TẬP LUYỆN CÁC NHÓM CƠ */}
                <View style={styles.muscleSection}>
                    <Text style={styles.muscleTitle}>
                        Tập luyện các nhóm cơ
                    </Text>
                    {/* KHU VỰC BODY */}
                    <View style={styles.bodyContainer}>
                        {/* LABEL BÊN TRÁI */}
                        <View style={styles.leftLabels}>
                            <View style={styles.muscleLabel}>
                                <Text style={styles.muscleLabelText}>
                                    Cơ ngực lớn
                                    {"\n"}
                                    (Pectoralis Major)
                                </Text>
                            </View>

                            <View style={styles.muscleLabel}>
                                <Text style={styles.muscleLabelText}>
                                    Cơ delta trước
                                    {"\n"}
                                    (Anterior Deltoid)
                                </Text>
                            </View>

                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    66,7% Cơ khất
                                    {"\n"}
                                    rộng Hạp
                                </Text>
                            </View>

                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    3,09% Cơ lung
                                </Text>
                            </View>

                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    3,39% Cơ rứa
                                </Text>
                            </View>

                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    3,39% Cơ răng dài
                                </Text>
                            </View>

                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    3,29% Cơ Hơsi
                                </Text>
                            </View>

                        </View>

                        {/* BODY Ở GIỮA */}
                        <View style={styles.bodyImageContainer}>
                            <Image source={require("../../assets/muscleBody/body.jpg")} style={styles.bodyImage} resizeMode="contain" />
                            {/* KHÓA */}
                            <View style={styles.bodyLock}>
                                <Ionicons name="lock-closed-outline" size={35} color="#FF535C" />
                            </View>
                            {/* NÚT PHÓNG TO */}
                            <TouchableOpacity style={styles.expandButton} onPress={() => setShowBodyModal(true)}>
                                <Ionicons name="scan-outline" size={34} color="#3DB8BA" />
                            </TouchableOpacity>
                        </View>
                        {/* LABEL BÊN PHẢI */}
                        <View style={styles.rightLabels}>
                            <View style={styles.muscleLabel}>
                                <Text style={styles.muscleLabelText}>
                                    Cơ nhị đầu cánh
                                    {"\n"}
                                    tay (Biceps Brachii)
                                </Text>
                            </View>
                            <View style={styles.muscleLabel}>
                                <Text style={styles.muscleLabelText}>
                                    Cơ delta giữa
                                    {"\n"}
                                    (Medial Deltoid)
                                </Text>
                            </View>
                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    16,49% Cơ rộng
                                    {"\n"}
                                    mạp đỏ
                                </Text>
                            </View>
                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    31,69% Cơ khẳng
                                    {"\n"}
                                    dài
                                </Text>
                            </View>
                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    16,89% Cơ lăng
                                    {"\n"}
                                    (gon)
                                </Text>
                            </View>
                            <View style={styles.muscleLabelSmall}>
                                <Text style={styles.muscleLabelText}>
                                    1,59% Cơ răng
                                    {"\n"}
                                    trong
                                </Text>
                            </View>
                        </View>
                    </View>
                    {/* SWITCH */}
                    <View style={styles.switchRow}>
                        <Text style={styles.switchTitle}>
                            Tên cơ
                        </Text>
                        <View style={styles.switch}>
                            <View style={styles.switchCircle} />
                        </View>
                    </View>
                    {/* LEGEND */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, styles.color1]} />
                            <Text style={styles.legendText}>
                                0 - 1.9%
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, styles.color2]} />
                            <Text style={styles.legendText}>
                                2.0 - 10.9%
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, styles.color3]} />
                            <Text style={styles.legendText}>
                                11.0 - 24.9%
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, styles.color4]} />
                            <Text style={styles.legendText}>
                                25.0 - 100%
                            </Text>
                        </View>
                    </View>
                    {/* PHÂN BỔ TẢI TRỌNG CƠ */}
                    <View style={styles.distributionSection}>

                        <Text style={styles.distributionTitle}>
                            Phân bổ tải trọng cơ
                        </Text>

                        <View style={styles.distributionChart}>

                            <PieChart
                                data={muscleDistribution}
                                donut
                                radius={wp("32%")}
                                innerRadius={wp("20%")}
                                innerCircleColor="#FFFFFF"
                                showText={false}
                                showValuesAsLabels={false}
                                focusOnPress={false}
                                strokeWidth={0}
                                centerLabelComponent={() => (
                                    <View style={styles.chartCenter}>
                                        <Text style={styles.chartCenterValue}>
                                            100%
                                        </Text>
                                    </View>
                                )}
                            />

                        </View>

                        {/* DANH SÁCH TỶ LỆ */}
                        <View style={styles.distributionList}>

                            {muscleDistribution.map((item, index) => (
                                <View
                                    key={index}
                                    style={styles.distributionItem}
                                >

                                    <View style={styles.distributionName}>
                                        <View
                                            style={[
                                                styles.distributionDot,
                                                {
                                                    backgroundColor: item.color,
                                                },
                                            ]}
                                        />

                                        <Text style={styles.distributionLabel}>
                                            {item.label}
                                        </Text>
                                    </View>

                                    <Text style={styles.distributionValue}>
                                        {item.value.toFixed(2)}%
                                    </Text>

                                </View>
                            ))}

                        </View>

                    </View>
                    {/* =============================== */}
                    {/* DANH SÁCH BÀI TẬP */}
                    {/* =============================== */}

                    <View style={styles.exerciseSection}>
                        <Text style={styles.exerciseTitle}>
                            Bài tập
                        </Text>

                        {exercises.map((exercise) => (
                            <View key={exercise.id} style={styles.exerciseItem} >

                                {/* ẢNH BÀI TẬP */}
                                <View style={styles.exerciseImageContainer}>
                                    <Image
                                        source={exercise.image}
                                        style={styles.exerciseImage}
                                        resizeMode="contain"
                                    />
                                </View>

                                {/* THÔNG TIN */}
                                <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseName}>
                                        {exercise.name}
                                    </Text>
                                    <Text style={styles.exerciseValue}>
                                        {exercise.type}: {exercise.value}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                    {/* NÚT CHIA SẺ + XÓA */}
                    <View style={styles.actionSection}>

                        {/* CHIA SẺ BÁO CÁO */}
                        <TouchableOpacity style={styles.shareReportButton} activeOpacity={0.8} onPress={() => {console.log("Chia sẻ báo cáo"); }} >
                            <Text style={styles.shareReportText}>
                                CHIA SẺ BÁO CÁO
                            </Text>
                        </TouchableOpacity>


                        {/* XÓA KẾT QUẢ */}
                        <TouchableOpacity style={styles.deleteResultButton} activeOpacity={0.8} onPress={() => {console.log("Xóa kết quả tập luyện"); }} >
                            <Text style={styles.deleteResultText}>
                                Xóa kết quả tập luyện
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>
            <Modal visible={showBodyModal} animationType="fade" onRequestClose={() => setShowBodyModal(false)} >
                <View style={styles.modalContainer}>
                    {/* NÚT ĐÓNG */}
                    <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowBodyModal(false)} >
                        <Ionicons name="close" size={32} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* TIÊU ĐỀ */}
                    <Text style={styles.modalTitle}>
                        Xoay & phóng to
                    </Text>

                    {/* HÌNH BODY */}
                    <GestureDetector gesture={gesture}>
                        <Animated.View style={styles.fullImageContainer}>
                            <Animated.Image
                                source={require("../../assets/muscleBody/body.jpg")}
                                style={[styles.fullBodyImage, animatedBodyStyle,]}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </GestureDetector>

                    {/* RESET */}
                    <TouchableOpacity style={styles.resetButton} onPress={() => { scale.value = 1; rotation.value = 0; }} >
                        <Ionicons name="refresh-outline" size={22} color="#3DB8BA" />
                        <Text style={styles.resetText}>
                            Đặt lại
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",

    },
    scrollContent: {
        paddingHorizontal: wp("3.5%"),
        paddingBottom: hp("3%"),
    },
    // HEADER
    header: {
        height: hp("12%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: hp("3%"),
    },
    circleButton: {
        width: wp("11%"),
        height: wp("11%"),
        borderRadius: wp("7%"),
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: wp("16%"),
        height: hp("5%"),
    },
    logoText: {
        fontSize: wp("3.4%"),
        fontWeight: "700",
        color: "#333333",
        marginTop: -hp("0.5%"),
    },
    // TITLE
    title: {
        fontSize: wp("6%"),
        fontWeight: "800",
        color: "#171717",
        textAlign: "center",
        marginTop: hp("1%"),
    },
    date: {
        fontSize: wp("4%"),
        color: "#6686A1",
        textAlign: "center",
        marginTop: hp("0.5%"),
    },
    // SUMMARY
    summaryCard: {
        marginTop: hp("4%"),
        minHeight: hp("12%"),
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: wp("4%"),
        paddingVertical: hp("2%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    smallText: {
        fontSize: wp("3.8%"),
        color: "#6686A1",
    },

    workoutName: {
        fontSize: wp("4.8%"),
        fontWeight: "700",
        color: "#171717",
        marginTop: hp("1%"),
    },
    progressCircle: {
        width: wp("18%"),
        height: wp("18%"),
        borderRadius: wp("9%"),
        borderWidth: 4,
        borderColor: "#FFD5C5",
        borderTopColor: "#FF633E",
        justifyContent: "center",
        alignItems: "center",
    },
    progressText: {
        fontSize: wp("4.5%"),
        color: "#FF633E",
        fontWeight: "600",
    },
    // QUOTE
    quote: {
        fontSize: wp("4.5%"),
        color: "#606060",
        lineHeight: hp("3.3%"),
        marginTop: hp("4%"),
        paddingHorizontal: wp("2%"),
    },
    // ROW
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: wp("3%"),
        marginTop: hp("4%"),
    },
    infoCard: {
        flex: 1,
        height: hp("12%"),
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    infoValue: {
        fontSize: wp("6%"),
        fontWeight: "500",
        color: "#171717",
    },
    infoLabel: {
        fontSize: wp("3.8%"),
        color: "#707070",
        marginTop: hp("1%"),
        textAlign: "center",
    },
    // STATISTICS
    statisticsCard: {
        marginTop: hp("4%"),
        height: hp("16%"),
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    questionMark: {
        fontSize: wp("5%"),
        color: "#D5D5D5",
        marginTop: hp("1%"),
    },
    statLabel: {
        fontSize: wp("3.8%"),
        color: "#D5D5D5",
        marginTop: hp("1%"),
    },
    lockCircle: {
        marginTop: hp("1%"),
        alignItems: "center",
        justifyContent: "center",
    },
    // MỤC TIÊU
    goalSection: {
        marginTop: hp("4%"),
        paddingHorizontal: wp("2%"),
    },
    goalTitle: {
        fontSize: wp("4.8%"),
        fontWeight: "500",
        color: "#6686A1",
        marginBottom: hp("2%"),
    },
    goalItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: hp("2.8%"),
    },
    goalCircle: {
        width: wp("18%"),
        height: wp("18%"),
        borderRadius: wp("9%"),
        borderWidth: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    redCircle: {
        borderColor: "#FFB4B4",
    },
    greenCircle: {
        borderColor: "#40BEB2",
    },
    orangeCircle: {
        borderColor: "#FFD28A",
    },
    redText: {
        color: "#FF4D4D",
        fontSize: wp("4.5%"),
        fontWeight: "600",
    },
    greenText: {
        color: "#35B5AA",
        fontSize: wp("4.5%"),
        fontWeight: "600",
    },
    orangeText: {
        color: "#F6B34E",
        fontSize: wp("4.5%"),
        fontWeight: "600",
    },
    goalContent: {
        marginLeft: wp("4%"),
        flex: 1,
    },
    goalName: {
        fontSize: wp("4.5%"),
        fontWeight: "700",
        color: "#222222",
    },
    goalDescription: {
        fontSize: wp("4.2%"),
        color: "#6686A1",
        marginTop: hp("0.5%"),
    },
    // ===============================
    // TẬP LUYỆN CÁC NHÓM CƠ
    // ===============================

    muscleSection: {
        marginTop: hp("4%"),
        paddingHorizontal: wp("1%"),
    },
    muscleTitle: {
        fontSize: wp("5%"),
        color: "#526F87",
        fontWeight: "500",
        marginBottom: hp("2%"),
    },
    bodyContainer: {
        height: hp("70%"),
        position: "relative",
        flexDirection: "row",
    },
    bodyImageContainer: {
        position: "absolute",
        left: wp("23%"),
        right: wp("23%"),
        height: hp("57%"),
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent"
    },
    bodyImage: {
        width: wp("43%"),
        height: hp("56%"),
    },
    bodyLock: {
        position: "absolute",
        top: hp("29%"),
        left: "50%",
        transform: [
            {
                translateX: -wp("5%"),
            },
        ],
        width: wp("10%"),
        height: wp("10%"),
        alignItems: "center",
        justifyContent: "center",
    },
    leftLabels: {
        position: "absolute",
        left: 0,
        top: hp("3%"),
        width: wp("25%"),
        zIndex: 5,
    },
    rightLabels: {
        position: "absolute",
        right: 0,
        top: hp("3%"),
        width: wp("25%"),
        zIndex: 4,
    },
    muscleLabel: {
        backgroundColor: "#EDF1F5",
        borderRadius: 14,
        paddingHorizontal: wp("3%"),
        paddingVertical: hp("1.2%"),
        marginBottom: hp("1.3%"),
        minHeight: hp("7%"),
        justifyContent: "center",
    },
    muscleLabelSmall: {
        backgroundColor: "#EDF1F5",
        borderRadius: 12,
        paddingHorizontal: wp("2.5%"),
        paddingVertical: hp("0.8%"),
        marginBottom: hp("0.9%"),
        minHeight: hp("5%"),
        justifyContent: "center",
    },

    muscleLabelText: {
        fontSize: wp("3.1%"),
        color: "#202020",
        lineHeight: hp("2.1%"),
    },
    expandButton: {
        position: "absolute",
        bottom: -wp("15%"),
        left: "50%",
        transform: [
            {
                translateX: -wp("6.5%"),
            },
        ],
        width: wp("13%"),
        height: wp("13%"),
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#83D6D5",
        backgroundColor: "#F2FFFF",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    switchRow: {
        marginTop: hp("1%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp("2%"),
    },
    switchTitle: {
        fontSize: wp("5%"),
        color: "#222222",
        fontWeight: "500",
    },
    switch: {
        width: wp("17%"),
        height: wp("8%"),
        borderRadius: wp("5%"),
        backgroundColor: "#32B8BA",
        justifyContent: "center",
        alignItems: "flex-end",
        paddingHorizontal: wp("1%"),
    },
    switchCircle: {
        width: wp("6%"),
        height: wp("6%"),
        borderRadius: wp("3%"),
        backgroundColor: "#FFFFFF",
    },
    legend: {
        marginTop: hp("3%"),
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: wp("2%"),
        paddingBottom: hp("4%"),
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        width: "48%",
        marginBottom: hp("2%"),
    },
    legendDot: {
        width: wp("7%"),
        height: wp("7%"),
        borderRadius: wp("3.5%"),
        marginRight: wp("2%"),
    },
    legendText: {
        fontSize: wp("3.5%"),
        color: "#333333",
    },
    color1: {
        backgroundColor: "#F8C28B",
    },
    color2: {
        backgroundColor: "#8BB9E8",
    },
    color3: {
        backgroundColor: "#A888E8",
    },
    color4: {
        backgroundColor: "#F27777",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#111111",
        justifyContent: "center",
        alignItems: "center",
    },
    closeModalButton: {
        position: "absolute",
        top: hp("6%"),
        right: wp("5%"),
        width: wp("12%"),
        height: wp("12%"),
        borderRadius: wp("6%"),
        backgroundColor: "#333333",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    modalTitle: {
        position: "absolute",
        top: hp("7%"),
        color: "#FFFFFF",
        fontSize: wp("5%"),
        fontWeight: "700",
    },
    fullImageContainer: {
        width: "100%",
        height: "75%",
        justifyContent: "center",
        alignItems: "center",
    },
    fullBodyImage: {
        width: wp("80%"),
        height: hp("65%"),
    },
    resetButton: {
        position: "absolute",
        bottom: hp("7%"),
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp("5%"),
        paddingVertical: hp("1.5%"),
        borderRadius: 25,
        backgroundColor: "#F2FFFF",
    },
    resetText: {
        marginLeft: wp("2%"),
        color: "#3DB8BA",
        fontSize: wp("4%"),
        fontWeight: "600",
    },
    // ===============================
    // PHÂN BỔ TẢI TRỌNG CƠ
    // ===============================

    distributionSection: {
        marginTop: hp("4%"),
        paddingHorizontal: wp("2%"),
    },

    distributionTitle: {
        fontSize: wp("5%"),
        color: "#526F87",
        fontWeight: "500",
        marginBottom: hp("2%"),
    },

    distributionChart: {
        height: hp("38%"),
        alignItems: "center",
        justifyContent: "center",
    },

    chartCenter: {
        alignItems: "center",
        justifyContent: "center",
    },

    chartCenterValue: {
        fontSize: wp("7%"),
        fontWeight: "500",
        color: "#333333",
    },

    distributionList: {
        marginTop: hp("1%"),
        paddingHorizontal: wp("2%"),
    },

    distributionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: hp("1.8%"),
    },

    distributionName: {
        flexDirection: "row",
        alignItems: "center",
    },

    distributionDot: {
        width: wp("5%"),
        height: wp("5%"),
        borderRadius: wp("2.5%"),
        marginRight: wp("3%"),
    },

    distributionLabel: {
        fontSize: wp("4%"),
        color: "#333333",
    },

    distributionValue: {
        fontSize: wp("4%"),
        fontWeight: "600",
        color: "#333333",
    },
    // ===============================
    // BÀI TẬP
    // ===============================

    exerciseSection: {
        marginTop: hp("3%"),
        backgroundColor: "#FFFFFF",
    },

    exerciseTitle: {
        fontSize: wp("5%"),
        fontWeight: "500",
        color: "#6686A1",
        marginBottom: hp("2%"),
    },

    exerciseItem: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: hp("13%"),
        marginBottom: hp("1%"),
    },

    exerciseImageContainer: {
        width: wp("20%"),
        height: hp("11%"),
        alignItems: "center",
        justifyContent: "center",
    },

    exerciseImage: {
        width: wp("19%"),
        height: hp("10%"),
    },

    exerciseInfo: {
        flex: 1,
        marginLeft: wp("3%"),
        justifyContent: "center",
    },

    exerciseName: {
        fontSize: wp("4.3%"),
        fontWeight: "500",
        color: "#222222",
    },

    exerciseValue: {
        fontSize: wp("3.8%"),
        color: "#6686A1",
        marginTop: hp("0.7%"),
    },

    // ===============================
    // BUTTONS
    // ===============================

    actionSection: {
        marginTop: hp("1%"),
        paddingBottom: hp("3%"),
    },

    shareReportButton: {
        height: hp("8%"),
        borderRadius: 12,
        backgroundColor: "#16B7BA",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: hp("2.5%"),
    },

    shareReportText: {
        fontSize: wp("4.8%"),
        fontWeight: "500",
        color: "#FFFFFF",
    },

    deleteResultButton: {
        height: hp("8%"),
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",

        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },

    deleteResultText: {
        fontSize: wp("4.8%"),
        fontWeight: "700",
        color: "#16B7BA",
    },
});

export default ResultPage;