import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import DashboardScreen from "../Tab/DashboardScreen";
import DietScreen from "../Tab/DietScreen";
import WorkoutExercisePlan from "../Tab/WorkoutExercisePlan";
import MyPlansModal from "./MyPlansModal";
import { COLORS, PASTEL, SOFT_SHADOW } from "../../../../general/theme";
import { Notice, notificationEmitter } from "../../../../general/notification";

// Nhãn ngày hôm nay hiển thị trên header
const WEEKDAY_NAMES = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const NOW = new Date();
const TODAY_LABEL = `${WEEKDAY_NAMES[NOW.getDay()]}, ${NOW.getDate()} tháng ${NOW.getMonth() + 1}`;

const HeaderPage = ({ navigation, route }: any) => {
  const [activeTab, setActiveTab] = useState("Trang tổng quan");
  const [myPlansVisible, setMyPlansVisible] = useState(false);


  // thông báo 
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  useEffect(() => {
    const handleNotification = (notice: Notice) => {
      setNotifications(prev => [notice, ...prev]);
      // Tự động mở modal thông báo
      setNotificationVisible(true);
    };
    notificationEmitter.on("thong_bao", handleNotification);
    return () => {
      notificationEmitter.removeListener("thong_bao", handleNotification);
    };
  }, []);



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
            <TouchableOpacity style={styles.iconButton} onPress={() => setActiveTab("Trang tổng quan")} activeOpacity={0.7} >
              <Ionicons name="calendar-outline" size={20} color={PASTEL.ink} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={() => setMyPlansVisible(true)} activeOpacity={0.7} >
              <Ionicons name="list-outline" size={20} color={PASTEL.ink} />
            </TouchableOpacity>

            {notifications.length > 0 && (
              <TouchableOpacity style={styles.iconButton} onPress={() => setNotificationVisible(true)} activeOpacity={0.7} >
                <Ionicons name="notifications-outline" size={21} color={PASTEL.ink} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notifications.length > 99 ? "99+" : notifications.length}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
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
      <MyPlansModal visible={myPlansVisible} onClose={() => setMyPlansVisible(false)} navigation={navigation} />

      <Modal visible={notificationVisible} transparent animationType="fade" onRequestClose={() => setNotificationVisible(false)} >
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.notificationHeader}>
              <View>
                <Text style={styles.notificationTitle}>Thông báo</Text>
                <Text style={styles.notificationSubtitle}>
                  Bạn có {notifications.length} thông báo mới
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setNotificationVisible(false)}
              >
                <Ionicons name="close-circle-outline" size={27} color="#777" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.map((item, index) => (
                <View key={index} style={styles.notificationItem}>
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name="trophy"
                      size={23}
                      color="#E9A23B"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.notificationItemTitle}>
                      {item.type === "success"
                        ? "Chúc mừng bạn!"
                        : "Thông báo"}
                    </Text>

                    <Text style={styles.notificationMessage}>
                      {item.message}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.clearNotificationButton}
              onPress={() => {
                setNotifications([]);
                setNotificationVisible(false);
              }}
            >
              <Text style={styles.clearNotificationText}>
                Xóa tất cả thông báo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


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

  notificationBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 17,
    height: 17,
    borderRadius: 10,
    backgroundColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  notificationBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },

  notificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingHorizontal: 16,
  },

  notificationModal: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
  },

  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  notificationTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PASTEL.ink,
  },

  notificationSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },

  notificationIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#FFF4DF",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: PASTEL.ink,
    marginBottom: 4,
  },

  notificationMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  clearNotificationButton: {
    alignItems: "center",
    paddingVertical: 13,
    marginTop: 8,
  },

  clearNotificationText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
