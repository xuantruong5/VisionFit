
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';

const RegistrationSuccessScreen = ({ navigation, route }: any) => {
    const draft = route?.params?.draft;
    const pkg = draft?.selectedPackage;
    const pt = draft?.selectedTrainer;
    const method = draft?.paymentMethod;
    const total = Number(draft?.estimatedTotal ?? pkg?.gia ?? 0);

    const methodName = method === 'bank'
        ? 'Chuyển khoản ngân hàng'
        : method === 'wallet'
            ? 'Ví điện tử'
            : method === 'counter'
                ? 'Thanh toán tại quầy'
                : 'Chưa chọn';

    return (
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

                {/* Thành công */}
                <View style={s.successSection}>
                    <View style={s.confettiA} />
                    <View style={s.confettiB} />
                    <View style={s.confettiC} />
                    <View style={s.confettiD} />

                    <View style={s.circle}>
                        <View style={s.ring}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={s.innerCircle}
                            >
                                <Ionicons name="checkmark" size={52} color={COLORS.white} />
                            </LinearGradient>
                        </View>
                    </View>

                    <Text style={s.successTitle}>Đăng ký thành công!</Text>
                    <View style={s.demoBadge}>
                        <Ionicons name="flask-outline" size={12} color={COLORS.primary} />
                        <Text style={s.demoBadgeText}>CHẾ ĐỘ DEMO</Text>
                    </View>
                    <Text style={s.successDesc}>
                        Bạn đã hoàn tất các bước đăng ký gói tập trên ứng dụng VisionFit.
                    </Text>
                </View>

                {/* Trạng thái */}
                <View style={s.statusBox}>
                    <View style={s.statusIcon}>
                        <Ionicons name="time-outline" size={22} color={COLORS.accentGold} />
                    </View>
                    <View style={s.flex}>
                        <Text style={s.statusTitle}>Chờ thanh toán</Text>
                        <Text style={s.subText}>Chưa phát sinh giao dịch thực tế</Text>
                    </View>
                    <View style={s.statusDot} />
                </View>

                {/* Thông tin đăng ký */}
                <Text style={s.sectionTitle}>Thông tin đăng ký</Text>

                <View style={s.card}>
                    <View style={s.packageRow}>
                        <View style={s.packageIcon}>
                            <Ionicons name="barbell" size={22} color={COLORS.primary} />
                        </View>

                        <View style={s.flex}>
                            <Text style={s.packageName}>{pkg?.ten_goi || 'Gói tập VisionFit'}</Text>
                            <Text style={s.subText}>Gói tập đã chọn</Text>
                        </View>

                        <Ionicons name="checkmark-circle" size={23} color={COLORS.accentGreen} />
                    </View>

                    <View style={s.divider} />

                    <View style={s.infoRow}>
                        <View style={s.infoLabelRow}>
                            <Ionicons name="calendar-outline" size={15} color={COLORS.textMuted} />
                            <Text style={s.infoLabel}>Thời hạn</Text>
                        </View>
                        <Text style={s.infoValue}>{pkg?.thoi_han || 0} ngày</Text>
                    </View>

                    <View style={s.infoRow}>
                        <View style={s.infoLabelRow}>
                            <Ionicons name="person-outline" size={15} color={COLORS.textMuted} />
                            <Text style={s.infoLabel}>Huấn luyện viên</Text>
                        </View>
                        <Text style={s.infoValue}>{pt?.ho_ten || 'Không chọn PT'}</Text>
                    </View>

                    <View style={s.infoRow}>
                        <View style={s.infoLabelRow}>
                            <Ionicons name="fitness-outline" size={15} color={COLORS.textMuted} />
                            <Text style={s.infoLabel}>Số buổi PT</Text>
                        </View>
                        <Text style={s.infoValue}>{pkg?.so_buoi_pt || 0} buổi</Text>
                    </View>

                    <View style={[s.infoRow, s.infoRowLast]}>
                        <View style={s.infoLabelRow}>
                            <Ionicons name="card-outline" size={15} color={COLORS.textMuted} />
                            <Text style={s.infoLabel}>Phương thức thanh toán</Text>
                        </View>
                        <Text style={s.infoValue}>{methodName}</Text>
                    </View>
                </View>

                {/* Tổng tiền */}
                <Text style={s.sectionTitle}>Tổng kết chi phí</Text>

                <View style={s.card}>
                    <View style={[s.infoRow, s.infoRowLast]}>
                        <Text style={s.infoLabel}>Giá gói tập</Text>
                        <Text style={s.infoValue}>
                            {Number(pkg?.gia || 0).toLocaleString('vi-VN')}đ
                        </Text>
                    </View>

                    <View style={s.dashedDivider} />

                    <View style={s.totalBox}>
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Tổng tạm tính</Text>
                            <Text style={s.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
                        </View>
                    </View>

                    <Text style={s.priceNote}>
                        Số tiền có thể thay đổi nếu lựa chọn PT phát sinh chi phí.
                    </Text>
                </View>

                {/* Lưu ý */}
                <View style={s.notice}>
                    <Ionicons name="information-circle" size={20} color={COLORS.primary} />

                    <Text style={s.noticeText}>
                        Đây là bản đăng ký mô phỏng. Thông tin chỉ được lưu trên thiết bị, chưa gửi lên hệ thống và chưa thanh toán.
                    </Text>
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={s.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                        const routeNames = navigation.getState()?.routeNames || [];
                        const target = routeNames.includes('MyPackages') ? 'MyPackages' : routeNames.includes('MyPackagesScreen') ? 'MyPackagesScreen' : 'MyPackages';
                        navigation.navigate(target);
                    }}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.homeButton}
                    >
                        <Ionicons name="albums-outline" size={20} color={COLORS.white} />
                        <Text style={s.homeText}>Xem gói tập của tôi</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.secondaryButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('MemberTabs')}
                >
                    <Ionicons name="home-outline" size={18} color={COLORS.primary} />
                    <Text style={s.secondaryText}>Về trang chủ</Text>
                </TouchableOpacity>
            </View>

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
    content: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 30,
    },
    successSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    confettiA: {
        position: 'absolute',
        top: 6,
        left: 40,
        width: 10,
        height: 10,
        borderRadius: 3,
        backgroundColor: COLORS.accentGold,
        transform: [{ rotate: '25deg' }],
    },
    confettiB: {
        position: 'absolute',
        top: 40,
        right: 44,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.accentOrange,
        opacity: 0.8,
    },
    confettiC: {
        position: 'absolute',
        top: 110,
        left: 60,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accentGreen,
    },
    confettiD: {
        position: 'absolute',
        top: 0,
        right: 80,
        width: 7,
        height: 14,
        borderRadius: 3,
        backgroundColor: COLORS.accentBlue,
        opacity: 0.7,
        transform: [{ rotate: '-30deg' }],
    },
    circle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    ring: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: COLORS.surfaceTeal,
        borderWidth: 1,
        borderColor: COLORS.borderFocus,
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: 86,
        height: 86,
        borderRadius: 43,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.glow,
    },
    successTitle: {
        fontSize: 25,
        fontWeight: '900',
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    demoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.surfaceTeal,
        borderWidth: 1,
        borderColor: COLORS.borderFocus,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
    },
    demoBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        color: COLORS.primary,
    },
    successDesc: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 14,
        paddingHorizontal: 20,
    },
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
        borderRadius: 18,
        marginBottom: 24,
        ...SHADOWS.card,
    },
    statusIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.accentGold,
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    subText: {
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 17,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
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
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.textPrimary,
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
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    infoRowLast: {
        marginBottom: 0,
    },
    infoLabelRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    totalBox: {
        backgroundColor: COLORS.surfaceTeal,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    priceNote: {
        fontSize: 11.5,
        lineHeight: 17,
        color: COLORS.textMuted,
        marginTop: 10,
    },
    notice: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: COLORS.surfaceTeal,
        borderWidth: 1,
        borderColor: COLORS.borderFocus,
        borderRadius: 16,
        padding: 14,
    },
    noticeText: {
        flex: 1,
        color: COLORS.primaryDark,
        fontSize: 12.5,
        lineHeight: 19,
    },
    footer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...SHADOWS.card,
        shadowOffset: { width: 0, height: -4 },
        elevation: 10,
    },
    homeButton: {
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    homeText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.white,
    },
    secondaryButton: {
        height: 50,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
    },
    secondaryText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.primary,
    },
});

export default RegistrationSuccessScreen;
