import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, NativeSyntheticEvent, NativeScrollEvent, ImageBackground } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const ITEM_HEIGHT = 50;

const generateRange = (start: number, end: number) => {
    const data = [];
    for (let i = start; i <= end; i++) data.push(i);
    return data;
};

const WEIGHTS = generateRange(30, 150);
const HEIGHTS = generateRange(120, 220);
const AGES = generateRange(10, 80);

interface WheelPickerProps {
    data: number[];
    value: number;
    onValueChange: (val: number) => void;
    suffix: string;
}

const WheelPicker = ({ data, value, onValueChange, suffix }: WheelPickerProps) => {
    const flatListRef = useRef<FlatList>(null);

    const initialIndex = data.findIndex(item => item === value);

    useEffect(() => {
        if (flatListRef.current && initialIndex >= 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                    offset: initialIndex * ITEM_HEIGHT,
                    animated: false
                });
            }, 100);
        }
    }, [initialIndex]);

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        if (data[index] !== undefined) {
            onValueChange(data[index]);
        }
    };

    return (
        <View style={styles.pickerContainer}>
            <View style={styles.highlightBar} />
            <FlatList
                ref={flatListRef}
                data={data}
                keyExtractor={(_, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                contentContainerStyle={{ paddingVertical: 25, paddingHorizontal: 20 }}
                renderItem={({ item }) => {
                    const isSelected = item === value;
                    return (
                        <View style={styles.pickerItem}>
                            <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                                {item} {isSelected && <Text style={styles.pickerSuffix}>{suffix}</Text>}
                            </Text>
                        </View>
                    );
                }}
            />
        </View>
    );
};

const BodyMetrics = ({ navigation, route }: any) => {
    const gender = route.params?.gender || "Nam";
    const [weight, setWeight] = useState(70);
    const [height, setHeight] = useState(170);
    const [age, setAge] = useState(25);

    const handleContinue = () => {
        // Go to MemberHome or whatever next screen is
        navigation.navigate("MemberHome");
    };

    const getBgImage = (type: string) => {
        if (gender === 'Nam') {
            if (type === 'weight') return require('../../assets/members/nam_weight.png');
            if (type === 'height') return require('../../assets/members/nam_height.png');
            if (type === 'age') return require('../../assets/members/nam_age.png');
        } else {
            if (type === 'weight') return require('../../assets/members/nu_weight.png');
            if (type === 'height') return require('../../assets/members/nu_height.png');
            if (type === 'age') return require('../../assets/members/nu_age.png');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0D7F8D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông số cơ thể</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>
                    Để lựa chọn chính xác mức tạ, vui lòng điền dữ liệu sau:
                </Text>

                <ImageBackground source={getBgImage('weight')} style={styles.card} imageStyle={styles.cardBg}>
                    <View style={styles.cardOverlay} />
                    <Text style={styles.cardTitle}>Cân nặng của bạn:</Text>
                    <WheelPicker data={WEIGHTS} value={weight} onValueChange={setWeight} suffix="kg" />
                </ImageBackground>

                <ImageBackground source={getBgImage('height')} style={styles.card} imageStyle={styles.cardBg}>
                    <View style={styles.cardOverlay} />
                    <Text style={styles.cardTitle}>Chiều cao của bạn:</Text>
                    <WheelPicker data={HEIGHTS} value={height} onValueChange={setHeight} suffix="cm" />
                </ImageBackground>

                <ImageBackground source={getBgImage('age')} style={styles.card} imageStyle={styles.cardBg}>
                    <View style={styles.cardOverlay} />
                    <Text style={styles.cardTitle}>Tuổi của bạn:</Text>
                    <WheelPicker data={AGES} value={age} onValueChange={setAge} suffix="tuổi" />
                </ImageBackground>

                <View style={{ flex: 1 }} />

                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.continueButtonText}>TIẾP TỤC</Text>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#075E68",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    subtitle: {
        fontSize: 14,
        color: "#71949A",
        marginBottom: 20,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        alignItems: "center",
        height: 160,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#9ED9DF',
        elevation: 5, // shadow for android
        shadowColor: '#D9D7FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    cardBg: {
        borderRadius: 12,
        opacity: 0.7,
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderRadius: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#11343A",
        marginBottom: 10,
    },
    pickerContainer: {
        height: 100,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    highlightBar: {
        position: 'absolute',
        top: '50%',
        marginTop: -ITEM_HEIGHT / 2,
        height: ITEM_HEIGHT,
        width: '50%',
        backgroundColor: 'rgba(13,127,141,0.1)',
        borderRadius: 8,
    },
    pickerItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerItemText: {
        fontSize: 24,
        color: '#555',
        fontWeight: 'bold',
    },
    pickerItemTextSelected: {
        fontSize: 32,
        color: '#000',
    },
    pickerSuffix: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'normal',
    },
    continueButton: {
        backgroundColor: "#0D7F8D",
        height: 55,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
});

export default BodyMetrics;
