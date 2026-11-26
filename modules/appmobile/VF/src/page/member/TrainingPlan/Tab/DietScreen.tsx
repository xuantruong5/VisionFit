
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { useNavigation } from "@react-navigation/native";
import apiFitlife from "../../../../general/api";
import { COLORS, SHADOWS, PASTEL, RADIUS, SOFT_SHADOW } from "../../../../general/theme";

// Nhãn thứ trong tuần cho dải chọn ngày
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

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
            <LinearGradient colors={[PASTEL.tealSoft, PASTEL.surfaceSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.daySection}>
                <View style={styles.daysRow}>
                    {days.map((item, index) => {
                        const isSelected = selectedDay === item.day;
                        const weekday = index === 0 ? "Hôm nay" : WEEKDAYS[new Date(item.date).getDay()];
                        return (
                            <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => { setSelectedDay(item.day); setSelectedDate(item.date); }}
                                style={styles.dayItem} >
                                <Text style={[styles.weekdayText, index === 0 && styles.todayLabel]} numberOfLines={1}>
                                    {weekday}
                                </Text>
                                {isSelected ? (
                                    <LinearGradient colors={["#5FD0DA", COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.dayCircle, styles.dayCircleSelected]}>
                                        <Text style={[styles.dayText, styles.selectedDayText]}>{item.day}</Text>
                                        <View style={styles.innerDot} />
                                    </LinearGradient>
                                ) : (
                                    <View style={[styles.dayCircle, index === 0 && styles.dayCircleWithDot]}>
                                        <Text style={styles.dayText}>{item.day}</Text>
                                        {index === 0 && <View style={[styles.innerDot, styles.innerDotToday]} />}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>
            {/* Danh sách các bữa ăn */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} >
                {loading ? (
                    <View style={styles.stateBox}>
                        <Text style={styles.loadingText}>
                            Đang tải thực đơn...
                        </Text>
                    </View>
                ) : meals.length > 0 ? (
                    meals.map((meal) => (
                        <View key={meal.id} style={styles.mealSection}>
                            <View style={styles.mealHeader}>
                                <View style={styles.mealHeaderLeft}>
                                    <Text style={styles.mealName}>
                                        {meal.name}
                                    </Text>
                                </View>
                                <View style={styles.mealTimeBadge}>
                                    <Text style={styles.mealTime}>
                                        {meal.time}
                                    </Text>
                                </View>
                            </View>
                            <ScrollView  horizontal  showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodList} >
                                {meal.foods.map((food: any) => (
                                    <TouchableOpacity
                                        key={food.id}
                                        activeOpacity={0.85}
                                        style={styles.foodCard}
                                        onPress={() => { navigation.navigate("DietDetail", { food: food,});}}>
                                        <View style={styles.foodImage}>
                                            <Image source={{ uri: food.image }} style={styles.foodImageRadius} resizeMode="cover" />
                                            <LinearGradient
                                                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                                style={styles.gradient}>
                                                <View style={styles.foodInfo}>
                                                    <Text style={styles.foodTitle} numberOfLines={2} >
                                                        {food.title}
                                                    </Text>
                                                    <View style={styles.foodMeta}>
                                                        <View style={styles.foodMetaPill}>
                                                            <Text style={styles.foodMetaText}>
                                                                {food.calories} · {food.weight}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </LinearGradient>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    ))
                ) : (
                    <View style={styles.stateBox}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="nutrition-outline" size={34} color={COLORS.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>
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
                            <View style={[styles.nutritionItem, styles.nutritionTeal]}>
                                <Text style={styles.nutritionValue}>{Number(mealPlans[0]?.protein_muc_tieu ?? 0)}</Text>
                                <Text style={styles.nutritionChangeGreen}>
                                    -20 ↓
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Protein, g
                                </Text>
                            </View>
                            <View style={[styles.nutritionItem, styles.nutritionOrange]}>
                                <Text style={styles.nutritionValue}>{Number(mealPlans[0]?.fat_muc_tieu ?? 0)}</Text>
                                <Text style={styles.nutritionChangeOrange}>
                                    +2 ↑
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Chất béo, g
                                </Text>
                            </View>
                            <View style={[styles.nutritionItem, styles.nutritionGreen]}>
                                <Text style={styles.nutritionValue}>{Number(mealPlans[0]?.carb_muc_tieu ?? 0)}</Text>
                                <Text style={styles.nutritionChangeGreen}>
                                    0
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Carb, g
                                </Text>
                            </View>
                            <View style={[styles.nutritionItem, styles.nutritionRed]}>
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
                            <View style={[styles.dailyInfoRow, styles.dailyInfoRowLast]}>
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
        backgroundColor: PASTEL.background,
    },

    daySection: {
        marginHorizontal: 16,
        marginTop: 14,
        paddingTop: 14,
        paddingHorizontal: 8,
        paddingBottom: 14,
        borderRadius: 28,
    },
    daysRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dayItem: {
        flex: 1,
        alignItems: "center",
    },
    weekdayText: {
        fontSize: 11.5,
        color: COLORS.textSecondary,
        fontWeight: "500",
        marginBottom: 8,
    },
    todayLabel: {
        color: COLORS.primary,
        fontWeight: "700",
    },
    dayCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.95)",
        backgroundColor: "rgba(255,255,255,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircleSelected: {
        borderColor: COLORS.white,
        paddingBottom: 7,
    },
    dayCircleWithDot: {
        paddingBottom: 7,
    },
    dayText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: "700",
    },
    selectedDayText: {
        color: COLORS.white,
        fontWeight: "800",
    },
    innerDot: {
        position: "absolute",
        bottom: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: COLORS.white,
    },
    innerDotToday: {
        borderColor: COLORS.primary,
    },
    dropdownButton: {
        alignSelf: "center",
        marginTop: 4,
        width: 44,
        height: 22,
        justifyContent: "center",
        alignItems: "center",
    },

    dropdownContent: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 6,
        padding: 12,
        backgroundColor: COLORS.surfaceTeal,
        borderRadius: 14,
        gap: 10,
    },

    dropdownIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
    },

    dropdownTextWrap: {
        flex: 1,
    },

    dropdownTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: "700",
    },

    dropdownDescription: {
        marginTop: 2,
        color: COLORS.textMuted,
        fontSize: 12,
    },

    scrollContent: {
        paddingTop: 8,
        paddingBottom: 24,
    },

    stateBox: {
        paddingVertical: 28,
        alignItems: "center",
    },

    loadingText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: "600",
    },

    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },

    emptyTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },

    mealSection: {
        marginTop: 20,
    },

    mealHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 12,
    },

    mealHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    mealIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#FFF1EC",
        alignItems: "center",
        justifyContent: "center",
    },

    mealName: {
        fontSize: 18,
        color: PASTEL.ink,
        fontWeight: "600",
    },

    mealTimeBadge: {
        backgroundColor: PASTEL.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        ...SOFT_SHADOW,
    },

    mealTime: {
        fontSize: 13,
        color: PASTEL.ink,
        fontWeight: "600",
    },

    foodList: {
        paddingLeft: 16,
        paddingRight: 6,
        paddingBottom: 6,
    },

    foodCard: {
        width: wp("72%"),
        height: 150,
        marginRight: 12,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: PASTEL.tealSoft,
    },

    foodImage: {
        width: "100%",
        height: "100%",
        justifyContent: "flex-end",
    },

    foodImageRadius: {
        ...StyleSheet.absoluteFill,
        width: "100%",
        height: "100%",
    },

    gradient: {
        width: "100%",
        height: "80%",
        justifyContent: "flex-end",
    },

    foodInfo: {
        paddingHorizontal: 14,
        paddingBottom: 12,
    },

    foodTitle: {
        color: COLORS.white,
        fontSize: 15.5,
        fontWeight: "800",
        lineHeight: 20,
    },

    foodMeta: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        gap: 6,
    },

    foodMetaPill: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.22)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
    },

    foodMetaText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: "600",
    },
    // Card tổng chứa tab và dinh dưỡng
    planCard: {
        marginHorizontal: 16,
        marginTop: 24,
        padding: 14,
        borderRadius: RADIUS.lg,
        backgroundColor: PASTEL.surface,
        ...SOFT_SHADOW,
    },
    // Thanh tab
    tabRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
        padding: 4,
        gap: 4,
        borderRadius: RADIUS.pill,
        backgroundColor: PASTEL.background,
    },
    tabButton: {
        flex: 1,
        minHeight: 38,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
        borderRadius: RADIUS.pill,
    },
    activeTabButton: {
        backgroundColor: PASTEL.dark,
    },
    tabText: {
        fontSize: 12.5,
        color: COLORS.textMuted,
        fontWeight: "600",
        textAlign: "center",
    },
    activeTabText: {
        color: COLORS.white,
        fontWeight: "700",
    },
    // Hàng dinh dưỡng
    nutritionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        gap: 8,
    },
    nutritionItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 14,
    },
    nutritionTeal: {
        backgroundColor: COLORS.surfaceTeal,
    },
    nutritionOrange: {
        backgroundColor: "#FFF7ED",
    },
    nutritionGreen: {
        backgroundColor: "#ECFDF5",
    },
    nutritionRed: {
        backgroundColor: "#FFF1EC",
    },
    nutritionValue: {
        fontSize: 17,
        color: COLORS.textPrimary,
        fontWeight: "800",
    },
    nutritionChangeGreen: {
        marginTop: 2,
        fontSize: 12,
        color: COLORS.accentGreen,
        fontWeight: "700",
    },
    nutritionChangeOrange: {
        marginTop: 2,
        fontSize: 12,
        color: COLORS.accentGold,
        fontWeight: "700",
    },
    nutritionChangeRed: {
        marginTop: 2,
        fontSize: 12,
        color: COLORS.accentOrange,
        fontWeight: "700",
    },
    nutritionLabel: {
        marginTop: 4,
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: "center",
    },
    // Nội dung khẩu phần ăn
    dailyContent: {
        paddingHorizontal: 4,
    },
    dailyTitle: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: "800",
        marginBottom: 4,
    },
    dailyDescription: {
        fontSize: 12.5,
        color: COLORS.textMuted,
        lineHeight: 18,
        marginBottom: 8,
    },
    dailyInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    dailyInfoRowLast: {
        borderBottomWidth: 0,
    },
    dailyInfoLabel: {
        fontSize: 13.5,
        color: COLORS.textSecondary,
    },
    dailyInfoValue: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "800",
    },
    // Nội dung kế hoạch
    planDescription: {
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    planDescriptionTitle: {
        marginTop: 8,
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: "700",
        textAlign: "center",
    },
    planDescriptionText: {
        marginTop: 6,
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 19,
        textAlign: "center",
    },
});

export default DietScreen;
