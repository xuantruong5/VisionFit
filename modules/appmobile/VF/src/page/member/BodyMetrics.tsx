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
        // Calculate an approximate birth date based on age
        const currentYear = new Date().getFullYear();
        const ngay_sinh = `${currentYear - age}-01-01`;

        navigation.navigate("WorkoutPlanScreen", { 
            gioi_tinh: gender === 'Nam' ? 0 : 1, // 0: Nam, 1: Nữ theo ClientSeeder
            can_nang_kg: weight, 
            chieu_cao_cm: height, 
            ngay_sinh: ngay_sinh 
        });
    };

    const getBgImage = (type: string) => {
        if (gender === 'Nam') {
            if (type === 'weight') return { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp2Hi3klp9sEdZElWZKjeXloDklfVoNKxGGJ9xgaF8g_kzchg7RLn1dow&s=10' };
            if (type === 'height') return { uri: 'https://www.wheystore.vn/upload/news_optimize/wst_1603871227_tap_gym_co_tang_chieu_cao_khong__cac_bai_tap_giup_tang_chieu_cao_hieu_qua__image_1603871227_2.jpg' };
            if (type === 'age') return { uri: 'https://4men.com.vn/images/2017/12/20171227_3efb50f643811f1ccddb60bb884eacae_1514364937.jpg' };
        } else {
            if (type === 'weight') return { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp2Hi3klp9sEdZElWZKjeXloDklfVoNKxGGJ9xgaF8g_kzchg7RLn1dow&s=10' };
            if (type === 'height') return { uri: 'https://www.tvbuy.vn/public/upload/tap-gym-giup-tang-chieu-cao.jpg' };
            if (type === 'age') return { uri: 'https://vcdn1-thethao.vnecdn.net/2025/06/03/503604187-3153370114828506-291-7938-2645-1748914666.jpg?w=500&h=300&q=100&dpr=1&fit=crop&s=AN2CakXy9amL4xYaHnKXlg' };
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
        opacity: 1,
    },
    cardOverlay: {
        ...StyleSheet.absoluteFill as any,
        backgroundColor: 'rgba(225, 243, 250, 0.75)',
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
