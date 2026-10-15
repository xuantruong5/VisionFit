import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const HomePage = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>Trainer</Text>
          </View>

          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>T</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TouchableOpacity style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchText}>
            Search members, sessions...
          </Text>
        </TouchableOpacity>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summarySmall}>TODAY</Text>
            <Text style={styles.summaryTitle}>
              Let's make today great!
            </Text>
            <Text style={styles.summaryDescription}>
              You have 8 training sessions scheduled.
            </Text>
          </View>

          <Text style={styles.summaryEmoji}>🏋️</Text>
        </View>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Today</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Next Session */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next Session</Text>

          <TouchableOpacity
            onPress={() => navigation?.navigate('Schedule')}
          >
            <Text style={styles.seeAll}>View schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sessionCard}>
          <View style={styles.sessionTime}>
            <Text style={styles.sessionHour}>09:00</Text>
            <Text style={styles.sessionPeriod}>AM</Text>
          </View>

          <View style={styles.verticalLine} />

          <View style={styles.sessionContent}>
            <Text style={styles.sessionTitle}>
              Personal Training
            </Text>

            <Text style={styles.sessionMember}>
              👤 Nguyễn Văn An
            </Text>

            <Text style={styles.sessionType}>
              Strength Training • 60 min
            </Text>
          </View>

          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingText}>Upcoming</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation?.navigate('Members')}
          >
            <View style={styles.actionIconBox}>
              <Text style={styles.actionIcon}>👥</Text>
            </View>

            <Text style={styles.actionTitle}>Members</Text>
            <Text style={styles.actionDescription}>
              Manage members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation?.navigate('Schedule')}
          >
            <View style={styles.actionIconBox}>
              <Text style={styles.actionIcon}>📆</Text>
            </View>

            <Text style={styles.actionTitle}>Schedule</Text>
            <Text style={styles.actionDescription}>
              Manage sessions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation?.navigate('SessionHistory')}
          >
            <View style={styles.actionIconBox}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>

            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionDescription}>
              View training history
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation?.navigate('Income')}
          >
            <View style={styles.actionIconBox}>
              <Text style={styles.actionIcon}>💰</Text>
            </View>

            <Text style={styles.actionTitle}>Income</Text>
            <Text style={styles.actionDescription}>
              Check your income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Members */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Members</Text>

          <TouchableOpacity
            onPress={() => navigation?.navigate('Members')}
          >
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.memberCard}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>NA</Text>
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>Nguyễn Văn An</Text>
            <Text style={styles.memberGoal}>
              Weight Loss • 12 sessions
            </Text>
          </View>

          <Text style={styles.memberArrow}>›</Text>
        </View>

        <View style={styles.memberCard}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>MA</Text>
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>Trần Minh Anh</Text>
            <Text style={styles.memberGoal}>
              Muscle Gain • 8 sessions
            </Text>
          </View>

          <Text style={styles.memberArrow}>›</Text>
        </View>

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
    paddingTop: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  greeting: {
    fontSize: 14,
    color: '#7B8494',
    marginBottom: 3,
  },

  name: {
    fontSize: 27,
    fontWeight: '700',
    color: '#151A23',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#151A23',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    
    fontSize: 19,
    fontWeight: '700',
  },

  searchBox: {
    height: 50,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 18,
  },

  searchIcon: {
    fontSize: 25,
    color: '#7B8494',
    marginRight: 8,
  },

  searchText: {
    fontSize: 13,
    color: '#9AA2AF',
  },

  summaryCard: {
    backgroundColor: '#151A23',
    borderRadius: 22,
    padding: 20,
    minHeight: 145,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
  },

  summarySmall: {
    color: '#8F98A7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },

  summaryTitle: {
    
    fontSize: 20,
    fontWeight: '700',
    maxWidth: 220,
  },

  summaryDescription: {
    color: '#AAB2C0',
    fontSize: 12,
    marginTop: 8,
    maxWidth: 220,
    lineHeight: 18,
  },

  summaryEmoji: {
    fontSize: 48,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#151A23',
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  statCard: {
    width: '31.5%',
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
  },

  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },

  statNumber: {
    fontSize: 21,
    fontWeight: '700',
    color: '#151A23',
  },

  statLabel: {
    color: '#8992A1',
    fontSize: 11,
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  seeAll: {
    color: '#4F7CFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
  },

  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 27,
  },

  sessionTime: {
    width: 50,
    alignItems: 'center',
  },

  sessionHour: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151A23',
  },

  sessionPeriod: {
    fontSize: 10,
    color: '#8992A1',
    marginTop: 2,
  },

  verticalLine: {
    width: 3,
    height: 55,
    borderRadius: 2,
    backgroundColor: '#4F7CFF',
    marginHorizontal: 12,
  },

  sessionContent: {
    flex: 1,
  },

  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151A23',
  },

  sessionMember: {
    fontSize: 12,
    color: '#606A79',
    marginTop: 6,
  },

  sessionType: {
    fontSize: 11,
    color: '#959DAA',
    marginTop: 5,
  },

  upcomingBadge: {
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  upcomingText: {
    color: '#4F7CFF',
    fontSize: 9,
    fontWeight: '700',
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 27,
  },

  actionCard: {
    width: '48%',
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EEF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 11,
  },

  actionIcon: {
    fontSize: 20,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#151A23',
  },

  actionDescription: {
    fontSize: 11,
    color: '#8D96A4',
    marginTop: 4,
  },

  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  memberAvatar: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#EAF1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  memberAvatarText: {
    color: '#4F7CFF',
    fontSize: 13,
    fontWeight: '700',
  },

  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },

  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151A23',
  },

  memberGoal: {
    fontSize: 11,
    color: '#8C95A3',
    marginTop: 4,
  },

  memberArrow: {
    fontSize: 25,
    color: '#A4ACB8',
  },
});

export default HomePage;
