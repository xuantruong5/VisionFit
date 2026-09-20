import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, ImageBackground, ScrollView, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife, { BASE_URL } from '../../general/api';

export interface WorkoutPlanType {
  id: number;
  name: string;
  description: string | null;
  difficulty: string;
  location: string | null;
  durationDays: number;
  sessionsPerWeek: number;
  coverUrl: string | null;
  stars: number;
}

const levelOptions = [
  { label: 'Chưa có kinh nghiệm', value: 'CHUA_CO_KINH_NGHIEM' },
  { label: 'Người bắt đầu', value: 'NGUOI_BAT_DAU' },
  { label: 'Nâng cao', value: 'NANG_CAO' },
  { label: 'Chuyên gia', value: 'CHUYEN_GIA' },
  { label: 'Pro', value: 'PRO' },
];

const getLevelLabel = (value: string) => {
  return levelOptions.find(item => item.value === value)?.label || value;
};

const getImageUrl = (url: string | null) => {
  if (!url) return 'https://i.ibb.co/3s64nKV/placeholder.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url}`;
};

const renderStars = (filled: number) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4].map(star => (
      <Ionicons
        key={star}
        name={star <= filled ? 'star' : 'star-outline'}
        size={12}
        color="#08BAC2"
        style={styles.star}
      />
    ))}
  </View>
);

const WorkoutUnPlan = ({ navigation }: any) => {
  const [generalPlans, setGeneralPlans] = useState<WorkoutPlanType[]>([]);
  const [isGeneralLoading, setIsGeneralLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('Tại nhà');

  useEffect(() => {
    fetchGeneralPlans();
  }, []);

  const fetchGeneralPlans = async () => {
    try {
      setIsGeneralLoading(true);
      const response = await apiFitlife.get('/chuong-trinh-tap/khong-muc-tieu');
      if (response.data.success) {
        setGeneralPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching general plans:', error);
    } finally {
      setIsGeneralLoading(false);
    }
  };

  const handleSelectLevel = (levelItem: WorkoutPlanType) => {
    navigation.navigate('WorkoutProgramDetailScreen', {
      goalId: levelItem.id,
      goalName: levelItem.name,
      capDo: levelItem.difficulty,
      capDoName: getLevelLabel(levelItem.difficulty),
      noitap: selectedLocation,
      goalMode: false,
    });
  };

  const filteredGeneralPlans = generalPlans.filter(
    (plan) => plan.location === selectedLocation
  );

  const groupedPlans = Object.values(
    filteredGeneralPlans.reduce((acc, plan) => {
      if (!acc[plan.name]) {
        acc[plan.name] = {
          name: plan.name,
          description: plan.description,
          coverUrl: plan.coverUrl,
          levels: [],
        };
      }
      acc[plan.name].levels.push(plan);
      return acc;
    }, {} as Record<string, { name: string; description: string | null; coverUrl: string | null; levels: WorkoutPlanType[] }>)
  );

  const renderGroup = ({ item }: { item: any }) => {
    // Sort levels by stars
    const sortedLevels = [...item.levels].sort((a, b) => a.stars - b.stars);

    return (
      <View style={styles.groupCard}>
        <ImageBackground source={{ uri: getImageUrl(item.coverUrl) }} style={styles.groupHeader} imageStyle={styles.groupHeaderImage}>
          <View style={[styles.blueGradient, { backgroundColor: 'rgba(0, 35, 55, 0.65)' }]} />
          <View style={styles.groupHeaderContent}>
            <Text style={styles.groupTitle}>{item.name}</Text>
            <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text>
          </View>
        </ImageBackground>

        <View style={styles.levelsContainer}>
          <Text style={styles.levelsTitle}>Chọn cấp độ:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelsScroll}>
            {sortedLevels.map((level: WorkoutPlanType) => (
              <TouchableOpacity key={level.id} style={styles.levelBox} activeOpacity={0.8} onPress={() => handleSelectLevel(level)}>
                {renderStars(level.stars)}
                <Text style={styles.levelName}>{getLevelLabel(level.difficulty)}</Text>
                <View style={styles.levelMetaRow}>
                  <Ionicons name="time-outline" size={12} color="#71949A" />
                  <Text style={styles.levelMeta}>{level.durationDays} ngày</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Location Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, selectedLocation === 'Tại nhà' && styles.tabBtnActive]}
          onPress={() => setSelectedLocation('Tại nhà')}>
          <Ionicons name="home-outline" size={18} color={selectedLocation === 'Tại nhà' ? '#FFFFFF' : '#71949A'} />
          <Text style={[styles.tabText, selectedLocation === 'Tại nhà' && styles.tabTextActive]}>Tại nhà</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedLocation === 'Phòng gym' && styles.tabBtnActive]}
          onPress={() => setSelectedLocation('Phòng gym')}>
          <Ionicons name="barbell-outline" size={18} color={selectedLocation === 'Phòng gym' ? '#FFFFFF' : '#71949A'} />
          <Text style={[styles.tabText, selectedLocation === 'Phòng gym' && styles.tabTextActive]}>Phòng gym</Text>
        </TouchableOpacity>
      </View>

      {isGeneralLoading ? (
        <ActivityIndicator size="large" color="#0D7F8D" style={{ marginTop: 50 }} />
      ) : groupedPlans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có kế hoạch tập phù hợp</Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={fetchGeneralPlans}>
            <Text style={styles.reloadBtnText}>Thử tải lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList 
          data={groupedPlans} 
          keyExtractor={(item) => item.name} 
          renderItem={renderGroup} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 20 }} />} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FAFB',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 15,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7E8EB',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#0D7F8D',
    borderColor: '#0D7F8D',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71949A',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#8FAEB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  groupHeader: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
  },
  groupHeaderImage: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  blueGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  groupHeaderContent: {
    padding: 15,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  groupDesc: {
    fontSize: 12,
    color: '#DFF6F8',
    lineHeight: 16,
  },
  levelsContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  levelsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#11343A',
    marginLeft: 15,
    marginBottom: 10,
  },
  levelsScroll: {
    paddingHorizontal: 15,
    gap: 12,
  },
  levelBox: {
    width: 130,
    backgroundColor: '#F4FAFB',
    borderWidth: 1,
    borderColor: '#D9EFF1',
    borderRadius: 10,
    padding: 10,
    marginRight: 12,
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  star: {
    marginRight: 2,
  },
  levelName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D7F8D',
    marginBottom: 6,
  },
  levelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelMeta: {
    fontSize: 11,
    color: '#71949A',
    fontWeight: '500',
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
