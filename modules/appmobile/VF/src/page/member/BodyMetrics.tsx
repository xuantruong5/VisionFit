import React, { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ImageBackground } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import WheelPicker from '@quidone/react-native-wheel-picker';

const ITEM_HEIGHT = 50;

const generateRange = (start: number, end: number) => {
    const data = [];
    for (let i = start; i <= end; i++) data.push(i);
    return data;
};

const WEIGHTS = generateRange(30, 150);
const HEIGHTS = generateRange(120, 220);
const AGES = generateRange(10, 80);



interface MetricCardProps {
    title: string;
    imageSource: any;
    data: number[];
    value: number;
    onValueChange: (val: number) => void;
    suffix: string;
}

const MetricCard = ({ title, imageSource, data, value, onValueChange, suffix }: MetricCardProps) => {
    const pickerData = React.useMemo(() => data.map(v => ({ value: v, label: `${v} ${suffix}` })), [data, suffix]);

    return (
        <ImageBackground source={imageSource} style={styles.card} imageStyle={styles.cardBg}>
            <View style={styles.cardOverlay} />
            <Text style={styles.cardTitle}>{title}</Text>
            <WheelPicker
                data={pickerData}
                value={value}
                onValueChanged={({ item }) => onValueChange(item.value as number)}
                itemTextStyle={styles.pickerItemText}
                overlayItemStyle={styles.highlightBar}
                itemHeight={30}
                style={{ width: '100%', height: 100 }}
            />
        </ImageBackground>
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

                <MetricCard 
                    title="Cân nặng của bạn:" 
                    imageSource={getBgImage('weight')} 
                    data={WEIGHTS} value={weight} onValueChange={setWeight} suffix="kg" 
                />

                <MetricCard 
                    title="Chiều cao của bạn:" 
                    imageSource={getBgImage('height')} 
                    data={HEIGHTS} value={height} onValueChange={setHeight} suffix="cm" 
                />

                <MetricCard 
                    title="Tuổi của bạn:" 
                    imageSource={getBgImage('age')} 
                    data={AGES} value={age} onValueChange={setAge} suffix="tuổi" 
                />

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
        height: 200, // Tăng chiều cao thẻ để picker có không gian
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#9ED9DF',
        elevation: 5,
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
        height: 120, // Tăng chiều cao để chứa trọn vẹn 3 dòng (40x3)
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    highlightBar: {
        backgroundColor: 'rgba(13,127,141,0.15)',
        borderRadius: 8,
    },
    pickerItemText: {
        fontSize: 24,
        color: '#000000', // Màu đen đậm
        fontWeight: '900',
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
