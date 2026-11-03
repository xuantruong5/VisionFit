import React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, StatusBar,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const BG = "#071A1D";
const MINT = "#5FD3DC";

const Login = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* ẢNH NỀN PHÍA TRÊN, MỜ DẦN XUỐNG NỀN TỐI */}
            <Image source={require("../assets/fitness-bg.png")} style={styles.heroPhoto} />
            <LinearGradient
                colors={["rgba(7,26,29,0.6)", "rgba(7,26,29,0)", "rgba(7,26,29,0.55)", BG]}
                locations={[0, 0.2, 0.42, 0.58]}
                style={styles.heroImage}
            />

            <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                {/* LOGO */}
                <Text style={styles.brandName}>
                    VISION<Text style={styles.brandAccent}>FIT</Text>
                </Text>

                <View style={styles.flexSpace} />

                {/* TIÊU ĐỀ */}
                <Text style={styles.heroTitle}>
                    Hành trình khỏe mạnh{"\n"}
                    <Text style={styles.brandAccent}>bắt đầu từ đây</Text>
                </Text>
                <Text style={styles.heroSub}>
                    Lịch tập cá nhân, huấn luyện viên riêng và AI đồng hành cùng bạn mỗi ngày.
                </Text>

                {/* EMAIL */}
                <TouchableOpacity onPress={() => navigation.navigate("AuthScreen")} activeOpacity={0.85}>
                    <LinearGradient
                        colors={["#3CC3CE", "#0F5468"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.primaryButton}
                    >
                        <Text style={styles.primaryText}>Bắt đầu với Email</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Hoặc</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* SOCIAL */}
                <View style={styles.socialRow}>
                    <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                        <MaterialCommunityIcons name="google" size={20} color="#FFFFFF" />
                        <Text style={styles.socialText}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                        <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
                        <Text style={styles.socialText}>Facebook</Text>
                    </TouchableOpacity>
                </View>

                {/* TRAINER */}
                <View style={styles.trainerRow}>
                    <Text style={styles.trainerQuestion}>Bạn là huấn luyện viên? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("TrainerAuthScreen")}>
                        <Text style={styles.trainerLink}>Đăng nhập Trainer</Text>
                    </TouchableOpacity>
                </View>

                {/* POLICY */}
                <Text style={styles.policyText}>
                    Tiếp tục nghĩa là bạn đồng ý với{" "}
                    <Text style={styles.policyLink}>Điều khoản</Text>
                    {" "}và{" "}
                    <Text style={styles.policyLink}>Chính sách bảo mật</Text>
                </Text>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    heroImage: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    heroPhoto: {
        position: "absolute",
        top: "-26%",
        left: 0,
        width: "100%",
        height: undefined,
        aspectRatio: 736 / 1444,
    },
    safe: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 10,
    },
    flexSpace: {
        flex: 1,
    },

    brandName: {
        marginTop: 26,
        textAlign: "center",
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: 3,
        color: "#FFFFFF",
    },
    brandAccent: {
        color: MINT,
    },

    heroTitle: {
        fontSize: 30,
        lineHeight: 38,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    heroSub: {
        marginTop: 10,
        marginBottom: 26,
        fontSize: 15,
        lineHeight: 22,
        fontWeight: "500",
        color: "rgba(255,255,255,0.72)",
    },

    primaryButton: {
        shadowColor: "#0F5468",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 8,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#FFFFFF",
    },

    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 18,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 13,
        fontWeight: "600",
        color: "rgba(255,255,255,0.5)",
    },

    socialRow: {
        flexDirection: "row",
        gap: 12,
    },
    socialButton: {
        flex: 1,
        height: 54,
        borderRadius: 27,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#10282C",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    socialText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    trainerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 24,
    },
    trainerQuestion: {
        fontSize: 14.5,
        fontWeight: "500",
        color: "rgba(255,255,255,0.75)",
    },
    trainerLink: {
        fontSize: 14.5,
        fontWeight: "800",
        color: MINT,
    },

    policyText: {
        marginTop: 14,
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
        color: "rgba(255,255,255,0.4)",
    },
    policyLink: {
        fontWeight: "700",
        color: "rgba(255,255,255,0.65)",
    },
});

export default Login;
