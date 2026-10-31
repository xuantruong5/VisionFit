import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal, Pressable, ActivityIndicator, RefreshControl, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import { COLORS as THEME, SHADOWS } from '../../general/theme';

const COLORS = {
    primary: THEME.primary, primaryDark: THEME.primaryDark, background: THEME.background,
    white: THEME.white, text: THEME.textPrimary, muted: THEME.textMuted,
    border: THEME.border, soft: THEME.surfaceTeal, gold: THEME.accentGold,
};

const STORAGE_KEY = 'visionfit_selected_package';

export interface TrainingPackage {
    id: number | string;
    ten_goi: string;
    loai: 'gym' | 'ai' | 'pt';
    gia: number;
    thoi_han: number;
    co_ai: boolean;
    co_trainer_review: boolean;
    so_buoi_pt: number;
    noi_bat: boolean;
    trang_thai: 'active' | 'inactive';
    mo_ta?: string;
    quyen_loi?: string[];
}

// Dữ liệu mẫu
const MOCK_PACKAGES: TrainingPackage[] = [
    {
        id: 1, ten_goi: 'Gym Cơ bản 1 tháng', loai: 'gym',
        gia: 500000, thoi_han: 30, co_ai: false, co_trainer_review: false,
        so_buoi_pt: 0, noi_bat: false, trang_thai: 'active',
        mo_ta: 'Khởi đầu hành trình rèn luyện sức khỏe.',
        quyen_loi: ['Sử dụng khu vực tập Gym', 'Tiếp cận các thiết bị tập luyện', 'Tập luyện linh hoạt trong thời hạn gói'],
    },
    {
        id: 2, ten_goi: 'Gym + AI 1 tháng', loai: 'ai',
        gia: 850000, thoi_han: 30, co_ai: true, co_trainer_review: true,
        so_buoi_pt: 0, noi_bat: true, trang_thai: 'active',
        mo_ta: 'Tập luyện thông minh cùng công nghệ AI.',
        quyen_loi: ['Sử dụng khu vực tập Gym', 'Phân tích và hỗ trợ tập luyện bằng AI', 'Huấn luyện viên đánh giá tiến độ', 'Theo dõi quá trình tập luyện'],
    },
    {
        id: 3, ten_goi: 'Gym + AI 3 tháng', loai: 'ai',
        gia: 2200000, thoi_han: 90, co_ai: true, co_trainer_review: true,
        so_buoi_pt: 0, noi_bat: false, trang_thai: 'active',
        mo_ta: 'Duy trì thói quen tập luyện dài hạn.',
        quyen_loi: ['Sử dụng khu vực tập Gym trong 90 ngày', 'Phân tích và hỗ trợ tập luyện bằng AI', 'Huấn luyện viên đánh giá tiến độ', 'Theo dõi quá trình tập luyện'],
    },
    {
        id: 4, ten_goi: 'Personal Trainer 12 buổi', loai: 'pt',
        gia: 3600000, thoi_han: 60, co_ai: true, co_trainer_review: true,
        so_buoi_pt: 12, noi_bat: false, trang_thai: 'active',
        mo_ta: 'Đồng hành cùng huấn luyện viên cá nhân.',
        quyen_loi: ['12 buổi tập với PT cá nhân', 'Hỗ trợ phân tích tập luyện bằng AI', 'Theo dõi và đánh giá tiến độ', 'Thời hạn sử dụng 60 ngày'],
    },
    {
        id: 5, ten_goi: 'Personal Trainer 24 buổi', loai: 'pt',
        gia: 6500000, thoi_han: 90, co_ai: true, co_trainer_review: true,
        so_buoi_pt: 24, noi_bat: false, trang_thai: 'inactive',
    },
];

type FilterType = 'all' | 'gym' | 'ai' | 'pt';

const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'gym', label: 'Gym' },
    { id: 'ai', label: 'Gym + AI' },
    { id: 'pt', label: 'Có PT' },
];

const money = (value: number) => `${Number(value).toLocaleString('vi-VN')}đ`;

const getTypeLabel = (type: TrainingPackage['loai']) => {
    if (type === 'pt') return 'PERSONAL TRAINER';
    if (type === 'ai') return 'GYM + AI';
    return 'GYM BASIC';
};

