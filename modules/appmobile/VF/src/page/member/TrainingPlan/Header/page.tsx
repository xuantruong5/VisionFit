import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import DashboardScreen from "../Tab/DashboardScreen";
import DietScreen from "../Tab/DietScreen";
import WorkoutExercisePlan from "../Tab/WorkoutExercisePlan";
import MyPlansModal from "./MyPlansModal";
import { COLORS, PASTEL, SOFT_SHADOW } from "../../../../general/theme";

// Nhãn ngày hôm nay hiển thị trên header
const WEEKDAY_NAMES = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const NOW = new Date();
const TODAY_LABEL = `${WEEKDAY_NAMES[NOW.getDay()]}, ${NOW.getDate()} tháng ${NOW.getMonth() + 1}`;

const HeaderPage = ({ navigation, route }: any) => {
  const [activeTab, setActiveTab] = useState("Trang tổng quan");
  const [myPlansVisible, setMyPlansVisible] = useState(false);

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
      navigation.setParams({ initialTab: undefined });
    }
  }, [route?.params?.initialTab, navigation]);

  const tabs = [
    { id: "Trang tổng quan", label: "Tổng quan", icon: "grid-outline" },
    { id: "Kế hoạch tập", label: "Lịch bài tập", icon: "barbell-outline" },
    { id: "Chế độ ăn", label: "Chế độ ăn", icon: "nutrition-outline" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.body}>
      {/* HEADER SÁNG */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.datePill}>
            <Ionicons name="sunny" size={14} color={COLORS.accentGold} />
            <Text style={styles.dateText}>{TODAY_LABEL}</Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setActiveTab("Trang tổng quan")}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={20} color={PASTEL.ink} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setMyPlansVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="list-outline" size={20} color={PASTEL.ink} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          <Text style={styles.titleLight}>Kế hoạch tập </Text>
          của tôi<Text style={styles.titleDot}>.</Text>
        </Text>

        {/* THANH CHỌN TAB TRONG HEADER */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tab, isActive && styles.activeTab]}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? COLORS.white : COLORS.textMuted}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* NỘI DUNG TAB */}
      <View style={styles.content}>
        {activeTab === "Trang tổng quan" && <DashboardScreen />}
        {activeTab === "Kế hoạch tập" && <WorkoutExercisePlan />}
        {activeTab === "Chế độ ăn" && <DietScreen />}
      </View>

      </View>
      {/* Modal Kế hoạch của tôi */}
      <MyPlansModal
        visible={myPlansVisible}
        onClose={() => setMyPlansVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

export default HeaderPage;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: PASTEL.background,
  },
  container: {
    flex: 1,
    backgroundColor: PASTEL.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  titleLight: {
    fontWeight: "400",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: PASTEL.ink,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  titleDot: {
    color: COLORS.primary,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SOFT_SHADOW,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginTop: 18,
    padding: 5,
    gap: 4,
    borderRadius: 26,
    ...SOFT_SHADOW,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: PASTEL.dark,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    backgroundColor: PASTEL.background,
  },
});
