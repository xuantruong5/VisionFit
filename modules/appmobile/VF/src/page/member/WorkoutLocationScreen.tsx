
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageTextGradient from '../../components/ImageTextGradient';
import apiFitlife from '../../general/api';

const WorkoutLocationScreen = ({ navigation, route }: any) => {
  const { goalId, goalName, gender } = (route.params as any) || {};

  const [noiTapList, setNoiTapList] = useState<{ id: number; ten_noi_tap: string; mo_ta: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  // Ảnh theo giới tính
  const gymImageMale = 'https://images.unsplash.com/photo-1641337221253-fdc7237f6b61?fm=jpg&q=60&w=3000&auto=format&fit=crop';
  const gymImageFemale = 'https://photo.znews.vn/w660/Uploaded/gtnvzv/2024_03_14/gym.jpg';
  const homeImageMale = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSujSVeA5kR_ZONbeZ3emZB_cuq_7ScD-hOusBOLzDeZhCx8KiTkSkr6fw&s=10';
  const homeImageFemale = 'https://media.istockphoto.com/id/1352616555/vi/anh/ng%C6%B0%E1%BB%9Di-ph%E1%BB%A5-n%E1%BB%AF-th%E1%BB%83-thao-t%E1%BA%ADp-th%E1%BB%83-d%E1%BB%A5c-t%E1%BA%A1i-nh%C3%A0.jpg?s=612x612&w=0&k=20&c=qgB4DoAqe9nMYRHhqI7KD3g9qASxXjF5_AN7nQfsgpc=';
  const gymImage = gender === 1 ? gymImageFemale : gymImageMale;
  const homeImage = gender === 1 ? homeImageFemale : homeImageMale;

  // Gọi API lấy danh sách nơi tập
  useEffect(() => {
    const getNoiTap = async () => {
      if (!goalId) {
        setNoiTapList([]);
        setLoading(false);
        return;
      }

      try {
        const response = await apiFitlife.get(
          `/client/chuong-trinh-tap/${goalId}/noi-tap`
        );

        if (response.data.status) {
          setNoiTapList(response.data.data);
        } else {
          setNoiTapList([]);
        }
      } catch (error) {
        console.log('Lỗi lấy nơi tập:', error);
        Alert.alert('Thông báo', 'Không thể tải danh sách nơi tập.');
      } finally {
        setLoading(false);
      }
    };

    getNoiTap();
  }, [goalId]);

  // Chọn nơi tập và chuyển màn hình
  const handleSelectLocation = (noiTap: { id: number; ten_noi_tap: string; mo_ta: string | null; }) => {
    navigation.navigate('WorkoutDifficultyScreen', {
      ...(route.params as any || {}),
      goalId,
      goalName,
      gender,
      id_noi_tap: noiTap.id,
      ten_noi_tap: noiTap.ten_noi_tap,
    });
  };
  // Chọn ảnh theo nơi tập từ API
  const getLocationImage = (noiTap: string) => {
    const location = noiTap.toLowerCase();
    if (location.includes('nhà')) {
      return homeImage;
    }
    return gymImage;
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={27} color="#376D88" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tập luyện ở đâu</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#376D88" />
        ) : noiTapList.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#666' }}>
            Chưa có nơi tập nào.
          </Text>
        ) : (
          noiTapList.map((noiTap) => (
            <TouchableOpacity
              key={noiTap.id}
              style={styles.cardContainer}
              activeOpacity={0.8}
              onPress={() => handleSelectLocation(noiTap)}
            >
              <ImageBackground
                source={{ uri: getLocationImage(noiTap.ten_noi_tap) }}
                style={styles.cardImage}
                imageStyle={styles.cardImageStyle}
              >
                <ImageTextGradient />

                <View style={styles.overlay}>
                  <Text style={styles.cardText}>
                    {noiTap.ten_noi_tap}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))
        )}
      </View>
    </SafeAreaView>
  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FAFB', // Nền ngoài
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    gap: 15,
  },
  cardContainer: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    backgroundColor: '#FFFFFF', // Panel/Card
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#9ED9DF', // Border
    shadowColor: '#D9D7FF', // Shadow tím nhẹ
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
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
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  cardImageStyle: {
    borderRadius: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingLeft: 30,
    borderRadius: 15,
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  }
});

export default WorkoutLocationScreen;