const getBenefits = (item: TrainingPackage): string[] => {
    if (item.quyen_loi?.length) return item.quyen_loi;
    return [
        'Sử dụng khu vực tập Gym',
        ...(item.co_ai ? ['Hỗ trợ tập luyện bằng AI'] : []),
        ...(item.co_trainer_review ? ['Đánh giá tiến độ bởi huấn luyện viên'] : []),
        ...(item.so_buoi_pt > 0 ? [`${item.so_buoi_pt} buổi tập cùng PT`] : []),
        `Thời hạn sử dụng ${item.thoi_han} ngày`,
    ];
};

const WorkoutSelectionScreen = ({ navigation }: any) => {
    const [packages, setPackages] = useState<TrainingPackage[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [detail, setDetail] = useState<TrainingPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Tải danh sách gói tập
    // Frontend demo: dùng danh sách gói tập mẫu, không gọi API.
    const loadPackages = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const validPackages = MOCK_PACKAGES.filter(item =>
            item.trang_thai === 'active' && item.gia >= 0 && item.thoi_han > 0
        );
        setPackages(validPackages);

        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            const savedId = saved ? String(JSON.parse(saved).id) : null;
            const exists = validPackages.some(item => String(item.id) === savedId);

            setSelectedId(exists ? savedId : null);
            if (saved && !exists) await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {
            setSelectedId(null);
            setError('Không thể đọc lựa chọn đã lưu.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadPackages(); }, [loadPackages]);

    const filteredPackages = useMemo(
        () => activeFilter === 'all' ? packages : packages.filter(item => item.loai === activeFilter),
        [packages, activeFilter]
    );

    const selectedPackage = useMemo(
        () => packages.find(item => String(item.id) === selectedId),
        [packages, selectedId]
    );

    // Chọn gói tập
    const handleSelect = async (item: TrainingPackage) => {
        if (item.trang_thai !== 'active') return Alert.alert('Thông báo', 'Gói tập này hiện không khả dụng.');

        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(item));
            setSelectedId(String(item.id));
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu lựa chọn. Vui lòng thử lại.');
        }
    };

    // Tiếp tục sang trang PT
    const handleContinue = async () => {
        if (!selectedPackage) return Alert.alert('Thông báo', 'Vui lòng chọn một gói tập.');

        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPackage));

            const routeNames = navigation.getState()?.routeNames || [];
            const target = routeNames.includes('PTList') ? 'PTList' : routeNames.includes('PTListScreen') ? 'PTListScreen' : 'PTList';
            navigation.navigate(target, { selectedPackage, packageId: selectedPackage.id });
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu lựa chọn gói tập.');
        }
    };

    // Card gói tập
    const renderPackage = ({ item }: { item: TrainingPackage }) => {
        const selected = selectedId === String(item.id);
        const benefits = getBenefits(item);

        return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => handleSelect(item)}
                style={[styles.packageCard, selected && styles.selectedCard]}>

                {item.noi_bat && (
                    <View style={styles.popularRibbon}>
                        <Ionicons name="sparkles" size={12} color="#8C5D15" />
                        <Text style={styles.popularText}>PHỔ BIẾN NHẤT</Text>
                    </View>
                )}

                <View style={styles.cardTop}>
                    <View style={[styles.packageIcon, selected && styles.packageIconActive]}>
                        <Ionicons name={item.loai === 'pt' ? 'people' : 'barbell'} size={22}
                            color={selected ? COLORS.white : COLORS.primary} />
                    </View>

                    <View style={styles.typeInfo}>
                        <Text style={styles.typeLabel}>{getTypeLabel(item.loai)}</Text>
                        <Text style={styles.packageName}>{item.ten_goi}</Text>
                    </View>

                    <View style={[styles.checkBadge, selected && styles.checkBadgeActive]}>
                        {selected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                    </View>
                </View>

                <View style={styles.durationPill}>
                    <Ionicons name="time-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.durationText}>Thời hạn {item.thoi_han} ngày</Text>
                </View>

                <View style={styles.priceRow}>
                    <Text style={styles.price}>{money(item.gia)}</Text>
                    <Text style={styles.priceDescription}>/ gói tập</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.benefitList}>
                    {benefits.slice(0, 3).map((benefit, index) => (
                        <View key={index} style={styles.benefitRow}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.cardBottom}>
                    <TouchableOpacity style={styles.detailButton} onPress={() => setDetail(item)}>
                        <Text style={styles.detailText}>Xem chi tiết</Text>
                        <Ionicons name="arrow-forward" size={15} color={COLORS.primary} />
                    </TouchableOpacity>

                    {selected && (
                        <View style={styles.chosenBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                            <Text style={styles.chosenText}>Đã chọn</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <AppHeader
                title="Đăng ký gói tập"
                onBack={() => navigation.goBack()}
                rightComponent={
                    <View style={styles.headerIconTile}>
                        <Ionicons name="fitness-outline" size={20} color={COLORS.primary} />
                    </View>
                }
            />

            {/* Progress */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTop}>
                    <Text style={styles.progressLabel}>BƯỚC 01 / 04</Text>
                    <Text style={styles.progressRight}>Chọn gói tập</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                </View>
            </View>

            <FlatList
                data={filteredPackages}
                keyExtractor={item => String(item.id)}
                renderItem={renderPackage}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadPackages(true)}
                        tintColor={COLORS.primary} colors={[COLORS.primary]} />
                }
                ListHeaderComponent={
                    <>
                        {/* Banner */}
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }} style={styles.hero}>
                            <View style={styles.heroCircleLg} />
                            <View style={styles.heroCircleSm} />

                            <View style={styles.heroBadge}>
                                <Ionicons name="flash-outline" color="#E8FDFF" size={13} />
                                <Text style={styles.heroBadgeText}>VISIONFIT MEMBERSHIP</Text>
                            </View>

                            <Text style={styles.heroTitle}>Lựa chọn gói tập{'\n'}phù hợp với bạn</Text>
                            <Text style={styles.heroSubtitle}>Khởi đầu hành trình khỏe mạnh theo cách của riêng bạn.</Text>

                            <View style={styles.heroFooter}>
                                <Ionicons name="shield-checkmark-outline" size={17} color="#BDF2F2" />
                                <Text style={styles.heroFooterText}>Linh hoạt • Rõ ràng • Dễ dàng đăng ký</Text>
                            </View>
                        </LinearGradient>

                        {/* Danh sách gói */}
                        <View style={styles.sectionTitleRow}>
                            <View>
                                <Text style={styles.sectionTitle}>Khám phá gói tập</Text>
                                <Text style={styles.sectionSubtitle}>Chọn gói phù hợp với mục tiêu của bạn</Text>
                            </View>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{packages.length} gói</Text>
                            </View>
                        </View>

                        {/* Bộ lọc */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                            {FILTERS.map(filter => {
                                const active = activeFilter === filter.id;
                                return (
                                    <TouchableOpacity key={filter.id} onPress={() => setActiveFilter(filter.id)}
                                        style={[styles.filterChip, active && styles.filterChipActive]}>
                                        <Text style={[styles.filterText, active && styles.filterTextActive]}>
                                            {filter.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? (
                            <>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.emptyText}>Đang tải gói tập...</Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.emptyIconTile}>
                                    <Ionicons name={error ? 'cloud-offline-outline' : 'albums-outline'} size={30} color={COLORS.primary} />
                                </View>
                                <Text style={styles.emptyText}>{error || 'Không có gói tập phù hợp.'}</Text>
                                {error && (
                                    <TouchableOpacity style={styles.retryButton} onPress={() => loadPackages()}>
                                        <Text style={styles.retryText}>Thử lại</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                }
            />

            {/* Thanh gói đã chọn */}
            <View style={styles.bottomBar}>
                {selectedPackage ? (
                    <View style={styles.selectedSummary}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryLabel}>GÓI ĐÃ CHỌN</Text>
                            <Text style={styles.summaryName} numberOfLines={1}>{selectedPackage.ten_goi}</Text>
                        </View>
                        <Text style={styles.summaryPrice}>{money(selectedPackage.gia)}</Text>
                    </View>
                ) : (
                    <Text style={styles.noSelection}>Vui lòng chọn một gói tập để tiếp tục</Text>
                )}

                <TouchableOpacity disabled={!selectedPackage || loading} onPress={handleContinue}
                    activeOpacity={0.85} style={[styles.continueWrap, (!selectedPackage || loading) && styles.continueWrapDisabled]}>
                    <LinearGradient
                        colors={(!selectedPackage || loading) ? ['#AFCBD0', '#AFCBD0'] : [COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.continueButton}>
                        <Text style={styles.continueText}>Tiếp tục chọn PT</Text>
                        <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Modal chi tiết gói tập */}
            <Modal visible={detail !== null} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
                <View style={styles.modalContainer}>
                    <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => setDetail(null)} />

                    {detail && (
                        <SafeAreaView style={styles.modalSheet} edges={['bottom']}>
                            <View style={styles.modalHandle} />

                            <View style={styles.modalHeader}>
                                <Text style={styles.modalHeading}>Chi tiết gói tập</Text>
                                <TouchableOpacity onPress={() => setDetail(null)}>
                                    <Ionicons name="close-circle" size={29} color={COLORS.muted} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                                <View style={styles.modalIcon}>
                                    <Ionicons name="barbell" size={26} color={COLORS.primary} />
                                </View>

                                <Text style={styles.modalPackageName}>{detail.ten_goi}</Text>
                                <Text style={styles.modalDescription}>
                                    {detail.mo_ta || 'Gói tập dành cho hội viên VisionFit.'}
                                </Text>

                                <View style={styles.modalPriceBox}>
                                    <Text style={styles.modalPriceLabel}>Giá gói tập</Text>
                                    <Text style={styles.modalPrice}>{money(detail.gia)}</Text>
                                    <Text style={styles.modalDuration}>Hiệu lực: {detail.thoi_han} ngày</Text>
                                </View>

                                <Text style={styles.benefitHeading}>Quyền lợi của bạn</Text>

                                {getBenefits(detail).map((benefit, index) => (
                                    <View key={index} style={styles.modalBenefitRow}>
                                        <Ionicons name="checkmark-circle" size={21} color={COLORS.primary} />
                                        <Text style={styles.modalBenefitText}>{benefit}</Text>
                                    </View>
                                ))}

                                <View style={styles.activeStatus}>
                                    <Ionicons name="checkmark-circle-outline" size={17} color={COLORS.primary} />
                                    <Text style={styles.activeStatusText}>Gói tập đang hoạt động</Text>
                                </View>
                            </ScrollView>

                            <TouchableOpacity style={styles.modalChooseWrap}
                                onPress={async () => { await handleSelect(detail); setDetail(null); }}>
                                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalChooseButton}>
                                    <Text style={styles.modalChooseText}>Chọn gói tập này</Text>
                                    <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
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
    header: {
        height: 62,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.background,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 13,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
    },
    headerRight: {
        width: 40,
        alignItems: 'center',
    },
    headerIconTile: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 6,
    },
    progressTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        color: COLORS.primary,
    },
    progressRight: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '600',
    },
    progressTrack: {
        height: 6,
        borderRadius: 10,
        backgroundColor: THEME.borderLight,
        overflow: 'hidden',
    },
    progressFill: {
        width: '25%',
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 10,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 30,
        flexGrow: 1,
    },
    hero: {
        borderRadius: 24,
        padding: 22,
        marginTop: 10,
        marginBottom: 24,
        minHeight: 208,
        overflow: 'hidden',
        ...SHADOWS.glow,
    },
    heroCircleLg: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.07)',
        top: -70,
        right: -50,
    },
    heroCircleSm: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255,255,255,0.06)',
        bottom: -40,
        left: -25,
    },
    heroBadge: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        alignItems: 'center',
        gap: 7,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 20,
        marginBottom: 19,
    },
    heroBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.1,
        color: '#E8FDFF',
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 25,
        lineHeight: 32,
        fontWeight: '800',
        marginBottom: 9,
    },
    heroSubtitle: {
        fontSize: 12,
        lineHeight: 19,
        color: '#D0EDF0',
        maxWidth: 270,
    },
    heroFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginTop: 18,
    },
    heroFooterText: {
        fontSize: 11,
        color: '#C8EAED',
        fontWeight: '500',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: '800',
    },
    sectionSubtitle: {
        color: COLORS.muted,
        fontSize: 12,
        marginTop: 3,
    },
    countBadge: {
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: COLORS.soft,
    },
    countText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '800',
    },
    filterRow: {
        gap: 9,
        paddingBottom: 20,
    },
    filterChip: {
        paddingHorizontal: 17,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.small,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.glow,
    },
    filterText: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
    },
    filterTextActive: {
        color: COLORS.white,
    },
    packageCard: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        ...SHADOWS.card,
    },
    selectedCard: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.soft,
        ...SHADOWS.glow,
        shadowOpacity: 0.16,
    },
    checkBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: THEME.textLight,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBadgeActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    popularRibbon: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: '#FFF1D8',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
    },
    popularText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94601D',
        letterSpacing: 0.4,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    packageIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: COLORS.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packageIconActive: {
        backgroundColor: COLORS.primary,
    },
    typeInfo: {
        flex: 1,
    },
    typeLabel: {
        color: COLORS.primary,
        fontSize: 10,
        letterSpacing: 0.7,
        fontWeight: '800',
        marginBottom: 5,
    },
    packageName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
    },
    durationPill: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    durationText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 7,
        marginTop: 15,
    },
    price: {
        color: COLORS.primaryDark,
        fontSize: 25,
        fontWeight: '900',
    },
    priceDescription: {
        color: COLORS.muted,
        fontSize: 12,
    },
    cardDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 17,
    },
    benefitList: {
        gap: 11,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 9,
    },
    benefitText: {
        flex: 1,
        color: THEME.textSecondary,
        fontSize: 12.5,
        lineHeight: 19,
    },
    cardBottom: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: THEME.primarySoft,
    },
    detailText: {
        color: COLORS.primary,
        fontWeight: '800',
        fontSize: 12,
    },
    chosenBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 7,
        paddingHorizontal: 11,
    },
    chosenText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: '800',
    },
    bottomBar: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.card,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        elevation: 12,
    },
    selectedSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 14,
    },
    summaryLabel: {
        color: COLORS.muted,
        fontSize: 10,
        letterSpacing: 0.7,
        fontWeight: '700',
        marginBottom: 5,
    },
    summaryName: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '800',
    },
    summaryPrice: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '900',
    },
    noSelection: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.muted,
        marginBottom: 13,
    },
    continueWrap: {
        borderRadius: 16,
        ...SHADOWS.glow,
    },
    continueWrapDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButton: {
        height: 54,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    continueText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    emptyIconTile: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: COLORS.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        paddingVertical: 55,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    emptyText: {
        color: COLORS.muted,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 21,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 23,
        borderRadius: 12,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(5,31,38,0.55)',
    },
    modalSheet: {
        maxHeight: '85%',
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 27,
        borderTopRightRadius: 27,
        paddingHorizontal: 22,
        paddingBottom: 15,
    },
    modalHandle: {
        width: 45,
        height: 5,
        backgroundColor: '#D7E5E8',
        borderRadius: 5,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 18,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
    },
    modalContent: {
        paddingBottom: 25,
    },
    modalIcon: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: COLORS.soft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    modalPackageName: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '900',
        color: COLORS.text,
    },
    modalDescription: {
        fontSize: 13,
        color: COLORS.muted,
        lineHeight: 21,
        marginTop: 8,
        marginBottom: 19,
    },
    modalPriceBox: {
        backgroundColor: COLORS.soft,
        borderWidth: 1,
        borderColor: THEME.borderFocus,
        borderRadius: 18,
        padding: 17,
        marginBottom: 23,
    },
    modalPriceLabel: {
        color: COLORS.muted,
        fontSize: 12,
    },
    modalPrice: {
        color: COLORS.primary,
        fontSize: 27,
        fontWeight: '900',
        marginVertical: 6,
    },
    modalDuration: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '600',
    },
    benefitHeading: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '800',
        marginBottom: 17,
    },
    modalBenefitRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    modalBenefitText: {
        flex: 1,
        color: THEME.textSecondary,
        fontSize: 13,
        lineHeight: 21,
    },
    activeStatus: {
        backgroundColor: COLORS.soft,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginTop: 12,
    },
    activeStatusText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    modalChooseWrap: {
        borderRadius: 16,
        ...SHADOWS.glow,
    },
    modalChooseButton: {
        height: 54,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    modalChooseText: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 15,
    },
});

export default WorkoutSelectionScreen;
