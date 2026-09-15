import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, FlatList, Image, ScrollView, StyleSheet } from 'react-native';
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
}

const WorkoutUnPlan = ({ navigation }: any) => {
  const [generalPlans, setGeneralPlans] = useState<WorkoutPlanType[]>([]);
  const [isGeneralLoading, setIsGeneralLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tất cả');
  const [selectedLocation, setSelectedLocation] = useState<string>('Tất cả');
  const [selectedGeneralPlanId, setSelectedGeneralPlanId] = useState<number | null>(null);

  const levelOptions = [
    { label: 'Tất cả', value: 'Tất cả' },
    { label: 'Chưa có kinh nghiệm', value: 'CHUA_CO_KINH_NGHIEM' },
    { label: 'Người bắt đầu', value: 'NGUOI_BAT_DAU' },
    { label: 'Nâng cao', value: 'NANG_CAO' },
    { label: 'Chuyên gia', value: 'CHUYEN_GIA' },
    { label: 'Pro', value: 'PRO' },
  ];

  const locationOptions = [
    'Tất cả',
    'Phòng gym',
    'Tại nhà',
  ];

  const getLevelLabel = (value: string) => {
    return levelOptions.find(item => item.value === value)?.label || value;
  };

  const [showLevel, setShowLevel] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
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

  const getImageUrl = (url: string | null) => {
    if (!url) return 'https://i.ibb.co/3s64nKV/placeholder.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}${url}`;
  };

  const filteredGeneralPlans = generalPlans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (plan.location && plan.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLevel =
      selectedLevel === 'Tất cả' ||
      plan.difficulty === selectedLevel;

    const matchesLocation =
      selectedLocation === 'Tất cả' ||
      plan.location === selectedLocation;
    return matchesSearch && matchesLevel && matchesLocation;
  });

  const handleUsePlan = () => {
    if (selectedGeneralPlanId) {
      // navigation logic
    }
  };

  const renderGeneralPlan = ({ item }: { item: WorkoutPlanType }) => {
    const isSelected = selectedGeneralPlanId === item.id;
    return (
      <TouchableOpacity style={[styles.generalCard, isSelected && styles.generalCardSelected]} activeOpacity={0.8} onPress={() => setSelectedGeneralPlanId(item.id)}>
        <Image source={{ uri: getImageUrl(item.coverUrl) }} style={styles.generalCardImage} />
        <View style={styles.generalCardContent}>
          <Text style={styles.generalCardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.generalCardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.generalCardMeta}>
            <View style={styles.badgeLevel}>
              <Text style={styles.badgeLevelText}>
                {getLevelLabel(item.difficulty)}
              </Text>
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Tất cả kế hoạch tập</Text>
        <Text style={styles.sectionDesc}>Chương trình tập luyện phù hợp cho cả Nam và Nữ</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#71949A" />
          <TextInput style={styles.searchInput} placeholder="Tìm kế hoạch tập..." placeholderTextColor="#71949A" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <View style={styles.selectRow}>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => {
              setShowLevel(!showLevel);
              setShowLocation(false);
            }}>
            <View>
              <Text style={styles.selectLabel}>Cấp độ</Text>
              <Text style={styles.selectValue} numberOfLines={1}>
                {getLevelLabel(selectedLevel)}
              </Text>
            </View>

            <Ionicons
              name={showLevel ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#0D7F8D"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => {
              setShowLocation(!showLocation);
              setShowLevel(false);
            }}>
            <View>
              <Text style={styles.selectLabel}>Nơi tập</Text>
              <Text style={styles.selectValue} numberOfLines={1}>
                {selectedLocation}
              </Text>
            </View>

            <Ionicons
              name={showLocation ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#0D7F8D"
            />
          </TouchableOpacity>
        </View>

        {showLevel && (
          <View style={styles.optionBox}>
            {levelOptions.map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.optionItem}
                onPress={() => {
                  setSelectedLevel(item.value);
                  setShowLevel(false);
                }}>
                <Text style={styles.optionText}>
                  {item.label}
                </Text>

                {selectedLevel === item.value && (
                  <Ionicons name="checkmark" size={18} color="#0D7F8D" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showLocation && (
          <View style={styles.optionBox}>
            {locationOptions.map(item => (
              <TouchableOpacity
                key={item}
                style={styles.optionItem}
                onPress={() => {
                  setSelectedLocation(item);
                  setShowLocation(false);
                }}>
                <Text style={styles.optionText}>
                  {item}
                </Text>

                {selectedLocation === item && (
                  <Ionicons name="checkmark" size={18} color="#0D7F8D" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

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
          <FlatList data={filteredGeneralPlans} keyExtractor={(item) => item.id.toString()} renderItem={renderGeneralPlan} scrollEnabled={false} ItemSeparatorComponent={() => <View style={{ height: 15 }} />} />
        )}
      </ScrollView>

      <View style={styles.bottomAction}>
        <TouchableOpacity style={[styles.actionButton, !selectedGeneralPlanId && styles.actionButtonDisabled]} disabled={!selectedGeneralPlanId} onPress={handleUsePlan}>
          <Text style={styles.actionButtonText}>SỬ DỤNG KẾ HOẠCH NÀY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  bottomAction: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
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

  selectRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 14,
},

selectBox: {
  flex: 1,
  height: 50,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#C7E8EB',
  borderRadius: 14,
  paddingHorizontal: 14,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  elevation: 1,
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 1},
  shadowOpacity: 0.06,
  shadowRadius: 3,
},

selectLabel: {
  fontSize: 10,
  color: '#71949A',
  marginBottom: 1,
},

selectValue: {
  fontSize: 13,
  fontWeight: '700',
  color: '#11343A',
  maxWidth: 125,
},

optionBox: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#9ED9DF',
  borderRadius: 12,
  padding: 5,
  marginBottom: 12,
},

optionItem: {
  height: 40,
  paddingHorizontal: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

optionText: {
  fontSize: 14,
  color: '#11343A',
},
});

export default WorkoutUnPlan;
