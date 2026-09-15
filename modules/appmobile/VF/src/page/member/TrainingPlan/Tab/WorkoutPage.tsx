import React from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ImageSourcePropType,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";


type ExerciseType = {
    id: number;
    name: string;
    sets: string;
    image: ImageSourcePropType;
};


const exercises: ExerciseType[] = [
    {
        id: 1,
        name: "Bài tập chạy tại chỗ",
        sets: "3x20",
        image: require("../assets/run.png"),
    },
    {
        id: 2,
        name: "Bài tập hít đất với đầu gối chống xuống sàn",
        sets: "2x10",
        image: require("../assets/push-up.png"),
    },
    {
        id: 3,
        name: "Bài tập kéo giãn cơ superman",
        sets: "2x15",
        image: require("../assets/superman.png"),
    },
    {
        id: 4,
        name: "Bài tập squat truyền thống không sử dụng tạ",
        sets: "2x15",
        image: require("../assets/squat.png"),
    },
    {
        id: 5,
        name: "Bài tập mông đùi nâng hông lên khi nằm ngửa trên sàn",
        sets: "2x10",
        image: require("../assets/bridge.png"),
    },
    {
        id: 6,
        name: "Bài tập nhảy jack chéo",
        sets: "2x20",
        image: require("../assets/jumping-jack.png"),
    },
];


