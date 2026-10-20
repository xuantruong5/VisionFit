import { ActivityIndicator, Image, Text, View } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from "react";
import apiFitlife from '../general/api';

const Onloading = ({ navigation }: any) => {
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const role = await AsyncStorage.getItem("role");
                console.log("TOKEN =", token);
                console.log("ROLE =", role);
                // Chưa đăng nhập
                if (!token || !role) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "OnboardingScreen" }],
                    });
                    return;
                }
                // Hội viên
                if (role === "member") {
                    try {const response = await apiFitlife.get("/client/my-programs");
                        const chuongTrinh = response.data.data;
                        console.log("MY PROGRAMS =", chuongTrinh);
                        const targetScreen =
                            Array.isArray(chuongTrinh) &&
                            chuongTrinh.length > 0
                                ? "headerPage"
                                : "WorkoutPlanScreen";

                        navigation.reset({
                            index: 0,
                            routes: [
                                {
                                    name: "MemberTabs",
                                    params: {
                                        screen: "Kế Hoạch Tập",
                                        params: {
                                            screen: targetScreen,
                                        },
                                    },
                                },
                            ],
                        });
                    } catch (error: any) {
                        console.log(
                            "Lỗi kiểm tra chương trình:",
                            error.response?.data || error.message
                        );

                        // API lỗi xác thực thì quay về đăng nhập
                        if (error.response?.status === 401 ||
                            error.response?.status === 403) {
                            await AsyncStorage.removeItem("token");
                            await AsyncStorage.removeItem("role");

                            navigation.reset({
                                index: 0,
                                routes: [
                                    { name: "OnboardingScreen" },
                                ],
                            });
                            return;
                        }

                        // Lỗi mạng/server: không đoán trạng thái đăng ký
                        navigation.replace("MemberTabs");
                    }

                    return;
                }

                // Huấn luyện viên
                if (role === "trainer") {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "MainTabs" }],
                    });
                    return;
                }
                // Role không hợp lệ
                navigation.reset({
                    index: 0,
                    routes: [{ name: "OnboardingScreen" }],
                });
            } catch (error: any) {
                console.log(
                    "Lỗi kiểm tra đăng nhập:",
                    error.message
                );

                navigation.reset({
                    index: 0,
                    routes: [{ name: "OnboardingScreen" }],
                });
            }
        };

        checkLogin();
    }, [navigation]);

    return (
        <View style={{ flex: 1, backgroundColor: "#F5FCFB" }}>
            {/* Ảnh nền toàn màn hình */}
            <Image source={require("../assets/Onloading.png")}
                style={{ position: "absolute", width: "100%", height: "100%", resizeMode: "stretch", }} />
            {/* Tên ứng dụng và slogan */}
            <View style={{ position: "absolute", top: "50%", width: "100%", alignItems: "center", }} >
                {/* Tên ứng dụng */}
                <Text style={{ fontSize: 34, fontWeight: "bold", color: "#11343A", letterSpacing: 1, }} >
                    VisionFit
                </Text>
                {/* Slogan */}
                <Text style={{ fontSize: 18, color: "#6B9294", marginTop: 8, }} >
                    Khỏe hơn mỗi ngày
                </Text>
            </View>
            {/* Loading */}
            <View style={{ position: "absolute", top: "65%", width: "100%", alignItems: "center", }}  >
                <ActivityIndicator size="large" color="#3DB8BA" />
                <Text
                    style={{ marginTop: 10, fontSize: 16, color: "#6B9294", }} >
                    Đang tải...
                </Text>
            </View>
            {/* Nội dung cuối màn hình */}
            <Text style={{ position: "absolute", bottom: 35, width: "100%", textAlign: "center", fontSize: 16, letterSpacing: 1.5, color: "#3DB8BA", fontWeight: "bold", }} >
                TẬP LUYỆN • CẢI THIỆN • PHÁT TRIỂN
            </Text>
        </View>
    );

}
export default Onloading; 