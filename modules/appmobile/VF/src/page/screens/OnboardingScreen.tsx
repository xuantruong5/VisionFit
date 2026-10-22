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

const OnboardingScreen = ({ navigation }: any) => {
    const { width, height } = useWindowDimensions();
    const imageSize = Math.min(width * 0.72, height * 0.36, 300);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => navigation.replace("Login")}
                >
                    <Text style={styles.skip}>Bỏ qua</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Image
                    source={require("../../assets/onboarding1.jpg")}
                    style={[styles.image, { width: imageSize, height: imageSize }]}
                    resizeMode="cover"
                />
                <Text style={styles.title}>Tập luyện tại nhà hoặc tại gym</Text>
                <Text style={styles.description}>
                    Giảm cân, tăng khối lượng cơ bắp, nâng cơ mông và sở hữu cơ bắp sắc nét hơn với các kế hoạch tập luyện và dinh dưỡng được lập sẵn của chúng tôi.
                </Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.dots}>
                    <View style={[styles.dot, styles.activeDot]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("OnboardingScreen1")}
                >
                    <Text style={styles.buttonText}>TIẾP</Text>
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
        alignItems: "flex-end",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    skip: {
        color: "#71949A",
        fontSize: 16,
        fontWeight: "600",
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
});

export default OnboardingScreen;
