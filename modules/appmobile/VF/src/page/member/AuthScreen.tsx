import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar, Modal, ActivityIndicator } from "react-native";
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

    // State cho Quên mật khẩu
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Nhập email gửi OTP, 2: Nhập OTP & mật khẩu mới
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
    const [showForgotNewPass, setShowForgotNewPass] = useState(false);
    const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
    const [loadingForgot, setLoadingForgot] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false);
    const [timer, setTimer] = useState(600); // 10 phút đếm ngược (600s)

    // Đếm ngược thời gian hiệu lực của mã OTP
    useEffect(() => {
        let interval: any = null;
        if (showForgotModal && forgotStep === 2 && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else if (timer === 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [showForgotModal, forgotStep, timer]);

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Xử lý Đăng ký tài khoản Hội viên
    const handleRegister = async () => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password;
        const fullName = `${lastName.trim()} ${firstName.trim()}`.trim();

        if (!trimmedEmail) {
            Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email');
            return;
        }
        if (!firstName.trim() && !lastName.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập họ và tên của bạn');
            return;
        }
        if (!trimmedPassword) {
            Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu');
            return;
        }
        if (trimmedPassword.length < 6) {
            Alert.alert('Thông báo', 'Mật khẩu phải có tối thiểu 6 ký tự');
            return;
        }

        setLoadingRegister(true);
        try {
            const response = await apiFitlife.post('/client/register', {
                email: trimmedEmail,
                password: trimmedPassword,
                ho_ten: fullName,
            });

            if (response.data?.status || response.data?.success) {
                const token = response.data.token;
                if (token) {
                    await AsyncStorage.setItem('token', token);
                    await AsyncStorage.setItem('role', 'member');
                }

                Alert.alert(
                    'Đăng ký thành công',
                    'Chào mừng bạn đến với VisionFit! Thư chào mừng và mã giới thiệu đã được gửi về email của bạn.',
                    [
                        {
                            text: 'Bắt đầu trải nghiệm',
                            onPress: () => {
                                navigation.reset({
                                    index: 0,
                                    routes: [
                                        {
                                            name: 'MemberTabs',
                                            params: {
                                                screen: 'Kế Hoạch Tập',
                                                params: {
                                                    screen: 'WorkoutPlanScreen',
                                                },
                                            },
                                        },
                                    ],
                                });
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Đăng ký thất bại', response.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
            }
        } catch (error: any) {
            console.log('Lỗi đăng ký:', error.response?.data || error.message);
            const msg = error.response?.data?.message || 'Không thể tạo tài khoản. Vui lòng thử lại!';
            Alert.alert('Thông báo', msg);
        } finally {
            setLoadingRegister(false);
        }
    };

    // Bước 1: Gửi OTP đến Email
    const handleSendForgotOtp = async () => {
        const targetEmail = forgotEmail.trim();
        if (!targetEmail) {
            Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email của bạn');
            return;
        }

        setLoadingForgot(true);
        try {
            const res = await apiFitlife.post('/client/quen-mat-khau', { email: targetEmail });
            if (res.data?.status || res.data?.success) {
                setTimer(600); // 10 phút đếm ngược
                Alert.alert(
                    'Đã gửi mã xác thực',
                    res.data?.message || 'Mã xác thực đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư đến!',
                    [
                        {
                            text: 'TIẾP TỤC',
                            onPress: () => {
                                setForgotStep(2);
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể gửi mã xác nhận.');
            }
        } catch (error: any) {
            Alert.alert('Thông báo', error.response?.data?.message || 'Email này chưa được đăng ký trong hệ thống.');
        } finally {
            setLoadingForgot(false);
        }
    };

    // Bước 2: Đặt lại mật khẩu mới
    const handleResetPassword = async () => {
        if (!forgotOtp.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập mã xác thực OTP 6 số');
            return;
        }
        if (!forgotNewPassword.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu mới');
            return;
        }
        if (forgotNewPassword.length < 6) {
            Alert.alert('Thông báo', 'Mật khẩu mới phải có tối thiểu 6 ký tự');
            return;
        }
        if (forgotNewPassword !== forgotConfirmPassword) {
            Alert.alert('Thông báo', 'Mật khẩu xác nhận không trùng khớp');
            return;
        }

        setLoadingForgot(true);
        try {
            const res = await apiFitlife.post('/client/dat-lai-mat-khau', {
                email: forgotEmail.trim(),
                otp: forgotOtp.trim(),
                mat_khau_moi: forgotNewPassword,
                xac_nhan_mat_khau: forgotConfirmPassword,
            });

            if (res.data?.status || res.data?.success) {
                Alert.alert(
                    'Thành công',
                    'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.',
                    [
                        {
                            text: 'Đăng nhập ngay',
                            onPress: () => {
                                setEmail(forgotEmail.trim());
                                setPassword(forgotNewPassword);
                                setShowForgotModal(false);
                                setForgotStep(1);
                                setForgotOtp('');
                                setForgotNewPassword('');
                                setForgotConfirmPassword('');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể đặt lại mật khẩu.');
            }
        } catch (error: any) {
            Alert.alert('Thất bại', error.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
        } finally {
            setLoadingForgot(false);
        }
    };

    const handleLogin = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu');
            return;
        }
        try {
            // 1. Thử đăng nhập với tài khoản Hội viên (Client)
            const response = await apiFitlife.post('/client/login', {
                email: trimmedEmail,
                password: password,
            });
            console.log('Kết quả đăng nhập Client:', response.data);

            // 2. Nếu đăng nhập Client không thành công, thử đăng nhập với tài khoản Huấn luyện viên (Trainer)
            if (!response.data?.status || !response.data?.token) {
                try {
                    const trainerRes = await apiFitlife.post('/trainer/login', {
                        email: trimmedEmail,
                        password: password,
                    });
                    console.log('Kết quả đăng nhập Trainer:', trainerRes.data);

                    if (trainerRes.data?.status && trainerRes.data?.token) {
                        const trainerToken = trainerRes.data.token;
                        await AsyncStorage.setItem('token', trainerToken);
                        await AsyncStorage.setItem('role', 'trainer');

                        Alert.alert('Thành công', 'Đăng nhập thành công với vai trò Huấn luyện viên');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'MainTabs' }],
                        });
                        return;
                    }
                } catch (trainerErr) {
                    console.log('Lỗi thử đăng nhập Trainer:', trainerErr);
                }

                // Cả hai đều không thành công -> Thông báo lỗi từ server
                Alert.alert(
                    'Đăng nhập thất bại',
                    response.data?.message || 'Tài khoản hoặc mật khẩu không chính xác'
                );
                return;
            }

            // 3. Đăng nhập Hội viên thành công
            const token = response.data.token;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('role', 'member');
            console.log('Đăng nhập thành công, đang kiểm tra chương trình tập...');

            // Kiểm tra chương trình tập đã đăng ký
            const programResponse = await apiFitlife.get('/client/my-programs');
            const chuongTrinh = programResponse.data?.data;
            console.log('MY PROGRAMS =', chuongTrinh);

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
                'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền.'
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
                            <Text style={styles.brandSub}>VisionFit • Member & Trainer</Text>
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
                            <TouchableOpacity 
                                style={[{ width: '100%' }, loadingRegister && { opacity: 0.7 }]}
                                onPress={handleRegister} 
                                disabled={loadingRegister}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.mainButton}
                                >
                                    {loadingRegister ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <>
                                            <Text style={styles.mainButtonText}>
                                                ĐĂNG KÝ
                                            </Text>
                                            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Form Đăng nhập */}
                    {!isRegister && (
                        <>
                            <TouchableOpacity 
                                style={styles.forgotContainer}
                                onPress={() => {
                                    setForgotEmail(email.trim());
                                    setForgotStep(1);
                                    setForgotOtp('');
                                    setForgotNewPassword('');
                                    setForgotConfirmPassword('');
                                    setShowForgotModal(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.forgotText}>
                                    Quên mật khẩu?
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} style={{ width: '100%' }}>
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

            {/* MODAL QUÊN MẬT KHẨU */}
            <Modal
                visible={showForgotModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowForgotModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.dragHandle} />
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>
                                    {forgotStep === 1 ? 'Khôi phục mật khẩu' : 'Đặt lại mật khẩu mới'}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {forgotStep === 1 
                                        ? 'Nhập email đã đăng ký để nhận mã xác thực' 
                                        : `Mã xác thực đã gửi tới ${forgotEmail}`}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setShowForgotModal(false)}
                            >
                                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                            {forgotStep === 1 ? (
                                <View style={{ gap: 16 }}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email tài khoản *</Text>
                                        <View style={styles.inputWrap}>
                                            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Nhập email của bạn..."
                                                placeholderTextColor={COLORS.textLight}
                                                value={forgotEmail}
                                                onChangeText={setForgotEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[{ width: '100%' }, loadingForgot && { opacity: 0.7 }]}
                                        onPress={handleSendForgotOtp}
                                        disabled={loadingForgot}
                                        activeOpacity={0.85}
                                    >
                                        <LinearGradient
                                            colors={[COLORS.primary, COLORS.primaryDark]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.mainButton}
                                        >
                                            {loadingForgot ? (
                                                <ActivityIndicator size="small" color={COLORS.white} />
                                            ) : (
                                                <>
                                                    <Text style={styles.mainButtonText}>GỬI MÃ XÁC THỰC</Text>
                                                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={{ gap: 14 }}>
                                    {/* Đồng hồ đếm ngược hiệu lực mã OTP */}
                                    <View style={[styles.timerBadge, timer === 0 && styles.timerBadgeExpired]}>
                                        <Ionicons
                                            name={timer > 0 ? "time-outline" : "alert-circle-outline"}
                                            size={17}
                                            color={timer > 0 ? COLORS.primary : COLORS.accentRed}
                                        />
                                        <Text style={[styles.timerText, timer === 0 && styles.timerTextExpired]}>
                                            {timer > 0
                                                ? `Hiệu lực mã còn: ${formatTimer(timer)}`
                                                : 'Mã xác thực đã hết hạn!'}
                                        </Text>
                                        {timer === 0 ? (
                                            <TouchableOpacity
                                                onPress={handleSendForgotOtp}
                                                disabled={loadingForgot}
                                                style={styles.resendBtn}
                                            >
                                                <Text style={styles.resendBtnText}>Gửi lại mã</Text>
                                            </TouchableOpacity>
                                        ) : timer <= 540 ? (
                                            <TouchableOpacity
                                                onPress={handleSendForgotOtp}
                                                disabled={loadingForgot}
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                <Text style={styles.resendLinkText}>Gửi lại</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Mã xác thực OTP (6 chữ số) *</Text>
                                        <View style={styles.inputWrap}>
                                            <Ionicons name="key-outline" size={18} color={COLORS.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Nhập mã 6 chữ số..."
                                                placeholderTextColor={COLORS.textLight}
                                                value={forgotOtp}
                                                onChangeText={setForgotOtp}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Mật khẩu mới (tối thiểu 6 ký tự) *</Text>
                                        <View style={styles.inputWrap}>
                                            <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Nhập mật khẩu mới..."
                                                placeholderTextColor={COLORS.textLight}
                                                value={forgotNewPassword}
                                                onChangeText={setForgotNewPassword}
                                                secureTextEntry={!showForgotNewPass}
                                            />
                                            <TouchableOpacity onPress={() => setShowForgotNewPass(!showForgotNewPass)} style={styles.eyeButton}>
                                                <Ionicons name={showForgotNewPass ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.textMuted} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Xác nhận mật khẩu mới *</Text>
                                        <View style={styles.inputWrap}>
                                            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Nhập lại mật khẩu mới..."
                                                placeholderTextColor={COLORS.textLight}
                                                value={forgotConfirmPassword}
                                                onChangeText={setForgotConfirmPassword}
                                                secureTextEntry={!showForgotConfirmPass}
                                            />
                                            <TouchableOpacity onPress={() => setShowForgotConfirmPass(!showForgotConfirmPass)} style={styles.eyeButton}>
                                                <Ionicons name={showForgotConfirmPass ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.textMuted} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                                        <TouchableOpacity
                                            style={styles.modalCancelBtn}
                                            onPress={() => setForgotStep(1)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.modalCancelText}>Quay lại</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[{ flex: 1.5 }, loadingForgot && { opacity: 0.7 }]}
                                            onPress={handleResetPassword}
                                            disabled={loadingForgot}
                                            activeOpacity={0.85}
                                        >
                                            <LinearGradient
                                                colors={[COLORS.primary, COLORS.primaryDark]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.mainButton}
                                            >
                                                {loadingForgot ? (
                                                    <ActivityIndicator size="small" color={COLORS.white} />
                                                ) : (
                                                    <Text style={styles.mainButtonText}>ĐẶT LẠI MẬT KHẨU</Text>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
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
        borderRadius: 20,
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
        borderRadius: 28,
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
        borderRadius: 25,
        flexDirection: "row",
        padding: 4,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    tab: {
        flex: 1,
        borderRadius: 21,
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
        borderRadius: 25,
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
        borderRadius: 18,
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
        width: "100%",
        height: 52,
        borderRadius: 999,
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

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 36,
        ...SHADOWS.card,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.border,
        alignSelf: "center",
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    modalSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    modalCloseBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.background,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
    },
    modalCancelBtn: {
        height: 52,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textSecondary,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceTeal,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(15, 84, 104, 0.15)',
        gap: 8,
        marginBottom: 2,
    },
    timerBadgeExpired: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    timerText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primaryDark,
        flex: 1,
    },
    timerTextExpired: {
        color: COLORS.accentRed,
    },
    resendBtn: {
        backgroundColor: COLORS.accentRed,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    resendBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.white,
    },
    resendLinkText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
});

export default AuthScreen;
