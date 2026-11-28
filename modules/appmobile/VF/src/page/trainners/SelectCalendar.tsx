
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert, TextInput, Modal, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiFitlife from '../../general/api';



const THU: { [key: number]: string } = {
    0: 'Chủ nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
};

const SelectCalendar = ({ navigation, route }: any) => {
    const [lichTap, setLichTap] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tangDan, setTangDan] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLich, setSelectedLich] = useState<any | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formLich, setFormLich] = useState({
        ngay_tap: '',
        thu_trong_tuan: '',
        gio_bat_dau: '',
        gio_ket_thuc: '',
    });
    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (event.type === 'set' && date) {
            const ngay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            setFormLich(prev => ({
                ...prev,
                ngay_tap: ngay,
                thu_trong_tuan: String(date.getDay()),
            }));
        }
    };
    const handleTimeChange = (
        event: any,
        time: Date | undefined,
        field: 'gio_bat_dau' | 'gio_ket_thuc'
    ) => {
        if (event.type === 'set' && time) {
            const gio = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

            setFormLich(prev => ({
                ...prev,
                [field]: gio,
            }));
        }

        setShowStartTimePicker(false);
        setShowEndTimePicker(false);
    };

    // Nhận ID gói đăng ký từ màn hình trước
    const idChiTiet = route?.params?.id_chi_tiet_dang_ky_goi;

    // Lấy danh sách lịch tập
    const fetchCalendar = async () => {
        try {
            // Thay endpoint bên dưới bằng đúng route API của bạn nếu khác
            const response = await apiFitlife.get(`/trainer/lich-members-moi`);
            if (response.data.success) {
                setLichTap(response.data.data || []);
            } else {
                setLichTap([]);
            }
        } catch (error: any) {
            console.log(
                'Lỗi lấy lịch tập:',
                error.response?.data || error.message
            );
            Alert.alert('Thông báo', 'Không thể tải danh sách lịch tập.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => {
        fetchCalendar();
    }, []);


    // Định dạng ngày tháng
    const formatDate = (dateString: string) => {
        const date = new Date(`${dateString}T00:00:00`);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Sắp xếp lịch
    const sortedCalendar = useMemo(() => {
        return [...lichTap].sort((a, b) => {
            const compare = a.ngay_tap.localeCompare(b.ngay_tap);
            return tangDan ? compare : -compare;
        });
    }, [lichTap, tangDan]);

    // Chọn ngày tập
    const handleSelect = (item: any) => {
        setSelectedLich(item);
        setFormLich({
            ngay_tap: item.ngay_tap,
            thu_trong_tuan: String(item.thu_trong_tuan),
            gio_bat_dau: item.gio_bat_dau?.slice(0, 5) || '',
            gio_ket_thuc: item.gio_ket_thuc?.slice(0, 5) || '',
        });

        setModalVisible(true);
    };





    const confirmBooking = async () => {
        if (!selectedLich) return;
        // 1. Kiểm tra thông tin
        if (
            !formLich.ngay_tap.trim() ||
            !formLich.gio_bat_dau.trim() ||
            !formLich.gio_ket_thuc.trim()
        ) {
            Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin.');
            return;
        }
        // 2. Kiểm tra ngày
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formLich.ngay_tap)) {
            Alert.alert('Thông báo', 'Ngày tập không hợp lệ.');
            return;
        }
        // 3. Kiểm tra giờ
        const gioRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (
            !gioRegex.test(formLich.gio_bat_dau) ||
            !gioRegex.test(formLich.gio_ket_thuc)
        ) {
            Alert.alert('Thông báo', 'Giờ phải có định dạng HH:mm.');
            return;
        }
        if (formLich.gio_ket_thuc <= formLich.gio_bat_dau) {
            Alert.alert('Thông báo', 'Giờ kết thúc phải sau giờ bắt đầu.');
            return;
        }
        // 4. Kiểm tra ID
        if (
            !selectedLich.id_chi_tiet_dang_ky_goi ||
            !selectedLich.id_hoi_vien
        ) {
            Alert.alert('Thông báo', 'Thiếu thông tin gói đăng ký hoặc hội viên.');
            return;
        }
        try {
            setSaving(true);
            // 5. Gửi dữ liệu lên API tạo lịch PT
            const response = await apiFitlife.post('/trainer/tao-lich-pt', {
                id_lich_tap: selectedLich.id_lich_tap,
                id_chi_tiet_dang_ky_goi: selectedLich.id_chi_tiet_dang_ky_goi,
                id_hoi_vien: selectedLich.id_hoi_vien,
                ngay_tap: formLich.ngay_tap,
                gio_bat_dau: formLich.gio_bat_dau,
                gio_ket_thuc: formLich.gio_ket_thuc,
            });
            if (response.data.success) {
                setModalVisible(false);
                Alert.alert(
                    'Thành công',
                    response.data.message +
                    `\n\nSố buổi PT: ${response.data.data.so_buoi_pt}` +
                    `\nĐã đặt: ${response.data.data.so_buoi_da_dat}` +
                    `\nCòn lại: ${response.data.data.so_buoi_con_lai}`
                );
                // 6. Tải lại danh sách
                fetchCalendar();
            }
        } catch (error: any) {
            console.log(
                'Lỗi tạo lịch PT:',
                error.response?.data || error.message
            );

            Alert.alert(
                'Không thể tạo lịch',
                error.response?.data?.message || 'Đã xảy ra lỗi khi tạo lịch PT.'
            );
        } finally {
            setSaving(false);
        }
    };

    // Tổng số buổi
    const tongBuoi = lichTap.length;
    // Số buổi có thể chọn
    const soBuoiCoTheChon = lichTap.filter( item => Number(item.phan_tram_hoan_thanh || 0) <= 20 && Number(item.da_dat_pt) === 0).length;
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
                    <Ionicons name="chevron-back" size={23} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Chọn ngày tập luyện</Text>

                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} colors={[COLORS.primary]} />}  >
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
                ) : lichTap.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={55} color={COLORS.textLight} />
                        <Text style={styles.emptyTitle}>
                            Chưa có lịch tập
                        </Text>
                        <Text style={styles.emptyDesc}>
                            Hiện tại chưa có ngày tập luyện nào được tạo.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* THÔNG TIN HỘI VIÊN */}
                        <View style={styles.memberCard}>
                            <View style={styles.memberIcon}>
                                <Ionicons name="person-outline" size={30} color={COLORS.primary} />
                            </View>

                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>
                                    {lichTap[0]?.ten_hoi_vien}
                                </Text>

                                <Text style={styles.memberSub}>
                                    <Ionicons name="fitness-outline" size={13} color={COLORS.textSecondary} />{' '}
                                    PT: {lichTap[0]?.ten_trainer}
                                </Text>

                                <View style={styles.statsRow}>
                                    <View style={styles.statBadge}>
                                        <Text style={styles.statText}>
                                            {tongBuoi} buổi tập
                                        </Text>
                                    </View>


                                    <View style={styles.statBadgeActive}>
                                        <Text style={styles.statTextActive}>
                                            {soBuoiCoTheChon} ngày có thể chọn
                                        </Text>
                                    </View>
                                    <View style={styles.statBadgePT}>
                                        <Text style={styles.statTextPT}>
                                            {lichTap[0]?.so_buoi_pt || 0}  buổi có PT
                                        </Text>
                                    </View>


                                </View>
                            </View>
                        </View>

                        {/* TIÊU ĐỀ NGÀY TẬP */}
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>
                                    Ngày tập luyện
                                </Text>
                                <Text style={styles.sectionSub}>
                                    Chọn ngày để đặt lịch tập với hội viên
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.sortButton} activeOpacity={0.8} onPress={() => setTangDan(!tangDan)} >
                                <Ionicons name="swap-vertical-outline" size={18} color={COLORS.textPrimary} />
                                <Text style={styles.sortText}>
                                    {tangDan ? 'Tăng dần' : 'Giảm dần'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* DANH SÁCH LỊCH */}
                        {sortedCalendar.map((item) => {
                            const daDat = Number(item.da_dat_pt) === 1;
                            const available = Number(item.phan_tram_hoan_thanh || 0) <= 20 && !daDat;
                            const thu = THU[item.thu_trong_tuan] || 'Chưa rõ';

                            return (
                                <View key={item.id_lich_tap}
                                    style={[styles.dayCard, !available && styles.dayCardLocked,]} >
                                    {/* ICON */}
                                    <View style={[styles.dayIcon, available ? styles.dayIconActive : styles.dayIconLocked]}>
                                        <Ionicons name="calendar-outline" size={23} color={available ? "#C58A08" : "#91A9AD"} />
                                    </View>

                                    {/* THÔNG TIN NGÀY */}
                                    <View style={styles.dayInfo}>
                                        <Text style={styles.dayNumber}>
                                            Ngày thứ {item.ngay_thu}
                                        </Text>
                                        <Text style={styles.dayName}>
                                            {item.ten_ngay_tap}
                                        </Text>
                                        <Text style={styles.dayDate}>
                                            Buổi {item.ngay_thu} · {thu} · {formatDate(item.ngay_tap)}
                                        </Text>
                                        <View style={styles.timeRow}>
                                            <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
                                            <Text style={styles.timeText}>
                                                {item.gio_bat_dau?.slice(0, 5)} - {item.gio_ket_thuc?.slice(0, 5)}
                                            </Text>
                                        </View>
                                        <View style={styles.progressRow}>
                                            <View style={styles.progressBackground}>
                                                <View
                                                    style={[styles.progressFill, { width: `${Math.min(Number(item.phan_tram_hoan_thanh || 0), 100)}%`, backgroundColor: available ? COLORS.primary : '#E59A43', }]} />
                                            </View>
                                            <Text style={[styles.progressText, !available && { color: '#D88732' }]}>
                                                {Number(item.phan_tram_hoan_thanh || 0).toFixed(2)}%
                                            </Text>
                                        </View>
                                    </View>

                                    {/* NÚT CHỌN */}
                                    {available && (
                                        <TouchableOpacity style={styles.chooseButton} activeOpacity={0.8} onPress={() => handleSelect(item)} >
                                            <Text style={styles.chooseText}>Chọn</Text>
                                            <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)} >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Chỉnh sửa lịch tập</Text>
                                <Text style={styles.modalSub}>
                                    Kiểm tra thông tin trước khi đặt lịch
                                </Text>
                            </View>

                            <TouchableOpacity onPress={() => setModalVisible(false)} >
                                <Ionicons name="close-circle" size={28} color="#91A9AD" />
                            </TouchableOpacity>
                        </View>

                        {/* Tên ngày tập */}
                        <Text style={styles.inputLabel}>Tên ngày tập</Text>
                        <View style={styles.readOnlyInput}>
                            <Text style={styles.readOnlyText}>
                                {selectedLich?.ten_ngay_tap}
                            </Text>
                        </View>

                        {/* Ngày tập */}
                        <Text style={styles.inputLabel}>Ngày tập</Text>
                        <TouchableOpacity style={styles.pickerInput} onPress={() => setShowDatePicker(true)} >
                            <Text style={styles.pickerText}>
                                {formatDate(formLich.ngay_tap)}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={new Date(`${formLich.ngay_tap}T00:00:00`)}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}

                        {/* Thứ trong tuần */}
                        <Text style={styles.inputLabel}>Thứ trong tuần</Text>

                        <View style={styles.readOnlyInput}>
                            <Text style={styles.readOnlyText}>
                                {THU[Number(formLich.thu_trong_tuan)]}
                            </Text>
                        </View>

                        {/* Giờ bắt đầu và kết thúc */}
                        <View style={styles.timeInputRow}>
                            <View style={styles.timeInputColumn}>
                                <Text style={styles.inputLabel}>Giờ bắt đầu</Text>
                                <TouchableOpacity style={styles.pickerInput} onPress={() => setShowStartTimePicker(true)} >
                                    <Text style={styles.pickerText}>{formLich.gio_bat_dau}</Text>
                                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.timeInputColumn}>
                                <Text style={styles.inputLabel}>Giờ kết thúc</Text>

                                <TouchableOpacity style={styles.pickerInput} onPress={() => setShowEndTimePicker(true)} >
                                    <Text style={styles.pickerText}>{formLich.gio_ket_thuc}</Text>
                                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {showStartTimePicker && (
                            <DateTimePicker
                                value={new Date(`2000-01-01T${formLich.gio_bat_dau}:00`)}
                                mode="time"
                                is24Hour
                                onChange={(event, time) =>
                                    handleTimeChange(event, time, 'gio_bat_dau')
                                }
                            />
                        )}

                        {showEndTimePicker && (
                            <DateTimePicker
                                value={new Date(`2000-01-01T${formLich.gio_ket_thuc}:00`)}
                                mode="time"
                                is24Hour
                                onChange={(event, time) =>
                                    handleTimeChange(event, time, 'gio_ket_thuc')
                                }
                            />
                        )}

                        {/* Nút */}
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)} >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity  style={styles.confirmButton}  onPress={confirmBooking} disabled={saving} >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.confirmButtonText}>
                                            Xác nhận
                                        </Text>
                                        <Ionicons name="arrow-forward" size={17}  color="#FFFFFF" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

