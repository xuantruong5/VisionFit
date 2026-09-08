import React, { useState } from "react";
import {StyleSheet,Text,View,TextInput,TouchableOpacity, ScrollView, SafeAreaView, StatusBar,} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp,} from "react-native-responsive-screen";

const TrainerAuthScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState("social");
    const [showPassword, setShowPassword] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
                        <Ionicons name="arrow-back" size={wp("6%")} color="#444" />
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
                            <TextInput style={styles.input} placeholder="Nhập mã giới thiệu của bạn" placeholderTextColor="#C8C8C8"/>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.helpText}>
                                Làm thế nào để nhận được mã giới thiệu?
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[ styles.socialButton, styles.appleButton, ]} >
                            <MaterialCommunityIcons name="google" size={wp("7%")} color="#fff" />
                            <Text style={styles.socialText}>
                                Đăng nhập bằng Google
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.socialButton,styles.facebookButton,]} >
                            <Ionicons name="logo-facebook" size={wp("7%")} color="#FFFFFF"/>
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
                                placeholderTextColor="#C8C8C8"
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
                                    placeholderTextColor="#C8C8C8"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity style={styles.eyeButton} onPress={() =>setShowPassword(!showPassword)} >
                                    <Ionicons name={ showPassword? "eye-outline" : "eye-off-outline" } size={wp("6%")} color="#BDBDBD" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* TÊN */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Tên
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập tên của bạn" placeholderTextColor="#C8C8C8" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Họ
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập họ của bạn" placeholderTextColor="#C8C8C8" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Mã
                            </Text>
                            <TextInput style={styles.input} placeholder="Nhập mã giới thiệu của bạn" placeholderTextColor="#C8C8C8" />
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
        backgroundColor: "#FFFFFF",
        paddingTop: 40,
    },

    scrollContent: {
        paddingBottom: hp("5%"),
    },

    // HEADER
    header: {
        height: hp("10%"),
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp("4%"),
    },

    backButton: {
        width: wp("11%"),
        height: wp("11%"),
        borderRadius: wp("6%"),
        backgroundColor: "#F6F6F6",
        alignItems: "center",
        justifyContent: "center",
    },

    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: wp("5%"),
        fontWeight: "700",
        color: "#303030",
        marginHorizontal: wp("2%"),
    },

    headerSpace: {
        width: wp("11%"),
    },

    // TAB
    tabContainer: {
        height: hp("6%"),
        marginHorizontal: wp("4%"),
        backgroundColor: "#E5E8E9",
        borderRadius: hp("3%"),
        flexDirection: "row",
        padding: wp("0.5%"),
    },

    tab: {
        flex: 1,
        borderRadius: hp("3%"),
        alignItems: "center",
        justifyContent: "center",
    },

    activeTab: {
        backgroundColor: "#315B7A",
    },

    tabText: {
        fontSize: wp("3.9%"),
        fontWeight: "500",
        color: "#899499",
    },

    activeTabText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },

    // CONTENT
    content: {
        paddingHorizontal: wp("4%"),
        paddingTop: hp("3%"),
    },

    description: {
        fontSize: wp("4%"),
        lineHeight: hp("3%"),
        color: "#626262",
        marginBottom: hp("3%"),
    },

    // INPUT
    inputGroup: {
        marginBottom: hp("2.3%"),
    },

    label: {
        fontSize: wp("4.2%"),
        color: "#414141",
        fontWeight: "500",
        marginBottom: hp("0.7%"),
    },

    input: {
        height: hp("6.5%"),
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
        fontSize: wp("4.2%"),
        color: "#333333",
        paddingHorizontal: 0,
        paddingVertical: 0,
    },

    // PASSWORD
    passwordContainer: {
        height: hp("6.5%"),
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
        flexDirection: "row",
        alignItems: "center",
    },

    passwordInput: {
        flex: 1,
        height: "100%",
        fontSize: wp("4.2%"),
        color: "#333333",
        paddingHorizontal: 0,
        paddingVertical: 0,
    },

    eyeButton: {
        width: wp("10%"),
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },

    // HELP
    helpText: {
        fontSize: wp("4.2%"),
        fontWeight: "600",
        color: "#35AAA6",
        marginTop: hp("0.2%"),
        marginBottom: hp("3%"),
    },

    // SOCIAL
    socialButton: {
        height: hp("7.5%"),
        borderRadius: hp("1.5%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: hp("2%"),
    },

    appleButton: {
        backgroundColor: "#181818",
    },

    facebookButton: {
        backgroundColor: "#4267B2",
    },

    socialText: {
        color: "#FFFFFF",
        fontSize: wp("4.6%"),
        fontWeight: "700",
        marginLeft: wp("5%"),
    },

    // REGISTER
    registerButton: {
        height: hp("7.5%"),
        backgroundColor: "#F1F2F2",
        borderRadius: hp("1.5%"),
        alignItems: "center",
        justifyContent: "center",
        marginTop: hp("3%"),
    },

    registerText: {
        color: "#C8C8C8",
        fontSize: wp("4.7%"),
        fontWeight: "700",
    },

    // TERMS
    termsContainer: {
        marginTop: hp("5%"),
        alignItems: "center",
        paddingHorizontal: wp("3%"),
    },

    termsText: {
        fontSize: wp("3.6%"),
        color: "#777777",
        textAlign: "center",
        lineHeight: hp("2.7%"),
    },

    termsRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
    },

    termsLink: {
        fontSize: wp("3.6%"),
        color: "#35AAA6",
        lineHeight: hp("2.7%"),
    },

});

export default TrainerAuthScreen;