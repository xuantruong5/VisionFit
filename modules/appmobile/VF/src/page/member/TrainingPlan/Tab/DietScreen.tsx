
import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import { useNavigation } from "@react-navigation/native";

const DietScreen = () => {
    // do trang header dang reder trực tiếp nên mới dùng cách này còn kh mọi người cứ dùng cách cũ 
    const navigation = useNavigation<any>()
    // Dữ liệu cứng - sau này thay bằng dữ liệu API
    const meals = [
        {
            id: 1,
            name: "Bữa ăn 1",
            time: "07:00",
            foods: [
                {
                    id: 1,
                    title: "Salad sốt mè tahini, ăn kèm bánh mì pita và sốt hummus, kiểu Levant",
                    calories: "281 Kcal",
                    weight: "200 g",
                    image:
                        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
                },
                {
                    id: 2,
                    title: "Sữa chua ăn kèm phô mai tươi, các loại hạt và mật ong",
                    calories: "320 Kcal",
                    weight: "250 g",
                    image:
                        "https://images.unsplash.com/photo-1488477181946-6428a0291777",
                },
                {
                    id: 3,
                    title: "Trứng chiên rau củ",
                    calories: "489 Kcal",
                    weight: "300 g",
                    image:
                        "https://images.unsplash.com/photo-1525351484163-7529414344d8",
                },
            ],
        },
        {
            id: 2,
            name: "Bữa ăn 2",
            time: "10:00",
            foods: [
                {
                    id: 4,
                    title: "Bánh mì nguyên cám và chuối",
                    calories: "250 Kcal",
                    weight: "180 g",
                    image:
                        "https://images.unsplash.com/photo-1481349518771-20055b2a7b24",
                },
                {
                    id: 5,
                    title: "Sinh tố trái cây tươi",
                    calories: "190 Kcal",
                    weight: "250 ml",
                    image:
                        "https://images.unsplash.com/photo-1553530666-ba11a7da3888",
                },
            ],
        },
        {
            id: 3,
            name: "Bữa ăn 3",
            time: "13:00",
            foods: [
                {
                    id: 6,
                    title: "Cơm gạo lứt với ức gà và rau củ",
                    calories: "450 Kcal",
                    weight: "350 g",
                    image:
                        "https://images.unsplash.com/photo-1547592180-85f173990554",
                },
                {
                    id: 7,
                    title: "Salad cá hồi và rau xanh",
                    calories: "380 Kcal",
                    weight: "280 g",
                    image:
                        "https://images.unsplash.com/photo-1467003909585-2f8a72700288",
                },
            ],
        },
        {
            id: 4,
            name: "Bữa ăn 4",
            time: "17:00",
            foods: [
                {
                    id: 6,
                    title: "Cơm gạo lứt với ức gà và rau củ",
                    calories: "450 Kcal",
                    weight: "350 g",
                    image:
                        "https://images.unsplash.com/photo-1547592180-85f173990554",
                },
                {
                    id: 7,
                    title: "Salad cá hồi và rau xanh",
                    calories: "380 Kcal",
                    weight: "280 g",
                    image:
                        "https://images.unsplash.com/photo-1467003909585-2f8a72700288",
                },
            ],
        },
        {
            id: 5,
            name: "Bữa ăn 5",
            time: "20:00",
            foods: [
                {
                    id: 4,
                    title: "Bánh mì nguyên cám và chuối",
                    calories: "250 Kcal",
                    weight: "180 g",
                    image:
                        "https://images.unsplash.com/photo-1481349518771-20055b2a7b24",
                },
                {
                    id: 5,
                    title: "Sinh tố trái cây tươi",
                    calories: "190 Kcal",
                    weight: "250 ml",
                    image:
                        "https://images.unsplash.com/photo-1553530666-ba11a7da3888",
                },
            ],
        },
    ];

    // hàm lấy ngày tháng 
    const today = new Date();
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [showDays, setShowDays] = useState(false);
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        return {
            day: date.getDate(),
            month: date.getMonth() + 1,
        };
    });
    // plan kế hoạch 
    const [activeTab, setActiveTab] = useState("plan");

    return (
        <View style={styles.container}>
            {/* Thanh chọn ngày */}
            <View style={styles.daySection}>
                <View style={styles.daysRow}>
                    {days.map((item, index) => (
                        <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => setSelectedDay(item.day)}
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
                            Ngày đang chọn: {selectedDay}
                        </Text>
                        <Text style={styles.dropdownDescription}>
                            Chọn ngày để xem thực đơn dinh dưỡng.
                        </Text>
                    </View>
                )}
            </View>
            {/* Danh sách các bữa ăn */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} >
                {meals.map((meal) => (
                    <View key={meal.id} style={styles.mealSection}>
                        {/* Tiêu đề bữa ăn */}
                        <View style={styles.mealHeader}>
                            <Text style={styles.mealName}>
                                {meal.name}:
                            </Text>
                            <Text style={styles.mealTime}>
                                {meal.time}
                            </Text>
                        </View>
                        {/* Các món ăn vuốt ngang */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodList} >
                            {meal.foods.map((food) => (
                                <TouchableOpacity key={food.id} activeOpacity={0.85} style={styles.foodCard}
                                 onPress={() => { navigation.navigate("DietDetail", { food: food, });}} >
                                    <ImageBackground source={{ uri: food.image }} style={styles.foodImage} imageStyle={styles.foodImageRadius} >
                                        {/* Lớp phủ tối */}
                                        <View style={styles.gradient} >
                                            <View style={styles.foodInfo} >
                                                <Text style={styles.foodTitle} numberOfLines={2} >
                                                    {food.title}
                                                </Text>
                                                <View style={styles.foodMeta} >
                                                    <Text
                                                        style={styles.foodMetaText} >
                                                        {food.calories}
                                                    </Text>
                                                    <Text style={styles.foodMetaText} >
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
                ))}

                {/* TAB KẾ HOẠCH / KHẨU PHẦN ĂN */}
                <View style={styles.planCard}>
                    {/* Thanh tab */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity activeOpacity={0.8}
                            style={[ styles.tabButton, activeTab === "plan" && styles.activeTabButton,]} onPress={() => setActiveTab("plan")} >
                            <Text style={[ styles.tabText, activeTab === "plan" && styles.activeTabText, ]} >
                                Kế hoạch hiện tại
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8} style={[ styles.tabButton, activeTab === "daily" && styles.activeTabButton, ]} 
                        onPress={() => setActiveTab("daily")} >
                            <Text style={[ styles.tabText, activeTab === "daily" && styles.activeTabText, ]} >
                                Khẩu phần ăn hàng ngày
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* Chỉ hiển thị bảng dinh dưỡng ở tab Kế hoạch hiện tại */}
                    {activeTab === "plan" && (
                        <View style={styles.nutritionRow}>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>178,5</Text>
                                <Text style={styles.nutritionChangeGreen}>
                                    -20 ↓
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Protein, g
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>40,3</Text>
                                <Text style={styles.nutritionChangeOrange}>
                                    +2 ↑
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Chất béo, g
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>500</Text>
                                <Text style={styles.nutritionChangeGreen}>
                                    0
                                </Text>
                                <Text style={styles.nutritionLabel}>
                                    Carb, g
                                </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>1800</Text>
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
        backgroundColor: "#18B9B8",
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
        backgroundColor: "#58758C",
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