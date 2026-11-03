
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal, Pressable, ActivityIndicator, RefreshControl, Alert, StatusBar} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import apiFitlife from '../../general/api';
import { COLORS as THEME, SHADOWS } from '../../general/theme';
const COLORS = {
    primary: THEME.primary,
    primaryDark: THEME.primaryDark,
    background: THEME.background,
    white: THEME.white,
    text: THEME.textPrimary,
    muted: THEME.textMuted,
    border: THEME.border,
    soft: THEME.surfaceTeal,
    gold: THEME.accentGold,
};
// const STORAGE_KEY = 'visionfit_selected_package';
export interface TrainingPackage {
    id: number;
    ma_goi_tap: string;
    id_phong_tap: number | null;
    ten_goi_tap: string;
    thoi_han_mua: number;
    thoi_han_tang: number;
    thoi_han_ngay: number;
    gia: string | number;
    hinh_anh: string | null;
    so_buoi: number;
    so_buoi_pt: number;
    mo_ta: string[];
    tinh_trang: number;
}
const money = (value: number | string) =>`${Number(value).toLocaleString('vi-VN')}đ`;

const WorkoutSelectionScreen = ({ navigation }: any) => {
    const [packages, setPackages] = useState<TrainingPackage[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<TrainingPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Gói tập đang được chọn
    const selectedPackage = packages.find( item => String(item.id) === selectedId);

    // Lấy danh sách gói tập từ API
    const loadPackages = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const response = await apiFitlife.get('/client/goi-tap');
            if (!response.data.success) {
                throw new Error(response.data.message || 'Không thể lấy danh sách gói tập');
            }
            const validPackages: TrainingPackage[] = (  response.data.data || [] ).filter(
                (item: TrainingPackage) => item.tinh_trang === 1 && Number(item.gia) >= 0 );
            setPackages(validPackages);

            // Kiểm tra gói đã lưu trước đó
            // const saved = await AsyncStorage.getItem(STORAGE_KEY);
            // if (saved) {
            //     const savedPackage = JSON.parse(saved);
            //     const exists = validPackages.some(
            //         item => String(item.id) === String(savedPackage.id)
            //     );
            //     if (exists) {
            //         setSelectedId(String(savedPackage.id));
            //         // Cập nhật thông tin mới nhất từ API
            //         const latestPackage = validPackages.find(
            //             item => String(item.id) === String(savedPackage.id)
            //         );
            //         if (latestPackage) {
            //             await AsyncStorage.setItem(
            //                 STORAGE_KEY,
            //                 JSON.stringify(latestPackage)
            //             );
            //         }
            //     } else {
            //         setSelectedId(null);
            //         await AsyncStorage.removeItem(STORAGE_KEY);
            //     }
            // } else {
            //     setSelectedId(null);
            // }
            setSelectedId(null);

        } catch (err: any) {
            console.log(
                'Lỗi lấy danh sách gói tập:',
                err.response?.data || err.message
            );

            setError('Không thể tải danh sách gói tập. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadPackages();
    }, [loadPackages]);

    // Chọn gói tập
   const handleSelect = (item: TrainingPackage) => {
        if (item.tinh_trang !== 1) {
            return Alert.alert('Thông báo', 'Gói tập này hiện không khả dụng.');
        }

        setSelectedId(String(item.id));
    };

    // Tiếp tục sang trang chọn PT
    const handleContinue = () => {
        if (!selectedPackage) {
            return Alert.alert('Thông báo', 'Vui lòng chọn một gói tập.');
        }
        const packageData = {
            id: selectedPackage.id,
            ten_goi_tap: selectedPackage.ten_goi_tap,
            thoi_han_ngay: selectedPackage.thoi_han_ngay,
            gia: selectedPackage.gia,
            so_buoi: selectedPackage.so_buoi,
            so_buoi_pt: selectedPackage.so_buoi_pt,
        };

        navigation.navigate('PTList', {
            selectedPackage: packageData,
            packageId: selectedPackage.id,
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />
            {/* Header */}
            <AppHeader title="Đăng ký gói tập"  onBack={() => navigation.goBack()}
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

            <FlatList data={packages} keyExtractor={item => String(item.id)} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadPackages(true)} tintColor={COLORS.primary} colors={[COLORS.primary]}/>}

                // Hiển thị từng gói tập trực tiếp tại FlatList
                renderItem={({ item }) => {
                    const selected = selectedId === String(item.id);
                    return (
                        <TouchableOpacity activeOpacity={0.85} onPress={() => handleSelect(item)}
                            style={[ styles.packageCard, selected && styles.selectedCard]} >
                            {/* Tên gói */}
                            <View style={styles.cardTop}>
                                <View style={[ styles.packageIcon, selected && styles.packageIconActive ]} >
                                    <Ionicons name="barbell" size={22} color={selected ? COLORS.white : COLORS.primary} />
                                </View>

                                <View style={styles.typeInfo}>
                                    <Text style={styles.typeLabel}>
                                        {item.ma_goi_tap.trim()}
                                    </Text>
                                    <Text style={styles.packageName}>
                                        {item.ten_goi_tap}
                                    </Text>
                                </View>
                                <View style={[ styles.checkBadge, selected && styles.checkBadgeActive ]} >
                                    {selected && (
                                        <Ionicons name="checkmark"  size={16} color={COLORS.white}/>
                                    )}
                                </View>
                            </View>

                            {/* Thời hạn */}
                            <View style={styles.durationPill}>
                                <Ionicons name="time-outline" size={15} color={COLORS.primary}/>
                                <Text style={styles.durationText}>
                                    {item.thoi_han_ngay} ngày sử dụng
                                </Text>
                            </View>

                            {/* Giá */}
                            <View style={styles.priceRow}>
                                <Text style={styles.price}>
                                    {money(item.gia)}
                                </Text>

                                <Text style={styles.priceDescription}>
                                    / gói tập
                                </Text>
                            </View>

                            <View style={styles.cardDivider} />
                            {/* Quyền lợi */}
                            <View style={styles.benefitList}>
                                {item.mo_ta?.slice(0, 4).map((description, index) => (
                                    <View key={index} style={styles.benefitRow}>
                                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary}/>
                                        <Text style={styles.benefitText}>
                                            {description}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Nút chi tiết */}
                            <View style={styles.cardBottom}>
                                <TouchableOpacity style={styles.detailButton} onPress={() => setDetail(item)} >
                                    <Text style={styles.detailText}>
                                        Xem chi tiết
                                    </Text>
                                    <Ionicons  name="arrow-forward" size={15} color={COLORS.primary} />
                                </TouchableOpacity>

                                {selected && (
                                    <View style={styles.chosenBadge}>
                                        <Ionicons name="checkmark-circle" size={14} color={COLORS.white}/>
                                        <Text style={styles.chosenText}>
                                            Đã chọn
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListHeaderComponent={
                    <>
                        {/* Banner */}
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero} >
                            <View style={styles.heroCircleLg} />
                            <View style={styles.heroCircleSm} />

                            <View style={styles.heroBadge}>
                                <Ionicons name="flash-outline" color="#E8FDFF" size={13}/>

                                <Text style={styles.heroBadgeText}>
                                    VISIONFIT MEMBERSHIP
                                </Text>
                            </View>

                            <Text style={styles.heroTitle}>
                                Lựa chọn gói tập{'\n'}phù hợp với bạn
                            </Text>

                            <Text style={styles.heroSubtitle}>
                                Khởi đầu hành trình khỏe mạnh theo cách của riêng bạn.
                            </Text>

                            <View style={styles.heroFooter}>
                                <Ionicons name="shield-checkmark-outline" size={17} color="#BDF2F2" />

                                <Text style={styles.heroFooterText}>
                                    Linh hoạt • Rõ ràng • Dễ dàng đăng ký
                                </Text>
                            </View>
                        </LinearGradient>

                        {/* Banner nhập mã HLV */}
                        <TouchableOpacity style={styles.referralEntryBanner} onPress={() => navigation.navigate('EnterTrainerCodeScreen')} activeOpacity={0.8} >
                            <View style={styles.referralEntryLeft}>
                                <View style={styles.referralIconCircle}>
                                    <Ionicons name="key" size={16} color={COLORS.primary}/>
                                </View>

                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={styles.referralEntryTitle}>
                                        Bạn đã có mã Huấn Luyện Viên?
                                    </Text>

                                    <Text style={styles.referralEntrySub}>
                                        Nhập mã HLV để được hỗ trợ giáo trình riêng
                                    </Text>
                                </View>
                            </View>

                            <Ionicons name="chevron-forward" size={16} color={COLORS.primary}/>
                        </TouchableOpacity>

                        {/* Tiêu đề danh sách */}
                        <View style={styles.sectionTitleRow}>
                            <View>
                                <Text style={styles.sectionTitle}>
                                    Khám phá gói tập
                                </Text>

                                <Text style={styles.sectionSubtitle}>
                                    Chọn gói phù hợp với mục tiêu của bạn
                                </Text>
                            </View>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>
                                    {packages.length} gói
                                </Text>
                            </View>
                        </View>
                    </>
                }

                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? (
                            <>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.emptyText}>
                                    Đang tải gói tập...
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.emptyIconTile}>
                                    <Ionicons name={error ? 'cloud-offline-outline' : 'albums-outline'}  size={30} color={COLORS.primary} />
                                </View>

                                <Text style={styles.emptyText}>
                                    {error || 'Không có gói tập phù hợp.'}
                                </Text>

                                {error && (
                                    <TouchableOpacity style={styles.retryButton}  onPress={() => loadPackages()} >
                                        <Text style={styles.retryText}>
                                            Thử lại
                                        </Text>
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
                            <Text style={styles.summaryLabel}>
                                GÓI ĐÃ CHỌN
                            </Text>

                            <Text style={styles.summaryName} numberOfLines={1} >
                                {selectedPackage.ten_goi_tap}
                            </Text>
                        </View>
                        <Text style={styles.summaryPrice}>
                            {money(selectedPackage.gia)}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.noSelection}>
                        Vui lòng chọn một gói tập để tiếp tục
                    </Text>
                )}

                <TouchableOpacity  disabled={!selectedPackage || loading} onPress={handleContinue} activeOpacity={0.85}
                    style={[ styles.continueWrap, (!selectedPackage || loading) && styles.continueWrapDisabled]} >
                    <LinearGradient
                        colors={ (!selectedPackage || loading) ? ['#AFCBD0', '#AFCBD0'] : [COLORS.primary, COLORS.primaryDark] }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.continueButton}  >
                        <Text style={styles.continueText}>
                            Tiếp tục chọn PT
                        </Text>
                        <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Modal chi tiết gói tập */}
            <Modal visible={detail !== null} transparent animationType="slide" onRequestClose={() => setDetail(null)} >
                <View style={styles.modalContainer}>
                    <Pressable style={{  position: 'absolute', top: 0,  left: 0, right: 0,  bottom: 0}} onPress={() => setDetail(null)}/>

                    {detail && (
                        <SafeAreaView style={styles.modalSheet} edges={['bottom']} >
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalHeading}>
                                    Chi tiết gói tập
                                </Text>
                                <TouchableOpacity onPress={() => setDetail(null)}>
                                    <Ionicons  name="close-circle" size={29} color={COLORS.muted} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView  contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false} >
                                <View style={styles.modalIcon}>
                                    <Ionicons name="barbell" size={26} color={COLORS.primary} />
                                </View>

                                <Text style={styles.modalPackageName}>
                                    {detail.ten_goi_tap}
                                </Text>

                                {detail.mo_ta?.map((description, index) => (
                                    <Text key={index} style={styles.modalDescription} >
                                        {description}
                                    </Text>
                                ))}

                                <View style={styles.modalPriceBox}>
                                    <Text style={styles.modalPriceLabel}>
                                        Giá gói tập
                                    </Text>

                                    <Text style={styles.modalPrice}>
                                        {money(detail.gia)}
                                    </Text>

                                    <Text style={styles.modalDuration}>
                                        Thời hạn mua: {detail.thoi_han_mua} ngày
                                    </Text>

                                    <Text style={styles.modalDuration}>
                                        Thời hạn tặng: {detail.thoi_han_tang} ngày
                                    </Text>

                                    <Text style={styles.modalDuration}>
                                        Tổng thời hạn: {detail.thoi_han_ngay} ngày
                                    </Text>
                                </View>

                                <Text style={styles.benefitHeading}>
                                    Quyền lợi của bạn
                                </Text>

                                <View style={styles.modalBenefitRow}>
                                    <Ionicons name="checkmark-circle" size={21} color={COLORS.primary}/>

                                    <Text style={styles.modalBenefitText}>
                                        {detail.so_buoi} buổi tập
                                    </Text>
                                </View>

                                {detail.so_buoi_pt > 0 && (
                                    <View style={styles.modalBenefitRow}>
                                        <Ionicons name="checkmark-circle" size={21} color={COLORS.primary} />

                                        <Text style={styles.modalBenefitText}>
                                            {detail.so_buoi_pt} buổi tập cùng PT
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.activeStatus}>
                                    <Ionicons  name="checkmark-circle-outline" size={17} color={COLORS.primary} />

                                    <Text style={styles.activeStatusText}>
                                        {detail.tinh_trang === 1
                                            ? 'Gói tập đang hoạt động'
                                            : 'Gói tập không khả dụng'}
                                    </Text>
                                </View>
                            </ScrollView>

                            <TouchableOpacity style={styles.modalChooseWrap}
                                onPress={async () => { await handleSelect(detail); setDetail(null); }} >
                                <LinearGradient  colors={[COLORS.primary, COLORS.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.modalChooseButton} >
                                    <Text style={styles.modalChooseText}>
                                        Chọn gói tập này
                                    </Text>
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
    referralEntryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 14,
        marginTop: 14,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: '#BEE7EB',
        ...SHADOWS.small,
    },
    referralEntryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    referralIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    referralEntryTitle: {
        fontSize: 13.5,
        fontWeight: '800',
        color: COLORS.text,
    },
    referralEntrySub: {
        fontSize: 11.5,
        color: COLORS.muted,
        marginTop: 2,
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
        borderRadius: 999,
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
        borderRadius: 999,
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
        borderRadius: 999,
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
        borderRadius: 999,
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
