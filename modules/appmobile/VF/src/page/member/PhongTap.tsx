import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, Image, Modal, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppHeader from '../../components/AppHeader';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';

// Dữ liệu danh sách Thành phố
const CITIES = [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Bình Dương',
];

// Dữ liệu danh sách Quận / Huyện theo từng Thành phố
const DISTRICTS_BY_CITY: { [city: string]: string[] } = {
    'TP. Hồ Chí Minh': [
        'Tất cả quận',
        'Quận 1',
        'Quận 3',
        'Quận 7',
        'Quận 10',
        'Quận Bình Thạnh',
        'Quận Phú Nhuận',
        'Quận Gò Vấp',
        'Quận Tân Bình',
        'TP. Thủ Đức',
    ],
    'Hà Nội': [
        'Tất cả quận',
        'Quận Ba Đình',
        'Quận Hoàn Kiếm',
        'Quận Đống Đa',
        'Quận Cầu Giấy',
        'Quận Hai Bà Trưng',
        'Quận Thanh Xuân',
        'Quận Nam Từ Liêm',
        'Quận Tây Hồ',
    ],
    'Đà Nẵng': [
        'Tất cả quận',
        'Quận Hải Châu',
        'Quận Thanh Khê',
        'Quận Sơn Trà',
        'Quận Ngũ Hành Sơn',
        'Quận Cẩm Lệ',
    ],
    'Hải Phòng': [
        'Tất cả quận',
        'Quận Hồng Bàng',
        'Quận Ngô Quyền',
        'Quận Lê Chân',
        'Quận Hải An',
    ],
    'Cần Thơ': [
        'Tất cả quận',
        'Quận Ninh Kiều',
        'Quận Cái Răng',
        'Quận Bình Thủy',
    ],
    'Bình Dương': [
        'Tất cả quận',
        'TP. Thủ Dầu Một',
        'TP. Thuận An',
        'TP. Dĩ An',
    ],
};

// Dữ liệu danh mục thể loại phòng tập
interface CategoryItem {
    id: string;
    name: string;
    icon: string;
}

const CATEGORIES: CategoryItem[] = [
    { id: 'all', name: 'Tất cả', icon: 'apps-outline' },
    { id: 'gym', name: 'Gym & Fitness', icon: 'barbell-outline' },
    { id: 'yoga', name: 'Yoga & Pilates', icon: 'body-outline' },
    { id: 'boxing', name: 'Boxing & MMA', icon: 'flame-outline' },
    { id: 'crossfit', name: 'CrossFit', icon: 'fitness-outline' },
    { id: 'pool', name: 'Bơi lội & Spa', icon: 'water-outline' },
    { id: '247', name: 'Mở 24/7', icon: 'time-outline' },
];

// Interface thông tin phòng tập
export interface GymItem {
    id: string;
    name: string;
    city: string;
    district: string;
    address: string;
    category: string;
    rating: number;
    reviewsCount: number;
    openTime: string;
    priceRange: string;
    distance: string;
    image: string;
    features: string[];
    phone: string;
}

