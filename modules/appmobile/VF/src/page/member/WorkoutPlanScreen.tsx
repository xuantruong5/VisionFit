import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import WorkoutPlan from './WorkoutPlan';
import WorkoutUnPlan from './WorkoutUnPlan';

const WorkoutPlanScreen = ({ navigation, route }: any) => {
  const [goalModeEnabled, setGoalModeEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lựa chọn kế hoạch tập của bạn</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.goalModeHeader}>
          <View style={styles.goalModeTitleRow}>
            <Text style={styles.goalModeTitle}>Nhóm theo mục tiêu</Text>
            <Switch
              trackColor={{ false: '#9ED9DF', true: '#0D7F8D' }}
              thumbColor={goalModeEnabled ? '#FFFFFF' : '#EAF9FB'}
              ios_backgroundColor="#EAF9FB"
              onValueChange={() => setGoalModeEnabled(!goalModeEnabled)}
              value={goalModeEnabled}
            />
          </View>
          <TouchableOpacity style={styles.expandButton} onPress={() => setIsExpanded(!isExpanded)} disabled={!goalModeEnabled}>
            <Ionicons name={goalModeEnabled ? (isExpanded ? "chevron-up" : "chevron-down") : "remove"} size={24} color={goalModeEnabled ? "#0D7F8D" : "#71949A"} />
          </TouchableOpacity>
        </View>

        <View style={styles.modeContainer}>
          {goalModeEnabled ? (
            isExpanded ? <WorkoutPlan navigation={navigation} route={route} /> : null
          ) : (
            <WorkoutUnPlan navigation={navigation} route={route} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF9FB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 45, // Đẩy xuống thêm giống màn hình trước
    paddingBottom: 15,
  },
  title: {
    color: '#075E68',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  goalModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9ED9DF',
    elevation: 5,
    shadowColor: '#D9D7FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  goalModeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalModeTitle: {
    color: '#11343A',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  expandButton: {
    padding: 5,
  },
  modeContainer: {
    flex: 1,
  },
});

export default WorkoutPlanScreen;
