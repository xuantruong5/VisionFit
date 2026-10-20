import React from "react";
import {
    SafeAreaView,
    View,
    Text,
    Image,
    StyleSheet,
    useWindowDimensions,
    TouchableOpacity,
} from "react-native";

const OnboardingScreen3 = ({ navigation }: any) => {
    const { width, height } = useWindowDimensions();
    const imageSize = Math.min(width * 0.72, height * 0.36, 300);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header} />

            <View style={styles.content}>
                <Image
                    source={require("../../assets/onboarding4.jpg")}
                    style={[styles.image, { width: imageSize, height: imageSize }]}
                    resizeMode="cover"
                />
                <Text style={styles.title}>Tham gia cộng đồng tập luyện</Text>
                <Text style={styles.description}>
                    Chia sẻ kết quả của bạn trong Sports Feed và đặt câu hỏi; gặp gỡ các thành viên khác của cộng đồng. Có một lượng người theo dõi tích cực giúp cho ứng dụng trở nên thu hút hơn.
                </Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.dots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={[styles.dot, styles.activeDot]} />
                </View>
                <TouchableOpacity
                    style={[styles.button, styles.startButton]}
                    activeOpacity={0.85}
                    onPress={() => navigation.replace("Login")}
                >
                    <Text style={[styles.buttonText, styles.startText]}>BẮT ĐẦU</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 24,
    },
    header: {
        height: 52,
        justifyContent: "center",
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    image: {
        borderRadius: 20,
    },
    title: {
        marginTop: 28,
        fontSize: 22,
        lineHeight: 30,
        fontWeight: "700",
        color: "#11343A",
        textAlign: "center",
    },
    description: {
        marginTop: 14,
        fontSize: 15,
        lineHeight: 23,
        color: "#557A80",
        textAlign: "center",
        paddingHorizontal: 8,
    },
    footer: {
        alignItems: "center",
        paddingBottom: 32,
    },
    dots: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 26,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#D3E4E6",
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#0D7F8D",
    },
    button: {
        width: "100%",
        maxWidth: 320,
        height: 52,
        backgroundColor: "#0D7F8D",
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#0D7F8D",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.8,
    },
    startButton: {
        backgroundColor: "#0D7F8D",
    },
    startText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "800",
        letterSpacing: 1,
    },
});

export default OnboardingScreen3;
