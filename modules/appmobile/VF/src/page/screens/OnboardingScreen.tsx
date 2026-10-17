import { StyleSheet, Text, View } from "react-native";

const OnboardingScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Hello</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 40,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default OnboardingScreen;