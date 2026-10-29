import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, FlatList, Modal, ActivityIndicator, RefreshControl, Alert, StatusBar, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import apiFitlife from '../../general/api';

const COLORS = {
    primary: '#0D7F8D', dark: '#075865', background: '#F4FAFB',
    white: '#FFFFFF', text: '#16383E', muted: '#76969B',
    border: '#DFEAEC', soft: '#E7F5F6', gold: '#E5AC4D',
};

const PACKAGE_KEY = 'visionfit_selected_package';
const TRAINER_KEY = 'visionfit_selected_pt';

interface TrainingPackage {
    id: string | number;
    ten_goi: string;
    gia: number;
    thoi_han: number;
    loai?: string;
    so_buoi_pt?: number;
}

interface Trainer {
    id: number | string;
    ho_ten: string;
    hinh_anh?: string | null;
    chuc_danh?: string;
    mo_ta?: string;
    so_nam_kinh_nghiem?: string | number;
    kinh_nghiem_lam_viec?: string;
    qua_trinh_dao_tao?: string;
    chung_chi?: string;
    thanh_tuu?: string;
    tinh_trang: number;
    is_active: number;
    is_block: number;
    id_phong_tap?: number;
    chuyen_mon?: string[];
}

type FilterType = 'all' | 'strength' | 'weight' | 'yoga' | 'recovery';

const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'strength', label: 'Tăng cơ' },
    { id: 'weight', label: 'Giảm cân' },
    { id: 'yoga', label: 'Yoga' },
    { id: 'recovery', label: 'Phục hồi' },
];

const MOCK_TRAINERS: Trainer[] = [
    {
        id: 1, ho_ten: 'Nguyễn Văn Hùng', chuc_danh: 'Personal Trainer',
        mo_ta: 'Huấn luyện viên chuyên về tăng cơ và thể hình.',
        so_nam_kinh_nghiem: '5', kinh_nghiem_lam_viec: '5 năm làm việc trong lĩnh vực thể hình.',
        qua_trinh_dao_tao: 'Tốt nghiệp chuyên ngành Thể dục thể thao.',
        chung_chi: 'Chứng chỉ Personal Trainer', thanh_tuu: 'Top Trainer VisionFit 2025',
        chuyen_mon: ['strength'], tinh_trang: 1, is_active: 1, is_block: 0, id_phong_tap: 1,
    },
    {
        id: 2, ho_ten: 'Trần Minh Tuấn', chuc_danh: 'Fitness Trainer',
        mo_ta: 'Huấn luyện viên chuyên về giảm cân và cải thiện sức bền.',
        so_nam_kinh_nghiem: '3', kinh_nghiem_lam_viec: '3 năm huấn luyện cá nhân.',
        qua_trinh_dao_tao: 'Đào tạo chuyên sâu về Fitness.',
        chung_chi: 'Fitness Trainer Certificate', thanh_tuu: 'Trainer xuất sắc 2025',
        chuyen_mon: ['weight'], tinh_trang: 1, is_active: 1, is_block: 0, id_phong_tap: 1,
    },
    {
        id: 3, ho_ten: 'Lê Quốc Bảo', chuc_danh: 'Strength Coach',
        mo_ta: 'Huấn luyện viên chuyên về tăng cơ và sức mạnh.',
        so_nam_kinh_nghiem: '7', kinh_nghiem_lam_viec: '7 năm trong lĩnh vực huấn luyện thể hình.',
        qua_trinh_dao_tao: 'Đào tạo chuyên sâu về Strength Training.',
        chung_chi: 'Strength Coach Certificate', thanh_tuu: 'Vô địch Fitness khu vực 2024',
        chuyen_mon: ['strength'], tinh_trang: 1, is_active: 1, is_block: 0, id_phong_tap: 2,
    },
    {
        id: 4, ho_ten: 'Phạm Hoàng Nam', chuc_danh: 'Senior Trainer',
        mo_ta: 'Huấn luyện viên có nhiều kinh nghiệm về phục hồi thể chất.',
        so_nam_kinh_nghiem: '10', kinh_nghiem_lam_viec: '10 năm huấn luyện và tư vấn thể hình.',
        qua_trinh_dao_tao: 'Đào tạo chuyên sâu về thể thao và phục hồi.',
        chung_chi: 'Senior Personal Trainer', thanh_tuu: 'Trainer tiêu biểu 2024',
        chuyen_mon: ['recovery'], tinh_trang: 1, is_active: 1, is_block: 0, id_phong_tap: 2,
    },
    {
        id: 5, ho_ten: 'Nguyễn Thị Lan', chuc_danh: 'Fitness & Yoga Trainer',
        mo_ta: 'Huấn luyện viên chuyên về Fitness và Yoga.',
        so_nam_kinh_nghiem: '4', kinh_nghiem_lam_viec: '4 năm huấn luyện Fitness và Yoga.',
        qua_trinh_dao_tao: 'Đào tạo Yoga và Fitness chuyên nghiệp.',
        chung_chi: 'Yoga Instructor Certificate', thanh_tuu: 'Trainer được yêu thích 2025',
        chuyen_mon: ['yoga'], tinh_trang: 1, is_active: 1, is_block: 0, id_phong_tap: 1,
    },
    {
        id: 6, ho_ten: 'Đỗ Minh Khôi', chuc_danh: 'CrossFit Coach',
        mo_ta: 'Huấn luyện viên CrossFit và thể lực.',
        so_nam_kinh_nghiem: '8', chuyen_mon: ['strength'],
        tinh_trang: 0, is_active: 1, is_block: 0, id_phong_tap: 2,
    },
];

