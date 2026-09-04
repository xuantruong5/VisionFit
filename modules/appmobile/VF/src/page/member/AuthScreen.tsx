import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView,} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
const AuthScreen = ({ navigation }: any) => {
    const [isRegister, setIsRegister] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={25} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        Đăng nhập/Đăng ký
                    </Text>
                    <View style={styles.headerRight} />
                </View>
                {/* Tab Đăng ký / Đăng nhập */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[ styles.tab, isRegister && styles.activeTab, ]} onPress={() => setIsRegister(true)} >
                        <Text
                            style={[ styles.tabText, isRegister && styles.activeTabText, ]} >
                            Đăng ký
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[ styles.tab, !isRegister && styles.activeTab, ]} onPress={() => setIsRegister(false)} >
                        <Text style={[ styles.tabText, !isRegister && styles.activeTabText, ]} >
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
                        placeholderTextColor="#b7b7b7"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none" />
                </View>

                {/* Mật khẩu */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mật khẩu</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Nhập mật khẩu của bạn"
                            placeholderTextColor="#b7b7b7"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword) } style={styles.eyeButton} >
                            <Ionicons
                                name={ showPassword  ? "eye-outline" : "eye-off-outline" } size={25} color="#a8a8a8" />
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
                                placeholderTextColor="#b7b7b7"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>                 
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Họ</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập họ của bạn"
                                placeholderTextColor="#b7b7b7"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                        <View style={styles.policyContainer}>
                            <Text style={styles.policyText}>
                                Bằng việc tiếp tục sử dụng Fitness Online,
                                bạn đồng ý chấp nhận
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
                        <TouchableOpacity style={styles.mainButton} onPress={() => { console.log("Đăng ký"); }} >
                            <Text style={styles.mainButtonText}>
                                ĐĂNG KÝ
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
                {/* Form Đăng nhập */}
                {!isRegister && (
                    <>
                        <TouchableOpacity style={styles.forgotContainer} >
                            <Text style={styles.forgotText}>
                                Quên mật khẩu?
                            </Text>
                        </TouchableOpacity>                    
                        <TouchableOpacity style={styles.mainButton} onPress={() => { console.log("Đăng nhập"); }} >
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
        backgroundColor: "#fff",
    },

    content: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    header: {
        height: 70,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    backButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#f5f5f5",
        alignItems: "center",
        justifyContent: "center",
    },

    headerRight: {
        width: 46,
    },

    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#222",
    },

    

    tabContainer: {
        height: 56,
        backgroundColor: "#e3e6e8",
        borderRadius: 30,
        flexDirection: "row",
        padding: 3,
        marginTop: 8,
        marginBottom: 38,
    },

    tab: {
        flex: 1,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },

    activeTab: {
        backgroundColor: "#314d68",
    },

    tabText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#71808d",
    },

    activeTabText: {
        color: "#fff",
    },

    

    inputGroup: {
        marginBottom: 27,
    },

    label: {
        fontSize: 17,
        fontWeight: "500",
        color: "#333",
        marginBottom: 9,
    },

    input: {
        height: 55,
        borderBottomWidth: 1,
        borderBottomColor: "#dedede",
        fontSize: 17,
        color: "#333",
        paddingHorizontal: 0,
    },

    passwordContainer: {
        height: 55,
        borderBottomWidth: 1,
        borderBottomColor: "#dedede",
        flexDirection: "row",
        alignItems: "center",
    },

    passwordInput: {
        flex: 1,
        height: 55,
        fontSize: 17,
        color: "#333",
        paddingHorizontal: 0,
    },

    eyeButton: {
        width: 40,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
    },

    

    policyContainer: {
        marginTop: 8,
        marginBottom: 30,
        alignItems: "center",
    },

    policyText: {
        fontSize: 14,
        lineHeight: 21,
        color: "#555",
        textAlign: "center",
    },

    policyLinks: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
    },

    linkText: {
        color: "#40aaa9",
        fontSize: 14,
        fontWeight: "500",
    },

    

    mainButton: {
        height: 56,
        borderRadius: 8,
        backgroundColor: "#e5e5e5",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 5,
    },

    mainButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#aaa",
    },

    

    forgotContainer: {
        marginTop: 4,
        marginBottom: 480,
    },

    forgotText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#3ba6a6",
    },
});

export default AuthScreen;