// Danh sách phòng tập mẫu chi tiết, thực tế
const GYM_DATA: GymItem[] = [
    {
        id: 'gym-01',
        name: 'VisionFit Diamond Elite Club',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        address: '34 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        category: 'Gym & Fitness',
        rating: 4.9,
        reviewsCount: 320,
        openTime: '06:00 - 22:30',
        priceRange: 'Từ 650.000đ/tháng',
        distance: '1.2 km',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
        features: ['Máy tập Technogym', 'Phòng Sauna & Xông hơi', 'Khăn tập miễn phí', 'Tủ Locker'],
        phone: '1900 6868',
    },
    {
        id: 'gym-02',
        name: 'VisionFit Landmark Luxury & Spa',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận Bình Thạnh',
        address: '208 Nguyễn Hữu Cảnh, P. 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
        category: 'Bơi lội & Spa',
        rating: 5.0,
        reviewsCount: 450,
        openTime: '05:30 - 23:00',
        priceRange: 'Từ 950.000đ/tháng',
        distance: '2.5 km',
        image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop',
        features: ['Bể bơi vô cực', 'Phòng Yoga view sông', 'Sauna đá muối', 'PT 1 kèm 1'],
        phone: '1900 6869',
    },
    {
        id: 'gym-03',
        name: 'VisionFit Thảo Điền Studio & Pilates',
        city: 'TP. Hồ Chí Minh',
        district: 'TP. Thủ Đức',
        address: '12 Quốc Hương, Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
        category: 'Yoga & Pilates',
        rating: 4.8,
        reviewsCount: 195,
        openTime: '06:00 - 21:30',
        priceRange: 'Từ 800.000đ/tháng',
        distance: '3.8 km',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
        features: ['Máy Pilates Reformer', 'Giảng viên quốc tế', 'Đỗ xe ôtô', 'Detox Bar'],
        phone: '1900 6870',
    },
    {
        id: 'gym-04',
        name: 'VisionFit Crescent Crescent 24/7',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 7',
        address: '101 Tôn Dật Tiên, Tân Phú, Quận 7, TP. Hồ Chí Minh',
        category: 'Mở 24/7',
        rating: 4.8,
        reviewsCount: 280,
        openTime: 'Mở cửa 24/7',
        priceRange: 'Từ 550.000đ/tháng',
        distance: '4.5 km',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop',
        features: ['Mở cửa 24/7', 'Check-in vân tay', 'Khu vực Functional', 'Wifi 5G'],
        phone: '1900 6871',
    },
    {
        id: 'gym-05',
        name: 'VisionFit Fight Club Boxing & MMA',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 3',
        address: '184 Nam Kỳ Khởi Nghĩa, Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
        category: 'Boxing & MMA',
        rating: 4.9,
        reviewsCount: 210,
        openTime: '07:00 - 22:00',
        priceRange: 'Từ 600.000đ/tháng',
        distance: '1.8 km',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
        features: ['Sàn đấu Octagon', 'Găng & Bao cát cao cấp', 'HLV vô địch quốc gia', 'Phục hồi cơ'],
        phone: '1900 6872',
    },
    {
        id: 'gym-06',
        name: 'VisionFit CrossFit Saigon Force',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 10',
        address: '268 Tô Hiến Thành, Phường 15, Quận 10, TP. Hồ Chí Minh',
        category: 'CrossFit',
        rating: 4.7,
        reviewsCount: 160,
        openTime: '06:00 - 21:00',
        priceRange: 'Từ 500.000đ/tháng',
        distance: '3.1 km',
        image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=800&auto=format&fit=crop',
        features: ['Tạ chuẩn cử tạ Olympic', 'Dây thừng & Lốp xe', 'Khu vực ngoài trời thoáng', 'Nước uống Free'],
        phone: '1900 6873',
    },
    {
        id: 'gym-07',
        name: 'VisionFit Vincom Center Ba Trieu',
        city: 'Hà Nội',
        district: 'Quận Hai Bà Trưng',
        address: '191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội',
        category: 'Gym & Fitness',
        rating: 4.9,
        reviewsCount: 390,
        openTime: '06:00 - 22:00',
        priceRange: 'Từ 700.000đ/tháng',
        distance: '1.5 km',
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800&auto=format&fit=crop',
        features: ['Dàn máy Life Fitness', 'Phòng xông hơi ướt & khô', 'Tủ đồ thông minh', 'Đo InBody miễn phí'],
        phone: '1900 6881',
    },
    {
        id: 'gym-08',
        name: 'VisionFit Lotte Center Liễu Giai',
        city: 'Hà Nội',
        district: 'Quận Ba Đình',
        address: '54 Liễu Giai, Cống Vị, Ba Đình, Hà Nội',
        category: 'Bơi lội & Spa',
        rating: 5.0,
        reviewsCount: 420,
        openTime: '05:30 - 22:30',
        priceRange: 'Từ 900.000đ/tháng',
        distance: '2.0 km',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop',
        features: ['Bể bơi 4 mùa nước ấm', 'Phòng xông tuyết', 'Juice Bar organic', 'Bãi đỗ xe ô tô'],
        phone: '1900 6882',
    },
    {
        id: 'gym-09',
        name: 'VisionFit Cầu Giấy Power 24/7',
        city: 'Hà Nội',
        district: 'Quận Cầu Giấy',
        address: '241 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
        category: 'Mở 24/7',
        rating: 4.8,
        reviewsCount: 310,
        openTime: 'Mở cửa 24/7',
        priceRange: 'Từ 480.000đ/tháng',
        distance: '3.4 km',
        image: 'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?q=80&w=800&auto=format&fit=crop',
        features: ['Tập luyện 24/7', 'Khu máy Cardio đa năng', 'Khu tạ tự do 1000m2', 'Điều hoà 2 chiều'],
        phone: '1900 6883',
    },
    {
        id: 'gym-10',
        name: 'VisionFit Indochina Yoga Studio',
        city: 'Hà Nội',
        district: 'Quận Đống Đa',
        address: '102 Trường Chinh, Phương Mai, Đống Đa, Hà Nội',
        category: 'Yoga & Pilates',
        rating: 4.8,
        reviewsCount: 225,
        openTime: '06:00 - 21:30',
        priceRange: 'Từ 650.000đ/tháng',
        distance: '2.8 km',
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
        features: ['Phòng thiền tĩnh tâm', 'Yoga bay Aerial', 'Thảm Lululemon', 'Trà thảo mộc Free'],
        phone: '1900 6884',
    },
    {
        id: 'gym-11',
        name: 'VisionFit Sông Hàn Riverside',
        city: 'Đà Nẵng',
        district: 'Quận Hải Châu',
        address: '150 Bạch Đằng, Hải Châu 1, Hải Châu, Đà Nẵng',
        category: 'Gym & Fitness',
        rating: 4.9,
        reviewsCount: 240,
        openTime: '05:30 - 22:00',
        priceRange: 'Từ 450.000đ/tháng',
        distance: '0.9 km',
        image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=800&auto=format&fit=crop',
        features: ['View toàn cảnh sông Hàn', 'Phòng xông hơi đá muối', 'Máy chạy bộ nhập khẩu', 'Khu vực giãn cơ'],
        phone: '1900 6891',
    },
    {
        id: 'gym-12',
        name: 'VisionFit Sơn Trà Ocean View',
        city: 'Đà Nẵng',
        district: 'Quận Sơn Trà',
        address: '88 Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng',
        category: 'Bơi lội & Spa',
        rating: 4.9,
        reviewsCount: 180,
        openTime: '06:00 - 22:00',
        priceRange: 'Từ 600.000đ/tháng',
        distance: '2.1 km',
        image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=800&auto=format&fit=crop',
        features: ['Hồ bơi sát biển Mỹ Khê', 'Yoga bãi biển buổi sáng', 'Bar sinh tố tươi', 'Sauna khô'],
        phone: '1900 6892',
    },
    {
        id: 'gym-13',
        name: 'VisionFit Ninh Kiều Premier Club',
        city: 'Cần Thơ',
        district: 'Quận Ninh Kiều',
        address: '01 Đại lộ Hòa Bình, Tân An, Ninh Kiều, Cần Thơ',
        category: 'Gym & Fitness',
        rating: 4.8,
        reviewsCount: 165,
        openTime: '06:00 - 21:30',
        priceRange: 'Từ 400.000đ/tháng',
        distance: '1.0 km',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
        features: ['Diện tích 1200m2', 'Phòng Group X sôi động', 'Phòng tắm tiện nghi', 'HLV nhiệt tình'],
        phone: '1900 6895',
    },
    {
        id: 'gym-14',
        name: 'VisionFit Dĩ An Green Center',
        city: 'Bình Dương',
        district: 'TP. Dĩ An',
        address: '89 Nguyễn Tri Phương, Dĩ An, Bình Dương',
        category: 'Gym & Fitness',
        rating: 4.7,
        reviewsCount: 140,
        openTime: '06:00 - 22:00',
        priceRange: 'Từ 380.000đ/tháng',
        distance: '3.0 km',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
        features: ['Bãi giữ xe rộng rãi', 'Khu tạ nặng chuyên sâu', 'Tủ khoá từ an toàn', 'Nước uống nóng lạnh'],
        phone: '1900 6898',
    },
];