const getInitials = (name: string) => name.trim().split(/\s+/).slice(-2).map(x => x.charAt(0)).join('').toUpperCase();
const getExperience = (t: Trainer) => t.so_nam_kinh_nghiem ? `${t.so_nam_kinh_nghiem} năm kinh nghiệm` : 'Huấn luyện viên';

const getSpecialties = (t: Trainer) => {
    const map: Record<string, string> = { strength: 'Tăng cơ', weight: 'Giảm cân', yoga: 'Yoga', recovery: 'Phục hồi' };
    return (t.chuyen_mon || []).map(x => map[x] || x).slice(0, 3);
};

const PTListScreen = ({ navigation, route }: any) => {
    const [selectedPackage, setSelectedPackage] = useState<TrainingPackage | null>(null);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchText, setSearchText] = useState('');
    const [detail, setDetail] = useState<Trainer | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [packageLoading, setPackageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Khôi phục lựa chọn
    useEffect(() => {
        const restoreSelection = async () => {
            try {
                let pkg = route?.params?.selectedPackage || null;
                if (!pkg) {
                    const saved = await AsyncStorage.getItem(PACKAGE_KEY);
                    pkg = saved ? JSON.parse(saved) : null;
                }

                setSelectedPackage(pkg);
                setSelectedTrainerId(null);

                const saved = await AsyncStorage.getItem(TRAINER_KEY);
                if (saved && pkg) {
                    const parsed = JSON.parse(saved);
                    if (String(parsed.selected_for_package_id) === String(pkg.id)) {
                        setSelectedTrainerId(String(parsed.id));
                    } else {
                        await AsyncStorage.removeItem(TRAINER_KEY);
                    }
                }
            } catch {
                setSelectedPackage(null);
                setSelectedTrainerId(null);
            } finally {
                setPackageLoading(false);
            }
        };
        restoreSelection();
    }, [route?.params?.selectedPackage]);

    // Tải danh sách PT từ Backend API
    const loadTrainers = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const res = await apiFitlife.get('/trainers');
            if (res.data?.status && Array.isArray(res.data?.data) && res.data.data.length > 0) {
                setTrainers(res.data.data);
            } else {
                setTrainers(MOCK_TRAINERS.filter(t =>
                    Number(t.tinh_trang) === 1 && Number(t.is_active) === 1 && Number(t.is_block) === 0
                ));
            }
        } catch (e) {
            console.log('Lỗi tải danh sách PT:', e);
            setTrainers(MOCK_TRAINERS.filter(t =>
                Number(t.tinh_trang) === 1 && Number(t.is_active) === 1 && Number(t.is_block) === 0
            ));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadTrainers(); }, [loadTrainers]);

    // Tìm kiếm và lọc PT
    const filteredTrainers = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();
        const terms: Record<string, string[]> = {
            strength: ['tăng cơ', 'sức mạnh', 'strength', 'thể hình'],
            weight: ['giảm cân', 'sức bền', 'weight loss'],
            yoga: ['yoga'],
            recovery: ['phục hồi', 'recovery'],
        };

        return trainers.filter(t => {
            const content = [t.ho_ten, t.chuc_danh, t.mo_ta, t.chung_chi, ...(t.chuyen_mon || [])].filter(Boolean).join(' ').toLowerCase();
            const matchesSearch = !keyword || content.includes(keyword);
            const matchesFilter = activeFilter === 'all' || (t.chuyen_mon || []).includes(activeFilter) ||
                (terms[activeFilter] || []).some(term => content.includes(term));
            return matchesSearch && matchesFilter;
        });
    }, [trainers, activeFilter, searchText]);

    const selectedTrainer = useMemo(
        () => trainers.find(t => String(t.id) === selectedTrainerId) || null,
        [trainers, selectedTrainerId]
    );

    const requiresPT = selectedPackage?.loai === 'pt' || Number(selectedPackage?.so_buoi_pt || 0) > 0;
    const cannotContinue = !selectedPackage || loading || (requiresPT && !selectedTrainer);

    // Chọn huấn luyện viên
    const handleSelectTrainer = async (trainer: Trainer) => {
        if (!selectedPackage) return Alert.alert('Chưa chọn gói tập', 'Vui lòng quay lại lựa chọn gói tập trước.');
        try {
            await AsyncStorage.setItem(TRAINER_KEY, JSON.stringify({ ...trainer, selected_for_package_id: selectedPackage.id }));
            setSelectedTrainerId(String(trainer.id));
            setDetail(null);
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu PT đã chọn.');
        }
    };

    // Chuyển sang xem lại đăng ký
    const handleContinue = async () => {
        if (!selectedPackage) return Alert.alert('Thông báo', 'Bạn cần chọn gói tập trước.');
        if (requiresPT && !selectedTrainer) return Alert.alert('Chưa chọn PT', 'Gói tập này yêu cầu lựa chọn huấn luyện viên cá nhân.');

        try {
            if (!selectedTrainer) await AsyncStorage.removeItem(TRAINER_KEY);

            if (navigation.getState()?.routeNames?.includes('RegistrationReview')) {
                navigation.navigate('RegistrationReview', { selectedPackage, selectedTrainer: selectedTrainer || null });
            } else {
                Alert.alert('Đã lưu lựa chọn', 'Thông tin đã được lưu. Trang xem lại đăng ký sẽ được tạo ở bước tiếp theo.');
            }
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu thông tin đăng ký.');
        }
    };

    // Ảnh PT
    const renderAvatar = (trainer: Trainer, size = 70) => {
        const url = trainer.hinh_anh;
        const avatarStyle = { width: size, height: size, borderRadius: size / 3 };

        return (
            <View style={[styles.avatar, avatarStyle]}>
                {url && /^https?:\/\//.test(url) ? (
                    <Image source={{ uri: url }} style={avatarStyle} resizeMode="cover" />
                ) : (
                    <Text style={[styles.avatarText, { fontSize: size * 0.29 }]}>{getInitials(trainer.ho_ten)}</Text>
                )}
            </View>
        );
    };

    // Card PT
    const renderTrainer = ({ item }: { item: Trainer }) => {
        const selected = selectedTrainerId === String(item.id);
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => handleSelectTrainer(item)}
                style={[styles.trainerCard, selected && styles.trainerCardSelected]}>

                <View style={styles.trainerTop}>
                    {renderAvatar(item)}
                    <View style={styles.trainerInfo}>
                        <Text style={styles.trainerName}>{item.ho_ten}</Text>
                        <Text style={styles.trainerRole}>{item.chuc_danh || 'Huấn luyện viên'}</Text>
                        <View style={styles.experienceRow}>
                            <Ionicons name="ribbon-outline" size={15} color={COLORS.primary} />
                            <Text style={styles.experienceText}>{getExperience(item)}</Text>
                        </View>
                    </View>
                    <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={25}
                        color={selected ? COLORS.primary : '#B9CED1'} />
                </View>

                {getSpecialties(item).length > 0 && (
                    <View style={styles.tagsRow}>
                        {getSpecialties(item).map(tag => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={styles.trainerDescription} numberOfLines={2}>
                    {item.mo_ta || 'Đồng hành và hỗ trợ hội viên trong quá trình tập luyện.'}
                </Text>

                <View style={styles.cardDivider} />
                <View style={styles.trainerBottom}>
                    <TouchableOpacity style={styles.viewProfileButton} onPress={() => setDetail(item)}>
                        <Text style={styles.viewProfileText}>Xem hồ sơ PT</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.selectButton, selected && styles.selectButtonActive]}
                        onPress={() => handleSelectTrainer(item)}>
                        <Text style={[styles.selectButtonText, selected && styles.selectButtonTextActive]}>
                            {selected ? 'Đã chọn' : 'Lựa chọn'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDetailField = (icon: string, title: string, value?: string | null) => {
        if (!value) return null;
        return (
            <View style={styles.detailField}>
                <View style={styles.detailFieldIcon}>
                    <Ionicons name={icon} size={19} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.detailFieldTitle}>{title}</Text>
                    <Text style={styles.detailFieldText}>{value}</Text>
                </View>
            </View>
        );
    };

    if (packageLoading) return (
        <SafeAreaView style={styles.container}>
            <View style={styles.centerState}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.stateText}>Đang chuẩn bị lựa chọn PT...</Text>
            </View>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <AppHeader
                title="Chọn huấn luyện viên"
                onBack={() => navigation.goBack()}
                rightComponent={
                    <Ionicons name="people-outline" size={22} color={COLORS.primary} />
                }
            />

            {/* Progress */}
            <View style={styles.progressContainer}>
                <View style={styles.progressRow}>
                    <Text style={styles.progressStep}>BƯỚC 02 / 04</Text>
                    <Text style={styles.progressName}>Lựa chọn PT</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                </View>
            </View>

            <FlatList
                data={filteredTrainers}
                renderItem={renderTrainer}
                keyExtractor={item => String(item.id)}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTrainers(true)} tintColor={COLORS.primary} />}
                ListHeaderComponent={
                    <>
                        {/* Banner */}
                        <LinearGradient colors={['#087F8F', '#064E60']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                            <View style={styles.heroBadge}>
                                <Ionicons name="fitness-outline" size={15} color="#D4F9FA" />
                                <Text style={styles.heroBadgeText}>VISIONFIT TRAINERS</Text>
                            </View>
                            <Text style={styles.heroTitle}>Người đồng hành{'\n'}cùng mục tiêu của bạn</Text>
                            <Text style={styles.heroDescription}>Khám phá đội ngũ huấn luyện viên và tìm người phù hợp với hành trình tập luyện.</Text>
                            <View style={styles.heroFooter}>
                                <Ionicons name="checkmark-circle-outline" size={17} color="#D9F6F6" />
                                <Text style={styles.heroFooterText}>Huấn luyện viên đang hoạt động</Text>
                            </View>
                        </LinearGradient>

                        {/* Gói đã chọn */}
                        <View style={styles.packageBox}>
                            <View style={styles.packageIcon}>
                                <Ionicons name="barbell" size={22} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.packageLabel}>GÓI TẬP ĐÃ CHỌN</Text>
                                <Text style={styles.packageName} numberOfLines={2}>{selectedPackage?.ten_goi || 'Chưa chọn gói tập'}</Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={22} color={selectedPackage ? COLORS.primary : COLORS.muted} />
                        </View>

                        {!selectedPackage && (
                            <View style={styles.warningBox}>
                                <Ionicons name="alert-circle-outline" size={19} color="#9B6A21" />
                                <Text style={styles.warningText}>Bạn cần quay lại chọn gói tập trước khi tiếp tục đăng ký.</Text>
                            </View>
                        )}

                        {/* Danh sách PT */}
                        <View style={styles.sectionHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sectionTitle}>Đội ngũ huấn luyện viên</Text>
                                <Text style={styles.sectionSubtitle}>Tìm người đồng hành phù hợp với bạn</Text>
                            </View>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{trainers.length} PT</Text>
                            </View>
                        </View>

                        {/* Tìm kiếm */}
                        <View style={styles.searchBox}>
                            <Ionicons name="search-outline" size={20} color={COLORS.muted} />
                            <TextInput style={styles.searchInput} value={searchText} onChangeText={setSearchText}
                                placeholder="Tìm tên hoặc chuyên môn PT..." placeholderTextColor="#91AAAE"
                                returnKeyType="search" onSubmitEditing={() => Keyboard.dismiss()} />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText('')}>
                                    <Ionicons name="close-circle" size={19} color={COLORS.muted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Bộ lọc */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled" contentContainerStyle={styles.filtersRow}>
                            {FILTERS.map(filter => {
                                const active = activeFilter === filter.id;
                                return (
                                    <TouchableOpacity key={filter.id} onPress={() => setActiveFilter(filter.id)}
                                        style={[styles.filterChip, active && styles.filterChipActive]}>
                                        <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        {loading ? (
                            <>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.stateText}>Đang tải danh sách PT...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name={error ? 'cloud-offline-outline' : 'people-outline'} size={46} color={COLORS.muted} />
                                <Text style={styles.emptyTitle}>{error ? 'Không thể tải dữ liệu' : 'Không tìm thấy PT phù hợp'}</Text>
                                <Text style={styles.stateText}>{error || 'Hãy thử từ khóa hoặc bộ lọc khác.'}</Text>
                                {error && (
                                    <TouchableOpacity style={styles.retryButton} onPress={() => loadTrainers()}>
                                        <Text style={styles.retryText}>Thử lại</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.noteBox}>
                        <Ionicons name="information-circle-outline" size={19} color={COLORS.primary} />
                        <Text style={styles.noteText}>Việc lựa chọn PT và lịch tập sẽ được xác nhận theo điều kiện của gói đăng ký.</Text>
                    </View>
                }
            />

            {/* Thanh lựa chọn */}
            <View style={styles.bottomBar}>
                {selectedTrainer ? (
                    <View style={styles.selectionSummary}>
                        {renderAvatar(selectedTrainer, 43)}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryLabel}>HUẤN LUYỆN VIÊN ĐÃ CHỌN</Text>
                            <Text style={styles.summaryName} numberOfLines={1}>{selectedTrainer.ho_ten}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={23} color={COLORS.primary} />
                    </View>
                ) : (
                    <Text style={styles.noSelectionText}>
                        {requiresPT ? 'Vui lòng chọn huấn luyện viên để tiếp tục' : 'Bạn có thể chọn PT hoặc bỏ qua bước này'}
                    </Text>
                )}

                <TouchableOpacity style={[styles.continueButton, cannotContinue && styles.continueButtonDisabled]}
                    disabled={!!cannotContinue} onPress={handleContinue}>
                    <Text style={styles.continueText}>{selectedTrainer ? 'Tiếp tục đăng ký' : 'Bỏ qua PT và tiếp tục'}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Modal chi tiết */}
            <Modal visible={detail !== null} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setDetail(null)} />

                    {detail && (
                        <SafeAreaView style={styles.modalSheet} edges={['bottom']}>
                            <View style={styles.modalHandle} />

                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Hồ sơ huấn luyện viên</Text>
                                <TouchableOpacity onPress={() => setDetail(null)}>
                                    <Ionicons name="close-circle" size={28} color={COLORS.muted} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                                <View style={styles.profileHero}>
                                    {renderAvatar(detail, 84)}
                                    <Text style={styles.profileName}>{detail.ho_ten}</Text>
                                    <Text style={styles.profileRole}>{detail.chuc_danh || 'Huấn luyện viên cá nhân'}</Text>
                                    <View style={styles.profileExperience}>
                                        <Ionicons name="ribbon-outline" size={17} color={COLORS.primary} />
                                        <Text style={styles.profileExperienceText}>{getExperience(detail)}</Text>
                                    </View>
                                </View>

                                {renderDetailField('person-outline', 'Giới thiệu', detail.mo_ta)}
                                {renderDetailField('barbell-outline', 'Kinh nghiệm làm việc', detail.kinh_nghiem_lam_viec)}
                                {renderDetailField('school-outline', 'Quá trình đào tạo', detail.qua_trinh_dao_tao)}
                                {renderDetailField('document-text-outline', 'Chứng chỉ', detail.chung_chi)}
                                {renderDetailField('trophy-outline', 'Thành tựu', detail.thanh_tuu)}

                                <View style={styles.availableBadge}>
                                    <Ionicons name="checkmark-circle" size={17} color={COLORS.primary} />
                                    <Text style={styles.availableText}>Đang hoạt động tại VisionFit</Text>
                                </View>
                            </ScrollView>

                            <TouchableOpacity style={styles.modalChooseButton} onPress={() => handleSelectTrainer(detail)}>
                                <Text style={styles.modalChooseText}>
                                    {selectedTrainerId === String(detail.id) ? 'Xác nhận lựa chọn' : 'Chọn huấn luyện viên này'}
                                </Text>
                                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
                            </TouchableOpacity>
                        </SafeAreaView>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
    },
    header: {
        height: 62,
        paddingHorizontal: 19,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        color: COLORS.text,
        fontWeight: '800',
    },
    headerIcon: {
        width: 42,
        alignItems: 'center',
    },
    progressContainer: {
        paddingHorizontal: 22,
        paddingTop: 12,
        paddingBottom: 18,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 11,
    },
    progressStep: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        color: COLORS.primary,
    },
    progressName: {
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: '600',
    },
    progressTrack: {
        height: 5,
        borderRadius: 8,
        backgroundColor: '#DCEBED',
        overflow: 'hidden',
    },
    progressFill: {
        width: '50%',
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    listContent: {
        paddingHorizontal: 18,
        paddingBottom: 24,
        flexGrow: 1,
    },
    hero: {
        borderRadius: 23,
        padding: 23,
        marginTop: 7,
        marginBottom: 17,
        minHeight: 210,
    },
    heroBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.14)',
        paddingHorizontal: 11,
        paddingVertical: 7,
        marginBottom: 20,
    },
    heroBadgeText: {
        color: '#E5FCFC',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    heroTitle: {
        color: COLORS.white,
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '900',
    },
    heroDescription: {
        color: '#D1EEF0',
        fontSize: 12,
        lineHeight: 19,
        marginTop: 10,
        maxWidth: 300,
    },
    heroFooter: {
        flexDirection: 'row',
        gap: 7,
        alignItems: 'center',
        marginTop: 18,
    },
    heroFooterText: {
        color: '#D4F1F2',
        fontSize: 11,
        fontWeight: '600',
    },
    packageBox: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
        borderRadius: 17,
        marginBottom: 26,
    },
    packageIcon: {
        width: 44,
        height: 44,
        borderRadius: 13,
        backgroundColor: COLORS.soft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    packageLabel: {
        color: COLORS.muted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 5,
    },
    packageName: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
    },
    warningBox: {
        flexDirection: 'row',
        gap: 9,
        padding: 13,
        marginBottom: 18,
        backgroundColor: '#FFF5E6',
        borderRadius: 12,
    },
    warningText: {
        flex: 1,
        color: '#976C29',
        fontSize: 12,
        lineHeight: 19,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: COLORS.text,
    },
    sectionSubtitle: {
        color: COLORS.muted,
        fontSize: 12,
        marginTop: 5,
    },
    countBadge: {
        backgroundColor: COLORS.soft,
        borderRadius: 15,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    countText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '800',
    },
    searchBox: {
        height: 51,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 17,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 0,
        fontSize: 13,
        color: COLORS.text,
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 9,
        paddingBottom: 20,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.muted,
    },
    filterTextActive: {
        color: COLORS.white,
    },
    trainerCard: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 21,
        padding: 17,
        backgroundColor: COLORS.white,
        marginBottom: 15,
    },
    trainerCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#FCFFFF',
        elevation: 2,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.07,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
    },
    trainerTop: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: COLORS.soft,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.primary,
        fontWeight: '900',
    },
    trainerInfo: {
        flex: 1,
    },
    trainerName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 5,
    },
    trainerRole: {
        color: COLORS.muted,
        fontSize: 12,
        marginBottom: 9,
    },
    experienceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    experienceText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 16,
    },
    tag: {
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: COLORS.soft,
    },
    tagText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    trainerDescription: {
        color: '#55747A',
        fontSize: 12,
        lineHeight: 20,
        marginTop: 14,
    },
    cardDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    trainerBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    viewProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    viewProfileText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.primary,
    },
    selectButton: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingHorizontal: 17,
        paddingVertical: 10,
        borderRadius: 11,
        backgroundColor: COLORS.white,
    },
    selectButtonActive: {
        backgroundColor: COLORS.primary,
    },
    selectButtonText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '800',
    },
    selectButtonTextActive: {
        color: COLORS.white,
    },
    noteBox: {
        flexDirection: 'row',
        gap: 9,
        marginTop: 8,
        padding: 14,
        borderRadius: 13,
        backgroundColor: COLORS.soft,
    },
    noteText: {
        flex: 1,
        color: COLORS.primary,
        fontSize: 11,
        lineHeight: 18,
    },
    emptyState: {
        paddingVertical: 48,
        alignItems: 'center',
        gap: 12,
    },
    emptyTitle: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '800',
    },
    stateText: {
        color: COLORS.muted,
        fontSize: 12,
        lineHeight: 19,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 11,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: '800',
    },
    bottomBar: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 18,
        paddingTop: 13,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    selectionSummary: {
        flexDirection: 'row',
        gap: 11,
        alignItems: 'center',
        marginBottom: 14,
    },
    summaryLabel: {
        color: COLORS.muted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 5,
    },
    summaryName: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
    },
    noSelectionText: {
        fontSize: 12,
        color: COLORS.muted,
        textAlign: 'center',
        marginBottom: 13,
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        height: 54,
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#AECBD0',
    },
    continueText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '800',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(4,28,35,0.55)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalSheet: {
        maxHeight: '85%',
        paddingHorizontal: 21,
        paddingBottom: 15,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 27,
        borderTopRightRadius: 27,
    },
    modalHandle: {
        width: 44,
        height: 5,
        borderRadius: 5,
        backgroundColor: '#D8E7E9',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 18,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.text,
    },
    modalContent: {
        paddingBottom: 20,
    },
    profileHero: {
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 19,
        backgroundColor: COLORS.background,
        marginBottom: 20,
    },
    profileName: {
        marginTop: 13,
        fontSize: 19,
        fontWeight: '900',
        color: COLORS.text,
    },
    profileRole: {
        color: COLORS.muted,
        fontSize: 12,
        marginTop: 6,
    },
    profileExperience: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        marginTop: 11,
    },
    profileExperienceText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 12,
    },
    detailField: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    detailFieldIcon: {
        width: 37,
        height: 37,
        borderRadius: 11,
        backgroundColor: COLORS.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailFieldTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 6,
    },
    detailFieldText: {
        fontSize: 12,
        color: '#57747A',
        lineHeight: 20,
    },
    availableBadge: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        gap: 7,
        alignItems: 'center',
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: COLORS.soft,
        marginTop: 18,
    },
    availableText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '700',
    },
    modalChooseButton: {
        height: 54,
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    modalChooseText: {
        fontSize: 14,
        color: COLORS.white,
        fontWeight: '800',
    },
});

export default PTListScreen;
