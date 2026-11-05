
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../general/theme';




type PaymentMethod = 'bank' | 'wallet' | 'counter';

type PaymentDraft = {
    selectedPackage: {
        id: number | string;
        ten_goi_tap?: string;
        ten_goi?: string;
        gia: number;
        thoi_han_ngay?: number;
        thoi_han?: number;
        loai?: string;
        so_buoi_pt?: number;
        [key: string]: any;
    };

    selectedTrainer?: {
        id: number | string;
        ho_ten: string;
        chuc_danh?: string;
        [key: string]: any;
    } | null;

    chuongTrinhTap?: any;
    noiTap?: any;
    hoiVien?: any;

    maKhuyenMai?: string;
    maGioiThieu?: string;
    tenNguoiGioiThieu?: string;

    chiTietUuDai?: {
        lan_dang_ky?: number;
        phan_tram_giam?: number;
        tien_giam_khuyen_mai?: number;
        tien_giam_gioi_thieu?: number;
        tong_tien_giam?: number;
        tong_tien?: number;
        ten_khuyen_mai?: string;
        [key: string]: any;
    };

    tongTienTamTinh?: number;
    paymentMethod?: PaymentMethod;
};

const paymentMethods: { id: PaymentMethod; title: string; description: string; icon: string; }[] = [
    {
        id: 'bank',
        title: 'Chuyển khoản ngân hàng',
        description: 'Thanh toán qua tài khoản ngân hàng',
        icon: 'card-outline',
    },
    {
        id: 'wallet',
        title: 'Ví điện tử',
        description: 'Thanh toán bằng ví điện tử',
        icon: 'wallet-outline',
    },
    {
        id: 'counter',
        title: 'Thanh toán tại quầy',
        description: 'Thanh toán trực tiếp tại phòng tập',
        icon: 'business-outline',
    },
];

