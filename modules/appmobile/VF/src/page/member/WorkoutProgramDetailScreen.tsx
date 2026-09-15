import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiFitlife from '../../general/api';
import ImageTextGradient from '../../components/ImageTextGradient';

type ProgramDetail = {
    id_chuong_trinh: number;
    ten_chuong_trinh: string;
    mo_ta: string | null;
    so_ngay: number | null;
    so_buoi_moi_tuan: number | null;
    anh_dai_dien: string | null;
};

const WorkoutProgramDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { goalId, goalName, gender, noitap, capDoName } = route.params || {};

    const [program, setProgram] = useState<ProgramDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgram = async () => {
            try {
                const res = await apiFitlife.get(`/chuong-trinh-tap/${goalId}`);
                setProgram(res.data?.data || null);
            } catch (error) {
                console.log('Lỗi lấy chương trình:', error);
            } finally {
                setLoading(false);
            }
        };

        if (goalId) fetchProgram();
        else setLoading(false);
    }, [goalId]);

    const genderLabel =
        gender === 'Nữ' ? 'Dành cho nữ' :
            gender === 'Nam' ? 'Dành cho nam' : 'Tất cả';

    const genderIcon = gender === 'Nữ' ? 'female-outline' : 'male-outline';

    const locationLabel =
        noitap === 'Phòng gym' || noitap === 'GYM' ? 'Tại gym' :
            noitap === 'Tại nhà' || noitap === 'TAI_NHA' ? 'Tại nhà' :
                noitap || 'Chưa chọn';

    const handleAddProgram = () => {
        navigation.navigate('headerPage');
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('WorkoutDifficultyScreen', route.params);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={25} color="#0D7F8D" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Kế hoạch tập luyện</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0D7F8D" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}>

                    <View style={styles.heroContainer}>
                        <ImageBackground
                            source={{
                                uri:
                                    program?.anh_dai_dien ||
                                    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1400',
                            }}
                            style={styles.heroImage}
                            imageStyle={styles.heroImageStyle}>
                            <ImageTextGradient />
                            <View style={styles.heroOverlay} />

                            <View style={styles.heroContent}>
                                <View style={styles.heroBadge}>
                                    <Ionicons name="fitness-outline" size={16} color="#FFFFFF" />
                                    <Text style={styles.heroBadgeText}>VisionFit</Text>
                                </View>

                                <Text style={styles.heroTitle}>
                                    {goalName || program?.ten_chuong_trinh}
                                </Text>

                                <Text style={styles.heroSubtitle}>
                                    Chương trình phù hợp với mục tiêu của bạn
                                </Text>
                            </View>
                        </ImageBackground>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="calendar-outline" size={21} color="#0D7F8D" />
                            </View>

                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>
                                    {program?.so_ngay || 0} ngày tập luyện
                                </Text>
                                <Text style={styles.infoDescription}>
                                    {program?.so_buoi_moi_tuan || 0} buổi mỗi tuần
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="barbell-outline" size={21} color="#0D7F8D" />
                            </View>

                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>Lộ trình rõ ràng</Text>
                                <Text style={styles.infoDescription}>
                                    Bài tập được sắp xếp phù hợp theo từng cấp độ
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.fitSection}>
                            <Text style={styles.fitTitle}>Phù hợp với bạn</Text>

                            <View style={styles.fitRow}>
                                <Ionicons name={genderIcon} size={19} color="#0D7F8D" />
                                <Text style={styles.fitText}>{genderLabel}</Text>
                            </View>

                            <View style={styles.fitRow}>
                                <Ionicons name="location-outline" size={19} color="#0D7F8D" />
                                <Text style={styles.fitText}>{locationLabel}</Text>
                            </View>

                            <View style={styles.fitRow}>
                                <Ionicons name="speedometer-outline" size={19} color="#0D7F8D" />
                                <Text style={styles.fitText}>{capDoName || 'Chưa chọn'}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddProgram}>
                        <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>THÊM KẾ HOẠCH</Text>
                    </TouchableOpacity>
                    <View style={styles.section}>
                        <Text style={styles.description}>{program?.mo_ta || 'Chưa có mô tả'}</Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4FAFB',
    },

    header: {
        height: 72,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F0F1',
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        color: '#11343A',
        marginHorizontal: 8,
    },

    headerPlaceholder: {
        width: 44,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#71949A',
    },

    errorText: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        color: '#71949A',
    },

    retryButton: {
        marginTop: 16,
        backgroundColor: '#0D7F8D',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },

    scrollContent: {
        paddingBottom: 45,
    },

    heroContainer: {
        margin: 18,
        height: 255,
        borderRadius: 24,
        overflow: 'hidden',

        shadowColor: '#78959A',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.22,
        shadowRadius: 12,
        elevation: 6,
    },

    heroImage: {
        flex: 1,
        justifyContent: 'flex-end',
    },

    heroImageStyle: {
        borderRadius: 24,
    },

    heroOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor:
            'rgba(4, 48, 55, 0.45)',
    },

    heroContent: {
        padding: 22,
    },

    heroBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',

        paddingHorizontal: 11,
        paddingVertical: 6,

        borderRadius: 20,
        backgroundColor:
            'rgba(13, 127, 141, 0.85)',

        marginBottom: 10,
    },

    heroBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 5,
    },

    heroTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 5,
    },

    heroSubtitle: {
        color: '#EDF9FA',
        fontSize: 14,
        lineHeight: 20,
    },

    infoCard: {
        marginHorizontal: 18,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 17,
        paddingVertical: 5,

        borderWidth: 1,
        borderColor: '#DDEFF1',

        shadowColor: '#8FAEB2',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },

    infoIcon: {
        width: 44,
        height: 44,
        borderRadius: 13,

        backgroundColor: '#E4F7F8',

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 13,
    },

    infoTextContainer: {
        flex: 1,
    },

    infoTitle: {
        color: '#11343A',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 3,
    },

    infoDescription: {
        color: '#71949A',
        fontSize: 13,
        lineHeight: 19,
    },

    divider: {
        height: 1,
        backgroundColor: '#EDF3F4',
        marginLeft: 57,
    },

    section: {
        marginTop: 24,
        paddingHorizontal: 18,
    },

    sectionTitle: {
        color: '#11343A',
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 13,
    },

    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
    },

    tag: {
        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#E5F7F8',

        borderWidth: 1,
        borderColor: '#BDE7EA',

        paddingHorizontal: 12,
        paddingVertical: 9,

        borderRadius: 20,
    },

    tagText: {
        color: '#0D7F8D',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 5,
    },

    description: {
        color: '#526D72',
        fontSize: 15,
        lineHeight: 25,
        textAlign: 'justify',
    },

    addButton: {
        height: 56,
        marginHorizontal: 18,
        marginTop: 22,

        borderRadius: 17,

        backgroundColor: '#0D7F8D',

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        shadowColor: '#0D7F8D',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },

    addButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 8,
        letterSpacing: 0.4,
    },

    descriptionSection: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },

    fitSection: {
        paddingVertical: 16,
    },

    fitTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11343A',
        marginBottom: 10,
    },

    fitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 7,
    },

    fitText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#164A52',
    },
});

export default WorkoutProgramDetailScreen;