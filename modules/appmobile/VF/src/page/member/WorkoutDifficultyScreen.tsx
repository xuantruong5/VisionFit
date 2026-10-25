
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, StatusBar, ActivityIndicator, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import apiFitlife from '../../general/api';
import LinearGradient from 'react-native-linear-gradient';
const WorkoutDifficultyScreen = ({ navigation, route }: any) => {
  const { goalId, goalName, gender, id_noi_tap, ten_noi_tap, } = route.params || {};
 
  const [difficulties, setDifficulties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDifficulties = async () => {
      try {
        setLoading(true);

        const res = await apiFitlife.get(
          '/client/chuong-trinh-tap/cap-do',
          {
            params: {
              ten_chuong_trinh: goalName?.trim(),
              gioi_tinh_ap_dung: gender,
              id_noi_tap: id_noi_tap,
            },
          },
        );

        const data = res.data?.data || [];

        setDifficulties(data);
      } catch (error: any) {
        console.log(
          'Lỗi lấy cấp độ:',
          error.response?.data || error.message,
        );
        setDifficulties([]);
      } finally {
        setLoading(false);
      }
    };

    if (goalName && gender !== undefined && id_noi_tap !== undefined) {
      fetchDifficulties();
    } else {
      setDifficulties([]);
      setLoading(false);
    }
  }, [goalName, gender, id_noi_tap]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={27} color="#376D88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cấp độ khó</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      <View style={styles.goalSection}>
        <View style={styles.goalCard}>
          <View style={styles.goalIcon}>
            <Ionicons name="flag-outline" size={22} color="#0D7F8D" />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalLabel}>Chương trình của bạn</Text>
            <Text style={styles.goalName}>
              {goalName || 'Chưa chọn chương trình'}
            </Text>
          </View>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#0D7F8D" style={{ marginTop: 40 }} />) : difficulties.length === 0 ? (
            <Text style={styles.emptyText}>
              Không tìm thấy cấp độ cho chương trình này.
            </Text>
          ) : (
          difficulties.map((item, index) => {
            return (
              <TouchableOpacity key={`${item.id_chuong_trinh}-${item.id_cap_do}`} style={styles.card} activeOpacity={0.88}
                onPress={() =>
                  navigation.navigate('WorkoutProgramDetailScreen', {
                    ...route.params,

                    // ID bản ghi chương trình thuộc cấp độ đã chọn
                    goalId: item.id_chuong_trinh,

                    // Thông tin cấp độ
                    capDoId: item.id_cap_do,
                    capDoName: item.ten_cap_do,
                    gender: gender, // 0 = Nam, 1 = Nữ

                    // Thông tin chương trình
                    goalName: item.ten_chuong_trinh,

                    // Nơi tập đã chọn
                    id_noi_tap,
                    ten_noi_tap,

                    // Mô tả và thời lượng của cấp độ
                    mo_ta_chuong_trinh: item.mo_ta_chuong_trinh,
                    so_ngay: item.so_ngay,
                    so_buoi_moi_tuan: item.so_buoi_moi_tuan,
                  })
                }
              >
                <ImageBackground
                  source={item.hinh_anh ? { uri: item.hinh_anh } : undefined}
                  style={styles.cardImage} imageStyle={styles.cardImageStyle}>
                  <LinearGradient
                    colors={[
                      'rgba(0, 55, 75, 0.98)',
                      'rgba(0, 75, 92, 0.90)',
                      'rgba(0, 90, 105, 0.62)',
                      'rgba(0, 100, 115, 0.28)',
                      'rgba(0, 100, 115, 0)',
                    ]}
                    locations={[0, 0.25, 0.5, 0.75, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.blueGradient}
                  />

                  <View style={styles.cardContent}>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                          key={star}
                          name={star <= item.so_sao ? 'star' : 'star-outline'}
                          size={25}
                          color="#08BAC2"
                          style={styles.star}
                        />
                      ))}
                    </View>

                    <Text style={styles.cardTitle}>
                      {item.ten_cap_do}
                    </Text>

                    <Text style={styles.description}>
                      {item.mo_ta_cap_do}
                    </Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
    // backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0F1',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#11343A',
  },
  headerPlaceholder: {
    width: 44,
  },
  goalSection: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9EFF1',
    shadowColor: '#8FAEB2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E3F7F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 13,
    color: '#71949A',
    marginBottom: 3,
    fontWeight: '500',
  },
  goalName: {
    fontSize: 18,
    color: '#11343A',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
  },
  card: {
    width: '100%',
    height: 185,
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#78959A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 5,

  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  blueGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '78%',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    marginRight: 3,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    color: '#F1FAFB',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  emptyText: {
    textAlign: 'center',
    color: '#71949A',
    fontSize: 15,
    marginTop: 40,
  },
});

export default WorkoutDifficultyScreen;
