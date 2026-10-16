
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ImageBackground, ScrollView, StyleSheet, } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife from '../../general/api';
import ImageTextGradient from '../../components/ImageTextGradient';

type Gender = 'male' | 'female';

const WorkoutUnPlan = ({ navigation, route }: any) => {
  const [selectedGender, setSelectedGender] = useState<Gender>('male');
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const response = await apiFitlife.get(
        '/client/chuong-trinh-tap/khong-muc-tieu',
        {
          params: {
            gioi_tinh_ap_dung: selectedGender === 'male' ? 0 : 1,
          },
        }
      );
      if (response.data.status === true) {
        setGoals(response.data.data);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Lỗi lấy chương trình tập không mục tiêu:', error);
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchGoals();
  }, [selectedGender]);
  
  const handleSelectGoal = (goal: any) => {
    navigation.navigate('WorkoutLocationScreen', {
      ...(route?.params || {}),
      goalId: goal.id,
      goalName: goal.ten_chuong_trinh,
      gender: selectedGender === 'male' ? 'Nam' : 'Nữ',
      goalMode: false,
    });
  };
  const currentGoals = goals;
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Chọn giới tính */}
      <View style={styles.genderSelector}>
        <TouchableOpacity style={styles.radioContainer} onPress={() => setSelectedGender('male')} >
          <View style={[styles.radioCircle, selectedGender === 'male' && styles.radioCircleSelected,]} >
            {selectedGender === 'male' && (
              <View style={styles.radioInnerCircle} />
            )}
          </View>
          <Text style={[styles.radioLabel, selectedGender === 'male' && styles.radioLabelSelected,]} >
            Dành cho nam
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.radioContainer} onPress={() => setSelectedGender('female')} >
          <View style={[styles.radioCircle, selectedGender === 'female' && styles.radioCircleSelected,]} >
            {selectedGender === 'female' && (
              <View style={styles.radioInnerCircle} />
            )}
          </View>

          <Text style={[styles.radioLabel, selectedGender === 'female' && styles.radioLabelSelected,]} >
            Dành cho nữ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách chương trình */}
      <View style={styles.goalList}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0D7F8D" style={{ marginTop: 50 }} />
        ) : currentGoals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Chưa có chương trình tập phù hợp
            </Text>
            <TouchableOpacity style={styles.reloadBtn} onPress={fetchGoals} >
              <Text style={styles.reloadBtnText}>Thử tải lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          currentGoals.map((goal) => (
            <TouchableOpacity key={goal.id} style={styles.goalCard} onPress={() => handleSelectGoal(goal)} activeOpacity={0.8} >
              <ImageBackground source={{ uri: goal.anh_dai_dien }} style={styles.goalImage} imageStyle={styles.goalImageStyle} >
                <ImageTextGradient />

                <View style={styles.goalCardContent}>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>
                      {goal.ten_chuong_trinh}
                    </Text>

                    <View style={styles.goalMeta}>
                      <Ionicons name="barbell-outline" size={15} color="#FFFFFF" />

                      <Text style={styles.goalMetaText}>
                        {goal.noi_tap}
                      </Text>

                      <View style={styles.goalStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={
                              star <= Number(goal.so_sao)
                                ? 'star'
                                : 'star-outline'
                            }
                            size={15}
                            color="#FFFFFF"
                          />
                        ))}
                      </View>

                      <Text style={styles.goalMetaText}>
                        {Number(goal.so_sao) === 0
                          ? 'Chưa có kinh nghiệm'
                          : Number(goal.so_sao) <= 2
                            ? 'Người mới'
                            : Number(goal.so_sao) <= 3
                              ? 'Trung cấp'
                              : 'Nâng cao'}
                      </Text>
                    </View>

                    <Text style={styles.goalDuration}>
                      {goal.so_ngay} ngày tập luyện (
                      {goal.so_buoi_moi_tuan} buổi mỗi tuần)
                    </Text>
                  </View>

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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  goalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  goalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  goalMetaText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  goalStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  goalDuration: {
    color: '#20D6D0',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#71949A',
    marginBottom: 15,
  },
  reloadBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0D7F8D',
  },
  reloadBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default WorkoutUnPlan;
