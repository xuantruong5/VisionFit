import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiFitlife from '../../general/api';
import LinearGradient from "react-native-linear-gradient";
import { COLORS, SHADOWS } from "../../general/theme";

const AuthScreen = ({ navigation }: any) => {
    const [isRegister, setIsRegister] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu');
            return;
        }
        try {
            const response = await apiFitlife.post('/client/login', {
                email: email.trim(),
                password: password,
            });
            console.log('Kết quả đăng nhập:', response.data);
            const token = response.data.token;
            if (!token) {
                Alert.alert(
                    'Thông báo',
                    'Đăng nhập thành công nhưng API không trả về token'
                );
                return;
            }
            // Lưu token và role
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('role', 'member');
            console.log('Đăng nhập thành công, đang kiểm tra chương trình tập...');
            // Kiểm tra chương trình tập đã đăng ký
            const programResponse = await apiFitlife.get('/client/my-programs');
            const chuongTrinh = programResponse.data.data;
            console.log('MY PROGRAMS =', chuongTrinh);
            // Có chương trình thì vào DashboardScreen
            // Chưa có chương trình thì vào WorkoutPlanScreen
            const targetScreen = Array.isArray(chuongTrinh) && chuongTrinh.length > 0
                    ? 'headerPage'
                    : 'WorkoutPlanScreen';

            Alert.alert('Thành công', 'Đăng nhập thành công');
            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: 'MemberTabs',
                        params: {
                            screen: 'Kế Hoạch Tập',
                            params: {
                                screen: targetScreen,
                            },
                        },
                    },
                ],
            });
        } catch (error: any) {
            console.log(
                'Lỗi đăng nhập hoặc kiểm tra chương trình:',
                error.response?.data || error.message
            );

            Alert.alert(
                'Thông báo',
                error.response?.data?.message ||
                'Không thể đăng nhập hoặc kiểm tra chương trình tập'
            );
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header gradient */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.decorCircle} />
                    <View style={styles.decorCircleSmall} />
                    <View style={styles.headerRow}>
                        {navigation?.canGoBack?.() ? (
                            <TouchableOpacity
                                style={styles.glassBtn}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        ) : null}
                        <Text style={styles.headerTitle}>Tài khoản VisionFit</Text>
                    </View>
                    <View style={styles.brandRow}>
                        <View style={styles.logoTile}>
                            <Ionicons name="fitness" size={28} color={COLORS.white} />
                        </View>
                        <View style={styles.flex}>
                            <Text style={styles.brandTitle}>
                                {isRegister ? 'Đăng ký' : 'Đăng nhập'}
                            </Text>
                            <Text style={styles.brandSub}>VisionFit • Member</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Form card */}
                <View style={styles.formCard}>
                    {/* Tab Đăng ký / Đăng nhập */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, isRegister && styles.activeTab]}
                            onPress={() => setIsRegister(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, isRegister && styles.activeTabText]}>
                                Đăng ký
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, !isRegister && styles.activeTab]}
                            onPress={() => setIsRegister(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, !isRegister && styles.activeTabText]}>
                                Đăng nhập
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập địa chỉ email của bạn"
                                placeholderTextColor={COLORS.textLight}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Mật khẩu */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mật khẩu của bạn"
                                placeholderTextColor={COLORS.textLight}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color={COLORS.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Form Đăng ký */}
                    {isRegister && (
                        <>
                            <View style={styles.nameRow}>
                                <View style={[styles.inputGroup, styles.flex]}>
                                    <Text style={styles.label}>Tên</Text>
                                    <View style={styles.inputWrap}>
                                        <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập tên của bạn"
                                            placeholderTextColor={COLORS.textLight}
                                            value={firstName}
                                            onChangeText={setFirstName}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.inputGroup, styles.flex]}>
                                    <Text style={styles.label}>Họ</Text>
                                    <View style={styles.inputWrap}>
                                        <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập họ của bạn"
                                            placeholderTextColor={COLORS.textLight}
                                            value={lastName}
                                            onChangeText={setLastName}
                                        />
                                    </View>
                                </View>
                            </View>
                            <View style={styles.policyContainer}>
                                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
                                <View style={styles.flex}>
                                    <Text style={styles.policyText}>
                                        Bằng việc tiếp tục sử dụng VisionFit, bạn đồng ý với
                                    </Text>
                                    <View style={styles.policyLinks}>
                                        <TouchableOpacity>
                                            <Text style={styles.linkText}>
                                                Thỏa thuận người dùng
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.policyText}> và </Text>
                                        <TouchableOpacity>
                                            <Text style={styles.linkText}>
                                                Chính sách bảo mật
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => { console.log("Đăng ký"); }} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.mainButton}
                                >
                                    <Text style={styles.mainButtonText}>
                                        ĐĂNG KÝ
                                    </Text>
                                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Form Đăng nhập */}
                    {!isRegister && (
                        <>
                            <TouchableOpacity style={styles.forgotContainer}>
                                <Text style={styles.forgotText}>
                                    Quên mật khẩu?
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLogin} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.mainButton}
                                >
                                    <Text style={styles.mainButtonText}>
                                        ĐĂNG NHẬP
                                    </Text>
                                    <Ionicons name="log-in-outline" size={19} color={COLORS.white} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        backgroundColor: COLORS.background,
    },
    flex: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 58,
        borderRadius: 28,
        marginHorizontal: 12,
        marginTop: 6,
        overflow: "hidden",
    },
    decorCircle: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(255,255,255,0.07)",
        top: -70,
        right: -60,
    },
    decorCircleSmall: {
        position: "absolute",
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: "rgba(255,255,255,0.07)",
        bottom: -30,
        left: -30,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 40,
    },
    glassBtn: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.white,
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginTop: 22,
    },
    logoTile: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    brandTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: COLORS.white,
    },
    brandSub: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
    },
    formCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginTop: -36,
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
        shadowOpacity: 0.12,
        elevation: 6,
    },
    tabContainer: {
        height: 50,
        backgroundColor: COLORS.background,
        borderRadius: 16,
        flexDirection: "row",
        padding: 4,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    tab: {
        flex: 1,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    activeTab: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.glow,
    },
    tabText: {
        fontSize: 14.5,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    activeTabText: {
        color: COLORS.white,
        fontWeight: "700",
    },
    nameRow: {
        flexDirection: "row",
        gap: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    inputWrap: {
        height: 50,
        backgroundColor: COLORS.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        gap: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 14.5,
        color: COLORS.textPrimary,
    },
    eyeButton: {
        width: 34,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    policyContainer: {
        flexDirection: "row",
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: COLORS.surfaceTeal,
        marginTop: 2,
        marginBottom: 20,
    },
    policyText: {
        fontSize: 12.5,
        lineHeight: 18,
        color: COLORS.textMuted,
    },
    policyLinks: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        marginTop: 2,
    },
    linkText: {
        color: COLORS.primary,
        fontSize: 12.5,
        fontWeight: "700",
    },
    mainButton: {
        height: 52,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...SHADOWS.glow,
    },
    mainButtonText: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    forgotContainer: {
        marginTop: 0,
        marginBottom: 22,
        alignItems: "flex-end",
    },
    forgotText: {
        fontSize: 13.5,
        fontWeight: "700",
        color: COLORS.primary,
    },
});

export default AuthScreen;
