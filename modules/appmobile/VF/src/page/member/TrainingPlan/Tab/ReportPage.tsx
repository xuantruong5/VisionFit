import React, { useEffect, useState } from "react";

import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    StatusBar,
    Modal,
    ScrollView,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Video from "react-native-video";


const ReportPage = ({ navigation, route }: any) => {

    const [time, setTime] = useState(9);

    const [isRunning, setIsRunning] = useState(false);

    const [setCount, setSetCount] = useState(0);
    

    const exercise = route?.params?.exercise;


    const exerciseName =
        exercise?.name || "Bài tập chạy tại chỗ";

    useEffect(() => {

        let interval: ReturnType<typeof setInterval> | undefined;

        if (isRunning && time > 0) {

            interval = setInterval(() => {

                setTime((prev) => prev - 1);

            }, 1000);

        }

        if (time === 0) {

            setIsRunning(false);

        }

        return () => {

            if (interval) {

                clearInterval(interval);

            }

        };

    }, [isRunning, time]);



    const formatTime = (seconds: number) => {

        const minute = Math.floor(seconds / 60);

        const second = seconds % 60;

        return `${minute}:${second.toString().padStart(2, "0")}`;

    };


    const handleStart = () => {

        if (time === 0) {

            setTime(20);

        }

        setIsRunning(!isRunning);

    };



    const handleReset = () => {

        setTime(20);

        setIsRunning(false);

        setSetCount(0);

    };


    const handleAddSet = () => {

        if (setCount < 3) {

            setSetCount((prev) => prev + 1);

        }

    };


    return (

        <View style={styles.container}>

            <StatusBar
                //    backgroundColor="#FFFFFF"
                barStyle="dark-content"
            />


            <View style={styles.header}>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate("MemberTabs");
                        }
                    }}
                >

                    <Ionicons
                        name="chevron-back"
                        size={wp("6%")}
                        color="#61737B"
                    />

                </TouchableOpacity>


                <Text style={styles.headerTitle}>

                    1/13 Luyện tập chức năng

                </Text>


                <View style={styles.headerTimer}>

                    <Text style={styles.headerTimerText}>

                        {formatTime(time)}

                    </Text>

                </View>

            </View>


            {/* ================= NOTICE ================= */}

            <TouchableOpacity
                style={styles.noticeBox}
                activeOpacity={0.85}
            >

                <View style={styles.noticeIcon}>

                    <Ionicons
                        name="information-circle-outline"
                        size={wp("5.5%")}
                        color="#FFFFFF"
                    />

                </View>


                <Text style={styles.noticeText}>

                    Xem cách diễn vào nhật ký{"\n"}
                    tập luyện

                </Text>

            </TouchableOpacity>


            {/* ================= EXERCISE IMAGE ================= */}

            <View style={styles.exerciseArea}>


                                <View style={styles.exerciseImageArea}>
                    {exercise?.video && !exercise.video.toLowerCase().endsWith('.gif') ? (
                        <Video
                            source={{ uri: exercise.video }}
                            style={styles.exerciseImage}
                            resizeMode="contain"
                            repeat={true}
                            paused={false}
                            muted={true}
                        />
                    ) : (
                        <Image
                            source={
                                exercise?.video
                                    ? { uri: exercise.video }
                                    : typeof exercise?.image === 'string'
                                        ? { uri: exercise.image }
                                        : exercise?.image
                                            ? exercise.image
                                            : require("../../../../assets/fitness-bg.png")
                            }
                            style={styles.exerciseImage}
                            resizeMode="contain"
                        />
                    )}
                </View>


                {/* RIGHT BUTTONS */}

                <View style={styles.rightButtons}>


                    <TouchableOpacity
                        style={styles.rightIconButton}
                        onPress={handleReset}
                    >

                        <Ionicons
                            name="refresh"
                            size={wp("5%")}
                            color="#1BC3C8"
                        />

                    </TouchableOpacity>


                    <TouchableOpacity
                        style={styles.rightIconButton}
                        onPress={() => {
                            navigation.navigate('ExerciseDetail', {
                                exercise: {
                                    ...exercise,
                                    name: exerciseName,
                                    description: exercise?.description || 'Tiếng Anh là Treadmill. Máy chạy bộ là một trong nhiều loại máy giúp bạn rèn luyện tim mạch với các chuyển động mô phỏng hệt như chạy bộ và đi bộ ở bên ngoài. Các chuyển động này giúp đẩy nhanh quá trình trao đổi chất, đồng thời đốt cháy mỡ thừa tích tụ và làm tăng sức bền.',
                                    image: typeof exercise?.image === 'string' ? exercise.image : 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
                                    musclesDistribution: exercise?.musclesDistribution || [
                                        { name: 'Cơ đùi trước (Quadriceps)', percent: 80, color: '#EF4444' },
                                        { name: 'Cơ mông (Glutes)', percent: 70, color: '#3B82F6' },
                                        { name: 'Cơ đùi sau (Hamstrings)', percent: 65, color: '#10B981' },
                                        { name: 'Cơ bắp chuối (Calves)', percent: 75, color: '#F59E0B' },
                                        { name: 'Cơ bụng và liên sườn (Core)', percent: 50, color: '#8B5CF6' },
                                    ]
                                },
                                categoryName: exercise?.muscle || 'Cardio'
                            });
                        }}
                        activeOpacity={0.8}
                    >

                        <Ionicons
                            name="information"
                            size={wp("5%")}
                            color="#1BC3C8"
                        />

                    </TouchableOpacity>


                </View>

            </View>


            {/* ================= EXERCISE TITLE ================= */}

            <Text style={styles.exerciseTitle}>

                {exerciseName}

            </Text>


            {/* ================= CONTROLS ================= */}

            <View style={styles.controlContainer}>


                {/* SECONDS */}

                <View style={styles.controlItem}>

                    <View style={styles.circleNormal}>

                        <Text style={styles.circleNumber}>

                            20

                        </Text>

                    </View>

                    <Text style={styles.controlLabel}>

                        Giây

                    </Text>

                    <Text style={styles.controlSubLabel}>

                        yêu cầu

                    </Text>

                </View>


                {/* START */}

                <View style={styles.controlItem}>

                    <TouchableOpacity
                        style={styles.startCircle}
                        activeOpacity={0.8}
                        onPress={handleStart}
                    >

                        <Text style={styles.startText}>

                            {isRunning ? "DỪNG" : "BẮT ĐẦU"}

                        </Text>

                        <Ionicons
                            name={
                                isRunning
                                    ? "pause"
                                    : "play"
                            }
                            size={wp("6.5%")}
                            color="#0EB9BD"
                        />

                    </TouchableOpacity>

                    <Text style={styles.controlLabel}>

                        Hẹn giờ

                    </Text>

                </View>


                {/* SET */}

                <View style={styles.controlItem}>

                    <View style={styles.setCircle}>

                        <Text style={styles.circleNumber}>

                            {setCount}/3

                        </Text>

                    </View>

                    <Text style={styles.controlLabel}>

                        Set

                    </Text>

                    <Text style={styles.controlSubLabel}>

                        tập

                    </Text>

                </View>


            </View>


            {/* ================= SECOND INPUT ================= */}

            <View style={styles.secondArea}>

                <TouchableOpacity
                    style={styles.secondButton}
                    activeOpacity={0.8}
                    onPress={() => setTime(20)}
                >

                    <Text style={styles.secondText}>

                        Giây

                    </Text>

                </TouchableOpacity>


                <TouchableOpacity
                    style={styles.addButton}
                    activeOpacity={0.8}
                    onPress={handleAddSet}
                >

                    <Ionicons
                        name="add"
                        size={wp("8%")}
                        color="#FFFFFF"
                    />

                </TouchableOpacity>

            </View>
        </View>

    );

};


const styles = StyleSheet.create({


    /* ================= CONTAINER ================= */

    container: {

        flex: 1,

        backgroundColor: "#FFFFFF",

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


    headerTimer: {

        position: "absolute",

        right: wp("4%"),

        paddingHorizontal: wp("3%"),

        paddingVertical: hp("0.8%"),

        borderRadius: wp("5%"),

        backgroundColor: "#F5F7F8",

    },


    headerTimerText: {

        fontSize: wp("3%"),

        color: "#65777D",

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

    },


    secondButton: {

        flex: 1,

        height: hp("5.2%"),

        backgroundColor: "#EDF7F9",

        borderRadius: wp("1.5%"),

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


    activeNavText: {

        color: "#18BEC2",

    },


    moreContainer: {

        position: "relative",

    },


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

});


export default ReportPage;
