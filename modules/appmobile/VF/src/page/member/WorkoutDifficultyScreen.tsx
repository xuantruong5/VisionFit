import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiFitlife from '../../general/api';
import LinearGradient from 'react-native-linear-gradient';

type DifficultyItem = {
  id_chuong_trinh: number;
  ten_chuong_trinh: string;
  cap_do: string;
  so_sao: number;
};

const difficultyUI: Record<
  string,
  { name: string; description: string; male: string; female: string }
> = {
  CHUA_CO_KINH_NGHIEM: {
    name: 'Chưa có kinh nghiệm',
    description: 'Dành cho người chưa từng tập luyện bao giờ',
    male:
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop',
    female:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop',
  },
  NGUOI_BAT_DAU: {
    name: 'Người bắt đầu',
    description: 'Kinh nghiệm tập dưới 1 năm\n- Tập luyện không thường xuyên',
    male:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop',
    female:
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1469&auto=format&fit=crop',
  },
  NANG_CAO: {
    name: 'Nâng cao',
    description: 'Kinh nghiệm tập hơn 1 năm\n- Tập luyện thường xuyên',
    male:
      'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?q=80&w=1373&auto=format&fit=crop',
    female:
      'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=1631&auto=format&fit=crop',
  },
  CHUYEN_GIA: {
    name: 'Chuyên gia',
    description: 'Kinh nghiệm tập hơn 2 năm\n- Tập luyện thường xuyên',
    male:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
    female:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1520&auto=format&fit=crop',
  },
  PRO: {
    name: 'Pro',
    description: 'Kinh nghiệm tập hơn 3 năm\n- Tập luyện thường xuyên',
    male:
      'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?fm=jpg&q=80&w=1470&auto=format&fit=crop',
    female:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1470&auto=format&fit=crop',
  },
};

const WorkoutDifficultyScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { goalName, gender, noitap, goalMode, nhom_muc_tieu } =
    route.params || {};

  const [difficulties, setDifficulties] = useState<DifficultyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const nhomMucTieu =
    nhom_muc_tieu !== undefined
      ? Number(nhom_muc_tieu)
      : goalMode === false
        ? 0
        : 1;

  const isFemale =
    gender === 'Nữ' ||
    gender === 'female' ||
    gender === 1 ||
    gender === '1';

  useEffect(() => {
    const fetchDifficulties = async () => {
      try {
        setLoading(true);

        const res = await apiFitlife.get('/chuong-trinh-tap/cap-do', {
          params: {
            ten_chuong_trinh: goalName,
            gioi_tinh: gender,
            noi_tap: noitap,
            nhom_muc_tieu: nhomMucTieu,
          },
        });

        setDifficulties(res.data?.data || []);
      } catch (error) {
        console.log('Lỗi lấy cấp độ:', error);
        setDifficulties([]);
      } finally {
        setLoading(false);
      }
    };

    if (goalName && noitap) {
      fetchDifficulties();
    } else {
      setLoading(false);
    }
  }, [goalName, gender, noitap, nhomMucTieu]);

  const handleSelectDifficulty = (item: DifficultyItem) => {
    const ui = difficultyUI[item.cap_do];

    navigation.navigate('WorkoutProgramDetailScreen', {
      ...(route.params || {}),
      goalId: item.id_chuong_trinh,
      goalName: item.ten_chuong_trinh,
      capDo: item.cap_do,
      capDoName: ui?.name || item.cap_do,
    });
  };

  const renderStars = (filled: number) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4].map(star => (
        <Ionicons
          key={star}
          name={star <= filled ? 'star' : 'star-outline'}
          size={25}
          color="#08BAC2"
          style={styles.star}
        />
      ))}
    </View>
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('WorkoutLocationScreen', route.params);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
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
            <Text style={styles.goalLabel}>
              {nhomMucTieu === 1 ? 'Mục tiêu của bạn' : 'Chương trình của bạn'}
            </Text>
            <Text style={styles.goalName}>
              {goalName || 'Chưa chọn chương trình'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0D7F8D"
            style={{ marginTop: 40 }}
          />
        ) : (
          difficulties.map(item => {
            const ui = difficultyUI[item.cap_do];
            const imageUrl = isFemale ? ui?.female : ui?.male;

            return (
              <TouchableOpacity
                key={item.id_chuong_trinh}
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => handleSelectDifficulty(item)}>
                <ImageBackground
                  source={{ uri: imageUrl }}
                  style={styles.cardImage}
                  imageStyle={styles.cardImageStyle}>

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
                    {renderStars(item.so_sao)}

                    <Text style={styles.cardTitle}>
                      {ui?.name || item.cap_do}
                    </Text>

                    <Text style={styles.description}>
                      - {ui?.description || ''}
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
    backgroundColor: '#FFFFFF',
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
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    height: 185,
    marginBottom: 16,
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
});

export default WorkoutDifficultyScreen;