const PhongTap = ({ navigation, route }: any) => {
    // State lưu tiêu chí lọc
    const [selectedCity, setSelectedCity] = useState<string>('TP. Hồ Chí Minh');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('Tất cả quận');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // State lưu phòng tập được chọn
    const [selectedGym, setSelectedGym] = useState<GymItem | null>(null);

    // State điều khiển modal chọn Thành phố / Quận
    const [cityModalVisible, setCityModalVisible] = useState<boolean>(false);
    const [districtModalVisible, setDistrictModalVisible] = useState<boolean>(false);

    // Danh sách quận tương ứng theo thành phố đang chọn
    const availableDistricts = useMemo(() => {
        return DISTRICTS_BY_CITY[selectedCity] || ['Tất cả quận'];
    }, [selectedCity]);

    // Đổi thành phố -> reset quận về 'Tất cả quận'
    const handleSelectCity = (city: string) => {
        setSelectedCity(city);
        setSelectedDistrict('Tất cả quận');
        setCityModalVisible(false);
    };

    // Đổi quận
    const handleSelectDistrict = (district: string) => {
        setSelectedDistrict(district);
        setDistrictModalVisible(false);
    };

    // Đặt lại toàn bộ bộ lọc
    const handleResetFilters = () => {
        setSelectedCity('TP. Hồ Chí Minh');
        setSelectedDistrict('Tất cả quận');
        setSelectedCategory('all');
        setSearchQuery('');
    };

    // State lưu danh sách phòng tập (kết hợp Backend API + Mock)
    const [gymList, setGymList] = useState<GymItem[]>(GYM_DATA);

    useEffect(() => {
        const fetchGyms = async () => {
            try {
                const res = await apiFitlife.get('/phong-gym');
                if (res.data?.status && Array.isArray(res.data?.data) && res.data.data.length > 0) {
                    const beGyms: GymItem[] = res.data.data.map((g: any, index: number) => ({
                        id: `gym-be-${g.id_phong_tap || index}`,
                        name: g.ten_phong_tap || 'VisionFit Center',
                        city: 'Đà Nẵng',
                        district: g.dia_chi?.includes('Sơn Trà') ? 'Quận Sơn Trà' : (g.dia_chi?.includes('Cẩm Lệ') ? 'Quận Cẩm Lệ' : 'Quận Hải Châu'),
                        address: g.dia_chi || 'Việt Nam',
                        category: 'Phòng Gym cao cấp',
                        rating: 5.0,
                        reviewsCount: 320,
                        openTime: '05:30 - 22:00',
                        priceRange: 'Từ 450.000đ/tháng',
                        distance: '1.2 km',
                        image: g.anh_banner ? (g.anh_banner.startsWith('http') ? g.anh_banner : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop') : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
                        features: ['Thiết bị chuyên nghiệp', 'Huấn luyện viên cá nhân', 'Locker & Tắm nóng lạnh', 'Wifi miễn phí'],
                        phone: g.so_dien_thoai || '1900 6868',
                    }));
                    setGymList([...beGyms, ...GYM_DATA]);
                }
            } catch (e) {
                console.log('Lỗi lấy phòng tập từ BE:', e);
            }
        };
        fetchGyms();
    }, []);

    // Lọc danh sách phòng tập theo 4 tiêu chí: Thành phố, Quận, Thể loại, Tên phòng tập
    const filteredGyms = useMemo(() => {
        return gymList.filter((gym) => {
            // Lọc theo Thành phố
            if (gym.city !== selectedCity) {
                return false;
            }

            // Lọc theo Quận/Huyện
            if (selectedDistrict !== 'Tất cả quận' && gym.district !== selectedDistrict) {
                return false;
            }

            // Lọc theo Thể loại
            if (selectedCategory !== 'all') {
                const categoryObj = CATEGORIES.find((c) => c.id === selectedCategory);
                if (categoryObj && gym.category !== categoryObj.name && selectedCategory !== '247') {
                    return false;
                }
                if (selectedCategory === '247' && gym.openTime !== 'Mở cửa 24/7') {
                    return false;
                }
            }

            // Lọc theo Tên phòng tập (không phân biệt hoa/thường, không dấu)
            if (searchQuery.trim().length > 0) {
                const keyword = searchQuery.toLowerCase().trim();
                const gymName = gym.name.toLowerCase();
                const gymAddress = gym.address.toLowerCase();
                if (!gymName.includes(keyword) && !gymAddress.includes(keyword)) {
                    return false;
                }
            }

            return true;
        });
    }, [selectedCity, selectedDistrict, selectedCategory, searchQuery]);

    // Xử lý khi nhấn nút Tiếp tục
    const handleContinue = () => {
        if (!selectedGym) {
            Alert.alert('Chưa chọn phòng tập', 'Vui lòng chọn 1 phòng tập trong danh sách để tiếp tục tập luyện!');
            return;
        }

        // Nếu có callback từ màn hình trước thì gọi callback
        if (route?.params?.onSelectGym) {
            route.params.onSelectGym(selectedGym);
            navigation.goBack();
            return;
        }

        // Chuyển tiếp tới WorkoutPlanScreen hoặc WorkoutLocationScreen theo luồng ứng dụng
        navigation.navigate('WorkoutPlanScreen', {
            ...(route?.params || {}),
            selectedGym: selectedGym,
            phong_tap_id: selectedGym.id,
            ten_phong_tap: selectedGym.name,
            dia_chi_phong_tap: selectedGym.address,
        });
    };

    // Render từng thẻ phòng tập
    const renderGymItem = ({ item }: { item: GymItem }) => {
        const isSelected = selectedGym?.id === item.id;

        return (
            <TouchableOpacity style={[styles.gymCard, isSelected && styles.gymCardSelected]} activeOpacity={0.85}  onPress={() => setSelectedGym(item)}>
                {/* Ảnh phòng tập */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.image }} style={styles.gymImage} resizeMode="cover" />

                    {/* Badge thể loại */}
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>

                    {/* Badge khoảng cách */}
                    <View style={styles.distanceBadge}>
                        <Ionicons name="navigate-outline" size={12} color={COLORS.white} />
                        <Text style={styles.distanceBadgeText}>{item.distance}</Text>
                    </View>

                    {/* Checkmark khi đã chọn */}
                    {isSelected && (
                        <View style={styles.selectedCheckmark}>
                            <Ionicons name="checkmark" size={18} color={COLORS.white} />
                        </View>
                    )}
                </View>

                {/* Nội dung chi tiết */}
                <View style={styles.gymInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.gymName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={13} color="#F59E0B" />
                            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                        </View>
                    </View>

                    {/* Địa chỉ */}
                    <View style={styles.locationRow}>
                        <Ionicons name="location-sharp" size={14} color={COLORS.primary} style={styles.locationIcon} />
                        <Text style={styles.gymAddress} numberOfLines={2}>{item.address}</Text>
                    </View>

                    {/* Giờ mở cửa & Khoảng giá */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>{item.openTime}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="pricetag-outline" size={13} color={COLORS.primary} />
                            <Text style={[styles.metaText, styles.metaTextPrice]}>{item.priceRange}</Text>
                        </View>
                    </View>

                    {/* Tiện ích tags */}
                    <View style={styles.featuresRow}>
                        {item.features.slice(0, 3).map((feat, idx) => (
                            <View key={idx} style={styles.featureChip}>
                                <Text style={styles.featureText}>{feat}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Nút chọn hoặc trạng thái chọn */}
                    <TouchableOpacity style={[styles.selectButton, isSelected && styles.selectButtonActive]} onPress={() => setSelectedGym(item)} >
                        <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextActive]}>
                            {isSelected ? '✓ ĐÃ CHỌN PHÒNG NÀY' : 'CHỌN PHÒNG TẬP NÀY'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />
            {/* Header */}
            <AppHeader
                title="Chọn phòng tập"
                onBack={() => navigation.goBack()}
                rightIcon="refresh-outline"
                onRightPress={handleResetFilters}
            />

            {/* Nội dung chính */}
            <View style={styles.content}>
                <Text style={styles.subtitle}>
                    Tìm kiếm và chọn cơ sở tập luyện phù hợp theo vị trí và thể loại:
                </Text>

                {/* Thanh tìm kiếm theo Tên phòng tập */}
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nhập tên phòng tập (VD: Diamond, Vincom...)"
                        placeholderTextColor={COLORS.textLight}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bộ lọc Vị trí: Thành phố & Quận */}
                <View style={styles.filterRow}>
                    {/* Chọn Thành phố */}
                    <TouchableOpacity style={styles.filterCard} onPress={() => setCityModalVisible(true)} activeOpacity={0.8} >
                        <View style={styles.filterCardIconWrapper}>
                            <Ionicons name="business" size={18} color={COLORS.primary} />
                        </View>
                        <View style={styles.filterCardContent}>
                            <Text style={styles.filterLabel}>Thành phố</Text>
                            <Text style={styles.filterValue} numberOfLines={1}>{selectedCity}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    {/* Chọn Quận / Huyện */}
                    <TouchableOpacity
                        style={styles.filterCard}
                        onPress={() => setDistrictModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.filterCardIconWrapper, styles.filterCardIconOrange]}>
                            <Ionicons name="map" size={18} color={COLORS.accentOrange} />
                        </View>
                        <View style={styles.filterCardContent}>
                            <Text style={styles.filterLabel}>Quận / Huyện</Text>
                            <Text style={styles.filterValue} numberOfLines={1}>{selectedDistrict}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Cuộn ngang thể loại phòng tập */}
                <View style={styles.categorySection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScrollList}
                    >
                        {CATEGORIES.map((cat) => {
                            const isCatSelected = selectedCategory === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoryChip, isCatSelected && styles.categoryChipActive]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={cat.icon as any}
                                        size={15}
                                        color={isCatSelected ? COLORS.white : COLORS.primary}
                                        style={styles.categoryChipIcon}
                                    />
                                    <Text style={[styles.categoryChipText, isCatSelected && styles.categoryChipTextActive]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Thống kê số lượng kết quả */}
                <View style={styles.resultCountRow}>
                    <Text style={styles.resultCountText}>
                        Tìm thấy <Text style={styles.resultCountHighlight}>{filteredGyms.length}</Text> phòng tập phù hợp
                    </Text>
                    {selectedGym && (
                        <Text style={styles.selectedCountText}>
                            Đã chọn: <Text style={styles.selectedNameHighlight}>{selectedGym.name.slice(0, 15)}...</Text>
                        </Text>
                    )}
                </View>

                {/* Danh sách phòng tập */}
                <FlatList
                    data={filteredGyms}
                    keyExtractor={(item) => item.id}
                    renderItem={renderGymItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconTile}>
                                <Ionicons name="barbell-outline" size={32} color={COLORS.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>Không tìm thấy phòng tập</Text>
                            <Text style={styles.emptySubtitle}>
                                Không có phòng tập nào khớp với tiêu chí tìm kiếm hiện tại. Vui lòng thử chọn lại thành phố, quận hoặc từ khoá khác.
                            </Text>
                            <TouchableOpacity style={styles.emptyResetBtn} onPress={handleResetFilters}>
                                <Text style={styles.emptyResetBtnText}>Xem tất cả phòng tập</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />

                {/* Nút Tiếp Tục ở đáy (phong cách BodyMetrics.tsx) */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.continueButtonWrap, !selectedGym && styles.continueButtonDisabled]}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={selectedGym ? [COLORS.primary, COLORS.primaryDark] : ['#AFC4C8', '#AFC4C8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.continueButton}
                        >
                            <Text style={styles.continueButtonText}>
                                {selectedGym ? 'TIẾP TỤC VỚI PHÒNG ĐÃ CHỌN' : 'VUI LÒNG CHỌN PHÒNG TẬP'}
                            </Text>
                            {selectedGym && <Ionicons name="arrow-forward" size={19} color={COLORS.white} />}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal Chọn Thành Phố */}
            <Modal
                visible={cityModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCityModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setCityModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Thành Phố</Text>
                            <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {CITIES.map((city) => {
                                const isCurrent = selectedCity === city;
                                return (
                                    <TouchableOpacity
                                        key={city}
                                        style={[styles.modalItem, isCurrent && styles.modalItemActive]}
                                        onPress={() => handleSelectCity(city)}
                                    >
                                        <Text style={[styles.modalItemText, isCurrent && styles.modalItemTextActive]}>
                                            {city}
                                        </Text>
                                        {isCurrent && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal Chọn Quận / Huyện */}
            <Modal
                visible={districtModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDistrictModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setDistrictModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Quận / Huyện ({selectedCity})</Text>
                            <TouchableOpacity onPress={() => setDistrictModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {availableDistricts.map((district) => {
                                const isCurrent = selectedDistrict === district;
                                return (
                                    <TouchableOpacity
                                        key={district}
                                        style={[styles.modalItem, isCurrent && styles.modalItemActive]}
                                        onPress={() => handleSelectDistrict(district)}
                                    >
                                        <Text style={[styles.modalItemText, isCurrent && styles.modalItemTextActive]}>
                                            {district}
                                        </Text>
                                        {isCurrent && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
    },
    backButton: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: COLORS.primaryDark,
    },
    resetButton: {
        padding: 6,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 12,
        lineHeight: 18,
    },

    // Thanh tìm kiếm
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textPrimary,
        paddingVertical: 0,
    },
    clearSearchButton: {
        padding: 4,
    },

    // Bộ lọc Thành phố & Quận
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 10,
    },
    filterCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    filterCardIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    filterCardIconOrange: {
        backgroundColor: '#FFF1EC',
    },
    filterCardContent: {
        flex: 1,
    },
    filterLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    filterValue: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginTop: 2,
    },

    // Thể loại cuộn ngang
    categorySection: {
        marginBottom: 12,
    },
    categoryScrollList: {
        paddingVertical: 2,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryChipIcon: {
        marginRight: 6,
    },
    categoryChipText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '700',
    },
    categoryChipTextActive: {
        color: COLORS.white,
    },

    // Thống kê kết quả
    resultCountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    resultCountText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    resultCountHighlight: {
        fontWeight: '800',
        color: COLORS.primary,
    },
    selectedCountText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    selectedNameHighlight: {
        fontWeight: '800',
        color: COLORS.primary,
    },

    // Danh sách thẻ phòng tập
    listContent: {
        paddingBottom: 100,
    },
    gymCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        overflow: 'hidden',
        ...SHADOWS.card,
    },
    gymCardSelected: {
        borderColor: COLORS.primary,
        borderWidth: 2,
        backgroundColor: COLORS.surfaceTeal,
    },
    imageContainer: {
        width: '100%',
        height: 150,
        position: 'relative',
    },
    gymImage: {
        width: '100%',
        height: '100%',
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(7, 88, 101, 0.88)',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.white,
    },
    distanceBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 52, 58, 0.72)',
        paddingVertical: 4,
        paddingHorizontal: 9,
        borderRadius: 10,
        gap: 4,
    },
    distanceBadgeText: {
        fontSize: 11,
        color: COLORS.white,
        fontWeight: '700',
    },
    selectedCheckmark: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Chi tiết phòng tập
    gymInfo: {
        padding: 14,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    gymName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginRight: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 3,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B45309',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    locationIcon: {
        marginTop: 2,
    },
    gymAddress: {
        flex: 1,
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 5,
        lineHeight: 17,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    metaTextPrice: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    featuresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    featureChip: {
        backgroundColor: COLORS.surfaceTeal,
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 9,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    featureText: {
        fontSize: 10.5,
        color: COLORS.primaryDark,
        fontWeight: '600',
    },
    selectButton: {
        backgroundColor: COLORS.primarySoft,
        borderWidth: 1,
        borderColor: COLORS.borderFocus,
        borderRadius: 12,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    selectButtonText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 0.3,
    },
    selectButtonTextActive: {
        color: COLORS.white,
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    emptyIconTile: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginTop: 12,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 12.5,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
    },
    emptyResetBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 12,
    },
    emptyResetBtnText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '800',
    },

    // Thanh hành động đáy (nổi phía trên bottom tab bar)
    bottomBar: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: 'transparent',
    },
    continueButtonWrap: {
        borderRadius: 16,
        marginBottom: 10,
        ...SHADOWS.glow,
    },
    continueButton: {
        height: 54,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonDisabled: {
        elevation: 0,
        shadowOpacity: 0,
    },
    continueButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.white,
        letterSpacing: 0.5,
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 31, 38, 0.55)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        maxHeight: '65%',
        paddingBottom: 25,
    },
    modalHandle: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.border,
        alignSelf: 'center',
        marginTop: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    modalList: {
        paddingHorizontal: 12,
        paddingTop: 6,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 14,
        marginBottom: 2,
    },
    modalItemActive: {
        backgroundColor: COLORS.surfaceTeal,
    },
    modalItemText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    modalItemTextActive: {
        color: COLORS.primary,
        fontWeight: '800',
    },
});

export default PhongTap;
