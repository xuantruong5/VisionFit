import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import { Calendar, LocaleConfig, } from "react-native-calendars";
import apiFitlife from "../../../../general/api";

const DashboardScreen = () => {
    const [program, setProgram] = useState<any>(null);
    const [trainingDates, setTrainingDates] = useState<string[]>([]);
    const [tongNgayDaHoanThanh, setTongNgayDaHoanThanh] = useState(0);
    const [tongNgayTap, setTongNgayTap] = useState(0);
    const [workouts, setWorkouts] = useState<any[]>([]);




    // Hàm lấy danh sách chương trình
    const getListPrograms = async () => {
        try {
            const res = await apiFitlife.get("/client/list-programs");
            if (res.data.success && res.data.data.length > 0) {
                setProgram(res.data.data[0]);
                const dates = res.data.data
                    .map((item: any) => item.ngay_tap)
                    .filter((date: any) => typeof date === "string");
                setTrainingDates(dates);
            } else {
                setProgram(null);
                setTrainingDates([]);
            }
        } catch (error) {
            console.log("Lỗi lấy chương trình tập:", error);
        }
    };

    const getHuanLuyenTiepTheo = async () => {
        try {
            const res = await apiFitlife.get("/client/huan-luyen-tiep-theo");

            if (res.data.success) {
                const data = res.data.data;
                setTongNgayDaHoanThanh(Number(data.tong_ngay_da_hoan_thanh || 0));
                setTongNgayTap(Number(data.tong_ngay_tap || 0));
                setWorkouts(Array.isArray(data.huan_luyen_tiep_theo) ? data.huan_luyen_tiep_theo : []);
                console.log(
                    "Huấn luyện tiếp theo:",
                    data.huan_luyen_tiep_theo
                );
            }
        } catch (error: any) {
            console.log(
                "Lỗi lấy huấn luyện tiếp theo:",
                error.response?.data || error.message
            );
        }
    };




    useEffect(() => {
        getListPrograms();
        getHuanLuyenTiepTheo();
    }, []);

    // lấy lịch 
    LocaleConfig.locales["vi"] = {
        monthNames: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",],
        monthNamesShort: ["Th 1", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "Th 8", "Th 9", "Th 10", "Th 11", "Th 12",],
        dayNames: ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7",],
        dayNamesShort: ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7",],
        today: "Hôm nay",
    };
    LocaleConfig.defaultLocale = "vi";
    const today = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // Tạo object đánh dấu ngày cho react-native-calendars
    const markedDates: any = {};
    trainingDates.forEach((date) => { markedDates[date] = { marked: true, dotColor: "#55758F", }; });
    // Ngày đang chọn
    markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: "#18BFC3", selectedTextColor: "#FFFFFF", };





    return (
        <View style={styles.container}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Thông báo */}
                <TouchableOpacity style={styles.notice}>
                    <View style={styles.noticeIcon}>
                        <Ionicons name="alert-circle-outline" size={wp("9%")} color="#fff" />
                    </View>
                    <Text style={styles.noticeText}>
                        Xem cách tạo bài tập mới
                    </Text>
                </TouchableOpacity>
                {/* Banner chương trình */}
                <View style={styles.programCard}>
                    <ImageBackground
                        source={{ uri: program?.anh_dai_dien }}
                        style={styles.programImage} imageStyle={styles.programImageStyle} >
                        {/* Lớp phủ tối */}
                        <View style={styles.overlay} />
                        <View style={styles.programContent}>
                            <Text style={styles.programTitle}>
                                {program?.ten_chuong_trinh || "Chưa có chương trình tập"}
                            </Text>

                            <View style={styles.programInfoRow}>
                                <Ionicons name="move-outline" size={wp("4.5%")} color="#fff" />

                                <Text style={styles.programInfo}>
                                    {program?.ten_noi_tap || "Chưa xác định nơi tập"}
                                </Text>

                                <View style={styles.stars}>
                                    {[1, 2, 3, 4, 5].map((item) => (
                                        <Ionicons key={item}
                                            name={item <= (program?.so_sao || 0) ? "star" : "star-outline"} size={wp("5%")} color="#fff" />
                                    ))}
                                </View>

                                <Text style={styles.programInfo}>
                                    {program?.ten_cap_do || "Chưa xác định cấp độ"}
                                </Text>
                            </View>

                            <Text style={styles.trainingTime}>
                                {program
                                    ? `${program.so_ngay} ngày tập luyện (${program.so_buoi_moi_tuan} buổi mỗi tuần)`
                                    : "Chưa có thông tin lịch tập"}
                            </Text>

                            <Text style={styles.completed}>
                                Tập luyện hoàn tất: {tongNgayDaHoanThanh}/{tongNgayTap} ngày
                            </Text>
                        </View>
                        {/* Nút chia sẻ */}
                        <TouchableOpacity style={styles.shareButton}>
                            <Ionicons name="share-social" size={wp("5.5%")} color="#063D43" />
                        </TouchableOpacity>
                    </ImageBackground>
                </View>
                {/* Tiêu đề */}
                <Text style={styles.sectionTitle}>
                    Huấn luyện tiếp theo
                </Text>
                {/* Danh sách buổi tập lấy từ API */}
                <View style={styles.workoutList}>
                    {workouts.length > 0 ? (
                        workouts.map((item) => {
                            const isLocked = Number(item.tinh_trang) === 0;
                            return (
                                <TouchableOpacity key={item.id} activeOpacity={0.8} style={styles.workoutCard}
                                    onPress={() => {
                                        console.log(
                                            "Chọn ngày tập:",
                                            item.ngay_thu,
                                            item.ten_ngay_tap
                                        );
                                    }}
                                >
                                    {/* Vòng tròn trạng thái */}
                                    {isLocked ? (
                                        <View style={styles.lockCircle}>
                                            <Ionicons name="lock-closed-outline" size={wp("7%")} color="#F5C4C8" />
                                        </View>
                                    ) : (
                                        <View style={styles.progressCircle}>
                                            <Text style={styles.progressText}>
                                                0%
                                            </Text>
                                        </View>
                                    )}

                                    {/* Thông tin buổi tập */}
                                    <View style={styles.workoutInfo}>
                                        <Text style={styles.workoutDay}>
                                             {item.ngay_thu} Ngày tập luyện
                                        </Text>
                                        <Text style={styles.workoutTitle}>
                                            {item.ten_ngay_tap}
                                        </Text>
                                    </View>
                                    {/* Chấm trạng thái */}
                                    {!isLocked && (
                                        <View style={styles.statusDot} />
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <Text style={{ color: "#7590A6", fontSize: wp("3.8%"), textAlign: "center", paddingVertical: hp("2%"), }}
                        >
                            Chưa có buổi tập tiếp theo.
                        </Text>
                    )}
                </View>

                {/* Lịch tập luyện */}
                <View style={styles.calendarSection}>
                    {/* Tiêu đề */}
                    <View style={styles.calendarTitleRow}>
                        <Text style={styles.calendarTitle}>
                            Lịch tập luyện
                        </Text>
                        <TouchableOpacity style={styles.addCalendarButton} onPress={() => { console.log("Thêm lịch tập"); }} >
                            <Text style={styles.addCalendarText}>
                                Thêm
                            </Text>

                            <Ionicons name="chevron-forward" size={wp("6%")} color="#18BFC3" />
                        </TouchableOpacity>
                    </View>

                    {/* Lịch của thư viện */}
                    <Calendar
                        current={today}
                        // Thứ 2 là ngày đầu tuần
                        firstDay={1}
                        // Cho phép vuốt chuyển tháng
                        enableSwipeMonths={true}
                        // Hiển thị đủ 6 hàng ngày
                        showSixWeeks={true}
                        // Không ẩn ngày tháng trước và tháng sau
                        hideExtraDays={false}
                        // Ngày có lịch tập
                        markedDates={markedDates}
                        // Khi chọn một ngày
                        onDayPress={(day) => { setSelectedDate(day.dateString); }}
                        // Giao diện
                        theme={{
                            backgroundColor: "transparent",
                            calendarBackground: "transparent",
                            textSectionTitleColor: "#7590A6",
                            textSectionTitleDisabledColor: "#BFC2C5",
                            dayTextColor: "#202020",
                            todayTextColor: "#18BFC3",
                            textDisabledColor: "#BFC2C5",
                            selectedDayBackgroundColor: "#18BFC3",
                            selectedDayTextColor: "#FFFFFF",
                            monthTextColor: "#202020",
                            textMonthFontSize: wp("5.8%"),
                            textMonthFontWeight: "700",
                            textDayFontSize: wp("5.2%"),
                            textDayFontWeight: "400",
                            textDayHeaderFontSize: wp("3.5%"),
                            textDayHeaderFontWeight: "600",
                            arrowColor: "#18BFC3",
                            disabledArrowColor: "#BFC2C5",
                            dotColor: "#55758F",
                            selectedDotColor: "#FFFFFF",
                        }}
                        style={[styles.calendar, { backgroundColor: "transparent" },]}
                        // Khoảng cách giữa các hàng
                        dayComponent={undefined}
                    />
                </View>


            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: wp("4%"),
        paddingTop: hp("2%"),
        paddingBottom: hp("5%"),
    },
    notice: {
        height: hp("12%"),
        backgroundColor: "#579BD6",
        borderRadius: wp("2.5%"),
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp("5%"),
        marginBottom: hp("2%"),
    },
    noticeIcon: {
        width: wp("13%"),
        alignItems: "center",
        justifyContent: "center",
    },
    noticeText: {
        color: "#fff",
        fontSize: wp("4.5%"),
        fontWeight: "500",
        marginLeft: wp("5%"),
    },
    programCard: {
        height: hp("21%"),
        borderRadius: wp("2.5%"),
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },

    programImage: {
        flex: 1,
        justifyContent: "center",
    },
    programImageStyle: {
        borderRadius: wp("2.5%"),
    },
    overlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0, 25, 35, 0.65)",
    },
    programContent: {
        paddingHorizontal: wp("4%"),
        paddingTop: hp("2%"),
    },
    programTitle: {
        color: "#fff",
        fontSize: wp("4.7%"),
        fontWeight: "700",
        marginBottom: hp("0.7%"),
    },
    programInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },
    programInfo: {
        color: "#fff",
        fontSize: wp("3.3%"),
        marginLeft: wp("1%"),
    },
    stars: {
        flexDirection: "row",
        marginLeft: wp("2%"),
    },
    trainingTime: {
        color: "#18C5C9",
        fontSize: wp("3.4%"),
        fontWeight: "500",
        marginTop: hp("0.7%"),
    },
    completed: {
        color: "#D5E4E6",
        fontSize: wp("3.3%"),
        marginTop: hp("0.7%"),
    },
    shareButton: {
        position: "absolute",
        right: wp("3%"),
        bottom: hp("2%"),
        width: wp("10%"),
        height: wp("10%"),
        borderRadius: wp("5%"),
        backgroundColor: "#16C3C7",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: {
        color: "#7590A6",
        fontSize: wp("4.5%"),
        fontWeight: "500",
        marginTop: hp("5%"),
        marginBottom: hp("2.5%"),
    },
    workoutList: {
        gap: hp("1.8%"),
    },
    workoutCard: {
        minHeight: hp("12%"),
        backgroundColor: "#fff",
        borderRadius: wp("2.5%"),
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp("4%"),
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    progressCircle: {
        width: wp("12%"),
        height: wp("12%"),
        borderRadius: wp("6%"),
        borderWidth: 3,
        borderColor: "#FFB5B8",
        alignItems: "center",
        justifyContent: "center",
    },
    progressText: {
        color: "#F04F58",
        fontSize: wp("4%"),
        fontWeight: "700",
    },
    lockCircle: {
        width: wp("12%"),
        height: wp("12%"),
        borderRadius: wp("6%"),
        borderWidth: 2,
        borderColor: "#F5C4C8",
        alignItems: "center",
        justifyContent: "center",
    },
    workoutInfo: {
        flex: 1,
        marginLeft: wp("5%"),
    },
    workoutDay: {
        color: "#7590A6",
        fontSize: wp("3.8%"),
        marginBottom: hp("0.5%"),
    },
    workoutTitle: {
        color: "#202020",
        fontSize: wp("4.3%"),
        fontWeight: "500",
    },
    statusDot: {
        width: wp("3%"),
        height: wp("3%"),
        borderRadius: wp("1.5%"),
        backgroundColor: "#18BFC3",
        marginLeft: wp("2%"),
    },
    // lịch 
    calendarSection: {
        marginTop: hp("2%"),
        paddingBottom: hp("1%"),
    },
    calendarTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: hp("2%"),
    },
    calendarTitle: {
        color: "#7590A6",
        fontSize: wp("4.8%"),
        fontWeight: "600",
    },
    addCalendarButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    addCalendarText: {
        color: "#18BFC3",
        fontSize: wp("4.8%"),
        fontWeight: "600",
        marginRight: wp("1%"),
    },
    calendar: {
        width: "110%",
        alignSelf: "center",
        paddingBottom: hp("1%"),
        backgroundColor: "transparent",
    },
    selectedDateBox: {
        marginTop: hp("2%"),
        padding: wp("4%"),
        backgroundColor: "#F5F9FA",
        borderRadius: wp("3%"),
    },
    selectedDateLabel: {
        color: "#7590A6",
        fontSize: wp("3.7%"),
    },
    selectedDateValue: {
        color: "#202020",
        fontSize: wp("4.5%"),
        fontWeight: "600",
        marginTop: hp("0.5%"),
    },
    selectedDateStatus: {
        color: "#18BFC3",
        fontSize: wp("3.7%"),
        marginTop: hp("0.5%"),
    },
});

export default DashboardScreen;