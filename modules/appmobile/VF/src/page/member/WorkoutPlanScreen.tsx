import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import WorkoutPlan from './WorkoutPlan';
import WorkoutUnPlan from './WorkoutUnPlan';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';

const WorkoutPlanScreen = ({ navigation, route }: any) => {
  const [goalModeEnabled, setGoalModeEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Kế hoạch tập luyện"
        showBack={false}
        rightComponent={
          <TouchableOpacity
            style={styles.aiHeaderBtn}
            onPress={() => navigation.navigate('AiConsultationScreen')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={15} color={COLORS.white} />
            <Text style={styles.aiHeaderBtnText}>AI</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Toggle chế độ mục tiêu */}
        <View style={styles.goalModeHeader}>
          <View style={styles.goalModeTitleRow}>
            <View style={styles.goalModeIconBadge}>
              <Ionicons
                name={goalModeEnabled ? 'flag' : 'apps'}
                size={18}
                color={COLORS.primary}
              />
            </View>
            <View>
              <Text style={styles.goalModeTitle}>Nhóm theo mục tiêu</Text>
              <Text style={styles.goalModeSubtitle}>
                {goalModeEnabled ? 'Đang phân loại theo mục đích tập' : 'Hiển thị tất cả chương trình'}
              </Text>
            </View>
          </View>
          <View style={styles.controlsRow}>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
              ios_backgroundColor={COLORS.borderLight}
              onValueChange={() => setGoalModeEnabled(!goalModeEnabled)}
              value={goalModeEnabled}
            />
            {goalModeEnabled && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>
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

export default WorkoutPlanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  aiHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  aiHeaderBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 5,
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
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  goalModeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalModeIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalModeTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  goalModeSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeContainer: {
    flex: 1,
  },
});
