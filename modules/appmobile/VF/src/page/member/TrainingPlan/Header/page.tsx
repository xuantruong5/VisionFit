import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import DashboardScreen from "../Tab/DashboardScreen";
import DietScreen from "../Tab/DietScreen";
import WorkoutExercisePlan from "../Tab/WorkoutExercisePlan";
import MyPlansModal from "./MyPlansModal";
import LinearGradient from "react-native-linear-gradient";
import { COLORS } from "../../../../general/theme";

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
      {/* HEADER GRADIENT */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.circleLg} />
        <View style={styles.circleSm} />

        {/* HEADER TOP */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("WorkoutPlanScreen");
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.subtitle}>Hành trình luyện tập</Text>
            <Text style={styles.title}>Kế hoạch của tôi</Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setMyPlansVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="list-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

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
                  color={isActive ? COLORS.primary : "rgba(255,255,255,0.85)"}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 28,
    marginHorizontal: 12,
    marginTop: 6,
    overflow: "hidden",
  },
  circleLg: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -90,
    right: -50,
  },
  circleSm: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -45,
    left: -25,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginTop: 16,
    padding: 4,
    gap: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
