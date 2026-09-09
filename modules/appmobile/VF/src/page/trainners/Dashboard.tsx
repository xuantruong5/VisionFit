import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const Dashboard = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>Good morning 👋</Text>
            <Text style={styles.title}>Trainer Dashboard</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {}}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Trainer Card */}
        <View style={styles.trainerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>T</Text>
          </View>

          <View style={styles.trainerInfo}>
            <Text style={styles.trainerName}>Trainer</Text>
            <Text style={styles.trainerRole}>Fitness Coach</Text>

            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>4.9</Text>
              <Text style={styles.ratingCount}> • 128 reviews</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation?.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>View</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation?.navigate('Members')}
          >
            <View style={[styles.iconBox, styles.blueBox]}>
              <Text style={styles.icon}>👥</Text>
            </View>

            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Members</Text>
            <Text style={styles.statChange}>+3 this month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation?.navigate('Schedule')}
          >
            <View style={[styles.iconBox, styles.greenBox]}>
              <Text style={styles.icon}>📅</Text>
            </View>

            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Sessions Today</Text>
            <Text style={styles.statChange}>2 remaining</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation?.navigate('Income')}
          >
            <View style={[styles.iconBox, styles.orangeBox]}>
              <Text style={styles.icon}>💰</Text>
            </View>

            <Text style={styles.statValue}>$2,450</Text>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statChange}>+12.5%</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, styles.purpleBox]}>
              <Text style={styles.icon}>⭐</Text>
            </View>

            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statChange}>Excellent</Text>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>

          <TouchableOpacity
            onPress={() => navigation?.navigate('Schedule')}
          >
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleCard}>
          <View style={styles.timeColumn}>
            <Text style={styles.time}>09:00</Text>
            <Text style={styles.timePeriod}>AM</Text>
          </View>

          <View style={styles.scheduleLine} />

          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>Personal Training</Text>
            <Text style={styles.memberName}>👤  Nguyễn Văn An</Text>
            <Text style={styles.sessionDuration}>60 minutes • Strength</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Upcoming</Text>
          </View>
        </View>

        <View style={styles.scheduleCard}>
          <View style={styles.timeColumn}>
            <Text style={styles.time}>14:00</Text>
            <Text style={styles.timePeriod}>PM</Text>
          </View>

          <View style={styles.scheduleLine} />

          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>Fitness Training</Text>
            <Text style={styles.memberName}>👤  Trần Minh Anh</Text>
            <Text style={styles.sessionDuration}>45 minutes • Cardio</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Upcoming</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation?.navigate('Members')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Members</Text>
            <Text style={styles.actionDescription}>
              Manage your members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation?.navigate('Schedule')}
          >
            <Text style={styles.actionIcon}>📆</Text>
            <Text style={styles.actionTitle}>Schedule</Text>
            <Text style={styles.actionDescription}>
              View your calendar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation?.navigate('SessionHistory')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionDescription}>
              Session history
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation?.navigate('Income')}
          >
            <Text style={styles.actionIcon}>💵</Text>
            <Text style={styles.actionTitle}>Income</Text>
            <Text style={styles.actionDescription}>
              Track your income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  smallText: {
    fontSize: 14,
    color: '#7B8494',
    marginBottom: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#151A23',
  },

  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  notificationIcon: {
    fontSize: 21,
  },

  notificationDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5C5C',
  },

  trainerCard: {
    backgroundColor: '#151A23',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#151A23',
  },

  trainerInfo: {
    flex: 1,
    marginLeft: 14,
  },

  trainerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  trainerRole: {
    color: '#AAB2C0',
    fontSize: 13,
    marginTop: 3,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  star: {
    color: '#FFC857',
    fontSize: 15,
  },

  rating: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },

  ratingCount: {
    color: '#8E97A6',
    fontSize: 12,
  },

  profileButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  profileButtonText: {
    color: '#151A23',
    fontSize: 12,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#151A23',
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  blueBox: {
    backgroundColor: '#E8F0FF',
  },

  greenBox: {
    backgroundColor: '#E8F8F0',
  },

  orangeBox: {
    backgroundColor: '#FFF1E5',
  },

  purpleBox: {
    backgroundColor: '#F0EAFE',
  },

  icon: {
    fontSize: 20,
  },

  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#151A23',
  },

  statLabel: {
    color: '#7B8494',
    fontSize: 13,
    marginTop: 3,
  },

  statChange: {
    color: '#27A66F',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  seeAll: {
    color: '#4F7CFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },

  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },

  timeColumn: {
    width: 52,
  },

  time: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151A23',
  },

  timePeriod: {
    fontSize: 11,
    color: '#7B8494',
    marginTop: 2,
  },

  scheduleLine: {
    width: 3,
    height: 52,
    borderRadius: 2,
    backgroundColor: '#4F7CFF',
    marginHorizontal: 12,
  },

  sessionInfo: {
    flex: 1,
  },

  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151A23',
  },

  memberName: {
    fontSize: 12,
    color: '#5E6878',
    marginTop: 5,
  },

  sessionDuration: {
    fontSize: 11,
    color: '#929AAA',
    marginTop: 4,
  },

  statusBadge: {
    backgroundColor: '#EAF2FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusText: {
    color: '#4F7CFF',
    fontSize: 9,
    fontWeight: '700',
  },

  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  actionIcon: {
    fontSize: 25,
    marginBottom: 10,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#151A23',
  },

  actionDescription: {
    fontSize: 11,
    color: '#8A93A2',
    marginTop: 4,
    lineHeight: 16,
  },
});

export default Dashboard;