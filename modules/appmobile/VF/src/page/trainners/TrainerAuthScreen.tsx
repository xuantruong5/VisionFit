import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, StatusBar, Modal, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { TRAINER_COLORS as C, SOFT_SHADOW } from "../../general/theme";

const TrainerAuthScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState("social");
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [referralCode, setReferralCode] = useState("");

    const handleRegister = () => {
        // Mở popup thông báo chờ duyệt theo đúng yêu cầu nghiệp vụ
        setShowSuccessModal(true);
    };

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
                                value={email}
                                onChangeText={setEmail}
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
                                    value={password}
                                    onChangeText={setPassword}
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
                            <TextInput style={styles.input} placeholder="Nhập tên của bạn" placeholderTextColor={C.textLight} value={firstName} onChangeText={setFirstName} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Họ
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập họ của bạn" placeholderTextColor={C.textLight} value={lastName} onChangeText={setLastName} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Mã
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập mã giới thiệu của bạn" placeholderTextColor={C.textLight} value={referralCode} onChangeText={setReferralCode} />
                        </View>
                 
                        <TouchableOpacity>
                            <Text style={styles.helpText}>
                                Làm thế nào để nhận được mã giới thiệu?
                            </Text>
                        </TouchableOpacity>
                 
                        <TouchableOpacity style={styles.registerButton} onPress={handleRegister} activeOpacity={0.85}>
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

            {/* POPUP THÔNG BÁO ĐĂNG KÝ CHỜ DUYỆT */}
            {showSuccessModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconBox}>
                            <Ionicons name="mail-unread" size={38} color={C.primary} />
                        </View>
                        <Text style={styles.modalTitle}>Đăng Ký Thành Công!</Text>
                        <Text style={styles.modalMessage}>
                            Chúng tôi đã nhận được thông tin đăng ký của bạn. Ban quản trị VisionFit sẽ xét duyệt hồ sơ và liên hệ với bạn trong vòng 2 ngày tới qua email.
                        </Text>
                        <View style={styles.modalTipBox}>
                            <Ionicons name="information-circle-outline" size={18} color="#D97706" />
                            <Text style={styles.modalTipText}>
                                Vui lòng kiểm tra hộp thư email (kể cả mục Thư rác/Quảng cáo) để theo dõi thông báo kích hoạt tài khoản.
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate("Login");
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.modalCloseBtnText}>VỀ TRANG ĐĂNG NHẬP</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
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
        fontWeight: "700",
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
        fontWeight: "700",
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
      fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: "700",
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
      fontWeight: '600',
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
      fontWeight: '600',
    },
    eyeButton: {
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
    },
    helpText: {
        fontSize: 13,
        fontWeight: "700",
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
        fontWeight: "700",
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
      fontWeight: '600',
    },
    termsRow: {
        flexDirection: "row",
        marginTop: 2,
    },
    termsLink: {
        fontSize: 12,
        fontWeight: "700",
        color: C.primaryDark,
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        zIndex: 9999,
        elevation: 20,
    },
    modalCard: {
        width: "100%",
        backgroundColor: C.white,
        borderRadius: 28,
        padding: 24,
        alignItems: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
    },
    modalIconBox: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: C.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: C.textPrimary,
        marginBottom: 10,
        textAlign: "center",
    },
    modalMessage: {
        fontSize: 14,
        color: C.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 16,
    },
    modalTipBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF3C7",
        borderRadius: 14,
        padding: 12,
        gap: 8,
        marginBottom: 20,
    },
    modalTipText: {
        flex: 1,
        fontSize: 12,
        color: "#92400E",
        lineHeight: 18,
        fontWeight: "500",
    },
    modalCloseBtn: {
        width: "100%",
        height: 50,
        borderRadius: 25,
        backgroundColor: C.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    modalCloseBtnText: {
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.8,
        color: C.white,
    },
});

export default TrainerAuthScreen;