const WorkoutPage = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <StatusBar
            //    backgroundColor="#FFFFFF"
                barStyle="dark-content"
            />

            {/* HEADER */}
            <View style={styles.header}>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="chevron-back"
                        size={wp("6%")}
                        color="#5B6C73"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Bài tập
                </Text>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.skipText}>
                        Bỏ qua
                    </Text>
                </TouchableOpacity>

            </View>


            {/* PROGRESS */}
            <View style={styles.progressCard}>

                <View style={styles.progressCircle}>
                    <Text style={styles.progressPercent}>
                        0%
                    </Text>
                </View>


                <View style={styles.progressContent}>

                    <Text style={styles.progressTitle}>
                        1 ngày tập luyện
                    </Text>

                    <Text style={styles.progressSubtitle}>
                        toàn thân
                    </Text>

                </View>


                <Text style={styles.duration}>
                    ~ 37ph
                </Text>

            </View>


            {/* EXERCISE LIST */}
            <ScrollView
                style={styles.exerciseList}
                contentContainerStyle={styles.exerciseListContent}
                showsVerticalScrollIndicator={false}
            >

                {exercises.map((item) => (

                    <TouchableOpacity
                        key={item.id}
                        style={styles.exerciseItem}
                        activeOpacity={0.7}
                        onPress={() => {
                            navigation.navigate("ExerciseDetail", {
                                exercise: item,
                            });
                        }}
                    >

                        {/* IMAGE */}
                        <View style={styles.imageContainer}>

                            <Image
                                source={item.image}
                                style={styles.exerciseImage}
                                resizeMode="contain"
                            />

                        </View>


                        {/* INFORMATION */}
                        <View style={styles.exerciseInfo}>

                            <Text
                                style={styles.exerciseName}
                                numberOfLines={2}
                            >
                                {item.name}
                            </Text>

                            <Text style={styles.exerciseSets}>
                                {item.sets}
                            </Text>

                        </View>


                        {/* ARROW */}
                        <Ionicons
                            name="chevron-forward"
                            size={wp("5%")}
                            color="#20C3C7"
                        />

                    </TouchableOpacity>

                ))}

            </ScrollView>


            {/* BOTTOM AREA */}
            <View style={styles.bottomArea}>

                {/* START BUTTON */}
                <TouchableOpacity
                    style={styles.startButton}
                    activeOpacity={0.8}
                    onPress={() =>
                        navigation.navigate("ExerciseDetail")
                    }
                >

                    <Text style={styles.startButtonText}>
                        BẮT ĐẦU TẬP
                    </Text>

                </TouchableOpacity>


                {/* BOTTOM NAV */}
                <View style={styles.bottomNavigation}>

                    {/* PLAN */}
                    <TouchableOpacity style={styles.navItem}>

                        <MaterialCommunityIcons
                            name="calendar-month-outline"
                            size={wp("6%")}
                            color="#18BEC2"
                        />

                        <Text
                            style={[
                                styles.navText,
                                styles.navTextActive,
                            ]}
                        >
                            Kế hoạch tập
                        </Text>

                    </TouchableOpacity>


                    {/* FEED */}
                    <TouchableOpacity style={styles.navItem}>

                        <MaterialCommunityIcons
                            name="rss"
                            size={wp("6%")}
                            color="#879398"
                        />

                        <Text style={styles.navText}>
                            Feed
                        </Text>

                    </TouchableOpacity>


                    {/* MESSAGE */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() =>
                            navigation.navigate("Messages")
                        }
                    >

                        <Ionicons
                            name="chatbubble-outline"
                            size={wp("5.8%")}
                            color="#879398"
                        />

                        <Text style={styles.navText}>
                            Tin nhắn
                        </Text>

                    </TouchableOpacity>


                    {/* NOTE */}
                    <TouchableOpacity style={styles.navItem}>

                        <MaterialCommunityIcons
                            name="notebook-outline"
                            size={wp("6%")}
                            color="#879398"
                        />

                        <Text style={styles.navText}>
                            Sổ tay
                        </Text>

                    </TouchableOpacity>


                    {/* MORE */}
                    <TouchableOpacity style={styles.navItem}>

                        <View style={styles.moreIconContainer}>

                            <Ionicons
                                name="ellipsis-horizontal"
                                size={wp("6%")}
                                color="#879398"
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
        borderBottomWidth: 1,
        borderBottomColor: "#F2F2F2",
        paddingHorizontal: wp("3%"),
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
        fontSize: wp("4.3%"),
        fontWeight: "600",
        color: "#25292C",
    },

    skipButton: {
        position: "absolute",
        right: wp("4%"),
        paddingVertical: hp("1%"),
    },

    skipText: {
        fontSize: wp("3.6%"),
        color: "#667A82",
        fontWeight: "400",
    },


    /* ================= PROGRESS ================= */

    progressCard: {
        width: wp("94%"),
        alignSelf: "center",
        minHeight: hp("7.5%"),
        marginTop: hp("1.2%"),
        marginBottom: hp("0.6%"),

        flexDirection: "row",
        alignItems: "center",

        paddingHorizontal: wp("3%"),

        backgroundColor: "#FFFFFF",

        borderWidth: 1,
        borderColor: "#EEEEEE",
        borderRadius: wp("2%"),

        elevation: 1,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },

    progressCircle: {
        width: wp("11%"),
        height: wp("11%"),
        borderRadius: wp("5.5%"),

        borderWidth: 2,
        borderColor: "#FF5D69",

        alignItems: "center",
        justifyContent: "center",
    },

    progressPercent: {
        color: "#FF5360",
        fontSize: wp("3%"),
        fontWeight: "600",
    },

    progressContent: {
        flex: 1,
        marginLeft: wp("3%"),
    },

    progressTitle: {
        color: "#7C8A90",
        fontSize: wp("2.8%"),
        marginBottom: hp("0.2%"),
    },

    progressSubtitle: {
        color: "#3D474B",
        fontSize: wp("3.3%"),
        fontWeight: "600",
    },

    duration: {
        alignSelf: "flex-start",
        marginTop: hp("1%"),

        color: "#808A8F",
        fontSize: wp("2.7%"),
    },


    /* ================= LIST ================= */

    exerciseList: {
        flex: 1,
    },

    exerciseListContent: {
        paddingHorizontal: wp("4%"),
        paddingBottom: hp("17%"),
    },

    exerciseItem: {
        minHeight: hp("9.5%"),

        flexDirection: "row",
        alignItems: "center",

        borderBottomWidth: 1,
        borderBottomColor: "#F1F1F1",
    },

    imageContainer: {
        width: wp("16%"),
        height: hp("8%"),
        justifyContent: "center",
        alignItems: "center",
    },

    exerciseImage: {
        width: wp("14%"),
        height: hp("7%"),
    },

    exerciseInfo: {
        flex: 1,
        marginLeft: wp("2.5%"),
        marginRight: wp("2%"),
    },

    exerciseName: {
        color: "#353C3F",
        fontSize: wp("3.4%"),
        fontWeight: "500",
        lineHeight: wp("4.5%"),
    },

    exerciseSets: {
        color: "#54747A",
        fontSize: wp("2.7%"),
        marginTop: hp("0.4%"),
    },


    /* ================= BOTTOM ================= */

    bottomArea: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,

        backgroundColor: "#FFFFFF",
    },


    /* START BUTTON */

    startButton: {
        width: wp("94%"),
        height: hp("5.7%"),

        alignSelf: "center",

        backgroundColor: "#16BEC1",

        borderRadius: wp("1.5%"),

        justifyContent: "center",
        alignItems: "center",

        marginBottom: hp("0.8%"),
    },

    startButtonText: {
        color: "#FFFFFF",
        fontSize: wp("3.7%"),
        fontWeight: "700",
    },


    /* NAVIGATION */

    bottomNavigation: {
        height: hp("7.5%"),

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",

        borderTopWidth: 1,
        borderTopColor: "#E8EDEF",

        backgroundColor: "#FFFFFF",
    },

    navItem: {
        flex: 1,
        height: "100%",

        justifyContent: "center",
        alignItems: "center",
    },

    navText: {
        marginTop: hp("0.2%"),
        fontSize: wp("2.3%"),
        color: "#7F8C91",
    },

    navTextActive: {
        color: "#18BEC2",
    },


    /* BADGE */

    moreIconContainer: {
        position: "relative",
    },

    notificationBadge: {
        position: "absolute",

        top: -hp("0.5%"),
        right: -wp("2.5%"),

        width: wp("4%"),
        height: wp("4%"),

        borderRadius: wp("2%"),

        backgroundColor: "#FF6070",

        justifyContent: "center",
        alignItems: "center",

        borderWidth: 1.5,
        borderColor: "#FFFFFF",
    },

    badgeText: {
        color: "#FFFFFF",
        fontSize: wp("2%"),
        fontWeight: "700",
    },

});


export default WorkoutPage;