import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

const Income = ({ navigation }: any) => {
  const transactions = [
    {
      date: "07/09/2026",
      type: "Personal Training",
      member: "Member A",
      amount: "500.000 ₫",
    },
    {
      date: "06/09/2026",
      type: "Personal Training",
      member: "Member B",
      amount: "500.000 ₫",
    },
    {
      date: "05/09/2026",
      type: "Personal Training",
      member: "Member C",
      amount: "400.000 ₫",
    },
    {
      date: "04/09/2026",
      type: "Personal Training",
      member: "Member D",
      amount: "500.000 ₫",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thu nhập</Text>

        <View style={styles.headerSpace} />
      </View>

      {/* Income summary */}
      <View style={styles.incomeCard}>
        <Text style={styles.incomeLabel}>Thu nhập tháng này</Text>

        <Text style={styles.incomeAmount}>
          12.500.000 ₫
        </Text>

        <View style={styles.growthRow}>
          <Text style={styles.growthIcon}>↑</Text>
          <Text style={styles.growthText}>
            15.2% so với tháng trước
          </Text>
        </View>
      </View>

      {/* Overview */}
      <Text style={styles.sectionTitle}>Tổng quan</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>32</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>28</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Chart */}
      <Text style={styles.sectionTitle}>Thu nhập theo tháng</Text>

      <View style={styles.chartCard}>
        <View style={styles.chart}>
          <View style={styles.barWrapper}>
            <View style={[styles.bar, { height: 55 }]} />
            <Text style={styles.month}>Jan</Text>
          </View>

          <View style={styles.barWrapper}>
            <View style={[styles.bar, { height: 80 }]} />
            <Text style={styles.month}>Feb</Text>
          </View>

          <View style={styles.barWrapper}>
            <View style={[styles.bar, { height: 65 }]} />
            <Text style={styles.month}>Mar</Text>
          </View>

          <View style={styles.barWrapper}>
            <View style={[styles.bar, { height: 105 }]} />
            <Text style={styles.month}>Apr</Text>
          </View>

          <View style={styles.barWrapper}>
            <View style={[styles.bar, { height: 85 }]} />
            <Text style={styles.month}>May</Text>
          </View>

          <View style={styles.barWrapper}>
            <View style={[styles.bar, { height: 120 }]} />
            <Text style={styles.month}>Jun</Text>
          </View>
        </View>
      </View>

      {/* Transaction history */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Lịch sử thu nhập</Text>

        <TouchableOpacity>
          <Text style={styles.viewAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {transactions.map((item, index) => (
        <View key={index} style={styles.transactionCard}>
          <View style={styles.transactionLeft}>
            <View style={styles.iconCircle}>
              <Text style={styles.moneyIcon}>₫</Text>
            </View>

            <View>
              <Text style={styles.transactionType}>
                {item.type}
              </Text>

              <Text style={styles.memberName}>
                {item.member}
              </Text>

              <Text style={styles.date}>
                {item.date}
              </Text>
            </View>
          </View>

          <Text style={styles.amount}>
            +{item.amount}
          </Text>
        </View>
      ))}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default Income;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 20,
  },

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 30,
    color: "#111827",
    marginTop: -3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  headerSpace: {
    width: 40,
  },

  incomeCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 24,
    marginTop: 10,
    marginBottom: 25,
  },

  incomeLabel: {
    fontSize: 14,
    color: "#CBD5E1",
  },

  incomeAmount: {
    fontSize: 30,
    fontWeight: "800",
    
    marginTop: 10,
  },

  growthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  growthIcon: {
    fontSize: 18,
    
    marginRight: 6,
  },

  growthText: {
    fontSize: 13,
    color: "#E2E8F0",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  statCard: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
  },

  chart: {
    height: 170,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  barWrapper: {
    height: 155,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  bar: {
    width: 24,
    backgroundColor: "#111827",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  month: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 8,
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  viewAll: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  moneyIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  transactionType: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  memberName: {
    fontSize: 13,
    color: "#475569",
    marginTop: 3,
  },

  date: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
  },

  amount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  bottomSpace: {
    height: 30,
  },
});
