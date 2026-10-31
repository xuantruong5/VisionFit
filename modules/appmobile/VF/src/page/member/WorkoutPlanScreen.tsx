import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import WorkoutPlan from './WorkoutPlan';
import WorkoutUnPlan from './WorkoutUnPlan';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

const WorkoutPlanScreen = ({ navigation, route }: any) => {
  const [goalModeEnabled, setGoalModeEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.circleLg} />
        <View style={styles.circleSm} />
        <View style={styles.headerRow}>
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerEyebrow}>VISIONFIT</Text>
            <Text style={styles.headerTitle}>Kế hoạch tập luyện</Text>
          </View>
          <TouchableOpacity
            style={styles.aiHeaderBtn}
            onPress={() => navigation.navigate('AiConsultationScreen')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={15} color={COLORS.white} />
            <Text style={styles.aiHeaderBtnText}>AI</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 52,
    borderRadius: 28,
    marginHorizontal: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  circleLg: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -50,
  },
  circleSm: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -25,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#9EE7E5',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 4,
  },
  aiHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  aiHeaderBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
  },
  goalModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: -32,
    marginBottom: 16,
    ...SHADOWS.card,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  goalModeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalModeIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalModeTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  goalModeSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeContainer: {
    flex: 1,
  },
});
