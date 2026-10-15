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
                        source={{ uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNuB_QDKBARCY2QZO8WhpIX__437nOqfTeXGKgdcYBufqJ0IhE1coHO-M&s=10" }} 
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
                        source={{ uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlNSC1DVC-dcI9xg_G6Vcb9yyAMBlwpiiPwDlDkQSore-lm2ZcuSVxf9w&s=10" }} 
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
        opacity: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
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

