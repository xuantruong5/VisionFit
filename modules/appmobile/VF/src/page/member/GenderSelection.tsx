import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, SafeAreaView } from "react-native";

const GenderSelection = ({ navigation }: any) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Vui lòng chọn giới tính.</Text>
                
                <TouchableOpacity 
                    style={styles.cardContainer} 
                    onPress={() => navigation.navigate("BodyMetrics", { gender: 'Nam' })}
                >
                    <ImageBackground 
                        source={require("../../assets/members/nam.png")} 
                        style={styles.cardImage}
                        imageStyle={styles.cardImageStyle}
                    >
                        <View style={styles.overlay}>
                            <Text style={styles.cardText}>Nam</Text>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.cardContainer} 
                    onPress={() => navigation.navigate("BodyMetrics", { gender: 'Nữ' })}
                >
                    <ImageBackground 
                        source={require("../../assets/members/nu.png")} 
                        style={styles.cardImage}
                        imageStyle={styles.cardImageStyle}
                    >
                        <View style={styles.overlay}>
                            <Text style={styles.cardText}>Nữ</Text>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EAF9FB",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#11343A",
        textAlign: "center",
        marginBottom: 40,
    },
    cardContainer: {
        height: 180,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
    },
    cardImageStyle: {
        borderRadius: 12,
        opacity: 0.7,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 30, 40, 0.4)',
        justifyContent: 'center',
        paddingLeft: 30,
    },
    cardText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
    }
});

export default GenderSelection;

