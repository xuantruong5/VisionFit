import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import DashboardScreen from "../Tab/DashboardScreen";
import DietScreen from "../Tab/DietScreen";
import WorkoutExercisePlan from "../Tab/WorkoutExercisePlan";
import MyPlansModal from "./MyPlansModal";
import { COLORS, SHADOWS } from "../../../../general/theme";

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

      {/* HEADER TOP */}
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setActiveTab("Trang tổng quan")}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Kế hoạch của tôi</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setMyPlansVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="list-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* SEGMENTED TAB BAR */}
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

      {/* NỘI DUNG TAB */}
      <View style={styles.content}>
        {activeTab === "Trang tổng quan" && <DashboardScreen />}
        {activeTab === "Kế hoạch tập" && <WorkoutExercisePlan />}
        {activeTab === "Chế độ ăn" && <DietScreen />}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTop: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
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
  },
});