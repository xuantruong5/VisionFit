import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ExerciseFilterModal from './ExerciseFilterModal';

interface ExerciseListScreenProps {
  navigation: any;
  route: any;
}

const EXERCISE_DATA: { [key: string]: any[] } = {
  chest: [
    {
      id: 1,
      name: 'Bài fly ép ngực với máy',
      englishName: 'Seated cable fly',
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
      description: 'Tiếng Anh là Seated cable fly. Đây là một bài tập giúp bạn tập trung phát triển hai nhóm cơ ngực lớn một cách riêng biệt. Chuyển động của bài tập này là tự nhiên đối với các cơ ngực lớn vì chức năng chính của chúng là dùng để kết hợp hai tay lại với nhau.',
      musclesDistribution: [
        { name: 'Ngực', percent: 80, color: '#EF4444' },
        { name: 'Cơ delta trước', percent: 45, color: '#8B5CF6' },
        { name: 'Đầu xương đòn của cơ ngực lớn', percent: 70, color: '#3B82F6' },
        { name: 'Đầu ức sườn của cơ ngực lớn', percent: 85, color: '#EF4444' },
        { name: 'Cơ ngực bé', percent: 60, color: '#10B981' },
      ],
    },
    {
      id: 2,
      name: 'Bài tập Xà kép có dây kháng lực hỗ trợ',
      englishName: 'Band-assisted chest dips',
      image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=400&q=80',
      description: 'Bài tập phát triển cơ ngực dưới và tay sau hiệu quả, sử dụng dây kháng lực để giảm tải trọng cơ thể cho người mới bắt đầu hoặc hoàn thiện kỹ thuật.',
      musclesDistribution: [
        { name: 'Ngực dưới', percent: 75, color: '#EF4444' },
        { name: 'Cơ tay sau', percent: 65, color: '#8B5CF6' },
        { name: 'Cơ vai trước', percent: 40, color: '#3B82F6' },
      ],
    },
    {
      id: 3,
      name: 'Bài tập chống đẩy sử dụng dây tập đàn hồi',
      englishName: 'Resisted push-ups',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
      description: 'Gia tăng áp lực lên toàn bộ nhóm cơ ngực và cơ lõi (core) ở điểm đỉnh của chuyển động nhờ lực đàn hồi của dây kháng lực.',
      musclesDistribution: [
        { name: 'Toàn bộ ngực', percent: 70, color: '#EF4444' },
        { name: 'Cơ tay sau', percent: 50, color: '#8B5CF6' },
        { name: 'Cơ bụng (Core)', percent: 45, color: '#10B981' },
      ],
    },
    {
      id: 4,
      name: 'Bài tập cơ ngực dưới cùng xà kép',
      englishName: 'Parallel bar chest dips',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
      description: 'Động tác tạo nét cắt ngực dưới sắc nét, phát triển cơ ngực toàn diện và sức mạnh thân trên.',
      musclesDistribution: [
        { name: 'Ngực dưới', percent: 85, color: '#EF4444' },
        { name: 'Cơ tay sau', percent: 70, color: '#8B5CF6' },
      ],
    },
    {
      id: 5,
      name: 'Bài tập cơ ngực trên với tạ đơn trên ghế nghiêng 45 độ',
      englishName: 'Incline dumbbell bench press',
      image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80',
      description: 'Tập trung kích thích phần cơ ngực trên (xương đòn) giúp ngực đầy đặn và dày hơn từ góc nhìn chính diện.',
      musclesDistribution: [
        { name: 'Ngực trên', percent: 90, color: '#EF4444' },
        { name: 'Cơ vai trước', percent: 55, color: '#8B5CF6' },
      ],
    },
    {
      id: 6,
      name: 'Bài tập gập người kéo cáp tập ngực',
      englishName: 'Standing cable crossover',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
      description: 'Duy trì lực căng liên tục trên toàn bộ sợi cơ ngực từ điểm giãn nhất đến khi ép chặt hai tay vào nhau.',
      musclesDistribution: [
        { name: 'Ngực giữa & khe ngực', percent: 85, color: '#EF4444' },
        { name: 'Cơ vai trước', percent: 40, color: '#3B82F6' },
      ],
    },
  ],
  back: [
    {
      id: 11,
      name: 'Bài tập Kéo xô dài trên máy',
      englishName: 'Lat pulldown machine',
      image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=400&q=80',
      description: 'Xây dựng độ rộng của lưng xô (V-taper), tác động mạnh mẽ vào cơ lưng xô (Lats) và cơ trám (Rhomboids).',
      musclesDistribution: [
        { name: 'Cơ lưng xô (Lats)', percent: 90, color: '#EF4444' },
        { name: 'Cơ tay trước (Biceps)', percent: 50, color: '#3B82F6' },
        { name: 'Cơ lưng giữa', percent: 65, color: '#8B5CF6' },
      ],
    },
    {
      id: 12,
      name: 'Bài tập Kéo lưng với thanh tạ đòn',
      englishName: 'Barbell bent-over row',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
      description: 'Bài tập tăng độ dày cơ lưng toàn diện nhất, kích thích lưng giữa, lưng xô và cơ dựng sống thắt lưng.',
      musclesDistribution: [
        { name: 'Lưng giữa & Lưng trên', percent: 85, color: '#EF4444' },
        { name: 'Lưng xô', percent: 80, color: '#3B82F6' },
        { name: 'Cơ dựng sống', percent: 60, color: '#10B981' },
      ],
    },
    {
      id: 13,
      name: 'Bài tập Kéo cáp ngồi chèo thuyền',
      englishName: 'Seated cable row',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
      description: 'Tác động sâu vào vùng cơ lưng giữa và trám lưng, siết chặt hai xương bả vai ở điểm co ngắn nhất.',
      musclesDistribution: [
        { name: 'Cơ lưng giữa', percent: 85, color: '#EF4444' },
        { name: 'Cơ trám & Thang lưng', percent: 75, color: '#8B5CF6' },
      ],
    },
    {
      id: 14,
      name: 'Hít xà đơn rộng tay',
      englishName: 'Wide grip pull-ups',
      image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=400&q=80',
      description: 'Bài tập thể trọng kinh điển giúp phát triển sức mạnh kéo và độ mở rộng lưng xô.',
      musclesDistribution: [
        { name: 'Lưng xô', percent: 95, color: '#EF4444' },
        { name: 'Tay trước', percent: 60, color: '#3B82F6' },
      ],
    },
  ],
  legs: [
    {
      id: 21,
      name: 'Gánh tạ đòn (Barbell Squat)',
      englishName: 'Barbell back squat',
      image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80',
      description: 'Vua của các bài tập chân, kích hoạt toàn bộ cơ đùi trước, cơ đùi sau, cơ mông và hệ cơ lõi trung tâm.',
      musclesDistribution: [
        { name: 'Đùi trước (Quadriceps)', percent: 90, color: '#EF4444' },
        { name: 'Cơ mông (Glutes)', percent: 80, color: '#8B5CF6' },
        { name: 'Đùi sau (Hamstrings)', percent: 60, color: '#3B82F6' },
      ],
    },
    {
      id: 22,
      name: 'Bài tập Đạp đùi trên máy nghiêng 45 độ',
      englishName: 'Leg press 45 degree',
      image: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=400&q=80',
      description: 'Tập trung áp lực cực lớn lên đùi trước và mông mà không gây tải trọng nén lên cột sống thắt lưng.',
      musclesDistribution: [
        { name: 'Đùi trước', percent: 85, color: '#EF4444' },
        { name: 'Cơ mông', percent: 70, color: '#8B5CF6' },
      ],
    },
    {
      id: 23,
      name: 'Đá đùi trước trên máy (Leg Extension)',
      englishName: 'Seated leg extension',
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
      description: 'Bài tập khu cơ giúp cô lập hoàn toàn 4 đầu cơ đùi trước, tạo rãnh cắt cơ sắc nét trên đầu gối.',
      musclesDistribution: [
        { name: 'Đùi trước', percent: 95, color: '#EF4444' },
      ],
    },
    {
      id: 24,
      name: 'Móc đùi sau nằm trên máy (Lying Leg Curl)',
      englishName: 'Lying hamstring curl',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
      description: 'Kích hoạt toàn bộ nhóm cơ đùi sau (biceps femoris, semitendinosus) ở vị trí uốn gập tối đa.',
      musclesDistribution: [
        { name: 'Đùi sau (Hamstrings)', percent: 95, color: '#EF4444' },
        { name: 'Bắp chân', percent: 35, color: '#3B82F6' },
      ],
    },
  ],
  glutes: [
    {
      id: 31,
      name: 'Đẩy hông tạ đòn (Barbell Hip Thrust)',
      englishName: 'Barbell hip thrust',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
      description: 'Bài tập số 1 giúp tăng kích thước và làm đầy đặn cơ mông lớn (Gluteus Maximus) mà không làm to đùi.',
      musclesDistribution: [
        { name: 'Cơ mông lớn', percent: 95, color: '#EF4444' },
        { name: 'Đùi sau', percent: 45, color: '#3B82F6' },
      ],
    },
    {
      id: 32,
      name: 'Đá cáp chân ra sau (Cable Glute Kickback)',
      englishName: 'Standing cable kickback',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
      description: 'Tạo độ cao và tròn trịa cho đỉnh mông, cô lập cơ mông cực kỳ hiệu quả.',
      musclesDistribution: [
        { name: 'Cơ mông trên & lớn', percent: 90, color: '#EF4444' },
      ],
    },
    {
      id: 33,
      name: 'Squat chân rộng Sumo với tạ ấm',
      englishName: 'Kettlebell sumo squat',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
      description: 'Tác động sâu vào cơ mông dưới và cơ đùi trong, giúp đùi săn chắc và mông săn nở.',
      musclesDistribution: [
        { name: 'Cơ mông', percent: 85, color: '#EF4444' },
        { name: 'Đùi trong', percent: 75, color: '#8B5CF6' },
      ],
    },
  ],
  shoulders: [
    {
      id: 41,
      name: 'Đẩy tạ đôi qua đầu (Dumbbell Shoulder Press)',
      englishName: 'Seated dumbbell overhead press',
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
      description: 'Xây dựng khối lượng cơ bắp toàn bộ khớp vai, đặc biệt là cơ delta trước và cơ delta giữa.',
      musclesDistribution: [
        { name: 'Cơ delta trước', percent: 85, color: '#EF4444' },
        { name: 'Cơ delta giữa', percent: 70, color: '#8B5CF6' },
        { name: 'Tay sau', percent: 50, color: '#3B82F6' },
      ],
    },
    {
      id: 42,
      name: 'Dang tạ đôi sang 2 bên (Dumbbell Lateral Raise)',
      englishName: 'Dumbbell side lateral raise',
      image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80',
      description: 'Bài tập cô lập tạo độ rộng cho bờ vai hình quả cầu, mở rộng khung vai nam tính.',
      musclesDistribution: [
        { name: 'Cơ delta giữa', percent: 95, color: '#EF4444' },
      ],
    },
    {
      id: 43,
      name: 'Kéo dây cáp ngang mặt (Face Pull)',
      englishName: 'Rope face pull',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
      description: 'Phát triển cơ delta sau và tăng cường sức khỏe cho nhóm chóp xoay vai, chống gù lưng.',
      musclesDistribution: [
        { name: 'Cơ delta sau', percent: 90, color: '#EF4444' },
        { name: 'Cơ trám & Thang lưng', percent: 70, color: '#8B5CF6' },
      ],
    },
  ],
  biceps: [
    {
      id: 51,
      name: 'Cuốn tạ đòn bắp tay trước (Barbell Bicep Curl)',
      englishName: 'Standing barbell bicep curl',
      image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80',
      description: 'Bài tập xây dựng kích thước và độ dày bắp tay trước hiệu quả nhất.',
      musclesDistribution: [
        { name: 'Bắp tay trước (Biceps)', percent: 95, color: '#EF4444' },
        { name: 'Cơ cẳng tay', percent: 45, color: '#3B82F6' },
      ],
    },
    {
      id: 52,
      name: 'Cuốn tạ đơn hình búa (Hammer Curl)',
      englishName: 'Dumbbell hammer curl',
      image: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=400&q=80',
      description: 'Tác động sâu vào cơ cánh tay ngoài (Brachialis) giúp đẩy cao đỉnh bắp tay và cẳng tay dày khỏe.',
      musclesDistribution: [
        { name: 'Cơ Brachialis', percent: 90, color: '#EF4444' },
        { name: 'Bắp tay trước', percent: 75, color: '#8B5CF6' },
      ],
    },
  ],
  triceps: [
    {
      id: 61,
      name: 'Kéo cáp tay sau dây thừng (Tricep Rope Pushdown)',
      englishName: 'Cable rope tricep pushdown',
      image: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=400&q=80',
      description: 'Cô lập và siết chặt đầu dài và đầu ngoài của bắp tay sau, tạo hình móng ngựa rõ rệt.',
      musclesDistribution: [
        { name: 'Cơ tay sau (Triceps)', percent: 95, color: '#EF4444' },
      ],
    },
    {
      id: 62,
      name: 'Nằm ghế đẩy tạ bẻ tay sau (Skull Crusher)',
      englishName: 'Lying EZ-bar tricep extension',
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
      description: 'Kéo căng tối đa đầu dài cơ tay sau (Long head) trong toàn bộ biên độ hạ tạ về trán.',
      musclesDistribution: [
        { name: 'Đầu dài tay sau', percent: 90, color: '#EF4444' },
      ],
    },
  ],
  abs: [
    {
      id: 71,
      name: 'Treo xà co gối nâng chân (Hanging Leg Raise)',
      englishName: 'Hanging knee/leg raise',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
      description: 'Tác động cực mạnh vào cơ bụng dưới và cơ gấp hông, hỗ trợ cắt nét múi bụng dưới.',
      musclesDistribution: [
        { name: 'Cơ bụng dưới', percent: 95, color: '#EF4444' },
        { name: 'Cơ gập hông', percent: 65, color: '#3B82F6' },
      ],
    },
    {
      id: 72,
      name: 'Lăn bánh xe tập bụng (Ab Wheel Rollout)',
      englishName: 'Ab wheel rollout',
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80',
      description: 'Thử thách cơ bụng ngang và toàn bộ hệ cơ lõi (anti-extension) ở mức độ tối đa.',
      musclesDistribution: [
        { name: 'Toàn bộ cơ lõi (Core)', percent: 95, color: '#EF4444' },
        { name: 'Cơ bụng ngang', percent: 90, color: '#8B5CF6' },
      ],
    },
  ],
};

