import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiFitlife from '../../general/api';
import AppHeader from "../../components/AppHeader";
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
            <AppHeader
                title="Tài khoản VisionFit"
                onBack={() => navigation.goBack()}
                showBack={navigation?.canGoBack?.()}
            />

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập địa chỉ email của bạn"
                        placeholderTextColor="#71949A"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Mật khẩu */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mật khẩu</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Nhập mật khẩu của bạn"
                            placeholderTextColor="#71949A"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                            <Ionicons
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                size={22}
                                color="#71949A"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form Đăng ký */}
                {isRegister && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập tên của bạn"
                                placeholderTextColor="#71949A"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Họ</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập họ của bạn"
                                placeholderTextColor="#71949A"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                        <View style={styles.policyContainer}>
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
                        <TouchableOpacity style={styles.mainButton} onPress={() => { console.log("Đăng ký"); }} activeOpacity={0.85}>
                            <Text style={styles.mainButtonText}>
                                ĐĂNG KÝ
                            </Text>
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
                        <TouchableOpacity style={styles.mainButton} onPress={handleLogin} activeOpacity={0.85}>
                            <Text style={styles.mainButtonText}>
                                ĐĂNG NHẬP
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        paddingHorizontal: 22,
        paddingTop: 16,
        paddingBottom: 40,
    },
    tabContainer: {
        height: 52,
        backgroundColor: COLORS.surfaceTeal,
        borderRadius: 26,
        flexDirection: "row",
        padding: 4,
        marginTop: 4,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    tab: {
        flex: 1,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    activeTab: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.card,
    },
    tabText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    activeTabText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textDark,
        marginBottom: 8,
    },
    input: {
        height: 52,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 15,
        paddingHorizontal: 16,
        color: COLORS.textDark,
    },
    passwordContainer: {
        height: 52,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        height: 52,
        fontSize: 15,
        color: COLORS.textDark,
    },
    eyeButton: {
        width: 36,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    policyContainer: {
        marginTop: 10,
        marginBottom: 24,
        alignItems: "center",
    },
    policyText: {
        fontSize: 13,
        lineHeight: 19,
        color: COLORS.textMuted,
        textAlign: "center",
    },
    policyLinks: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
    },
    linkText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: "600",
    },
    mainButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
        ...SHADOWS.card,
    },
    mainButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    forgotContainer: {
        marginTop: 4,
        marginBottom: 26,
        alignItems: "flex-end",
    },
    forgotText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
});

export default AuthScreen;
