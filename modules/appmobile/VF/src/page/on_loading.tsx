import { ActivityIndicator, Image, Text, View } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from "react";

const Onloading = ({ navigation }: any) => {
    useEffect(() => {
        const timeout = setTimeout(async () => {
            const token = await AsyncStorage.getItem('token');
            const role = await AsyncStorage.getItem("role");
            console.log("TOKEN =", token);
            console.log("ROLE =", role);

            if (token && role) {
                if (role === "member") {
                    navigation.replace("MemberTabs");
                } else {
                    navigation.replace("MainTabs");
                }
            } else {
                navigation.replace("Login");
            }
        }, 2000);

        return () => clearTimeout(timeout);
    }, [navigation]);
    return (
        <View style={{ flex: 1, backgroundColor: "#F5FCFB" }}>
            {/* Ảnh nền toàn màn hình */}
            <Image source={require("../assets/Onloading.png")}
                style={{ position: "absolute", width: "100%", height: "100%", resizeMode: "stretch", }} />
            {/* Tên ứng dụng và slogan */}
            <View style={{  position: "absolute", top: "50%", width: "100%", alignItems: "center", }} >
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
            <Text style={{ position: "absolute", bottom: 35,  width: "100%", textAlign: "center", fontSize: 16, letterSpacing: 1.5, color: "#3DB8BA",fontWeight: "bold",}} >
                TẬP LUYỆN • CẢI THIỆN • PHÁT TRIỂN
            </Text>
        </View>
    );

}
export default Onloading; 