const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const PaymentScreen = ({ navigation, route }: any) => {
    const [draft, setDraft] = useState<PaymentDraft | null>(null);
    const [method, setMethod] = useState<PaymentMethod>('bank');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const data = route?.params?.draft;

        if (data) {
            setDraft(data);

            if (data.paymentMethod) {
                setMethod(data.paymentMethod);
            }
        } else {
            setDraft(null);
        }

        setLoading(false);
    }, [route?.params?.draft]);


    const pkg = draft?.selectedPackage;
    const pt = draft?.selectedTrainer;
    const total = Number(draft?.tongTienTamTinh ?? draft?.chiTietUuDai?.tong_tien ?? pkg?.gia ?? 0);

    const extraPT = !!pt && pkg?.loai !== 'pt' && Number(pkg?.so_buoi_pt || 0) === 0;



    const handleConfirm = async () => {
        if (!draft || saving) return;
        setSaving(true);
        try {
            // TODO: Gọi API Backend để tạo đăng ký và lưu phương thức thanh toán.
            // Ví dụ:
            // const response = await apiFitlife.post('/client/dang-ky-goi', {
            //     id_goi_tap: draft.selectedPackage.id,
            //     id_trainer: draft.selectedTrainer?.id || null,
            //     phuong_thuc_thanh_toan: method,
            // });

            const routeNames = navigation.getState()?.routeNames || [];

            const target = routeNames.includes('RegistrationSuccess')
                ? 'RegistrationSuccess'
                : routeNames.includes('RegistrationSuccessScreen')
                    ? 'RegistrationSuccessScreen'
                    : 'RegistrationSuccess';

            navigation.replace(target, {
                draft: {
                    ...draft,
                    paymentMethod: method,
                },
            });

        } catch (error: any) {
            console.log(
                'Lỗi xác nhận đăng ký:',
                error.response?.data || error.message
            );

            Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể xác nhận đăng ký.'
            );
        } finally {
            setSaving(false);
        }
    };


    return (
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <AppHeader
                title="Thanh toán"
                onBack={() => navigation.goBack()}
                rightComponent={
                    <View style={s.headerIcon}>
                        <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                    </View>
                }
            />

            {/* Progress */}
            <View style={s.progress}>
                <View style={s.rowBetween}>
                    <Text style={s.stepText}>BƯỚC 04 / 04</Text>
                    <Text style={s.subtitle}>Phương thức thanh toán</Text>
                </View>
                <View style={s.progressTrack}>
                    <View style={s.progressFill} />
                </View>
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={s.subtitle}>Đang tải thông tin...</Text>
                </View>
            ) : !pkg ? (
                <View style={s.center}>
                    <View style={s.emptyIcon}>
                        <Ionicons name="alert-circle-outline" size={34} color={COLORS.accentOrange} />
                    </View>
                    <Text style={s.emptyText}>Không tìm thấy thông tin đăng ký</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.linkBtn}>
                        <Text style={s.linkText}>Quay lại xem đăng ký</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

                        {/* Banner */}
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
                            <View style={s.heroDecor} />
                            <View style={s.heroIcon}>
                                <Ionicons name="wallet-outline" size={22} color={COLORS.white} />
                            </View>
                            <Text style={s.heroTitle}>Hoàn tất hành trình đăng ký</Text>
                            <Text style={s.heroDesc}>
                                Kiểm tra chi phí và lựa chọn phương thức thanh toán phù hợp với bạn.
                            </Text>
                        </LinearGradient>

                        {/* Trạng thái */}
                        <View style={s.statusBox}>
                            <View style={s.statusIcon}>
                                <Ionicons name="time-outline" size={20} color={COLORS.accentGold} />
                            </View>
                            <View style={s.flex}>
                                <Text style={s.statusTitle}>Chưa thanh toán</Text>
                                <Text style={s.subtitle}>Đơn đăng ký đang ở dạng bản nháp</Text>
                            </View>
                            <View style={s.statusBadge}>
                                <Text style={s.statusBadgeText}>BẢN NHÁP</Text>
                            </View>
                        </View>

                        {/* Thông tin gói tập */}
                        <Text style={s.sectionTitle}>Thông tin đăng ký</Text>

                        <View style={s.card}>
                            <View style={s.packageRow}>
                                <View style={s.packageIcon}>
                                    <Ionicons name="barbell" size={22} color={COLORS.primary} />
                                </View>
                                <View style={s.flex}>
                                    <Text style={s.packageName}>{pkg.ten_goi_tap || pkg.ten_goi || 'Chưa có tên gói'}</Text>
                                    <Text style={s.subtitle}>Gói tập VisionFit</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={23} color={COLORS.primary} />
                            </View>

                            <View style={s.divider} />

                            <View style={s.rowBetween}>
                                <Text style={s.infoLabel}>Thời hạn</Text>
                                <Text style={s.infoValue}>{pkg.thoi_han_ngay || pkg.thoi_han || 0} ngày ngày</Text>
                            </View>

                            <View style={s.infoSpacing} />

                            <View style={s.rowBetween}>
                                <Text style={s.infoLabel}>Huấn luyện viên</Text>
                                <Text style={s.infoValue}>{pt?.ho_ten || 'Không chọn PT'}</Text>
                            </View>

                            <View style={s.infoSpacing} />

                            <View style={s.rowBetween}>
                                <Text style={s.infoLabel}>Số buổi PT</Text>
                                <Text style={s.infoValue}>{pkg.so_buoi_pt || 0} buổi</Text>
                            </View>
                        </View>

                        {/* Phương thức thanh toán */}
                        <Text style={s.sectionTitle}>Phương thức thanh toán</Text>
                        <Text style={s.sectionDesc}>Chọn một phương thức thanh toán bên dưới</Text>

                        {paymentMethods.map(item => {
                            const selected = method === item.id;
                            return (
                                <TouchableOpacity key={item.id} activeOpacity={0.85} onPress={() => setMethod(item.id)} style={[s.methodCard, selected && s.methodSelected]} >
                                    <View style={[s.methodIcon, selected && s.methodIconActive]}>
                                        <Ionicons name={item.icon} size={22} color={selected ? COLORS.white : COLORS.primary} />
                                    </View>

                                    <View style={s.flex}>
                                        <Text style={s.methodTitle}>{item.title}</Text>
                                        <Text style={s.methodDesc}>{item.description}</Text>
                                    </View>

                                    <View style={[s.checkCircle, selected && s.checkCircleActive]}>
                                        {selected ? (
                                            <Ionicons name="checkmark" size={15} color={COLORS.white} />
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                        {/* Mã QR chuyển khoản */}
                        {method === 'bank' && (
                            <View style={s.qrCard}>
                                <Text style={s.qrTitle}>Quét mã QR để thanh toán</Text>
                                <Image
                                    source={{
                                        uri: `https://img.vietqr.io/image/MB-0813559551-compact.png?amount=${Math.round(total)}&addInfo=${encodeURIComponent(draft?.orderCode || 'THANH TOAN VISIONFIT')}&accountName=TRAN%20XUAN%20TRUONG`,
                                    }}
                                    resizeMode="contain"
                                    style={s.qrImage}
                                />

                                <Text style={s.qrText}>
                                    Sử dụng ứng dụng ngân hàng để quét mã QR
                                </Text>

                                <View style={s.qrAmountRow}>
                                    <Text style={s.infoLabel}>Số tiền cần chuyển</Text>
                                    <Text style={s.qrAmount}>{money(total)}</Text>
                                </View>

                                <Text style={s.qrNotice}>
                                    Vui lòng chuyển đúng số tiền và kiểm tra nội dung chuyển khoản trước khi xác nhận.
                                </Text>
                            </View>
                        )}



                        {/* Chi tiết chi phí */}
                        <Text style={s.sectionTitle}>Chi tiết thanh toán</Text>
                        <View style={s.card}>
                            {/* Giá gói tập */}
                            <View style={s.rowBetween}>
                                <Text style={s.infoLabel}>Giá gói tập</Text>
                                <Text style={s.infoValue}>{money(Number(pkg.gia))}</Text>
                            </View>

                            {/* Ưu đãi khuyến mãi */}
                            {Number(draft?.chiTietUuDai?.tien_giam_khuyen_mai || 0) > 0 && (
                                <>
                                    <View style={s.infoSpacing} />

                                    <View style={s.rowBetween}>
                                        <Text style={s.infoLabel}>
                                            {Number(draft?.chiTietUuDai?.lan_dang_ky || 1) >= 2
                                                ? `Ưu đãi đăng ký lần ${draft?.chiTietUuDai?.lan_dang_ky} (${draft?.chiTietUuDai?.phan_tram_giam || 0}%)`
                                                : draft?.chiTietUuDai?.ten_khuyen_mai || 'Khuyến mãi hội viên mới'}
                                        </Text>

                                        <Text style={{ color: COLORS.accentGreen }}>
                                            -{money(Number(draft?.chiTietUuDai?.tien_giam_khuyen_mai))}
                                        </Text>
                                    </View>
                                </>
                            )}
                            {/* Ưu đãi giới thiệu */}
                            {Number(draft?.chiTietUuDai?.tien_giam_gioi_thieu || 0) > 0 && (
                                <>
                                    <View style={s.infoSpacing} />

                                    <View style={s.rowBetween}>
                                        <Text style={s.infoLabel}>Ưu đãi giới thiệu</Text>

                                        <Text style={{ color: COLORS.accentGreen, fontWeight: '600' }}>
                                            -{money(Number(draft?.chiTietUuDai?.tien_giam_gioi_thieu))}
                                        </Text>
                                    </View>
                                </>
                            )}


                            {/* Chi phí PT */}
                            <View style={s.infoSpacing} />

                            <View style={s.rowBetween}>
                                <Text style={s.infoLabel}>Chi phí PT</Text>
                                <Text style={s.infoValue}>
                                    {extraPT ? 'Chưa xác định' : 'Theo gói / Không có'}
                                </Text>
                            </View>

                            <View style={s.dashedDivider} />

                            {/* Tổng tiền giảm */}
                            {Number(draft?.chiTietUuDai?.tong_tien_giam || 0) > 0 && (
                                <>
                                    <View style={s.rowBetween}>
                                        <Text style={s.infoLabel}>Tổng tiền ưu đãi</Text>
                                        <Text style={{ color: COLORS.accentGreen, fontWeight: '700' }}>
                                            -{money(Number(draft?.chiTietUuDai?.tong_tien_giam))}
                                        </Text>
                                    </View>

                                    <View style={s.infoSpacing} />
                                </>
                            )}

                            {/* Tổng thanh toán */}
                            <View style={[s.rowBetween, s.totalBox]}>
                                <Text style={s.totalLabel}>Tổng Tiền</Text>
                                <Text style={s.totalValue}>{money(total)}</Text>
                            </View>

                            {extraPT && (
                                <Text style={s.warning}>
                                    Chi phí PT chọn thêm chưa được tính vào tổng tạm tính.
                                </Text>
                            )}
                        </View>

                        {/* Lưu ý */}
                        <View style={s.notice}>
                            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
                            <Text style={s.noticeText}>
                                Thông tin đăng ký và chi phí sẽ được hệ thống kiểm tra trước khi xác nhận.Vui lòng kiểm tra kỹ gói tập, ưu đãi và số tiền thanh toán trước thanh toán .
                            </Text>
                        </View>

                    </ScrollView>

                    {/* Footer */}
                    <View style={s.footer}>
                        <View style={s.rowBetween}>
                            <View>
                                <Text style={s.footerLabel}>TỔNG TIỀN </Text>
                                <Text style={s.footerPrice}>{money(total)}</Text>
                            </View>

                            <View style={s.safeRow}>
                                <Ionicons name="shield-checkmark" size={15} color={COLORS.accentGreen} />
                                <Text style={s.safeText}>Chế độ Demo</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[s.confirmWrap, saving && s.disabledButton]}
                            activeOpacity={0.85}
                            onPress={handleConfirm}
                            disabled={saving}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={s.confirmButton}
                            >
                                {saving ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <>
                                        <Ionicons name="lock-closed" size={17} color={COLORS.white} />
                                        <Text style={s.confirmText}>Lưu phương thức thanh toán</Text>
                                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    flex: {
        flex: 1,
    },
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progress: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    stepText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        color: COLORS.primary,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primaryLight,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressFill: {
        width: '100%',
        height: '100%',
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    subtitle: {
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.textMuted,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: 20,
    },
    emptyIcon: {
        width: 68,
        height: 68,
        borderRadius: 22,
        backgroundColor: '#FFF1EC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: '700',
        textAlign: 'center',
    },
    linkBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: COLORS.primarySoft,
    },
    linkText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '800',
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
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.07)',
        top: -60,
        right: -50,
    },
    heroIcon: {
        width: 44,
        height: 44,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    heroTitle: {
        color: COLORS.white,
        fontSize: 22,
        lineHeight: 29,
        fontWeight: '900',
    },
    heroDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12.5,
        lineHeight: 19,
        marginTop: 8,
    },
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
        ...SHADOWS.card,
    },
    statusIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 2,
    },
    statusBadge: {
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FDE6C4',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    statusBadgeText: {
        color: COLORS.accentGold,
        fontSize: 9.5,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    sectionDesc: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: -8,
        marginBottom: 12,
    },
    card: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        ...SHADOWS.card,
    },
    packageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    packageIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packageName: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 2,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: 14,
    },
    dashedDivider: {
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
        marginVertical: 14,
    },
    infoLabel: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textMuted,
    },
    infoValue: {
        flexShrink: 1,
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'right',
    },
    infoSpacing: {
        height: 12,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        ...SHADOWS.small,
    },
    methodSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surfaceTeal,
        ...SHADOWS.card,
    },
    methodIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.surfaceTeal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodIconActive: {
        backgroundColor: COLORS.primary,
    },
    methodTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    methodDesc: {
        fontSize: 12,
        lineHeight: 16,
        color: COLORS.textMuted,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
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
    totalBox: {
        backgroundColor: COLORS.surfaceTeal,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.primary,
    },
    warning: {
        fontSize: 12,
        lineHeight: 18,
        color: '#B47A30',
        marginTop: 12,
        backgroundColor: '#FFF7ED',
        borderRadius: 12,
        padding: 10,
        overflow: 'hidden',
    },
    notice: {
        flexDirection: 'row',
        gap: 10,
        padding: 14,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceTeal,
        borderWidth: 1,
        borderColor: COLORS.borderFocus,
    },
    noticeText: {
        flex: 1,
        fontSize: 12.5,
        lineHeight: 19,
        color: COLORS.primaryDark,
    },
    footer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        ...SHADOWS.card,
        shadowOffset: { width: 0, height: -4 },
        elevation: 10,
    },
    footerLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: COLORS.textMuted,
    },
    footerPrice: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.primary,
        marginTop: 2,
    },
    safeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: '#ECFDF5',
    },
    safeText: {
        fontSize: 11,
        color: COLORS.accentGreen,
        fontWeight: '700',
    },
    confirmWrap: {
        marginTop: 12,
    },
    confirmButton: {
        height: 52,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    disabledButton: {
        opacity: 0.6,
    },
    confirmText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '800',
    },
    qrCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DCEEEF',
    },

    qrTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 12,
    },

    qrImage: {
        width: 240,
        height: 240,
    },

    qrText: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
    },

    qrAmountRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        marginTop: 16,
        paddingTop: 14,
    },

    qrAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.primary,
    },

    qrNotice: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 19,
    },
});

export default PaymentScreen;
