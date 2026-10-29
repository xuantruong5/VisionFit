import React from "react";
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import AppHeader from "../../../../components/AppHeader";
import { COLORS, SHADOWS } from "../../../../general/theme";

const parseList = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return parsed ? [parsed] : [];
    } catch {
      return value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const DietDetail = ({ navigation, route }: any) => {
  const food = route.params?.food;
  const foodName = food?.title || "Chi tiết món ăn";
  const weightdetail = food?.weight || "0 g";
  const cookingTime = food?.thoi_gian_nau;
  const protein = Number(food?.protein || 0);
  const fat = Number(food?.fat || 0);
  const carb = Number(food?.carb || 0);
  const calories = Number(food?.calo ?? String(food?.calories ?? "0").replace(/[^\d.]/g, ""));

  const ingredients = parseList(food?.nguyen_lieu);
  const spices = parseList(food?.gia_vi);
  const cookingSteps = parseList(food?.huong_dan_nau);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="Chi tiết món ăn"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Ảnh món ăn */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                food?.image ||
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
            }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.foodName}>{foodName}</Text>

          {/* Thời gian & khẩu phần */}
          <View style={styles.timeRow}>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>
                {cookingTime ? `${cookingTime} phút` : "Chế biến nhanh"}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="scale-outline" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>{weightdetail}</Text>
            </View>
          </View>

          {/* Bảng Dinh Dưỡng / Macro Card */}
          <View style={styles.nutritionCard}>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: COLORS.accentBlue }]}>{protein}g</Text>
              <Text style={styles.nutritionLabel}>Đạm (Protein)</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: COLORS.accentOrange }]}>{fat}g</Text>
              <Text style={styles.nutritionLabel}>Chất béo</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: COLORS.accentGold }]}>{carb}g</Text>
              <Text style={styles.nutritionLabel}>Tinh bột (Carb)</Text>
            </View>

            <View style={styles.kcalItem}>
              <Text style={styles.kcalValue}>{calories}</Text>
              <Text style={styles.kcalLabel}>Calories</Text>
            </View>
          </View>

          {/* Nguyên liệu */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Nguyên liệu chính</Text>
            </View>

            {ingredients.length > 0 ? (
              ingredients.map((item, index) => {
                const name =
                  typeof item === "string"
                    ? item
                    : item.name ?? item.ten_nguyen_lieu ?? item.ten ?? "Nguyên liệu";
                const amount =
                  typeof item === "string"
                    ? ""
                    : item.amount ?? item.khoi_luong ?? item.so_luong ?? "";

                return (
                  <View
                    key={index}
                    style={[
                      styles.ingredientRow,
                      index === ingredients.length - 1 && styles.lastRow,
                    ]}
                  >
                    <Text style={styles.ingredientName}>{name}</Text>
                    {amount ? <Text style={styles.amountText}>{amount}</Text> : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Chưa có thông tin nguyên liệu chi tiết.</Text>
            )}
          </View>

          {/* Gia vị nêm nếm */}
          {spices.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flask-outline" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Gia vị gợi ý</Text>
              </View>
              {spices.map((spice, idx) => (
                <View
                  key={idx}
                  style={[styles.ingredientRow, idx === spices.length - 1 && styles.lastRow]}
                >
                  <Text style={styles.ingredientName}>
                    {typeof spice === "string" ? spice : spice.name ?? "Gia vị"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Hướng dẫn nấu */}
          {cookingSteps.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flame-outline" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Cách chế biến</Text>
              </View>
              {cookingSteps.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{typeof step === "string" ? step : step.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DietDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  imageContainer: {
    width: "100%",
    height: 220,
    backgroundColor: COLORS.borderLight,
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 16,
  },
  foodName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  timeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  nutritionCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  nutritionItem: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  nutritionLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  kcalItem: {
    flex: 1.2,
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  kcalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  kcalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  ingredientName: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  amountText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});