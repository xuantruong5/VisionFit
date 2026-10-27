
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
    primary: '#0D7F8D',
    dark: '#075865',
    bg: '#F4FAFB',
    white: '#FFFFFF',
    text: '#16383E',
    muted: '#78949A',
    border: '#DFEAEC',
    soft: '#E7F5F6',
};

const DRAFT_KEY = 'visionfit_registration_draft';

type PaymentMethod = 'bank' | 'wallet' | 'counter';

type PaymentDraft = {
    selectedPackage: {
        id: number | string;
        ten_goi: string;
        gia: number;
        thoi_han: number;
        loai?: string;
        so_buoi_pt?: number;
    };
    selectedTrainer?: {
        id: number | string;
        ho_ten: string;
        chuc_danh?: string;
    } | null;
    estimatedTotal?: number;
    additionalPtFee?: number | null;
    status?: string;
    paymentMethod?: PaymentMethod;
};

const paymentMethods: {
    id: PaymentMethod;
    title: string;
    description: string;
    icon: string;
}[] = [
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
        const loadData = async () => {
            try {
                const saved = await AsyncStorage.getItem(DRAFT_KEY);
                const data = route?.params?.draft || (saved ? JSON.parse(saved) : null);

                setDraft(data);
                if (data?.paymentMethod) setMethod(data.paymentMethod);
            } catch {
                Alert.alert('Lỗi', 'Không thể tải thông tin thanh toán.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [route?.params?.draft]);

    const total = Number(draft?.estimatedTotal ?? draft?.selectedPackage?.gia ?? 0);
    const pkg = draft?.selectedPackage;
    const pt = draft?.selectedTrainer;
    const extraPT = !!pt && pkg?.loai !== 'pt' && Number(pkg?.so_buoi_pt || 0) === 0;



    const handleConfirm = async () => {
        if (!draft || saving) return;

        setSaving(true);

        try {
            const saved = await AsyncStorage.getItem('visionfit_demo_registrations');
            const list = saved ? JSON.parse(saved) : [];

            const registration = {
                ...draft,
                id: `VF-${Date.now()}`,
                createdAt: new Date().toISOString(),
                paymentMethod: method,
                status: 'pending',
            };

            await AsyncStorage.setItem(
                'visionfit_demo_registrations',
                JSON.stringify([registration, ...(Array.isArray(list) ? list : [])])
            );

            await AsyncStorage.setItem(
                DRAFT_KEY,
                JSON.stringify({ ...draft, paymentMethod: method, status: 'draft' })
            );

            navigation.replace('RegistrationSuccess', {
                draft: registration,
            });
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu đăng ký Demo.');
        } finally {
            setSaving(false);
        }
    };


    return (
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={23} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Thanh toán</Text>
                <Ionicons name="card-outline" size={24} color={C.primary} />
            </View>

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
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={s.subtitle}>Đang tải thông tin...</Text>
                </View>
            ) : !pkg ? (
                <View style={s.center}>
                    <Ionicons name="alert-circle-outline" size={45} color={C.muted} />
                    <Text style={s.emptyText}>Không tìm thấy thông tin đăng ký</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={s.linkText}>Quay lại xem đăng ký</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

                        {/* Banner */}
                        <LinearGradient colors={['#087F8F', '#064E60']} style={s.hero}>
                            <View style={s.heroIcon}>
                                <Ionicons name="wallet-outline" size={25} color={C.white} />
                            </View>
                            <Text style={s.heroTitle}>Hoàn tất hành trình đăng ký</Text>
                            <Text style={s.heroDesc}>
                                Kiểm tra chi phí và lựa chọn phương thức thanh toán phù hợp với bạn.
                            </Text>
                        </LinearGradient>

                        {/* Trạng thái */}
                        <View style={s.statusBox}>
                            <Ionicons name="time-outline" size={23} color={C.primary} />
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
                                    <Ionicons name="barbell" size={24} color={C.primary} />
                                </View>
                                <View style={s.flex}>
                                    <Text style={s.packageName}>{pkg.ten_goi}</Text>
                                    <Text style={s.subtitle}>Gói tập VisionFit</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={23} color={C.primary} />
                            </View>

                            <View style={s.divider} />

                            <View style={s.rowBetween}>
                                <Text style={s.infoLabel}>Thời hạn</Text>
                                <Text style={s.infoValue}>{pkg.thoi_han} ngày</Text>
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
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.85}
                                    onPress={() => setMethod(item.id)}
                                    style={[s.methodCard, selected && s.methodSelected]}
                                >
                                    <View style={[s.methodIcon, selected && s.methodIconActive]}>
                                        <Ionicons
                                            name={item.icon}
                                            size={24}
                                            color={selected ? C.white : C.primary}
                                        />
                                    </View>

                                    <View style={s.flex}>
                                        <Text style={s.methodTitle}>{item.title}</Text>
                                        <Text style={s.methodDesc}>{item.description}</Text>
                                    </View>

                                    <Ionicons
                                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                                        size={24}
                                        color={selected ? C.primary : '#B8CED2'}
                                    />
                                </TouchableOpacity>
                            );
                        })}

                        {/* Chi tiết chi phí */}
                        <Text style={s.sectionTitle}>Chi tiết thanh toán</Text>

                        <View style={s.card}>
                            <View style={s.rowBetween}>
                                <Text style={s.infoLabel}>Giá gói tập</Text>
                                <Text style={s.infoValue}>{money(Number(pkg.gia))}</Text>
                            </View>

                            <View style={s.infoSpacing} />

                            <View style={s.rowBetween}>
                                <Text style={s.infoLabel}>Chi phí PT</Text>
                                <Text style={s.infoValue}>
                                    {extraPT ? 'Chưa xác định' : 'Theo gói / Không có'}
                                </Text>
                            </View>

                            <View style={s.divider} />

                            <View style={s.rowBetween}>
                                <Text style={s.totalLabel}>Tổng tạm tính</Text>
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
                            <Ionicons name="information-circle-outline" size={21} color={C.primary} />
                            <Text style={s.noticeText}>
                                Đây là giao diện thanh toán thử nghiệm. Chưa tích hợp ngân hàng, ví điện tử hoặc tạo giao dịch thực tế.
                            </Text>
                        </View>

                    </ScrollView>

                    {/* Footer */}
                    <View style={s.footer}>
                        <View style={s.rowBetween}>
                            <View>
                                <Text style={s.footerLabel}>TỔNG TẠM TÍNH</Text>
                                <Text style={s.footerPrice}>{money(total)}</Text>
                            </View>

                            <View style={s.safeRow}>
                                <Ionicons name="shield-checkmark-outline" size={18} color={C.primary} />
                                <Text style={s.safeText}>Chế độ Demo</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[s.confirmButton, saving && s.disabledButton]}
                            onPress={handleConfirm}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={C.white} />
                            ) : (
                                <>
                                    <Text style={s.confirmText}>Lưu phương thức thanh toán</Text>
                                    <Ionicons name="arrow-forward" size={21} color={C.white} />
                                </>
                            )}
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
        backgroundColor: C.bg,
    },
    flex: {
        flex: 1,
    },
    header: {
        height: 62,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: C.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: C.text,
    },
    progress: {
        paddingHorizontal: 22,
        paddingVertical: 14,
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
        color: C.primary,
    },
    progressTrack: {
        height: 5,
        borderRadius: 8,
        backgroundColor: C.border,
        marginTop: 12,
    },
    progressFill: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        backgroundColor: C.primary,
    },
    subtitle: {
        fontSize: 12,
        lineHeight: 19,
        color: C.muted,
    },
    content: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 25,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 13,
        padding: 20,
    },
    emptyText: {
        fontSize: 15,
        color: C.text,
        fontWeight: '700',
        textAlign: 'center',
    },
    linkText: {
        fontSize: 13,
        color: C.primary,
        fontWeight: '800',
    },
    hero: {
        borderRadius: 23,
        padding: 23,
        marginBottom: 17,
    },
    heroIcon: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    heroTitle: {
        color: C.white,
        fontSize: 24,
        lineHeight: 31,
        fontWeight: '900',
    },
    heroDesc: {
        color: '#D2F0F2',
        fontSize: 12,
        lineHeight: 20,
        marginTop: 10,
    },
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 16,
        backgroundColor: C.soft,
        marginBottom: 25,
    },
    statusTitle: {
        color: C.text,
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 3,
    },
    statusBadge: {
        backgroundColor: C.white,
        borderRadius: 8,
        padding: 7,
    },
    statusBadgeText: {
        color: C.primary,
        fontSize: 9,
        fontWeight: '900',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: C.text,
        marginBottom: 13,
        marginTop: 6,
    },
    sectionDesc: {
        fontSize: 12,
        color: C.muted,
        marginTop: -7,
        marginBottom: 15,
    },
    card: {
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 19,
        padding: 17,
        marginBottom: 24,
    },
    packageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    packageIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: C.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packageName: {
        color: C.text,
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 5,
    },
    divider: {
        height: 1,
        backgroundColor: C.border,
        marginVertical: 17,
    },
    infoLabel: {
        flex: 1,
        fontSize: 12,
        color: C.muted,
    },
    infoValue: {
        flexShrink: 1,
        fontSize: 12,
        fontWeight: '800',
        color: C.text,
        textAlign: 'right',
    },
    infoSpacing: {
        height: 15,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.white,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 17,
        padding: 14,
        marginBottom: 12,
    },
    methodSelected: {
        borderColor: C.primary,
        backgroundColor: '#F0FAFA',
    },
    methodIcon: {
        width: 46,
        height: 46,
        borderRadius: 13,
        backgroundColor: C.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodIconActive: {
        backgroundColor: C.primary,
    },
    methodTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: C.text,
        marginBottom: 5,
    },
    methodDesc: {
        fontSize: 11,
        lineHeight: 17,
        color: C.muted,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: C.text,
    },
    totalValue: {
        fontSize: 23,
        fontWeight: '900',
        color: C.primary,
    },
    warning: {
        fontSize: 11,
        lineHeight: 18,
        color: '#B47A30',
        marginTop: 12,
    },
    notice: {
        flexDirection: 'row',
        gap: 10,
        padding: 15,
        borderRadius: 14,
        backgroundColor: C.soft,
    },
    noticeText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 20,
        color: C.primary,
    },
    footer: {
        backgroundColor: C.white,
        paddingHorizontal: 19,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    footerLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: C.muted,
    },
    footerPrice: {
        fontSize: 23,
        fontWeight: '900',
        color: C.primary,
        marginTop: 5,
    },
    safeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    safeText: {
        fontSize: 11,
        color: C.primary,
        fontWeight: '700',
    },
    confirmButton: {
        height: 54,
        backgroundColor: C.primary,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 15,
    },
    disabledButton: {
        opacity: 0.6,
    },
    confirmText: {
        color: C.white,
        fontSize: 15,
        fontWeight: '800',
    },
});

export default PaymentScreen;
