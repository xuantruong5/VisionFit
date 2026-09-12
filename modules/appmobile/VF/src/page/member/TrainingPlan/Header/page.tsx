import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import DashboardScreen from "../Tab/DashboardScreen";
import DietScreen from "../Tab/DietScreen";
import WorkoutPlan from "../Tab/WorkoutPlan";
const HeaderPage = () => {
    const [activeTab, setActiveTab] = useState("Trang tổng quan");
    return (
        <View style={styles.container}>
            {/* ================= HEADER ================= */}
            <View style={styles.headerTop}>
                {/* Nút lịch */}
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="time-outline" size={wp("7%")} color="#456987" />
                </TouchableOpacity>
                {/* Tiêu đề */}
                <Text style={styles.title}>
                    Kế hoạch tập
                </Text>
                {/* Nút danh sách */}
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="list-outline" size={wp("7%")} color="#456987" />
                </TouchableOpacity>
            </View>
            {/* ================= TAB ================= */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer} >
                {/* TAB 1 */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab("Trang tổng quan")}
                    style={[styles.tab, activeTab === "Trang tổng quan" && styles.activeTab,]} >
                    <Text style={[styles.tabText, activeTab === "Trang tổng quan" && styles.activeTabText,]} >
                        Trang tổng quan
                    </Text>
                </TouchableOpacity>
                {/* TAB 2 */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab("Kế hoạch tập")} style={[styles.tab, activeTab === "Kế hoạch tập" && styles.activeTab,]} >
                    <Text style={[styles.tabText, activeTab === "Kế hoạch tập" && styles.activeTabText,]} >
                        Kế hoạch tập
                    </Text>
                </TouchableOpacity>
                {/* TAB 3 */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab("Chế độ ăn")} style={[styles.tab, activeTab === "Chế độ ăn" && styles.activeTab,]} >
                    <Text style={[styles.tabText, activeTab === "Chế độ ăn" && styles.activeTabText,]} >
                        Chế độ ăn
                    </Text>
                </TouchableOpacity>

            </ScrollView>
            {/* ================= NỘI DUNG ================= */}
            {activeTab === "Trang tổng quan" && (
                <DashboardScreen />
            )}
            {activeTab === "Kế hoạch tập" && (
                <WorkoutPlan />
            )}
            {activeTab === "Chế độ ăn" && (
                <DietScreen />
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        paddingTop: hp("2%"),
    },
    headerTop: {
        height: hp("10%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp("4%"),
    },
    title: {
        fontSize: wp("5%"),
        fontWeight: "700",
        color: "#111111",
    },
    iconButton: {
        width: wp("13%"),
        height: wp("13%"),
        borderRadius: wp("7%"),
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    tabScroll: {
        flexGrow: 0,
        height: hp("7%"),
    },
    tabContainer: {
        paddingHorizontal: wp("3%"),
        alignItems: "center",
        height: hp("7%"),
    },
    tab: {
        height: hp("6%"),
        paddingHorizontal: wp("6%"),
        borderRadius: wp("8%"),
        alignItems: "center",
        justifyContent: "center",
        marginRight: wp("1%"),
    },
    activeTab: {
        backgroundColor: "#456987",
    },
    tabText: {
        fontSize: wp("4%"),
        color: "#456987",
        fontWeight: "500",
    },
    activeTabText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    page: {
        width: "100%",
        paddingHorizontal: wp("5%"),
        paddingTop: hp("2%"),
    },
    pageTitle: {
        fontSize: wp("5%"),
        fontWeight: "700",
        marginBottom: hp("1%"),
    },
});

export default HeaderPage;