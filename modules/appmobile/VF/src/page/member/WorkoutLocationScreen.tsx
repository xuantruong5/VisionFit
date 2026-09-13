import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const WorkoutLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { goalId, goalName, gender } = route.params as any || {};
  const handleSelectLocation = (noitap: string) => {
    console.log(`Selected noitap: ${noitap}, gender: ${gender} for goal: ${goalName}`);
  };

  // Define dynamic images based on gender
  const gymImageMale = 'https://images.unsplash.com/photo-1641337221253-fdc7237f6b61?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z3ltJTIwZXhlcmNpc2V8ZW58MHx8MHx8fDA%3D'; 
  const gymImageFemale = 'https://photo.znews.vn/w660/Uploaded/gtnvzv/2024_03_14/gym.jpg'; 
  
  const homeImageMale = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSujSVeA5kR_ZONbeZ3emZB_cuq_7ScD-hOusBOLzDeZhCx8KiTkSkr6fw&s=10'; 
  const homeImageFemale = 'https://media.istockphoto.com/id/1352616555/vi/anh/ng%C6%B0%E1%BB%9Di-ph%E1%BB%A5-n%E1%BB%AF-th%E1%BB%83-thao-t%E1%BA%ADp-th%E1%BB%83-d%E1%BB%A5c-t%E1%BA%A1i-nh%C3%A0.jpg?s=612x612&w=0&k=20&c=qgB4DoAqe9nMYRHhqI7KD3g9qASxXjF5_AN7nQfsgpc='; 

  const gymImage = gender === 'Nữ' ? gymImageFemale : gymImageMale;
  const homeImage = gender === 'Nữ' ? homeImageFemale : homeImageMale;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0D7F8D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tập luyện ở đâu</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.cardContainer} 
          activeOpacity={0.8}
          onPress={() => handleSelectLocation('Phòng gym')}
        >
          <ImageBackground 
            source={{ uri: gymImage }} 
            style={styles.cardImage}
            imageStyle={styles.cardImageStyle}
          >
            <View style={styles.overlay}>
              <Text style={styles.cardText}>Tại gym</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cardContainer} 
          activeOpacity={0.8}
          onPress={() => handleSelectLocation('Tại nhà')}
        >
          <ImageBackground 
            source={{ uri: homeImage }} 
            style={styles.cardImage}
            imageStyle={styles.cardImageStyle}
          >
            <View style={styles.overlay}>
              <Text style={styles.cardText}>Tại nhà </Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF9FB', // Nền ngoài
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40, // Đẩy xuống thêm
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#11343A', // Text chính
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
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
