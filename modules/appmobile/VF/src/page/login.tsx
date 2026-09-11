import React from "react";
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, StatusBar,} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp,} from "react-native-responsive-screen";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
const Login = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <ImageBackground source={require("../assets/anh-fitness-1.png")} style={styles.background}  resizeMode="cover" >
                <View style={styles.overlay} />
                <View style={styles.content}>
                    <Text style={styles.title}>
                       VisionFit
                    </Text>
                    <Text style={styles.loginBy}>
                        Đăng nhập bằng
                    </Text>
                    <TouchableOpacity style={[ styles.loginButton, styles.appleButton, ]} >
                        <MaterialCommunityIcons name="google" size={wp("7.5%")} color="#11343A" />
                        <Text style={styles.buttonText}>
                            Đăng nhập bằng Google
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[ styles.loginButton, styles.facebookButton, ]} >
                        <Ionicons name="logo-facebook" size={wp("7.5%")} color="#11343A" />
                        <Text style={styles.buttonText}>
                            Đăng nhập bằng Facebook
                        </Text>
                    </TouchableOpacity>
                    {/* EMAIL */}
                    <TouchableOpacity style={styles.emailButton} onPress={() => navigation.navigate("AuthScreen")}>
                        <Text style={styles.emailText}>
                            Đăng nhập/Đăng ký bằng địa chỉ email
                        </Text>
                    </TouchableOpacity>
                    {/* TRAINER */}
                    <View style={styles.trainerContainer}>
                        <Text style={styles.trainerQuestion}>
                            Bạn có phải là huấn luyện viên không?
                        </Text>
                        <TouchableOpacity>
                            <Text style={styles.trainerLink} onPress={() => navigation.navigate("TrainerAuthScreen")}>
                                Nhấn vào đây
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {/* POLICY */}
                    <View style={styles.policyContainer}>
                        <Text style={styles.policyText}>
                            Bằng việc tiếp tục sử dụng Fitness Online, bạn đồng ý
                        </Text>
                        <Text style={styles.policyText}>
                            chấp nhận
                        </Text>
                        <View style={styles.policyLinks}>
                            <Text style={styles.policyLink}>
                                Thỏa thuận người dùng
                            </Text>
                            <Text style={styles.policyAnd}>
                                {" "}và{" "}
                            </Text>
                            <Text style={styles.policyLink}>
                                Chính sách bảo mật
                            </Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EAF9FB",
    },
    background: {
        flex: 1,
        width: wp("100%"),
        height: hp("100%"),
    },
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.62)",
    },

    closeButton: {
        position: "absolute",
        top: hp("5%"),
        left: wp("3%"),
        width: wp("15%"),
        height: wp("15%"),
        borderRadius: wp("7.5%"),
        borderWidth: 1,
        borderColor: "rgba(120, 130, 140, 0.4)",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },

    content: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: wp("5%"),
        paddingTop: hp("23%"),
    },

    title: {
        
        fontSize: wp("10%"),
        fontWeight: "900",
        letterSpacing: 0.5,
    },

    titleThin: {
        fontWeight: "300",
    },

    loginBy: {
        
        fontSize: wp("6.5%"),
        fontWeight: "700",
        marginTop: hp("3%"),
        marginBottom: hp("4%"),
    },

    loginButton: {
        width: wp("92%"),
        height: hp("6%"),
        borderRadius: wp("3%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: hp("1.5%"),
        gap: wp("3%"),
    },

    appleButton: {
        backgroundColor: "#111419",
    },

    facebookButton: {
        backgroundColor: "#4385e9",
    },

    buttonText: {
        
        fontSize: wp("5.3%"),
        fontWeight: "700",
    },

    emailButton: {
        marginTop: hp("3%"),
    },

    emailText: {
        
        fontSize: wp("5%"),
        fontWeight: "600",
        textDecorationLine: "underline",
    },

    trainerContainer: {
        alignItems: "center",
        marginTop: hp("10%"),
    },

    trainerQuestion: {
        
        fontSize: wp("5%"),
        fontWeight: "700",
        textAlign: "center",
    },

    trainerLink: {
        
        fontSize: wp("5.2%"),
        fontWeight: "600",
        textDecorationLine: "underline",
        marginTop: hp("0.7%"),
    },

    policyContainer: {
        position: "absolute",
        bottom: hp("4%"),
        left: wp("4%"),
        right: wp("4%"),
        alignItems: "center",
    },

    policyText: {
        
        fontSize: wp("3.4%"),
        textAlign: "center",
        lineHeight: hp("2.5%"),
    },

    policyLinks: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: hp("0.2%"),
    },

    policyLink: {
        
        fontSize: wp("3.4%"),
        fontWeight: "700",
        textDecorationLine: "underline",
    },

    policyAnd: {
        
        fontSize: wp("3.4%"),
    },
});

export default Login;
