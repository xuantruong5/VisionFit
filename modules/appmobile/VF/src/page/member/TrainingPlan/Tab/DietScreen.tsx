
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import { useNavigation } from "@react-navigation/native";
import apiFitlife from "../../../../general/api";
import { COLORS, SHADOWS } from "../../../../general/theme";

const DietScreen = () => {
    // do trang header dang reder trực tiếp nên mới dùng cách này còn kh mọi người cứ dùng cách cũ 
    const navigation = useNavigation<any>()
    // Danh sách dữ liệu kế hoạch ăn từ API
    const [mealPlans, setMealPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    // Hàm lấy ngày theo định dạng YYYY-MM-DD
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Ngày hiện tại
    const today = new Date();
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [selectedDate, setSelectedDate] = useState(formatDate(today));
    const [showDays, setShowDays] = useState(false);

    // Danh sách 7 ngày, giữ nguyên giao diện chọn ngày
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);

        return {
            day: date.getDate(),
            month: date.getMonth() + 1,
            date: formatDate(date),
        };
    });

    // Gọi API mỗi khi chọn ngày khác
    useEffect(() => {
        const getMealPlans = async () => {
            try {
                setLoading(true);
                const response = await apiFitlife.get("/client/list-meal-plans");

                if (response.data.success) {
                    setMealPlans(response.data.data || []);
                } else {
                    setMealPlans([]);
                }
            } catch (error) {
                console.log("Lỗi lấy danh sách kế hoạch ăn:", error);
                setMealPlans([]);
            } finally {
                setLoading(false);
            }
        };

        getMealPlans();
    }, [selectedDate]);

    // Tên hiển thị của từng bữa ăn
    const mealNames: Record<string, string> = {
        SANG: "Bữa sáng",
        PHU_SANG: "Bữa phụ sáng",
        TRUA: "Bữa trưa",
        PHU_TRUA: "Bữa phụ trưa",
        TOI: "Bữa tối",
        PHU_TOI: "Bữa phụ tối",
    };
    // Lọc dữ liệu theo ngày đã chọn và nhóm các món cùng bữa
    const meals = useMemo(() => {
        const filteredPlans = mealPlans.filter((item) => item.ngay_an === selectedDate);
        const groupedMeals: Record<string, any> = {};
        filteredPlans.forEach((item) => {
            const key = `${item.bua_an}_${item.gio_an}`;
            if (!groupedMeals[key]) {
                groupedMeals[key] = {
                    id: key,
                    name: mealNames[item.bua_an] || item.bua_an,
                    time: item.gio_an?.slice(0, 5) || "",
                    foods: [],
                };
            }
            groupedMeals[key].foods.push({
                id: item.id_khau_phan_an,
                title: item.ten_mon_an,
                calories: `${Number(item.calo || 0)} Kcal`,
                weight: `${Number(item.khoi_luong_gram || 0)} g`,
                image: item.anh_dai_dien,
                id_mon_an: item.id_mon_an,
                mo_ta: item.mo_ta,
                nguyen_lieu: item.nguyen_lieu,
                gia_vi: item.gia_vi,
                thoi_gian_nau: item.thoi_gian_nau,
                huong_dan_nau: item.huong_dan_nau,
                protein: item.protein,
                carb: item.carb,
                fat: item.fat,
                // Mục tiêu dinh dưỡng của kế hoạch
                muc_tieu_the_trang: item.muc_tieu_the_trang,
                muc_tieu_calo: item.muc_tieu_calo,
                protein_muc_tieu: item.protein_muc_tieu,
                carb_muc_tieu: item.carb_muc_tieu,
                fat_muc_tieu: item.fat_muc_tieu,

                so_luong: item.so_luong,
                ghi_chu: item.ghi_chu,
                ngay_an: item.ngay_an,
            });
        });
        return Object.values(groupedMeals).sort((a, b) =>
            a.time.localeCompare(b.time)
        );
    }, [mealPlans, selectedDate]);
    // plan kế hoạch 
    const [activeTab, setActiveTab] = useState("plan");

    return (
        <View style={styles.container}>
            {/* Thanh chọn ngày */}
            <View style={styles.daySection}>
                <View style={styles.daysRow}>
                    {days.map((item, index) => (
                        <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => { setSelectedDay(item.day); setSelectedDate(item.date); }}
                            style={[styles.dayItem, selectedDay === item.day && styles.selectedDay,]} >
                            <Text style={[styles.dayText, selectedDay === item.day && styles.selectedDayText,]} >
                                {item.day}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {/* Nút mở rộng */}
                <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDays(!showDays)} >
                    <Ionicons name={showDays ? "chevron-up" : "chevron-down"} size={wp("5%")} color="#16B9B7" />
                </TouchableOpacity>
                {showDays && (
                    <View style={styles.dropdownContent}>
                        <Text style={styles.dropdownTitle}>
                            Ngày đang chọn: {selectedDate}
                        </Text>
                        <Text style={styles.dropdownDescription}>
                            Chọn ngày để xem thực đơn dinh dưỡng.
                        </Text>
                    </View>
                )}
            </View>
            {/* Danh sách các bữa ăn */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} >
                {loading ? (
                    <View style={{ paddingVertical: hp("4%"), alignItems: "center" }}>
                        <Text style={{ color: "#16B9B7", fontSize: wp("3.8%") }}>
                            Đang tải thực đơn...
                        </Text>
                    </View>
                ) : meals.length > 0 ? (
                    meals.map((meal) => (
                        <View key={meal.id} style={styles.mealSection}>
                            <View style={styles.mealHeader}>
                                <Text style={styles.mealName}>
                                    {meal.name}:
                                </Text>
                                <Text style={styles.mealTime}>
                                    {meal.time}
                                </Text>
                            </View>
                            <ScrollView  horizontal  showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodList} >
                                {meal.foods.map((food: any) => (
                                    <TouchableOpacity
                                        key={food.id}
                                        activeOpacity={0.85}
                                        style={styles.foodCard}
                                        onPress={() => { navigation.navigate("DietDetail", { food: food,});}}>
                                        <ImageBackground source={{ uri: food.image }} style={styles.foodImage} imageStyle={styles.foodImageRadius} >
                                            <View style={styles.gradient}>
                                                <View style={styles.foodInfo}>
                                                    <Text style={styles.foodTitle} numberOfLines={2} >
                                                        {food.title}
                                                    </Text>
                                                    <View style={styles.foodMeta}>
                                                        <Text style={styles.foodMetaText}>
                                                            {food.calories}
                                                        </Text>

                                                        <Text style={styles.foodMetaText}>
                                                            {food.weight}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    ))
                ) : (
                    <View style={{ paddingVertical: hp("4%"), alignItems: "center" }}>
                        <Text style={{ color: "#777", fontSize: wp("3.8%") }}>
                            Ngày này chưa có thực đơn.
                        </Text>
                    </View>
                )}

                {/* TAB KẾ HOẠCH / KHẨU PHẦN ĂN */}
                <View style={styles.planCard}>
                    {/* Thanh tab */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity activeOpacity={0.8}
                            style={[styles.tabButton, activeTab === "plan" && styles.activeTabButton,]} onPress={() => setActiveTab("plan")} >
                            <Text style={[styles.tabText, activeTab === "plan" && styles.activeTabText,]} >
                                Kế hoạch hiện tại
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8} style={[styles.tabButton, activeTab === "daily" && styles.activeTabButton,]}
                            onPress={() => setActiveTab("daily")} >
                            <Text style={[styles.tabText, activeTab === "daily" && styles.activeTabText,]} >
                                Khẩu phần ăn hàng ngày
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* Chỉ hiển thị bảng dinh dưỡng ở tab Kế hoạch hiện tại */}
                    {activeTab === "plan" && (
                        <View style={styles.nutritionRow}>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{Number(mealPlans[0]?.protein_muc_tieu ?? 0)}</Text>
                                <Text style={styles.nutritionChangeGreen}>
                                    -20 ↓
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Protein, g
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{Number(mealPlans[0]?.fat_muc_tieu ?? 0)}</Text>
                                <Text style={styles.nutritionChangeOrange}>
                                    +2 ↑
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Chất béo, g
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{Number(mealPlans[0]?.carb_muc_tieu ?? 0)}</Text>
                                <Text style={styles.nutritionChangeGreen}>
                                    0
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Carb, g
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{Number(mealPlans[0]?.muc_tieu_calo ?? 0)}</Text>
                                <Text style={styles.nutritionChangeRed}>
                                    -100 ↓
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Kcal
                                </Text>
                            </View>
                        </View>
                    )}
                    {/* Nội dung khi chọn Khẩu phần ăn hàng ngày */}
                    {activeTab === "daily" && (
                        <View style={styles.dailyContent}>
                            <Text style={styles.dailyTitle}>
                                Khẩu phần ăn hàng ngày
                            </Text>
                            <Text style={styles.dailyDescription}>
                                Theo dõi các bữa ăn và lượng dinh dưỡng cần thiết
                                trong ngày.
                            </Text>
                            <View style={styles.dailyInfoRow}>
                                <Text style={styles.dailyInfoLabel}>
                                    Tổng năng lượng
                                </Text>
                                <Text style={styles.dailyInfoValue}>
                                    1800 Kcal
                                </Text>
                            </View>
                            <View style={styles.dailyInfoRow}>
                                <Text style={styles.dailyInfoLabel}>
                                    Số bữa ăn
                                </Text>
                                <Text style={styles.dailyInfoValue}>
                                    {meals.length} bữa
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: "#FFFFFF",
    },

    daySection: {
        paddingTop: hp("1%"),
        paddingHorizontal: wp("5%"),
        paddingBottom: hp("1%"),
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },

    daysRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    dayItem: {
        width: wp("10%"),
        height: wp("10%"),
        justifyContent: "center",
        alignItems: "center",
        borderRadius: wp("5%"),
    },

    selectedDay: {
        backgroundColor: COLORS.primary,
    },

    dayText: {
        fontSize: wp("4.2%"),
        color: "#333333",
        fontWeight: "500",
    },

    selectedDayText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },

    dropdownButton: {
        alignSelf: "center",
        marginTop: hp("1%"),
        width: wp("13%"),
        height: hp("3.5%"),
        borderRadius: wp("3%"),
        backgroundColor: "#F8FAFA",
        justifyContent: "center",
        alignItems: "center",
    },

    dropdownContent: {
        marginTop: hp("1%"),
        padding: wp("3%"),
        backgroundColor: "#F5FAFA",
        borderRadius: wp("2%"),
    },

    dropdownTitle: {
        color: "#333333",
        fontSize: wp("3.8%"),
        fontWeight: "600",
    },

    dropdownDescription: {
        marginTop: hp("0.5%"),
        color: "#777777",
        fontSize: wp("3.2%"),
    },

    scrollContent: {
        paddingTop: hp("1.5%"),
        paddingBottom: hp("12%"),
    },

    mealSection: {
        marginBottom: hp("2.5%"),
    },

    mealHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: wp("5%"),
        marginBottom: hp("1.5%"),
    },

    mealName: {
        fontSize: wp("4.5%"),
        color: "#555555",
        fontWeight: "500",
    },

    mealTime: {
        fontSize: wp("4.5%"),
        color: "#171717",
        fontWeight: "700",
    },

    foodList: {
        paddingLeft: wp("5%"),
        paddingRight: wp("2%"),
    },

    foodCard: {
        width: wp("72%"),
        height: hp("15%"),
        marginRight: wp("3%"),
        borderRadius: wp("3%"),
        overflow: "hidden",
        backgroundColor: "#EDEDED",
    },

    foodImage: {
        width: "100%",
        height: "100%",
        justifyContent: "flex-end",
    },

    foodImageRadius: {
        borderRadius: wp("3%"),
    },

    gradient: {
        width: "100%",
        height: "75%",
        justifyContent: "flex-end",
    },

    foodInfo: {
        paddingHorizontal: wp("4%"),
        paddingBottom: hp("1.5%"),
    },

    foodTitle: {
        color: "#FFFFFF",
        fontSize: wp("4%"),
        fontWeight: "600",
        lineHeight: wp("5.5%"),
    },

    foodMeta: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: hp("0.8%"),
        gap: wp("4%"),
    },

    foodMetaText: {
        color: "#FFFFFF",
        fontSize: wp("3.5%"),
        fontWeight: "500",
    },
    // Card tổng chứa tab và dinh dưỡng
    planCard: {
        marginHorizontal: wp("1%"),
        marginTop: hp("1%"),
        marginBottom: hp("1.5%"),
        padding: wp("2%"),
        borderRadius: wp("3%"),
        backgroundColor: "#F8FAFC",
        // borderWidth: 1,
        // borderColor: "#E2EDEF",
    },
    // Thanh tab
    tabRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: hp("1.5%"),
    },
    tabButton: {
        flex: 1,
        minHeight: hp("4%"),
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: wp("1%"),
        borderRadius: wp("1.8%"),
    },
    activeTabButton: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: wp("3.1%"),
        color: "#81909D",
        fontWeight: "500",
        textAlign: "center",
    },
    activeTabText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },
    // Hàng dinh dưỡng
    nutritionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: hp("1%"),
        backgroundColor: "#FFFFFF",
        borderRadius: wp("2%"),
    },
    nutritionItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    nutritionValue: {
        fontSize: wp("4.5%"),
        color: "#20252B",
        fontWeight: "600",
    },
    nutritionChangeGreen: {
        marginTop: hp("0.3%"),
        fontSize: wp("4%"),
        color: "#4CBF91",
        fontWeight: "500",
    },
    nutritionChangeOrange: {
        marginTop: hp("0.3%"),
        fontSize: wp("4%"),
        color: "#EBA73F",
        fontWeight: "500",
    },
    nutritionChangeRed: {
        marginTop: hp("0.3%"),
        fontSize: wp("4%"),
        color: "#E88D91",
        fontWeight: "500",
    },
    nutritionLabel: {
        marginTop: hp("0.5%"),
        fontSize: wp("3%"),
        color: "#7B7F83",
        textAlign: "center",
    },
    // Nội dung khẩu phần ăn
    dailyContent: {
        paddingHorizontal: wp("2%"),
        paddingBottom: hp("1%"),
    },
    dailyTitle: {
        fontSize: wp("4%"),
        color: "#333333",
        fontWeight: "600",
        marginBottom: hp("0.5%"),
    },
    dailyDescription: {
        fontSize: wp("3.3%"),
        color: "#777777",
        lineHeight: wp("5%"),
        marginBottom: hp("1%"),
    },
    dailyInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: hp("0.8%"),
        borderBottomWidth: 1,
        borderBottomColor: "#EDF0F2",
    },
    dailyInfoLabel: {
        fontSize: wp("3.5%"),
        color: "#666666",
    },
    dailyInfoValue: {
        fontSize: wp("3.6%"),
        color: "#18B9B8",
        fontWeight: "600",
    },
    // Nội dung kế hoạch
    planDescription: {
        alignItems: "center",
        paddingHorizontal: wp("5%"),
        paddingVertical: hp("2%"),
    },
    planDescriptionTitle: {
        marginTop: hp("1%"),
        fontSize: wp("4%"),
        color: "#333333",
        fontWeight: "600",
        textAlign: "center",
    },
    planDescriptionText: {
        marginTop: hp("0.8%"),
        fontSize: wp("3.4%"),
        color: "#777777",
        lineHeight: wp("5%"),
        textAlign: "center",
    },
});

export default DietScreen;