export default SelectCalendar;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F7F6',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp('4%'),
        paddingVertical: 12,
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...SOFT_SHADOW,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#203C46',
    },

    content: {
        paddingHorizontal: wp('3%'),
        paddingBottom: 35,
    },

    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 16,
        marginTop: 10,
        ...SOFT_SHADOW,
    },

    memberIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EAF8F8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    memberInfo: {
        flex: 1,
    },

    memberName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#203C46',
    },

    memberSub: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 5,
    },

    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 10,
    },

    statBadge: {
        backgroundColor: '#EAF3FC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },

    statText: {
        color: '#52788A',
        fontSize: 11,
        fontWeight: '700',
    },

    statBadgeActive: {
        backgroundColor: '#FFF2D5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },

    statTextActive: {
        color: '#BD870C',
        fontSize: 11,
        fontWeight: '700',
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 28,
        marginBottom: 18,
    },

    sectionTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: '#203C46',
    },

    sectionSub: {
        fontSize: 11,
        color: COLORS.textLight,
        marginTop: 4,
    },

    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 13,
        paddingVertical: 12,
        borderRadius: 25,
        ...SOFT_SHADOW,
    },

    sortText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#203C46',
    },

    dayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 15,
        marginBottom: 14,
        minHeight: 126,
        ...SOFT_SHADOW,
    },

    dayCardLocked: {
        backgroundColor: '#F7FAF9',
        elevation: 0,
        shadowOpacity: 0,
    },

    dayIcon: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },

    dayIconActive: {
        backgroundColor: '#FFF1CD',
    },

    dayIconLocked: {
        backgroundColor: '#E7F0EF',
    },

    dayInfo: {
        flex: 1,
    },

    dayNumber: {
        fontSize: 13,
        color: '#8BA7AE',
        marginBottom: 5,
    },

    dayName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#203C46',
    },

    dayDate: {
        fontSize: 12,
        color: '#597B87',
        marginTop: 6,
    },

    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 5,
    },

    timeText: {
        fontSize: 11,
        color: COLORS.textLight,
    },

    chooseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 11,
        paddingVertical: 9,
        borderRadius: 18,
        gap: 2,
        marginLeft: 5,
    },

    chooseText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    lockLabel: {
        marginLeft: 5,
    },

    lockText: {
        fontSize: 10,
        color: '#9BAEB0',
        fontWeight: '600',
    },

    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 120,
    },

    emptyTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#203C46',
        marginTop: 15,
    },

    emptyDesc: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 7,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    modalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 22,
        elevation: 10,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#203C46',
    },

    modalSub: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 5,
    },

    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#45636D',
        marginBottom: 7,
        marginTop: 12,
    },

    modalInput: {
        height: 46,
        borderWidth: 1,
        borderColor: '#DCE9E8',
        borderRadius: 12,
        paddingHorizontal: 13,
        fontSize: 14,
        color: '#203C46',
        backgroundColor: '#FAFCFC',
    },

    readOnlyInput: {
        height: 46,
        justifyContent: 'center',
        paddingHorizontal: 13,
        borderRadius: 12,
        backgroundColor: '#EAF8F8',
    },

    readOnlyText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },

    timeInputRow: {
        flexDirection: 'row',
        gap: 12,
    },

    timeInputColumn: {
        flex: 1,
    },

    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 25,
    },

    cancelButton: {
        flex: 1,
        height: 47,
        borderRadius: 14,
        backgroundColor: '#EDF3F3',
        alignItems: 'center',
        justifyContent: 'center',
    },

    cancelButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#607A80',
    },

    confirmButton: {
        flex: 1.5,
        height: 47,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    confirmButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    pickerInput: {
        height: 46,
        borderWidth: 1,
        borderColor: '#DCE9E8',
        borderRadius: 12,
        paddingHorizontal: 13,
        backgroundColor: '#FAFCFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    pickerText: {
        fontSize: 14,
        color: '#203C46',
        fontWeight: '600',
    },

    autoText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '700',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 9,
        gap: 8,
    },

    progressBackground: {
        flex: 1,
        height: 6,
        backgroundColor: '#E8EEEE',
        borderRadius: 10,
        overflow: 'hidden',
    },

    progressFill: {
        height: 6,
        borderRadius: 10,
    },

    progressText: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.primary,
        minWidth: 43,
        textAlign: 'right',
    },
    statBadgePT: {
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },

    statTextPT: {
        color: '#7856C5',
        fontSize: 11,
        fontWeight: '700',
    },
});
