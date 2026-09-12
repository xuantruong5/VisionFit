import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Gender = 'male' | 'female';

type WorkoutGoal = {
  id: string;
  title: string;
  gender: Gender;
  image: ImageSourcePropType;
};

const maleGoals: WorkoutGoal[] = [
  { id: 'm1', title: 'Tăng cơ bắp', gender: 'male', image: require('../../assets/goals/nam1.jpeg') },
  { id: 'm2', title: 'Tay to khỏe', gender: 'male', image: require('../../assets/goals/nam2.jpeg') },
  { id: 'm3', title: 'Ngực vạm vỡ', gender: 'male', image: require('../../assets/goals/nam3.jpeg') },
  { id: 'm4', title: 'Lưng rộng', gender: 'male', image: require('../../assets/goals/nam4.jpeg') },
  { id: 'm5', title: 'Vai rộng', gender: 'male', image: require('../../assets/goals/nam5.jpeg') },
  { id: 'm6', title: 'Chân chắc khỏe', gender: 'male', image: require('../../assets/goals/nam6.jpeg') },
  { id: 'm7', title: 'Giảm cân', gender: 'male', image: require('../../assets/goals/nam7.jpeg') },
  { id: 'm8', title: 'Cơ thể sắc nét', gender: 'male', image: require('../../assets/goals/nam8.jpeg') },
  { id: 'm9', title: 'Cơ bụng 6 múi', gender: 'male', image: require('../../assets/goals/nam9.jpeg') },
  { id: 'm10', title: 'Powerlifting', gender: 'male', image: require('../../assets/goals/nam10.jpeg') },
  { id: 'm11', title: 'Crossfit', gender: 'male', image: require('../../assets/goals/nam11.jpeg') },
  { id: 'm12', title: 'Tập toàn thân 45 phút', gender: 'male', image: require('../../assets/goals/nam12.jpeg') },
];

const femaleGoals: WorkoutGoal[] = [
  { id: 'f1', title: 'Giảm cân', gender: 'female', image: require('../../assets/goals/nu1.jpeg') },
  { id: 'f2', title: 'Cơ thể sắc nét', gender: 'female', image: require('../../assets/goals/nu2.jpeg') },
  { id: 'f3', title: 'Vòng ba hoàn hảo', gender: 'female', image: require('../../assets/goals/nu3.jpeg') },
  { id: 'f4', title: 'Cơ bụng 6 múi', gender: 'female', image: require('../../assets/goals/nu4.jpeg') },
  { id: 'f5', title: 'Tăng cơ bắp', gender: 'female', image: require('../../assets/goals/nu5.jpeg') },
  { id: 'f6', title: 'Powerlifting', gender: 'female', image: require('../../assets/goals/nu6.jpeg') },
  { id: 'f7', title: 'Crossfit', gender: 'female', image: require('../../assets/goals/nu7.jpeg') },
  { id: 'f8', title: 'Tập toàn thân 45 phút', gender: 'female', image: require('../../assets/goals/nu8.jpeg') },
  { id: 'f9', title: 'Phục hồi sau sinh', gender: 'female', image: require('../../assets/goals/nu9.jpeg') },
];

const WorkoutPlanScreen = ({ navigation }: any) => {
  const [goalModeEnabled, setGoalModeEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedGender, setSelectedGender] = useState<Gender>('male');

  const toggleSwitch = () => setGoalModeEnabled(previousState => !previousState);

  const handleGenderChange = (gender: Gender) => {
    setSelectedGender(gender);
  };

  const handleGoalPress = (goalId: string) => {
    // Navigate immediately to the next screen when a goal is pressed
    // navigation.navigate('WorkoutBuilder', { gender: selectedGender, goalId });
  };

  const currentGoals = selectedGender === 'male' ? maleGoals : femaleGoals;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lựa chọn kế hoạch tập của bạn</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Goal Mode Header */}
        <View style={styles.goalModeHeader}>
          <View style={styles.goalModeTitleRow}>
            <Text style={styles.goalModeTitle}>Nhóm theo mục tiêu</Text>
            <Switch
              trackColor={{ false: '#9ED9DF', true: '#0D7F8D' }}
              thumbColor={goalModeEnabled ? '#FFFFFF' : '#EAF9FB'}
              ios_backgroundColor="#EAF9FB"
              onValueChange={toggleSwitch}
              value={goalModeEnabled}
            />
          </View>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
            disabled={!goalModeEnabled}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={goalModeEnabled ? "#0D7F8D" : "#71949A"}
            />
          </TouchableOpacity>
        </View>

        {/* Content area */}
        {goalModeEnabled && isExpanded && (
          <View style={styles.expandedContent}>
            {/* Gender Selector */}
            <View style={styles.genderSelector}>
              <TouchableOpacity
                style={styles.radioContainer}
                onPress={() => handleGenderChange('male')}
              >
                <View style={[styles.radioCircle, selectedGender === 'male' && styles.radioCircleSelected]}>
                  {selectedGender === 'male' && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={[styles.radioLabel, selectedGender === 'male' && styles.radioLabelSelected]}>
                  Dành cho nam
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioContainer}
                onPress={() => handleGenderChange('female')}
              >
                <View style={[styles.radioCircle, selectedGender === 'female' && styles.radioCircleSelected]}>
                  {selectedGender === 'female' && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={[styles.radioLabel, selectedGender === 'female' && styles.radioLabelSelected]}>
                  Dành cho nữ
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.goalList}>
              {currentGoals.map((goal) => {
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={styles.goalCard}
                    onPress={() => handleGoalPress(goal.id)}
                    activeOpacity={0.8}
                  >
                    <ImageBackground
                      source={goal.image}
                      style={styles.goalImage}
                      imageStyle={styles.goalImageStyle}
                    >
                      <View style={styles.goalCardContent}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        {/* Biểu tượng chuyển trang thay vì dấu tích */}
                        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        )}

      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    color: '#075E68',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Extra padding for bottom navigation
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
  expandedContent: {
    flex: 1,
  },
  genderSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ED9DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: '#0D7F8D',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D7F8D',
  },
  radioLabel: {
    color: '#71949A',
    fontSize: 16,
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: '#0D7F8D',
    fontWeight: 'bold',
  },
  goalList: {
    marginBottom: 30,
  },
  goalCard: {
    width: '100%',
    aspectRatio: 2.6,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#D9D7FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  goalImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  goalImageStyle: {
    resizeMode: 'cover',
  },
  gradientOverlay: {
    ...(StyleSheet.absoluteFill as any),
  },
  goalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 15,
    height: '100%',
  },
  goalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    maxWidth: '80%',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
});

export default WorkoutPlanScreen;
