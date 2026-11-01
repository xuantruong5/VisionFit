import React, { useState } from "react";
import {StyleSheet,Text,View,TextInput,TouchableOpacity, ScrollView, StatusBar,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { TRAINER_COLORS as C, SOFT_SHADOW } from "../../general/theme";

const TrainerAuthScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState("social");
    const [showPassword, setShowPassword] = useState(false);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="dark-content" />
            <ScrollView showsVerticalScrollIndicator={false}contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
                        <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        Đăng ký dành cho huấn luyện viên
                    </Text>
                    <View style={styles.headerSpace} />
                </View>
                {/* TAB */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[ styles.tab, activeTab === "social" && styles.activeTab, ]} onPress={() => setActiveTab("social")} >
                        <Text style={[ styles.tabText, activeTab === "social" && styles.activeTabText, ]} >
                            Truyền thông xã hội
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[ styles.tab, activeTab === "email" && styles.activeTab, ]} onPress={() => setActiveTab("email")} >
                        <Text style={[ styles.tabText, activeTab === "email" && styles.activeTabText, ]} >
                            Đăng ký bằng email
                        </Text>
                    </TouchableOpacity>
                </View>
                {activeTab === "social" && (
                    <View style={styles.content}>
                        <Text style={styles.description}>
                            Trở thành huấn luyện viên của VisionFit và cung 
                            cấp dịch vụ cho khách hàng. Chia sẻ kinh nghiệm của
                            bạn, giao tiếp và giúp người dùng đạt được kết quả mỹ 
                            mãn!
                        </Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Mã
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập mã giới thiệu của bạn" placeholderTextColor={C.textLight}/>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.helpText}>
                                Làm thế nào để nhận được mã giới thiệu?
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[ styles.socialButton, styles.appleButton, ]} >
                            <MaterialCommunityIcons name="google" size={wp("7%")} color={C.textPrimary} />
                            <Text style={styles.socialText}>
                                Đăng nhập bằng Google
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.socialButton,styles.facebookButton,]} >
                            <Ionicons name="logo-facebook" size={wp("7%")} color={C.textPrimary}/>
                            <Text style={styles.socialText}>
                                Đăng nhập bằng Facebook
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                Bằng việc tiếp tục sử dụng Fitness Online, bạn đồng ý
                            </Text>
                            <View style={styles.termsRow}>
                                <Text style={styles.termsLink}>
                                    Thỏa thuận người dùng
                                </Text>
                                <Text style={styles.termsText}>
                                    {" "}và{" "}
                                </Text>
                                <Text style={styles.termsLink}>
                                    Chính sách bảo mật
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                {/* ================= EMAIL ================= */}
                {activeTab === "email" && (
                    <View style={styles.content}>
                        {/* EMAIL */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Email
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập địa chỉ email của bạn"
                                placeholderTextColor={C.textLight}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        {/* PASSWORD */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Mật khẩu
                            </Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Nhập mật khẩu của bạn"
                                    placeholderTextColor={C.textLight}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity style={styles.eyeButton} onPress={() =>setShowPassword(!showPassword)} >
                                    <Ionicons name={ showPassword? "eye-outline" : "eye-off-outline" } size={wp("6%")} color={C.textLight} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* TÊN */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Tên
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập tên của bạn" placeholderTextColor={C.textLight} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Họ
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập họ của bạn" placeholderTextColor={C.textLight} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Mã
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập mã giới thiệu của bạn" placeholderTextColor={C.textLight} />
                        </View>
                 
                        <TouchableOpacity>
                            <Text style={styles.helpText}>
                                Làm thế nào để nhận được mã giới thiệu?
                            </Text>
                        </TouchableOpacity>
                 
                        <TouchableOpacity style={styles.registerButton} >
                            <Text style={styles.registerText}>
                                ĐĂNG KÝ
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                Bằng việc tiếp tục sử dụng Fitness Online, bạn đồng ý
                            </Text>
                            <View style={styles.termsRow}>
                                <Text style={styles.termsLink}>
                                    Thỏa thuận người dùng
                                </Text>
                                <Text style={styles.termsText}>
                                    {" "}và{" "}
                                </Text>
                                <Text style={styles.termsLink}>
                                    Chính sách bảo mật
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.background,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 8,
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: C.white,
        alignItems: "center",
        justifyContent: "center",
        ...SOFT_SHADOW,
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "600",
        color: C.textPrimary,
        paddingHorizontal: 8,
    },
    headerSpace: {
        width: 44,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: C.white,
        borderRadius: 26,
        padding: 5,
        gap: 4,
        ...SOFT_SHADOW,
    },
    tab: {
        flex: 1,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
    },
    activeTab: {
        backgroundColor: C.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
        color: C.textMuted,
    },
    activeTabText: {
        color: C.white,
        fontWeight: "700",
    },
    content: {
        backgroundColor: C.white,
        borderRadius: 28,
        padding: 20,
        marginTop: 16,
        ...SOFT_SHADOW,
    },
    description: {
        fontSize: 14,
        lineHeight: 21,
        color: C.textSecondary,
        marginBottom: 18,
    },
    inputGroup: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: C.textPrimary,
        marginBottom: 8,
    },
    input: {
        height: 52,
        borderRadius: 26,
        backgroundColor: C.background,
        paddingHorizontal: 18,
        fontSize: 14,
        color: C.textPrimary,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 52,
        borderRadius: 26,
        backgroundColor: C.background,
        paddingLeft: 18,
        paddingRight: 8,
    },
    passwordInput: {
        flex: 1,
        fontSize: 14,
        color: C.textPrimary,
    },
    eyeButton: {
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
    },
    helpText: {
        fontSize: 13,
        fontWeight: "600",
        color: C.primaryDark,
        marginBottom: 20,
    },
    socialButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        height: 54,
        borderRadius: 27,
        marginBottom: 12,
    },
    appleButton: {
        backgroundColor: C.background,
    },
    facebookButton: {
        backgroundColor: C.primaryLight,
    },
    socialText: {
        fontSize: 14.5,
        fontWeight: "600",
        color: C.textPrimary,
    },
    registerButton: {
        height: 54,
        borderRadius: 27,
        backgroundColor: C.primary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    registerText: {
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 1,
        color: C.white,
    },
    termsContainer: {
        alignItems: "center",
        marginTop: 16,
    },
    termsText: {
        fontSize: 12,
        color: C.textMuted,
        textAlign: "center",
    },
    termsRow: {
        flexDirection: "row",
        marginTop: 2,
    },
    termsLink: {
        fontSize: 12,
        fontWeight: "600",
        color: C.primaryDark,
    },
});

export default TrainerAuthScreen;
