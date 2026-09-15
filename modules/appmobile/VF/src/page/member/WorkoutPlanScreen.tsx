import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import WorkoutPlan from './WorkoutPlan';
import WorkoutUnPlan from './WorkoutUnPlan';

const WorkoutPlanScreen = ({ navigation, route }: any) => {
  const [goalModeEnabled, setGoalModeEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />

        <Text style={styles.headerTitle}>Chọn kế hoạch tập luyện của bạn</Text>

        <View style={styles.headerPlaceholder} />
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
    backgroundColor: '#F4FAFB',
  },
  header: {
    height: 72,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0F1',
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#11343A',
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerPlaceholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  goalModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    height: 64,

    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#B9E5E9',

    marginBottom: 18,

    elevation: 2,
    shadowColor: '#78959A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },

  goalModeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  goalModeTitle: {
    color: '#11343A',
    fontSize: 16,
    fontWeight: '700',
  },

  expandButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeContainer: {
    flex: 1,
  },
});

export default WorkoutPlanScreen;
