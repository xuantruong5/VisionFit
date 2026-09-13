import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife, { BASE_URL } from '../../general/api';

type Gender = 'male' | 'female';

const WorkoutPlan = ({ navigation }: any) => {
  const [selectedGender, setSelectedGender] = useState<Gender>('male');
  const [goals, setGoals] = useState<any[]>([]);
  const [isGoalLoading, setIsGoalLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsGoalLoading(true);
      const response = await apiFitlife.get('/chuong-trinh-tap');
      if (response.data.status) {
        setGoals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching workout goals:', error);
    } finally {
      setIsGoalLoading(false);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://i.ibb.co/3s64nKV/placeholder.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}${url}`;
  };

  const currentGoals = goals.filter((goal) => 
    selectedGender === 'male' ? goal.gioi_tinh_ap_dung === 0 : goal.gioi_tinh_ap_dung === 1
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.genderSelector}>
        <TouchableOpacity style={styles.radioContainer} onPress={() => setSelectedGender('male')}>
          <View style={[styles.radioCircle, selectedGender === 'male' && styles.radioCircleSelected]}>
            {selectedGender === 'male' && <View style={styles.radioInnerCircle} />}
          </View>
          <Text style={[styles.radioLabel, selectedGender === 'male' && styles.radioLabelSelected]}>Dành cho nam</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.radioContainer} onPress={() => setSelectedGender('female')}>
          <View style={[styles.radioCircle, selectedGender === 'female' && styles.radioCircleSelected]}>
            {selectedGender === 'female' && <View style={styles.radioInnerCircle} />}
          </View>
          <Text style={[styles.radioLabel, selectedGender === 'female' && styles.radioLabelSelected]}>Dành cho nữ</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.goalList}>
        {isGoalLoading ? (
          <ActivityIndicator size="large" color="#0D7F8D" style={{ marginTop: 50 }} />
        ) : (
          currentGoals.map((goal) => (
            <TouchableOpacity key={goal.id_chuong_trinh} style={styles.goalCard} onPress={() => {}} activeOpacity={0.8}>
              <ImageBackground source={{ uri: getImageUrl(goal.anh_dai_dien) }} style={styles.goalImage} imageStyle={styles.goalImageStyle}>
                <View style={styles.goalCardContent}>
                  <Text style={styles.goalTitle}>{goal.ten_chuong_trinh}</Text>
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
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
    marginBottom: 10,
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
    textShadowRadius: 10,
  },
});

export default WorkoutPlan;
