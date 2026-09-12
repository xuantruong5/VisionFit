import React, { useEffect, useState } from "react";

import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    StatusBar,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";


const ReportPage = ({ navigation, route }: any) => {

    const [time, setTime] = useState(9);

    const [isRunning, setIsRunning] = useState(false);

    const [setCount, setSetCount] = useState(0);


    /*
        Nếu đi từ WorkoutPage:

        navigation.navigate("ExerciseDetail", {
            exercise: item,
        });

        thì có thể lấy dữ liệu ở đây.
    */

    const exercise = route?.params?.exercise;


    const exerciseName =
        exercise?.name || "Bài tập chạy tại chỗ";


    /*
        COUNTDOWN TIMER
    */

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


    /*
        FORMAT TIMER HEADER
    */

    const formatTime = (seconds: number) => {

        const minute = Math.floor(seconds / 60);

        const second = seconds % 60;

        return `${minute}:${second.toString().padStart(2, "0")}`;

    };


    /*
        START
    */

    const handleStart = () => {

        if (time === 0) {

            setTime(20);

        }

        setIsRunning(!isRunning);

    };


    /*
        RESET
    */

    const handleReset = () => {

        setTime(20);

        setIsRunning(false);

        setSetCount(0);

    };


    /*
        ADD SET
    */

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


            {/* ================= HEADER ================= */}

            <View style={styles.header}>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
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

                    <Image
                        source={
                            exercise?.image
                                ? exercise.image
                                : require("../assets/running-man.png")
                        }
                        style={styles.exerciseImage}
                        resizeMode="contain"
                    />

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


            {/* ================= BOTTOM NAV ================= */}

            <View style={styles.bottomNavigation}>


                {/* PLAN */}

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() =>
                        navigation.navigate("WorkoutPage")
                    }
                >

                    <View style={styles.activeNavIcon}>

                        <MaterialCommunityIcons
                            name="calendar-month-outline"
                            size={wp("5.5%")}
                            color="#18BEC2"
                        />

                    </View>

                    <Text
                        style={[
                            styles.navText,
                            styles.activeNavText
                        ]}
                    >

                        Kế hoạch tập

                    </Text>

                </TouchableOpacity>


                {/* FEED */}

                <TouchableOpacity style={styles.navItem}>

                    <MaterialCommunityIcons
                        name="rss"
                        size={wp("5.4%")}
                        color="#6E797D"
                    />

                    <Text style={styles.navText}>

                        Feed

                    </Text>

                </TouchableOpacity>


                {/* MESSAGE */}

                <TouchableOpacity style={styles.navItem}>

                    <Ionicons
                        name="chatbubble-outline"
                        size={wp("5.3%")}
                        color="#6E797D"
                    />

                    <Text style={styles.navText}>

                        Tin nhắn

                    </Text>

                </TouchableOpacity>


                {/* NOTE */}

                <TouchableOpacity style={styles.navItem}>

                    <MaterialCommunityIcons
                        name="notebook-outline"
                        size={wp("5.5%")}
                        color="#6E797D"
                    />

                    <Text style={styles.navText}>

                        Sổ tay

                    </Text>

                </TouchableOpacity>


                {/* MORE */}

                <TouchableOpacity style={styles.navItem}>

                    <View style={styles.moreContainer}>

                        <Ionicons
                            name="ellipsis-horizontal"
                            size={wp("5.5%")}
                            color="#6E797D"
                        />

                        <View style={styles.notificationBadge}>

                            <Text style={styles.badgeText}>

                                1

                            </Text>

                        </View>

                    </View>

                    <Text style={styles.navText}>

                        Thêm

                    </Text>

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

        height: hp("31%"),

        position: "relative",

        justifyContent: "center",

        alignItems: "center",

    },


    exerciseImageArea: {

        width: wp("65%"),

        height: hp("28%"),

        alignItems: "center",

        justifyContent: "center",

    },


    exerciseImage: {

        width: wp("55%"),

        height: hp("27%"),

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

});


export default ReportPage;