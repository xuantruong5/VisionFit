
import React from "react";
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, SafeAreaView, } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp, } from "react-native-responsive-screen";
import { useRoute } from "@react-navigation/native";

const ingredients = [
    { name: "Sốt đậu gà nhà làm", amount: "30 g" },
    { name: "Ớt chuông đỏ, sống", amount: "14 g" },
    { name: "Bơ hoặc dầu mè", amount: "8 g" },
    { name: "Ngò tây", amount: "6 g" },
    { name: "Bánh mì Pita", amount: "60 g" },
    { name: "Dưa leo, có vỏ, sống", amount: "42 g" },
    { name: "Cà chua, đỏ, sống", amount: "30 g" },
    { name: "Hành tây đỏ, sống", amount: "6 g" },
    { name: "Nước ép chanh vàng", amount: "4 g" },
];

const spices = [
    "Tỏi, sống",
    "Gia vị sumac",
    "Muối",
];
const cookingSteps = [
    "Băm nhỏ cà chua, dưa chuột, ớt chuông, hành tây tím và rau mùi tây.",
    "Băm nhỏ tỏi.",
    "Trộn nước cốt chanh, sốt mè tahini và tỏi trong tô lớn. Nếu nước sốt quá sệt thì pha loãng với một chút nước.",
    "Cho các loại rau và rau mùi tây vào nước sốt.",
    "Thêm muối và bột sumac cho vừa ăn.",
    "Trộn đều.",
    "Thưởng thức món salad với bánh mì pita và sốt hummus.",
];
const DietDetail = ({ navigation }: any) => {
    const route = useRoute<any>();
    // Lấy món ăn được truyền từ DietScreen
    const food = route.params?.food;
    const foodImage = food?.image;
    const foodName = food?.title || "Chi tiết món ăn";
    const weightdetail = food?.weight || "0 g";


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
                        <Ionicons name="arrow-back" size={wp("6%")} color="#263746" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        Chi tiết món ăn
                    </Text>
                    <View style={styles.headerRight} />
                </View>

                {/* Ảnh món ăn */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: food?.image }} style={styles.foodImage} resizeMode="cover" />
                </View>

                {/* Tên món ăn */}
                <View style={styles.content}>
                    <Text style={styles.foodName}>
                        {foodName} {weightdetail}
                    </Text>
                    {/* Thời gian nấu */}
                    <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={wp("4.5%")} color="#A7B0B6" />
                        <Text style={styles.timeText}>
                            Thời gian nấu: 15 phút.
                        </Text>
                    </View>
                    {/* Khẩu phần */}
                    <View style={styles.servingRow}>
                        <View style={styles.servingActive}>
                            <Text style={styles.servingActiveText}>
                                Toàn bộ món ăn
                            </Text>
                        </View>
                        <View style={styles.servingInactive}>
                            <Text style={styles.servingInactiveText}>
                                100 g
                            </Text>
                        </View>
                    </View>
                    {/* Dinh dưỡng */}
                    <View style={styles.nutritionCard}>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>
                                281,2
                            </Text>
                            <Text style={styles.nutritionLabel}>
                                Protein, g
                            </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>
                                9,8
                            </Text>
                            <Text style={styles.nutritionLabel}>
                                Chất béo, g
                            </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>
                                8,2
                            </Text>
                            <Text style={styles.nutritionLabel}>
                                Carb, g
                            </Text>
                        </View>
                        <View style={styles.kcalItem}>
                            <Text style={styles.kcalValue}>
                                46
                            </Text>
                            <Text style={styles.kcalLabel}>
                                Kcal
                            </Text>
                        </View>
                    </View>
                    {/* Nguyên liệu */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Nguyên liệu
                        </Text>
                        <Ionicons name="information-circle-outline" size={wp("5.5%")} color="#27BFC4" />
                    </View>
                    <View style={styles.ingredientsCard}>
                        {ingredients.map((item, index) => (
                            <TouchableOpacity
                                key={index} style={[styles.ingredientRow, index === ingredients.length - 1 && styles.lastRow,]} >
                                <Text style={styles.ingredientName}>
                                    {item.name}
                                </Text>
                                <View style={styles.amountRow}>
                                    <Text style={styles.amountText}>
                                        {item.amount}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={wp("5%")} color="#26BDBD" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tùy theo khẩu vị */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Tùy theo khẩu vị
                        </Text>
                    </View>

                    <View style={styles.spicesCard}>
                        {spices.map((item, index) => (
                            <TouchableOpacity key={index}
                                style={[styles.spiceRow, index === spices.length - 1 && styles.lastRow,]} >
                                <Text style={styles.spiceName}>
                                    {item}
                                </Text>
                                <Ionicons name="chevron-forward" size={wp("5%")} color="#26BDBD" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Công thức nấu ăn */}
                    <View style={styles.recipeSectionHeader}>
                        <Text style={styles.recipeSectionTitle}>
                            Công thức nấu ăn
                        </Text>
                    </View>
                    <View style={styles.recipeCard}>
                        {cookingSteps.map((step, index) => (
                            <View key={index} style={[ styles.recipeStep, index === cookingSteps.length - 1 && styles.lastRecipeStep, ]} >
                                <View style={styles.stepNumberContainer}>
                                    <Text style={styles.stepNumber}>
                                        {index + 1}
                                    </Text>
                                </View>
                                <Text style={styles.stepText}>
                                    {step}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: hp("3%"),
    },

    scrollContent: {
        paddingBottom: hp("3%"),
    },

    header: {
        height: hp("7%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp("5%"),
        backgroundColor: "#FFFFFF",
    },

    backButton: {
        width: wp("10%"),
        height: wp("10%"),
        alignItems: "center",
        justifyContent: "center",
    },

    headerTitle: {
        fontSize: wp("4.5%"),
        fontWeight: "700",
        color: "#263746",
    },

    headerRight: {
        width: wp("10%"),
    },

    imageContainer: {
        width: "100%",
        height: hp("26%"),
        backgroundColor: "#E9EFF1",
    },

    foodImage: {
        width: "100%",
        height: "100%",
    },

    content: {
        paddingHorizontal: wp("5%"),
    },

    foodName: {
        fontSize: wp("4.7%"),
        fontWeight: "700",
        color: "#263746",
        lineHeight: hp("3.2%"),
        marginTop: hp("2%"),
    },

    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: hp("1.8%"),
        gap: wp("2%"),
    },

    timeText: {
        fontSize: wp("3.5%"),
        color: "#8A969D",
    },

    servingRow: {
        flexDirection: "row",
        height: hp("5%"),
        borderRadius: wp("2%"),
        overflow: "hidden",
        backgroundColor: "#E8F0F3",
        marginTop: hp("2%"),
    },

    servingActive: {
        flex: 1.5,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#496D87",
        borderRadius: wp("2%"),
    },

    servingActiveText: {
        color: "#FFFFFF",
        fontSize: wp("3.5%"),
        fontWeight: "600",
    },

    servingInactive: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    servingInactiveText: {
        color: "#718692",
        fontSize: wp("3.5%"),
        fontWeight: "500",
    },

    nutritionCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: hp("2%"),
        marginTop: hp("1.5%"),
        borderRadius: wp("2%"),
        backgroundColor: "#FFFFFF",
        elevation: 2,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },

    nutritionItem: {
        flex: 1,
        alignItems: "center",
    },

    nutritionValue: {
        fontSize: wp("4.5%"),
        fontWeight: "700",
        color: "#263746",
    },

    nutritionLabel: {
        fontSize: wp("2.7%"),
        color: "#8B969C",
        marginTop: hp("0.5%"),
    },

    kcalItem: {
        width: wp("17%"),
        alignItems: "center",
        justifyContent: "center",
        borderLeftWidth: 1,
        borderLeftColor: "#E5EAED",
    },

    kcalValue: {
        fontSize: wp("4.5%"),
        fontWeight: "700",
        color: "#263746",
    },

    kcalLabel: {
        fontSize: wp("2.7%"),
        color: "#8B969C",
        marginTop: hp("0.5%"),
    },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: wp("2%"),
        marginTop: hp("2.5%"),
        marginBottom: hp("1%"),
    },

    sectionTitle: {
        fontSize: wp("4.2%"),
        fontWeight: "700",
        color: "#78909C",
    },

    ingredientsCard: {
        borderWidth: 0,
        // borderColor: "#DCE9ED",
        borderRadius: wp("2.5%"),
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
    },

    ingredientRow: {
        minHeight: hp("6.7%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp("3%"),
        borderBottomWidth: 1,
        borderBottomColor: "#E6ECEF",
    },

    ingredientName: {
        flex: 1,
        fontSize: wp("3.8%"),
        color: "#34434D",
        paddingRight: wp("2%"),
    },

    amountRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: wp("2%"),
    },

    amountText: {
        fontSize: wp("3.6%"),
        color: "#68747A",
    },

    lastRow: {
        borderBottomWidth: 0,
    },

    spicesCard: {
        borderWidth: 0,
        // borderColor: "#DCE9ED",
        borderRadius: wp("2.5%"),
        overflow: "hidden",
        backgroundColor: "#F7FAFB",
    },

    spiceRow: {
        minHeight: hp("6.5%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp("4%"),
        borderBottomWidth: 1,
        borderBottomColor: "#E6ECEF",
    },

    spiceName: {
        fontSize: wp("3.9%"),
        color: "#34434D",
    },
    recipeSectionHeader: {
        marginTop: hp("3%"),
        marginBottom: hp("1.5%"),
        paddingHorizontal: wp("1%"),
    },

    recipeSectionTitle: {
        fontSize: wp("4.2%"),
        fontWeight: "700",
        color: "#78909C",
    },

    recipeCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 0,
        borderColor: "#DCE9ED",
        borderRadius: wp("2.5%"),
        paddingHorizontal: wp("2.5%"),
        paddingVertical: hp("1.5%"),
        marginBottom: hp("2%"),
    },

    recipeStep: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F4F8FA",
        borderRadius: wp("2%"),
        paddingVertical: hp("2%"),
        paddingHorizontal: wp("3%"),
        marginBottom: hp("1.5%"),
        minHeight: hp("8%"),
    },

    lastRecipeStep: {
        marginBottom: 0,
    },

    stepNumberContainer: {
        width: wp("7%"),
        height: wp("7%"),
        borderRadius: wp("3.5%"),
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: wp("3%"),
        flexShrink: 0,
    },

    stepNumber: {
        fontSize: wp("3.5%"),
        fontWeight: "600",
        color: "#78909C",
    },

    stepText: {
        flex: 1,
        fontSize: wp("3.8%"),
        lineHeight: hp("2.8%"),
        color: "#34434D",
    },
});

export default DietDetail;