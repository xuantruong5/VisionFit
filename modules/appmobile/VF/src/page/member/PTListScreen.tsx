import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, FlatList, Modal, ActivityIndicator, RefreshControl, Alert, StatusBar, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import apiFitlife from '../../general/api';
import { COLORS, SHADOWS } from '../../general/theme';


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

            const routeNames = navigation.getState()?.routeNames || [];
            const target = routeNames.includes('RegistrationReview') ? 'RegistrationReview' : routeNames.includes('RegistrationReviewScreen') ? 'RegistrationReviewScreen' : 'RegistrationReview';
            navigation.navigate(target, { selectedPackage, selectedTrainer: selectedTrainer || null });
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu thông tin đăng ký.');
        }
    };

    // Ảnh PT
    const renderAvatar = (trainer: Trainer, size = 70) => {
        const url = trainer.hinh_anh;
        const avatarStyle = { width: size, height: size, borderRadius: size / 2 };

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

                {selected && <View style={styles.selectedStripe} />}
                <View style={styles.trainerTop}>
                    <View>
                        {renderAvatar(item, 64)}
                        <View style={styles.onlineDot} />
                    </View>
                    <View style={styles.trainerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.trainerName} numberOfLines={1}>{item.ho_ten}</Text>
                            <Ionicons name="checkmark-circle" size={15} color={COLORS.accentBlue} />
                        </View>
                        <Text style={styles.trainerRole}>{item.chuc_danh || 'Huấn luyện viên'}</Text>
                        <View style={styles.experienceRow}>
                            <Ionicons name="ribbon" size={13} color={COLORS.accentGold} />
                            <Text style={styles.experienceText}>{getExperience(item)}</Text>
                        </View>
                    </View>
                    <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
                        {selected && <Ionicons name="checkmark" size={15} color={COLORS.white} />}
                    </View>
                </View>

                {getSpecialties(item).length > 0 && (
                    <View style={styles.tagsRow}>
                        {getSpecialties(item).map(tag => (
                            <View key={tag} style={styles.tag}>
                                <Ionicons name="flash" size={11} color={COLORS.primary} />
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
                        <Ionicons name="document-text-outline" size={15} color={COLORS.primary} />
                        <Text style={styles.viewProfileText}>Xem hồ sơ PT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.selectButton, selected && styles.selectButtonActive]}
                        onPress={() => handleSelectTrainer(item)}>
                        <Ionicons name={selected ? 'checkmark-circle' : 'add-circle-outline'} size={16}
                            color={selected ? COLORS.white : COLORS.primary} />
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
                    <Ionicons name={icon} size={18} color={COLORS.primary} />
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
                    <View style={styles.headerIcon}>
                        <Ionicons name="people-outline" size={20} color={COLORS.primary} />
                    </View>
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
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                            <View style={styles.heroDecor} />
                            <View style={styles.heroDecorSmall} />
                            <View style={styles.heroBadge}>
                                <Ionicons name="fitness-outline" size={14} color={COLORS.white} />
                                <Text style={styles.heroBadgeText}>VISIONFIT TRAINERS</Text>
                            </View>
                            <Text style={styles.heroTitle}>Người đồng hành{'\n'}cùng mục tiêu của bạn</Text>
                            <Text style={styles.heroDescription}>Khám phá đội ngũ huấn luyện viên và tìm người phù hợp với hành trình tập luyện.</Text>
                            <View style={styles.heroFooter}>
                                <View style={styles.heroLiveDot} />
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
                            <Ionicons name="checkmark-circle" size={22} color={selectedPackage ? COLORS.accentGreen : COLORS.textLight} />
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
                            <Ionicons name="search-outline" size={19} color={COLORS.primary} />
                            <TextInput style={styles.searchInput} value={searchText} onChangeText={setSearchText}
                                placeholder="Tìm tên hoặc chuyên môn PT..." placeholderTextColor={COLORS.textLight}
                                returnKeyType="search" onSubmitEditing={() => Keyboard.dismiss()} />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText('')}>
                                    <Ionicons name="close-circle" size={19} color={COLORS.textMuted} />
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
                                <View style={styles.emptyIcon}>
                                    <Ionicons name={error ? 'cloud-offline-outline' : 'people-outline'} size={34} color={COLORS.primary} />
                                </View>
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
                        <Ionicons name="information-circle" size={19} color={COLORS.primary} />
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
                        <View style={styles.summaryCheck}>
                            <Ionicons name="checkmark" size={15} color={COLORS.white} />
                        </View>
                    </View>
                ) : (
                    <Text style={styles.noSelectionText}>
                        {requiresPT ? 'Vui lòng chọn huấn luyện viên để tiếp tục' : 'Bạn có thể chọn PT hoặc bỏ qua bước này'}
                    </Text>
                )}

                <TouchableOpacity activeOpacity={0.85}
                    disabled={!!cannotContinue} onPress={handleContinue}>
                    <LinearGradient
                        colors={cannotContinue ? ['#AECBD0', '#AECBD0'] : [COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.continueButton}
                    >
                        <Text style={styles.continueText}>{selectedTrainer ? 'Tiếp tục đăng ký' : 'Bỏ qua PT và tiếp tục'}</Text>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                    </LinearGradient>
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
                                <TouchableOpacity onPress={() => setDetail(null)} style={styles.modalClose}>
                                    <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                                <LinearGradient colors={[COLORS.surfaceTeal, COLORS.white]} style={styles.profileHero}>
                                    <View style={styles.profileAvatarRing}>
                                        {renderAvatar(detail, 84)}
                                    </View>
                                    <Text style={styles.profileName}>{detail.ho_ten}</Text>
                                    <Text style={styles.profileRole}>{detail.chuc_danh || 'Huấn luyện viên cá nhân'}</Text>
                                    <View style={styles.profileExperience}>
                                        <Ionicons name="ribbon" size={15} color={COLORS.accentGold} />
                                        <Text style={styles.profileExperienceText}>{getExperience(detail)}</Text>
                                    </View>
                                    {getSpecialties(detail).length > 0 && (
                                        <View style={styles.profileTags}>
                                            {getSpecialties(detail).map(tag => (
                                                <View key={tag} style={styles.tag}>
                                                    <Text style={styles.tagText}>{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </LinearGradient>

                                {renderDetailField('person-outline', 'Giới thiệu', detail.mo_ta)}
                                {renderDetailField('barbell-outline', 'Kinh nghiệm làm việc', detail.kinh_nghiem_lam_viec)}
                                {renderDetailField('school-outline', 'Quá trình đào tạo', detail.qua_trinh_dao_tao)}
                                {renderDetailField('document-text-outline', 'Chứng chỉ', detail.chung_chi)}
                                {renderDetailField('trophy-outline', 'Thành tựu', detail.thanh_tuu)}

                                <View style={styles.availableBadge}>
                                    <View style={styles.heroLiveDotGreen} />
                                    <Text style={styles.availableText}>Đang hoạt động tại VisionFit</Text>
                                </View>
                            </ScrollView>

                            <TouchableOpacity activeOpacity={0.85} onPress={() => handleSelectTrainer(detail)}>
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.modalChooseButton}
                                >
                                    <Text style={styles.modalChooseText}>
                                        {selectedTrainerId === String(detail.id) ? 'Xác nhận lựa chọn' : 'Chọn huấn luyện viên này'}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={19} color={COLORS.white} />
                                </LinearGradient>
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
        gap: 14,
    },
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressStep: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        color: COLORS.primary,
    },
    progressName: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primaryLight,
        overflow: 'hidden',
    },
    progressFill: {
        width: '50%',
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        flexGrow: 1,
    },
    hero: {
        borderRadius: 22,
        padding: 20,
        marginBottom: 16,
        overflow: 'hidden',
        ...SHADOWS.glow,
    },
    heroDecor: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.07)',
        top: -70,
        right: -50,
    },
    heroDecorSmall: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255,255,255,0.07)',
        bottom: -40,
        left: -30,
    },
    heroBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 14,
    },
    heroBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    heroTitle: {
        color: COLORS.white,
        fontSize: 22,
        lineHeight: 29,
        fontWeight: '900',
    },
    heroDescription: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12.5,
        lineHeight: 19,
        marginTop: 8,
        maxWidth: 300,
    },
    heroFooter: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        marginTop: 14,
    },
    heroLiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6EE7B7',
    },
    heroLiveDotGreen: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accentGreen,
    },
    heroFooterText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11.5,
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
        borderRadius: 18,
        marginBottom: 22,
        ...SHADOWS.card,
    },
    packageIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.surfaceTeal,
        justifyContent: 'center',
        alignItems: 'center',
    },
    packageLabel: {
        color: COLORS.textMuted,
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    packageName: {
        fontSize: 14.5,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    warningBox: {
        flexDirection: 'row',
        gap: 9,
        padding: 12,
        marginTop: -8,
        marginBottom: 18,
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FDE6C4',
        borderRadius: 14,
    },
    warningText: {
        flex: 1,
        color: '#976C29',
        fontSize: 12,
        lineHeight: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    sectionSubtitle: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    countBadge: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    countText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '800',
    },
    searchBox: {
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        ...SHADOWS.small,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 0,
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        height: 36,
        justifyContent: 'center',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.glow,
    },
    filterText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    filterTextActive: {
        color: COLORS.white,
    },
    trainerCard: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 20,
        padding: 16,
        backgroundColor: COLORS.white,
        marginBottom: 14,
        ...SHADOWS.card,
    },
    trainerCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#FBFEFE',
        ...SHADOWS.card,
        shadowOpacity: 0.12,
        elevation: 6,
    },
    selectedStripe: {
        position: 'absolute',
        top: 20,
        left: -1.5,
        bottom: 20,
        width: 4,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
        backgroundColor: COLORS.primary,
    },
    trainerTop: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: COLORS.surfaceTeal,
        borderWidth: 2,
        borderColor: COLORS.borderFocus,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.primary,
        fontWeight: '900',
    },
    onlineDot: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.accentGreen,
        borderWidth: 2.5,
        borderColor: COLORS.white,
    },
    trainerInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 2,
    },
    trainerName: {
        flexShrink: 1,
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    trainerRole: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginBottom: 6,
    },
    experienceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: '#FFF7ED',
    },
    experienceText: {
        color: '#B47A30',
        fontSize: 11,
        fontWeight: '700',
    },
    checkCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 14,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
    },
    tagText: {
        color: COLORS.primary,
        fontSize: 11.5,
        fontWeight: '700',
    },
    trainerDescription: {
        color: COLORS.textSecondary,
        fontSize: 12.5,
        lineHeight: 19,
        marginTop: 12,
    },
    cardDivider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: 14,
    },
    trainerBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    viewProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 38,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
    },
    viewProfileText: {
        fontSize: 12.5,
        fontWeight: '800',
        color: COLORS.primary,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        paddingHorizontal: 14,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    selectButtonActive: {
        backgroundColor: COLORS.primary,
    },
    selectButtonText: {
        fontSize: 12.5,
        color: COLORS.primary,
        fontWeight: '800',
    },
    selectButtonTextActive: {
        color: COLORS.white,
    },
    noteBox: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
        padding: 14,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceTeal,
        borderWidth: 1,
        borderColor: COLORS.borderFocus,
    },
    noteText: {
        flex: 1,
        color: COLORS.primaryDark,
        fontSize: 12,
        lineHeight: 18,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 10,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    emptyTitle: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '800',
    },
    stateText: {
        color: COLORS.textMuted,
        fontSize: 12.5,
        lineHeight: 18,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        height: 42,
        justifyContent: 'center',
        borderRadius: 14,
        marginTop: 4,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: '800',
    },
    bottomBar: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        ...SHADOWS.card,
        shadowOffset: { width: 0, height: -4 },
        elevation: 10,
    },
    selectionSummary: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        marginBottom: 12,
        padding: 10,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceTeal,
    },
    summaryLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    summaryName: {
        fontSize: 14.5,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    summaryCheck: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noSelectionText: {
        fontSize: 12.5,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 12,
    },
    continueButton: {
        borderRadius: 16,
        height: 52,
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalHandle: {
        width: 42,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.border,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 14,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    modalClose: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        paddingBottom: 16,
    },
    profileHero: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 8,
    },
    profileAvatarRing: {
        padding: 4,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        ...SHADOWS.card,
    },
    profileName: {
        marginTop: 12,
        fontSize: 19,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    profileRole: {
        color: COLORS.textMuted,
        fontSize: 12.5,
        marginTop: 3,
    },
    profileExperience: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: '#FFF7ED',
    },
    profileExperienceText: {
        color: '#B47A30',
        fontWeight: '700',
        fontSize: 12,
    },
    profileTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
    },
    detailField: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    detailFieldIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailFieldTitle: {
        fontSize: 13.5,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 3,
    },
    detailFieldText: {
        fontSize: 12.5,
        color: COLORS.textSecondary,
        lineHeight: 19,
    },
    availableBadge: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        gap: 7,
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#ECFDF5',
        marginTop: 16,
    },
    availableText: {
        fontSize: 11.5,
        color: COLORS.accentGreen,
        fontWeight: '700',
    },
    modalChooseButton: {
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    modalChooseText: {
        fontSize: 15,
        color: COLORS.white,
        fontWeight: '800',
    },
});

export default PTListScreen;