const ExerciseListScreen: React.FC<ExerciseListScreenProps> = ({ navigation, route }) => {
  const categoryName = route?.params?.category || 'Ngực';
  const categoryId = route?.params?.categoryId || 'chest';
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Tìm danh sách theo categoryId hoặc fallback về chest
  const rawList = EXERCISE_DATA[categoryId] || EXERCISE_DATA.chest || [];

  const exercises = rawList.filter((ex: any) =>
    ex.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{categoryName}</Text>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isBookmarked ? '#0D7F8D' : '#374151'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Thanh tìm kiếm */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách bài tập */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            style={styles.exerciseRow}
            onPress={() =>
              navigation.navigate('ExerciseDetail', {
                exercise: item,
                categoryName: categoryName,
              })
            }
          >
            <Image
              source={{ uri: item.image }}
              style={styles.exerciseThumb}
              resizeMode="cover"
            />
            <Text style={styles.exerciseName} numberOfLines={2}>
              {item.name}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#00C4CC" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal bộ lọc */}
      <ExerciseFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(filters) => {
          console.log('Applied filters:', filters);
        }}
      />
    </SafeAreaView>
  );
};

export default ExerciseListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FAFB',
  },
  header: {
    height: 64,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0F1',
  },
  headerIconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#11343A',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E8F0F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  exerciseThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 14,
  },
  exerciseName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
    paddingRight: 8,
  },
});
