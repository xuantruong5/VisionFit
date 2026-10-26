
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

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
                    <LinearGradient colors={['#E0F5F0', '#F0FAFA']} style={s.circle}>
                        <View style={s.innerCircle}>
                            <Ionicons name="checkmark" size={55} color={C.white} />
                        </View>
                    </LinearGradient>

                    <Text style={s.successTitle}>Đăng ký thành công!</Text>
                    <Text style={s.demoBadge}>CHẾ ĐỘ DEMO</Text>
                    <Text style={s.successDesc}>
                        Bạn đã hoàn tất các bước đăng ký gói tập trên ứng dụng VisionFit.
                    </Text>
                </View>

                {/* Trạng thái */}
                <View style={s.statusBox}>
                    <Ionicons name="time-outline" size={25} color={C.primary} />
                    <View style={s.flex}>
                        <Text style={s.statusTitle}>Chờ thanh toán</Text>
                        <Text style={s.subText}>Chưa phát sinh giao dịch thực tế</Text>
                    </View>
                </View>

                {/* Thông tin đăng ký */}
                <Text style={s.sectionTitle}>Thông tin đăng ký</Text>

                <View style={s.card}>
                    <View style={s.packageRow}>
                        <View style={s.packageIcon}>
                            <Ionicons name="barbell" size={25} color={C.primary} />
                        </View>

                        <View style={s.flex}>
                            <Text style={s.packageName}>{pkg?.ten_goi || 'Gói tập VisionFit'}</Text>
                            <Text style={s.subText}>Gói tập đã chọn</Text>
                        </View>

                        <Ionicons name="checkmark-circle" size={23} color={C.primary} />
                    </View>

                    <View style={s.divider} />

                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Thời hạn</Text>
                        <Text style={s.infoValue}>{pkg?.thoi_han || 0} ngày</Text>
                    </View>

                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Huấn luyện viên</Text>
                        <Text style={s.infoValue}>{pt?.ho_ten || 'Không chọn PT'}</Text>
                    </View>

                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Số buổi PT</Text>
                        <Text style={s.infoValue}>{pkg?.so_buoi_pt || 0} buổi</Text>
                    </View>

                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Phương thức thanh toán</Text>
                        <Text style={s.infoValue}>{methodName}</Text>
                    </View>
                </View>

                {/* Tổng tiền */}
                <Text style={s.sectionTitle}>Tổng kết chi phí</Text>

                <View style={s.card}>
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Giá gói tập</Text>
                        <Text style={s.infoValue}>
                            {Number(pkg?.gia || 0).toLocaleString('vi-VN')}đ
                        </Text>
                    </View>

                    <View style={s.divider} />

                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>Tổng tạm tính</Text>
                        <Text style={s.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
                    </View>

                    <Text style={s.priceNote}>
                        Số tiền có thể thay đổi nếu lựa chọn PT phát sinh chi phí.
                    </Text>
                </View>

                {/* Lưu ý */}
                <View style={s.notice}>
                    <Ionicons name="information-circle-outline" size={23} color={C.primary} />

                    <Text style={s.noticeText}>
                        Đây là bản đăng ký mô phỏng. Thông tin chỉ được lưu trên thiết bị, chưa gửi lên hệ thống và chưa thanh toán.
                    </Text>
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={s.homeButton}
                    onPress={() => navigation.navigate('MyPackages')}
                >
                    <Ionicons name="albums-outline" size={21} color={C.white} />
                    <Text style={s.homeText}>Xem gói tập của tôi</Text>
                </TouchableOpacity>
            </View>

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
    content: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 30,
    },
    successSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    circle: {
        width: 125,
        height: 125,
        borderRadius: 65,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    innerCircle: {
        width: 88,
        height: 88,
        borderRadius: 45,
        backgroundColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitle: {
        fontSize: 25,
        fontWeight: '900',
        color: C.text,
        marginBottom: 12,
    },
    demoBadge: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        color: C.primary,
        backgroundColor: C.soft,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
        overflow: 'hidden',
    },
    successDesc: {
        fontSize: 13,
        lineHeight: 21,
        color: C.muted,
        textAlign: 'center',
        marginTop: 15,
        paddingHorizontal: 15,
    },
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.soft,
        padding: 16,
        borderRadius: 16,
        marginBottom: 26,
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: C.text,
        marginBottom: 5,
    },
    subText: {
        fontSize: 12,
        color: C.muted,
        lineHeight: 19,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: C.text,
        marginBottom: 13,
    },
    card: {
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 19,
        padding: 17,
        marginBottom: 25,
    },
    packageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    packageIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: C.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packageName: {
        fontSize: 15,
        fontWeight: '800',
        color: C.text,
        marginBottom: 5,
    },
    divider: {
        height: 1,
        backgroundColor: C.border,
        marginVertical: 17,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 15,
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
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    priceNote: {
        fontSize: 11,
        lineHeight: 18,
        color: C.muted,
        marginTop: 13,
    },
    notice: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: C.soft,
        borderRadius: 15,
        padding: 15,
    },
    noticeText: {
        flex: 1,
        color: C.primary,
        fontSize: 12,
        lineHeight: 20,
    },
    footer: {
        backgroundColor: C.white,
        paddingHorizontal: 19,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    homeButton: {
        height: 54,
        backgroundColor: C.primary,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    homeText: {
        fontSize: 15,
        fontWeight: '800',
        color: C.white,
    },
});

export default RegistrationSuccessScreen;
