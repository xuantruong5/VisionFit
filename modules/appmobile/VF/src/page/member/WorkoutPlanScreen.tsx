import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
  ActivityIndicator,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiFitlife, { BASE_URL } from '../../general/api';

type Gender = 'male' | 'female' | 'all';

export interface WorkoutPlan {
  id: number;
  name: string;
  description: string | null;
  goalMode: boolean;
  gender: Gender;
  difficulty: 'Cơ bản' | 'Trung cấp' | 'Nâng cao' | string;
  location: string | null;
  durationDays: number;
  sessionsPerWeek: number;
  coverUrl: string | null;
  status: number;
}

const WorkoutPlanScreen = ({ navigation }: any) => {
  const [goalModeEnabled, setGoalModeEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Goal Mode States
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [goals, setGoals] = useState<any[]>([]);
  const [isGoalLoading, setIsGoalLoading] = useState(true);

  // General Mode States
  const [generalPlans, setGeneralPlans] = useState<WorkoutPlan[]>([]);
  const [isGeneralLoading, setIsGeneralLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tất cả');
  const [selectedLocation, setSelectedLocation] = useState<string>('Tất cả');
  const [selectedGeneralPlanId, setSelectedGeneralPlanId] = useState<number | null>(null);

  useEffect(() => {
    fetchGoals();
    fetchGeneralPlans();
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

  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://i.ibb.co/3s64nKV/placeholder.png'; // Placeholder image
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${BASE_URL}${url}`;
  };

  const toggleSwitch = () => {
    setGoalModeEnabled(previousState => !previousState);
  };

  const currentGoals = goals.filter((goal) => 
    selectedGender === 'male' ? goal.gioi_tinh_ap_dung === 0 : goal.gioi_tinh_ap_dung === 1
  );

  // Filter General Plans
  const filteredGeneralPlans = generalPlans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (plan.location && plan.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLevel = selectedLevel === 'Tất cả' || plan.difficulty === selectedLevel;
    const matchesLocation = selectedLocation === 'Tất cả' || 
                            (plan.location && plan.location.toLowerCase().includes(selectedLocation.toLowerCase())) ||
                            (plan.location === 'Mọi nơi');
    
    return matchesSearch && matchesLevel && matchesLocation;
  });

  const handleUsePlan = () => {
    if (selectedGeneralPlanId) {
       // Navigate logic here
    }
  };

  const renderGeneralPlan = ({ item }: { item: WorkoutPlan }) => {
    const isSelected = selectedGeneralPlanId === item.id;
    return (
      <TouchableOpacity
        style={[styles.generalCard, isSelected && styles.generalCardSelected]}
        activeOpacity={0.8}
        onPress={() => setSelectedGeneralPlanId(item.id)}
      >
        <Image 
           source={{ uri: getImageUrl(item.coverUrl) }} 
           style={styles.generalCardImage} 
        />
        <View style={styles.generalCardContent}>
          <Text style={styles.generalCardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.generalCardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.generalCardMeta}>
            <View style={styles.badgeLevel}>
              <Text style={styles.badgeLevelText}>{item.difficulty}</Text>
            </View>
            <Text style={styles.metaText}> • {item.location}</Text>
          </View>
          <Text style={styles.metaText}>{item.durationDays} ngày • {item.sessionsPerWeek} buổi/tuần</Text>
        </View>
        {isSelected && (
          <View style={styles.checkIconContainer}>
            <Ionicons name="checkmark-circle" size={28} color="#0D7F8D" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lựa chọn kế hoạch tập của bạn</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} stickyHeaderIndices={[]}>
        
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
              name={goalModeEnabled ? (isExpanded ? "chevron-up" : "chevron-down") : "remove"}
              size={24}
              color={goalModeEnabled ? "#0D7F8D" : "#71949A"}
            />
          </TouchableOpacity>
        </View>

        {/* --- GOAL MODE CONTENT --- */}
        {goalModeEnabled && isExpanded && (
          <View style={styles.expandedContent}>
            {/* Gender Selector */}
            <View style={styles.genderSelector}>
              <TouchableOpacity
                style={styles.radioContainer}
                onPress={() => setSelectedGender('male')}
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
                onPress={() => setSelectedGender('female')}
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
              {isGoalLoading ? (
                <ActivityIndicator size="large" color="#0D7F8D" style={{ marginTop: 50 }} />
              ) : (
                currentGoals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id_chuong_trinh}
                    style={styles.goalCard}
                    onPress={() => {}} 
                    activeOpacity={0.8}
                  >
                    <ImageBackground
                      source={{ uri: getImageUrl(goal.anh_dai_dien) }}
                      style={styles.goalImage}
                      imageStyle={styles.goalImageStyle}
                    >
                      <View style={styles.goalCardContent}>
                        <Text style={styles.goalTitle}>{goal.ten_chuong_trinh}</Text>
                        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* --- GENERAL MODE CONTENT --- */}
        {!goalModeEnabled && (
          <View style={styles.generalContent}>
            <Text style={styles.sectionTitle}>Tất cả kế hoạch tập</Text>
            <Text style={styles.sectionDesc}>Chương trình tập luyện phù hợp cho cả Nam và Nữ</Text>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#71949A" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Tìm kế hoạch tập..."
                placeholderTextColor="#71949A"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Level Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {['Tất cả', 'Cơ bản', 'Trung cấp', 'Nâng cao'].map((level) => (
                <TouchableOpacity 
                  key={level} 
                  style={[styles.filterPill, selectedLevel === level && styles.filterPillActive]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Text style={[styles.filterPillText, selectedLevel === level && styles.filterPillTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Location Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, { marginBottom: 20 }]}>
              {['Tất cả', 'Phòng gym', 'Tại nhà', 'Mọi nơi'].map((loc) => (
                <TouchableOpacity 
                  key={loc} 
                  style={[styles.filterPill, selectedLocation === loc && styles.filterPillActive]}
                  onPress={() => setSelectedLocation(loc)}
                >
                  <Text style={[styles.filterPillText, selectedLocation === loc && styles.filterPillTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isGeneralLoading ? (
              <ActivityIndicator size="large" color="#0D7F8D" style={{ marginTop: 50 }} />
            ) : filteredGeneralPlans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có kế hoạch tập phù hợp</Text>
                <TouchableOpacity style={styles.reloadBtn} onPress={fetchGeneralPlans}>
                  <Text style={styles.reloadBtnText}>Thử tải lại</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList 
                data={filteredGeneralPlans}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGeneralPlan}
                scrollEnabled={false} 
                ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Button for General Mode */}
      {!goalModeEnabled && (
        <View style={styles.bottomAction}>
          <TouchableOpacity 
            style={[styles.actionButton, !selectedGeneralPlanId && styles.actionButtonDisabled]}
            disabled={!selectedGeneralPlanId}
            onPress={handleUsePlan}
          >
            <Text style={styles.actionButtonText}>SỬ DỤNG KẾ HOẠCH NÀY</Text>
          </TouchableOpacity>
        </View>
      )}

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
  
  // General Mode Styles
  generalContent: {
    flex: 1,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#11343A',
    marginBottom: 5,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#71949A',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#9ED9DF',
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#11343A',
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#9ED9DF',
    marginRight: 10,
  },
  filterPillActive: {
    backgroundColor: '#0D7F8D',
    borderColor: '#0D7F8D',
  },
  filterPillText: {
    fontSize: 14,
    color: '#71949A',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // Card General
  generalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#9ED9DF',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#D9D7FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  generalCardSelected: {
    borderColor: '#0D7F8D',
  },
  generalCardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  generalCardContent: {
    padding: 15,
  },
  generalCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#11343A',
    marginBottom: 4,
  },
  generalCardDesc: {
    fontSize: 13,
    color: '#71949A',
    marginBottom: 10,
    lineHeight: 18,
  },
  generalCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  badgeLevel: {
    backgroundColor: '#DFF6F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeLevelText: {
    fontSize: 12,
    color: '#075E68',
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 13,
    color: '#71949A',
  },
  checkIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
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
  
  // Bottom Action
  bottomAction: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
  },
  actionButton: {
    backgroundColor: '#0D7F8D',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0D7F8D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  actionButtonDisabled: {
    backgroundColor: '#9ED9DF',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorkoutPlanScreen;
