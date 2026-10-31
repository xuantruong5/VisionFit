import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Gesture, GestureDetector, } from "react-native-gesture-handler";
import { PieChart } from "react-native-gifted-charts";

import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import { COLORS, SHADOWS } from "../../general/theme";

const ResultPage = ({ navigation }: any) => {
    // phóng to mô hình người và xoay 
    const [showBodyModal, setShowBodyModal] = useState(false);
    const currentDateStr = new Date().toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
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
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="dark-content" />
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} >
                {/* HEADER */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroHeader}
                >
                    <View style={styles.heroCircleLg} />
                    <View style={styles.heroCircleSm} />
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.circleButton}
                            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate("MemberTabs"))}
                        >
                            <Ionicons name="close" size={22} color={COLORS.white} />
                        </TouchableOpacity>
                        {/* LOGO FITNESS ONLINE */}
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>
                                VisionFit
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.circleButton} onPress={() => {}}>
                            <Ionicons name="share-outline" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                    {/* TITLE */}
                    <Text style={styles.title}>Kết quả tập luyện</Text>
                    <View style={styles.datePill}>
                        <Ionicons name="calendar-outline" size={13} color={COLORS.white} />
                        <Text style={styles.date}>
                            {currentDateStr}
                        </Text>
                    </View>
                </LinearGradient>
                <View style={styles.body}>
                {/* WORKOUT SUMMARY */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryIconTile}>
                        <Ionicons name="trophy" size={22} color={COLORS.accentOrange} />
                    </View>
                    <View style={styles.summaryTextWrap}>
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
                <View style={styles.quoteCard}>
                    <Ionicons name="chatbox-ellipses-outline" size={20} color={COLORS.primary} style={styles.quoteIcon} />
                    <Text style={styles.quote}>
                        Khổng Tử đã nói rằng ngọc không giũa không
                        sáng, con người trải qua thất bại mới thành
                        công.
                    </Text>
                </View>

                {/* DURATION + REST */}
                <View style={styles.row}>
                    <View style={styles.infoCard}>
                        <View style={[styles.infoIconTile, styles.tileTeal]}>
                            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.infoValue}>
                            2:05
                        </Text>
                        <Text style={styles.infoLabel}>
                            Thời lượng tập luyện
                        </Text>
                    </View>
                    <View style={styles.infoCard}>
                        <View style={[styles.infoIconTile, styles.tileViolet]}>
                            <Ionicons name="pause-circle-outline" size={20} color="#7C3AED" />
                        </View>
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
                        <View style={[styles.statIconTile, styles.tileOrange]}>
                            <Ionicons name="flame-outline" size={22} color={COLORS.accentOrange} />
                        </View>
                        <Text style={styles.questionMark}>?</Text>
                        <Text style={styles.statLabel}>
                            Calo
                        </Text>
                    </View>
                    {/* STEPS */}
                    <View style={styles.statItem}>
                        <View style={[styles.statIconTile, styles.tileTeal]}>
                            <Ionicons name="footsteps-outline" size={22} color={COLORS.primary} />
                        </View>
                        <View style={styles.lockCircle}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.accentRed} />
                        </View>
                        <Text style={styles.statLabel}>
                            Bước
                        </Text>
                    </View>

                    {/* HEART RATE */}
                    <View style={styles.statItem}>
                        <View style={[styles.statIconTile, styles.tileRose]}>
                            <Ionicons name="heart-outline" size={22} color="#E11D48" />
                        </View>
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
                                <Ionicons name="lock-closed-outline" size={30} color={COLORS.accentRed} />
                            </View>
                            {/* NÚT PHÓNG TO */}
                            <TouchableOpacity style={styles.expandButton} onPress={() => setShowBodyModal(true)}>
                                <Ionicons name="scan-outline" size={26} color={COLORS.primary} />
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
                                innerCircleColor={COLORS.white}
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
                        <TouchableOpacity style={styles.shareReportWrap} activeOpacity={0.8} onPress={() => {console.log("Chia sẻ báo cáo"); }} >
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.shareReportButton}
                            >
                                <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
                                <Text style={styles.shareReportText}>
                                    CHIA SẺ BÁO CÁO
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>


                        {/* XÓA KẾT QUẢ */}
                        <TouchableOpacity style={styles.deleteResultButton} activeOpacity={0.8} onPress={() => {console.log("Xóa kết quả tập luyện"); }} >
                            <Ionicons name="trash-outline" size={18} color={COLORS.accentRed} />
                            <Text style={styles.deleteResultText}>
                                Xóa kết quả tập luyện
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
                </View>
            </ScrollView>
            <Modal visible={showBodyModal} animationType="fade" onRequestClose={() => setShowBodyModal(false)} >
                <View style={styles.modalContainer}>
                    {/* NÚT ĐÓNG */}
                    <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowBodyModal(false)} >
                        <Ionicons name="close" size={26} color={COLORS.white} />
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
                        <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
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
        backgroundColor: COLORS.background,
    },
    scroll: {
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    body: {
        paddingHorizontal: 16,
    },
    // HEADER
    heroHeader: {
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 58,
        borderRadius: 28,
        marginHorizontal: 12,
        marginTop: 6,
        overflow: "hidden",
    },
    heroCircleLg: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(255,255,255,0.07)",
        top: -70,
        right: -60,
    },
    heroCircleSm: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.06)",
        bottom: -40,
        left: -30,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    circleButton: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
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
        fontSize: 12,
        fontWeight: "800",
        color: "#9EE7E5",
        letterSpacing: 1.5,
        textTransform: "uppercase",
    },
    // TITLE
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: COLORS.white,
        textAlign: "center",
        marginTop: 18,
    },
    datePill: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    date: {
        fontSize: 12.5,
        color: COLORS.white,
        fontWeight: "600",
    },
    // SUMMARY
    summaryCard: {
        marginTop: -34,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        ...SHADOWS.card,
        shadowOpacity: 0.12,
        elevation: 6,
    },
    summaryIconTile: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: "#FFF1EC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    summaryTextWrap: {
        flex: 1,
    },
    smallText: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: "600",
    },

    workoutName: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginTop: 3,
        textTransform: "capitalize",
    },
    progressCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 5,
        borderColor: "#FFE1D6",
        borderTopColor: COLORS.accentOrange,
        justifyContent: "center",
        alignItems: "center",
    },
    progressText: {
        fontSize: 16,
        color: COLORS.accentOrange,
        fontWeight: "800",
    },
    // QUOTE
    quoteCard: {
        flexDirection: "row",
        marginTop: 16,
        padding: 14,
        borderRadius: 18,
        backgroundColor: COLORS.surfaceTeal,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    quoteIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    quote: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 21,
        fontStyle: "italic",
    },
    // ROW
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 16,
    },
    infoCard: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 10,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
        ...SHADOWS.card,
    },
    infoIconTile: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    tileTeal: {
        backgroundColor: COLORS.surfaceTeal,
    },
    tileViolet: {
        backgroundColor: "#F5F3FF",
    },
    tileOrange: {
        backgroundColor: "#FFF1EC",
    },
    tileRose: {
        backgroundColor: "#FFF1F2",
    },
    infoValue: {
        fontSize: 22,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
        textAlign: "center",
    },
    // STATISTICS
    statisticsCard: {
        marginTop: 16,
        paddingVertical: 18,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        ...SHADOWS.card,
    },
    statIconTile: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    questionMark: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textLight,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: "600",
        marginTop: 4,
    },
    lockCircle: {
        marginTop: 8,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    // MỤC TIÊU
    goalSection: {
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    goalTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginBottom: 14,
    },
    goalItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },
    goalCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    redCircle: {
        borderColor: "#FECACA",
        backgroundColor: "#FEF2F2",
    },
    greenCircle: {
        borderColor: COLORS.accentGreen,
        backgroundColor: "#ECFDF5",
    },
    orangeCircle: {
        borderColor: "#FCD34D",
        backgroundColor: "#FFF7ED",
    },
    redText: {
        color: COLORS.accentRed,
        fontSize: 14,
        fontWeight: "800",
    },
    greenText: {
        color: COLORS.accentGreen,
        fontSize: 14,
        fontWeight: "800",
    },
    orangeText: {
        color: COLORS.accentGold,
        fontSize: 14,
        fontWeight: "800",
    },
    goalContent: {
        marginLeft: 14,
        flex: 1,
    },
    goalName: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    goalDescription: {
        fontSize: 12.5,
        color: COLORS.textMuted,
        marginTop: 3,
    },
    // ===============================
    // TẬP LUYỆN CÁC NHÓM CƠ
    // ===============================

    muscleSection: {
        marginTop: 22,
    },
    muscleTitle: {
        fontSize: 17,
        color: COLORS.textPrimary,
        fontWeight: "800",
        marginBottom: 14,
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
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: wp("3%"),
        paddingVertical: hp("1.2%"),
        marginBottom: hp("1.3%"),
        minHeight: hp("7%"),
        justifyContent: "center",
    },
    muscleLabelSmall: {
        backgroundColor: COLORS.surfaceTeal,
        borderRadius: 12,
        paddingHorizontal: wp("2.5%"),
        paddingVertical: hp("0.8%"),
        marginBottom: hp("0.9%"),
        minHeight: hp("5%"),
        justifyContent: "center",
    },

    muscleLabelText: {
        fontSize: wp("3.1%"),
        color: COLORS.textSecondary,
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
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: COLORS.borderFocus,
        backgroundColor: COLORS.white,
        ...SHADOWS.card,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    switchRow: {
        marginTop: hp("1%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    switchTitle: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: "700",
    },
    switch: {
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "flex-end",
        paddingHorizontal: wp("1%"),
    },
    switchCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    legend: {
        marginTop: 14,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 4,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        width: "48%",
        marginBottom: hp("2%"),
    },
    legendDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        marginRight: 8,
    },
    legendText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: "600",
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
        backgroundColor: "#071F24",
        justifyContent: "center",
        alignItems: "center",
    },
    closeModalButton: {
        position: "absolute",
        top: hp("6%"),
        right: wp("5%"),
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    modalTitle: {
        position: "absolute",
        top: hp("7%"),
        color: COLORS.white,
        fontSize: 18,
        fontWeight: "800",
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
        borderRadius: 16,
        backgroundColor: COLORS.white,
    },
    resetText: {
        marginLeft: 8,
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: "800",
    },
    // ===============================
    // PHÂN BỔ TẢI TRỌNG CƠ
    // ===============================

    distributionSection: {
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },

    distributionTitle: {
        fontSize: 17,
        color: COLORS.textPrimary,
        fontWeight: "800",
        marginBottom: 8,
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
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    distributionList: {
        marginTop: 8,
    },

    distributionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },

    distributionName: {
        flexDirection: "row",
        alignItems: "center",
    },

    distributionDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 10,
    },

    distributionLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },

    distributionValue: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    // ===============================
    // BÀI TẬP
    // ===============================

    exerciseSection: {
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },

    exerciseTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginBottom: 10,
    },

    exerciseItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },

    exerciseImageContainer: {
        width: 76,
        height: 76,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceTeal,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },

    exerciseImage: {
        width: 72,
        height: 72,
    },

    exerciseInfo: {
        flex: 1,
        marginLeft: 14,
        justifyContent: "center",
    },

    exerciseName: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    exerciseValue: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 4,
    },

    // ===============================
    // BUTTONS
    // ===============================

    actionSection: {
        marginTop: 20,
    },

    shareReportWrap: {
        borderRadius: 16,
        marginBottom: 12,
        ...SHADOWS.glow,
    },

    shareReportButton: {
        height: 54,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    shareReportText: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.white,
        letterSpacing: 0.5,
    },

    deleteResultButton: {
        height: 52,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: "#FECACA",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    deleteResultText: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.accentRed,
    },
});

export default ResultPage;