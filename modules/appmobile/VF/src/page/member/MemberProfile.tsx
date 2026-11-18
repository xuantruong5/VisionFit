import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Modal, TextInput, Alert, StatusBar, Switch, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS } from '../../general/theme';
import apiFitlife from '../../general/api';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';

// Dữ liệu mẫu hồ sơ ban đầu (Frontend Mock Data)
const INITIAL_MEMBER = {
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    anh_dai_dien: '',
    ngay_sinh: '',
    gioi_tinh: '',
    chieu_cao_cm: '',
    can_nang_kg: '',
    dang_nguoi: '',
    muc_tieu_hien_tai: '',
    cap_do_hien_tai: '',
    noi_tap_uu_tien: '',
    goi_tap: '',
    ngay_bat_dau: '',
    ngay_het_han: '',
    so_ngay_con_lai: 0,
    hlv_phu_trach: '',
    ma_thanh_vien: '',
    ma_gioi_thieu: '',
    hang_thanh_vien: 'Hội viên VIP Premium',
    co_so: 'VisionFit Center - Quận 1, TP.HCM',
    thong_ke: {
        so_buoi_tap: 32,
        tong_gio_tap: 48,
        tuan_duy_tri: 8,
        calo_tieu_thu: 14250,
    },
};

// Danh sách ảnh đại diện mẫu để chọn nhanh
const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
];

const MemberProfile = ({ navigation }: any) => {
    // Thông tin hội viên
    const [member, setMember] = useState(INITIAL_MEMBER);

    // Trạng thái mở/đóng các nhóm mục giống WorkoutPlanScreen
    const [expandPersonal, setExpandPersonal] = useState(true);
    const [expandMembership, setExpandMembership] = useState(true);
    const [expandSettings, setExpandSettings] = useState(true);

    // Cài đặt công tắc (Switch)
    const [remindWorkout, setRemindWorkout] = useState(true);
    const [syncHealthData, setSyncHealthData] = useState(false);
    const [drinkWaterAlert, setDrinkWaterAlert] = useState(true);

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [editForm, setEditForm] = useState({ ...INITIAL_MEMBER });
    const [saving, setSaving] = useState(false);

    // Modal đổi mật khẩu
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Tính chỉ số BMI và xếp loại thể trạng
    const getBMIData = () => {
        const heightM = parseFloat(member.chieu_cao_cm) / 100;
        const weightKg = parseFloat(member.can_nang_kg);
        if (heightM > 0 && weightKg > 0) {
            const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
            let status = 'Bình thường';
            let color = '#10B981';

            if (bmi < 18.5) {
                status = 'Gầy';
                color = '#FF9800';
            } else if (bmi >= 18.5 && bmi < 24.9) {
                status = 'Cân đối chuẩn';
                color = '#10B981';
            } else if (bmi >= 25 && bmi < 29.9) {
                status = 'Thừa cân nhẹ';
                color = '#FF9800';
            } else {
                status = 'Béo phì';
                color = '#FA3E3E';
            }

            return { bmi, status, color };
        }
        return { bmi: 22.2, status: 'Cân đối', color: '#10B981' };
    };

    const bmiData = getBMIData();

    const formatDate = (date?: string | null) => {
        if (!date) return null;
        const parts = date.split('-');
        if (parts.length !== 3) return date;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    // Chuyển giới tính từ API
    const formatGender = (gender?: string | number | null) => {
        if (gender === null || gender === undefined) return null;
        const value = String(gender).trim().toLowerCase();
        if (value === '0' || value === 'nam') return 'Nam';
        if (value === '1' || value === 'nu' || value === 'nữ') return 'Nữ';
        if (value === '2') return 'Khác';
        return String(gender);
    };

    const fetchProfile = async () => {
        try {
            const response = await apiFitlife.get('/client/profile');
            if (!response.data.success && !response.data.status) {
                return;
            }
            const data = response.data.data;
            setMember((prev) => ({
                ...prev,
                ho_ten: data.ho_ten ?? prev.ho_ten,
                email: data.email ?? prev.email,
                so_dien_thoai: data.so_dien_thoai ?? prev.so_dien_thoai,
                anh_dai_dien: data.anh_dai_dien ?? prev.anh_dai_dien,
                ngay_sinh: formatDate(data.ngay_sinh) ?? prev.ngay_sinh,
                gioi_tinh: formatGender(data.gioi_tinh) ?? prev.gioi_tinh,

                chieu_cao_cm: data.chieu_cao_cm ? String(data.chieu_cao_cm) : prev.chieu_cao_cm,
                can_nang_kg: data.can_nang_kg ? String(data.can_nang_kg) : prev.can_nang_kg,
                dang_nguoi: data.dang_nguoi ?? prev.dang_nguoi,

                muc_tieu_hien_tai: data.muc_tieu_hien_tai ?? prev.muc_tieu_hien_tai,
                cap_do_hien_tai: data.cap_do_hien_tai ?? prev.cap_do_hien_tai,
                noi_tap_uu_tien: data.noi_tap_uu_tien ?? prev.noi_tap_uu_tien,

                ma_thanh_vien: data.ma_thanh_vien ?? prev.ma_thanh_vien,
                ma_gioi_thieu: data.ma_gioi_thieu ?? prev.ma_gioi_thieu,

                goi_tap: data.ten_goi_tap ?? prev.goi_tap,
                ngay_bat_dau: formatDate(data.ngay_bat_dau) ?? prev.ngay_bat_dau,
                ngay_het_han: formatDate(data.ngay_ket_thuc) ?? prev.ngay_het_han,
                so_ngay_con_lai: data.so_ngay_con_lai ?? prev.so_ngay_con_lai,

                hlv_phu_trach: data.ho_ten_hlv
                    ? `${data.ho_ten_hlv}${data.chuc_danh ? ` (${data.chuc_danh})` : ''}`
                    : prev.hlv_phu_trach,

                // Chưa có API thì giữ dữ liệu mẫu
                hang_thanh_vien: prev.hang_thanh_vien,
                co_so: prev.co_so,
                thong_ke: prev.thong_ke,
            }));

        } catch (error) {
            console.log('Lỗi lấy hồ sơ hội viên:', error);
        }
    };
    useEffect(() => {
        fetchProfile();
    }, []);

    // Lưu thông tin chỉnh sửa vào Database
    const handleSaveProfile = async () => {
        if (!editForm.ho_ten.trim()) {
            Alert.alert('Thông báo', 'Họ và tên không được để trống!');
            return;
        }
        if (!editForm.so_dien_thoai.trim()) {
            Alert.alert('Thông báo', 'Số điện thoại không được để trống!');
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                ho_ten: editForm.ho_ten.trim(),
                so_dien_thoai: editForm.so_dien_thoai.trim(),
                email: editForm.email ? editForm.email.trim() : undefined,
                chieu_cao_cm: editForm.chieu_cao_cm ? parseFloat(String(editForm.chieu_cao_cm)) : undefined,
                can_nang_kg: editForm.can_nang_kg ? parseFloat(String(editForm.can_nang_kg)) : undefined,
                ngay_sinh: editForm.ngay_sinh,
                gioi_tinh: editForm.gioi_tinh,
                muc_tieu_hien_tai: editForm.muc_tieu_hien_tai,
                cap_do_hien_tai: editForm.cap_do_hien_tai,
                noi_tap_uu_tien: editForm.noi_tap_uu_tien,
                dang_nguoi: editForm.dang_nguoi,
            };

            const response = await apiFitlife.post('/client/profile', payload);
            if (response.data && (response.data.success || response.data.status)) {
                setMember((prev) => ({ ...prev, ...editForm }));
                setShowEditModal(false);
                Alert.alert('Cập nhật thành công', 'Thông tin hồ sơ hội viên của bạn đã được lưu vào hệ thống!');
                fetchProfile();
            } else {
                Alert.alert('Lỗi cập nhật', response.data?.message || 'Không thể lưu hồ sơ.');
            }
        } catch (error: any) {
            console.log('Lỗi API cập nhật hồ sơ hội viên:', error.response?.data || error.message);
            Alert.alert('Lỗi kết nối', error.response?.data?.message || 'Không thể lưu thông tin vào cơ sở dữ liệu. Vui lòng thử lại!');
        } finally {
            setSaving(false);
        }
    };

    // Đổi ảnh đại diện và lưu vào Database
    const handleSelectAvatar = async (url: string) => {
        setMember((prev) => ({ ...prev, anh_dai_dien: url }));
        setShowAvatarPicker(false);
        try {
            await apiFitlife.post('/client/profile/avatar', { url });
            Alert.alert('Thành công', 'Đã lưu ảnh đại diện mới vào hệ thống!');
            fetchProfile();
        } catch (error: any) {
            console.log('Lỗi cập nhật avatar:', error.response?.data || error.message);
        }
    };

    // Đổi mật khẩu tài khoản
    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu hiện tại!');
            return;
        }
        if (!passwordForm.newPassword.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu mới!');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            Alert.alert('Thông báo', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            Alert.alert('Thông báo', 'Mật khẩu xác nhận không trùng khớp!');
            return;
        }

        setChangingPassword(true);
        try {
            const response = await apiFitlife.post('/client/doi-mat-khau', {
                mat_khau_cu: passwordForm.currentPassword,
                mat_khau_moi: passwordForm.newPassword,
                xac_nhan_mat_khau: passwordForm.confirmPassword,
            });

            if (response.data && (response.data.success || response.data.status)) {
                Alert.alert('Thành công', 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordModal(false);
            } else {
                Alert.alert('Lỗi', response.data?.message || 'Không thể đổi mật khẩu.');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại!';
            Alert.alert('Thất bại', msg);
        } finally {
            setChangingPassword(false);
        }
    };

    // Sao chép mã hội viên
    const handleCopyMemberCode = () => {
        if (!member.ma_thanh_vien) {
            Alert.alert('Thông báo', 'Bạn chưa có mã thành viên!');
            return;
        }
        Clipboard.setString(member.ma_thanh_vien);

        Alert.alert(
            'Thành công',
            `Đã sao chép mã thẻ: ${member.ma_thanh_vien}`
        );
    };

    // Xử lý Đăng xuất
    const handleLogout = () => {
        Alert.alert(
            'Xác nhận đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản VisionFit?',
            [
                {
                    text: 'Ở lại',
                    style: 'cancel',
                },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Gọi API đăng xuất hội viên
                            const response = await apiFitlife.post('/client/logout');

                            console.log('LOGOUT CLIENT =', response.data);
                        } catch (error: any) {
                            console.log(
                                'Lỗi API đăng xuất:',
                                error.response?.data || error.message
                            );
                        } finally {
                            // Xóa thông tin đăng nhập
                            await AsyncStorage.removeItem("token");
                            await AsyncStorage.removeItem("role");

                            // Quay về màn hình đăng nhập
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* HEADER GRADIENT */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.decorCircle} />
                    <View style={styles.decorCircleSmall} />
                    <View style={styles.headerRow}>
                        {navigation?.getState?.()?.type === 'stack' && navigation?.canGoBack?.() ? (
                            <TouchableOpacity
                                style={styles.glassBtn}
                                onPress={() => navigation?.goBack?.()}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        ) : null}
                        <Text style={styles.headerTitle}>Hồ sơ hội viên</Text>
                        <TouchableOpacity
                            style={styles.glassBtn}
                            onPress={() => setShowCardModal(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="qr-code-outline" size={19} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* 1. HERO PROFILE CARD */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: member.anh_dai_dien || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' }} style={styles.avatarImage} />
                        <TouchableOpacity
                            style={styles.cameraBadge}
                            onPress={() => setShowAvatarPicker(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="camera" size={14} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.nameRow}>
                        <Text style={styles.nameText}>{member.ho_ten}</Text>
                        <Ionicons name="checkmark-circle" size={19} color={COLORS.accentBlue} />
                    </View>

                    <LinearGradient
                        colors={['#FFF7ED', '#FDEBD3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.badgeWrap}
                    >
                        <Ionicons name="diamond" size={12} color={COLORS.accentGold} style={{ marginRight: 5 }} />
                        <Text style={styles.badgeText}>{member.hang_thanh_vien}</Text>
                    </LinearGradient>

                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>
                            Đang hoạt động • Còn {member.so_ngay_con_lai} ngày
                        </Text>
                    </View>

                    <View style={styles.profileActionRow}>
                        <TouchableOpacity
                            style={styles.editProfileBtnWrap}
                            onPress={() => {
                                setEditForm({ ...member });
                                setShowEditModal(true);
                            }}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.editProfileBtn}
                            >
                                <Ionicons name="create-outline" size={17} color={COLORS.white} style={{ marginRight: 6 }} />
                                <Text style={styles.editProfileBtnText}>Chỉnh sửa hồ sơ</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cardViewBtn}
                            onPress={() => setShowCardModal(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="card" size={16} color={COLORS.accentGold} style={{ marginRight: 6 }} />
                            <Text style={styles.cardViewBtnText}>Thẻ VIP</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. HIỆU SUẤT TẬP LUYỆN */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeading}>Hiệu suất tập luyện</Text>
                    <View style={styles.sectionHeadingIcon}>
                        <Ionicons name="flame" size={16} color={COLORS.accentOrange} />
                    </View>
                </View>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: COLORS.surfaceTeal }]}>
                            <Ionicons name="barbell" size={18} color={COLORS.primary} />
                        </View>
                        <Text style={styles.statValue}>{member.thong_ke.so_buoi_tap}</Text>
                        <Text style={styles.statLabel}>Buổi tập</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="time" size={18} color={COLORS.accentGold} />
                        </View>
                        <Text style={styles.statValue}>{member.thong_ke.tong_gio_tap}h</Text>
                        <Text style={styles.statLabel}>Giờ tập</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="calendar" size={18} color={COLORS.accentGreen} />
                        </View>
                        <Text style={styles.statValue}>{member.thong_ke.tuan_duy_tri}</Text>
                        <Text style={styles.statLabel}>Tuần liên tục</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#FFF1EC' }]}>
                            <Ionicons name="flash" size={18} color={COLORS.accentOrange} />
                        </View>
                        <Text style={styles.statValue}>{member.thong_ke.calo_tieu_thu.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Kcal đốt</Text>
                    </View>
                </View>

                {/* 3. COLLAPSIBLE: THÔNG TIN CÁ NHÂN & THỂ TRẠNG */}
                <View style={styles.collapsibleWrapper}>
                    <TouchableOpacity
                        style={styles.sectionAccordionHeader}
                        onPress={() => setExpandPersonal(!expandPersonal)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.accordionTitleRow}>
                            <View style={[styles.accordionIcon, { backgroundColor: COLORS.surfaceTeal }]}>
                                <Ionicons name="person" size={18} color={COLORS.primary} />
                            </View>
                            <Text style={styles.accordionTitle}>Thông tin cá nhân & Thể trạng</Text>
                        </View>
                        <View style={styles.chevronWrap}>
                            <Ionicons
                                name={expandPersonal ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={COLORS.primary}
                            />
                        </View>
                    </TouchableOpacity>

                    {expandPersonal && (
                        <View style={styles.accordionContentCard}>
                            <ProfileItem icon="person-outline" title="Họ và tên" value={member.ho_ten} />
                            <ProfileItem icon="mail-outline" title="Email" value={member.email} />
                            <ProfileItem icon="call-outline" title="Số điện thoại" value={member.so_dien_thoai} />
                            <ProfileItem
                                icon="calendar-outline"
                                title="Ngày sinh & Giới tính"
                                value={`${member.ngay_sinh} • ${member.gioi_tinh}`}
                            />
                            <ProfileItem
                                icon="body-outline"
                                title="Chỉ số cơ thể (Chiều cao / Cân nặng)"
                                value={`${member.chieu_cao_cm} cm • ${member.can_nang_kg} kg`}
                            />
                            <View style={[styles.profileItem, styles.itemBorder]}>
                                <View style={styles.itemIconWrap}>
                                    <Ionicons name="fitness-outline" size={18} color={COLORS.primary} />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemTitle}>Chỉ số khối cơ thể (BMI)</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                                        <Text style={styles.itemValue}>{bmiData.bmi} </Text>
                                        <View style={[styles.bmiBadge, { backgroundColor: `${bmiData.color}20` }]}>
                                            <Text style={[styles.bmiBadgeText, { color: bmiData.color }]}>
                                                {bmiData.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <ProfileItem
                                icon="trophy-outline"
                                title="Mục tiêu & Cấp độ rèn luyện"
                                value={`${member.muc_tieu_hien_tai} • ${member.cap_do_hien_tai}`}
                                last
                            />
                        </View>
                    )}
                </View>

                {/* 4. COLLAPSIBLE: THÔNG TIN GÓI TẬP & HỘI VIÊN */}
                <View style={styles.collapsibleWrapper}>
                    <TouchableOpacity
                        style={styles.sectionAccordionHeader}
                        onPress={() => setExpandMembership(!expandMembership)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.accordionTitleRow}>
                            <View style={[styles.accordionIcon, { backgroundColor: '#F5F3FF' }]}>
                                <Ionicons name="card" size={18} color={'#8B5CF6'} />
                            </View>
                            <Text style={styles.accordionTitle}>Gói tập & Quyền lợi hội viên</Text>
                        </View>
                        <View style={styles.chevronWrap}>
                            <Ionicons
                                name={expandMembership ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={COLORS.primary}
                            />
                        </View>
                    </TouchableOpacity>

                    {expandMembership && (
                        <View style={styles.accordionContentCard}>
                            <View style={[styles.profileItem, styles.itemBorder]}>
                                <View style={styles.itemIconWrap}>
                                    <Ionicons name="finger-print-outline" size={18} color={COLORS.primary} />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemTitle}>Mã thẻ hội viên</Text>
                                    <Text style={styles.itemValue}>{member.ma_thanh_vien}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.copyBtn}
                                    onPress={handleCopyMemberCode}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
                                    <Text style={styles.copyBtnText}>Sao chép</Text>
                                </TouchableOpacity>
                            </View>

                            <ProfileItem icon="shield-checkmark-outline" title="Gói hội viên" value={member.goi_tap} />
                            <ProfileItem
                                icon="hourglass-outline"
                                title="Hạn sử dụng thẻ"
                                value={`${member.ngay_het_han} (Còn ${member.so_ngay_con_lai} ngày)`}
                            />
                            <View style={[styles.profileItem, styles.itemBorder]}>
                                <View style={styles.itemIconWrap}>
                                    <Ionicons name="barbell-outline" size={18} color={COLORS.primary} />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemTitle}>Huấn luyện viên phụ trách</Text>
                                    <Text style={styles.itemValue}>{member.hlv_phu_trach}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.chatCoachBtn}
                                    onPress={() => {
                                        if (navigation?.navigate) {
                                            navigation.navigate('ChatList');
                                        } else {
                                            Alert.alert('Tin nhắn', `Mở cuộc trò chuyện với ${member.hlv_phu_trach}`);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.white} />
                                    <Text style={styles.chatCoachBtnText}>Nhắn tin</Text>
                                </TouchableOpacity>
                            </View>
                            <ProfileItem
                                icon="location-outline"
                                title="Cơ sở tập luyện chính"
                                value={member.co_so}
                            />

                            <TouchableOpacity
                                style={[styles.profileItem, styles.itemBorder]}
                                onPress={() => navigation?.navigate('EnterTrainerCodeScreen')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.itemIconWrap, { backgroundColor: '#E6F0F4' }]}>
                                    <Ionicons name="key-outline" size={18} color={COLORS.primary} />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemTitle}>Nhập mã Huấn Luyện Viên</Text>
                                    <Text style={[styles.itemValue, { color: COLORS.primary }]}>Liên kết HLV riêng bằng mã</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.profileItem}
                                onPress={() => navigation?.navigate('ChangeWorkoutScheduleScreen')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.itemIconWrap, { backgroundColor: '#FFF7ED' }]}>
                                    <Ionicons name="calendar-outline" size={18} color="#D97706" />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemTitle}>Đổi lịch tập luyện</Text>
                                    <Text style={[styles.itemValue, { color: '#D97706' }]}>Theo HLV hoặc chu kỳ tập/nghỉ</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 5. COLLAPSIBLE: CÀI ĐẶT & TIỆN ÍCH */}
                <View style={styles.collapsibleWrapper}>
                    <TouchableOpacity
                        style={styles.sectionAccordionHeader}
                        onPress={() => setExpandSettings(!expandSettings)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.accordionTitleRow}>
                            <View style={[styles.accordionIcon, { backgroundColor: '#EAF3FC' }]}>
                                <Ionicons name="settings" size={18} color={COLORS.accentBlue} />
                            </View>
                            <Text style={styles.accordionTitle}>Cài đặt & Tiện ích ứng dụng</Text>
                        </View>
                        <View style={styles.chevronWrap}>
                            <Ionicons
                                name={expandSettings ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={COLORS.primary}
                            />
                        </View>
                    </TouchableOpacity>

                    {expandSettings && (
                        <View style={styles.accordionContentCard}>
                            {/* Switch: Nhận thông báo nhắc tập */}
                            <View style={[styles.settingSwitchItem, styles.itemBorder]}>
                                <View style={[styles.settingIconWrap, { backgroundColor: '#EAF3FC' }]}>
                                    <Ionicons name="notifications-outline" size={19} color={COLORS.accentBlue} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.settingTitle}>Nhận thông báo lịch tập</Text>
                                    <Text style={styles.settingSubtitle}>Nhắc nhở trước giờ tập 30 phút</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                    thumbColor={remindWorkout ? '#FFFFFF' : '#E6F0F4'}
                                    ios_backgroundColor={COLORS.border}
                                    onValueChange={() => setRemindWorkout(!remindWorkout)}
                                    value={remindWorkout}
                                />
                            </View>

                            {/* Switch: Đồng bộ thể chất Apple Health / Google Fit */}
                            <View style={[styles.settingSwitchItem, styles.itemBorder]}>
                                <View style={[styles.settingIconWrap, { backgroundColor: '#FFF1EC' }]}>
                                    <Ionicons name="heart-circle-outline" size={19} color={COLORS.accentOrange} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.settingTitle}>Đồng bộ Apple Health / Google Fit</Text>
                                    <Text style={styles.settingSubtitle}>Tự động cập nhật calo & bước chân</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                    thumbColor={syncHealthData ? '#FFFFFF' : '#E6F0F4'}
                                    ios_backgroundColor={COLORS.border}
                                    onValueChange={() => setSyncHealthData(!syncHealthData)}
                                    value={syncHealthData}
                                />
                            </View>

                            {/* Switch: Nhắc nhở uống nước */}
                            <View style={[styles.settingSwitchItem, styles.itemBorder]}>
                                <View style={[styles.settingIconWrap, { backgroundColor: COLORS.surfaceTeal }]}>
                                    <Ionicons name="water-outline" size={19} color={COLORS.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.settingTitle}>Nhắc nhở bổ sung nước</Text>
                                    <Text style={styles.settingSubtitle}>Thông báo mỗi 2 giờ một lần</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                    thumbColor={drinkWaterAlert ? '#FFFFFF' : '#E6F0F4'}
                                    ios_backgroundColor={COLORS.border}
                                    onValueChange={() => setDrinkWaterAlert(!drinkWaterAlert)}
                                    value={drinkWaterAlert}
                                />
                            </View>

                            {/* Điều hướng: Lịch sử buổi tập */}
                            <SettingItem
                                icon="calendar-number-outline"
                                title="Lịch sử buổi tập & Phân tích AI"
                                onPress={() => {
                                    if (navigation?.navigate) {
                                        navigation.navigate('WorkoutHistory');
                                    } else {
                                        Alert.alert('Lịch sử tập', 'Đang tải dữ liệu các buổi tập gần đây...');
                                    }
                                }}
                            />

                            {/* Điều hướng: Gói tập của tôi */}
                            <SettingItem
                                icon="barbell-outline"
                                title="Gói tập của tôi & Đăng ký gói mới"
                                onPress={() => {
                                    if (navigation?.navigate) {
                                        navigation.navigate('MyPackages');
                                    }
                                }}
                            />

                            {/* Điều hướng: Thẻ điện tử */}
                            <SettingItem
                                icon="wallet-outline"
                                title="Quản lý thẻ & Quét mã check-in"
                                onPress={() => setShowCardModal(true)}
                            />

                            {/* Điều hướng: Bảo mật */}
                            <SettingItem
                                icon="lock-closed-outline"
                                title="Bảo mật & Đổi mật khẩu tài khoản"
                                onPress={() => {
                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    setShowPasswordModal(true);
                                }}
                            />

                            {/* Điều hướng: CSKH */}
                            <SettingItem
                                icon="help-circle-outline"
                                title="Hỗ trợ khách hàng (Hotline: 1900 8899)"
                                onPress={() => Alert.alert('Hỗ trợ VisionFit', 'Tổng đài CSKH: 1900 8899 (8h00 - 22h00)')}
                                last
                            />
                        </View>
                    )}
                </View>

                {/* 6. NÚT ĐĂNG XUẤT TÀI KHOẢN */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={19} color={COLORS.accentRed} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>VisionFit v2.4.0 • Dành riêng cho hội viên</Text>
            </ScrollView>

            {/* MODAL 1: CHỈNH SỬA HỒ SƠ */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.dragHandle} />
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
                                <Text style={styles.modalSubtitle}>Cập nhật thông tin cá nhân & thể trạng</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setShowEditModal(false)}
                            >
                                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Họ và tên *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={editForm.ho_ten}
                                    onChangeText={(val) => setEditForm({ ...editForm, ho_ten: val })}
                                    placeholder="Nhập họ và tên..."
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Số điện thoại *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={editForm.so_dien_thoai}
                                    onChangeText={(val) => setEditForm({ ...editForm, so_dien_thoai: val })}
                                    placeholder="Nhập số điện thoại..."
                                    keyboardType="phone-pad"
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={editForm.email}
                                    onChangeText={(val) => setEditForm({ ...editForm, email: val })}
                                    placeholder="Email liên hệ..."
                                    keyboardType="email-address"
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editForm.chieu_cao_cm}
                                        onChangeText={(val) => setEditForm({ ...editForm, chieu_cao_cm: val })}
                                        keyboardType="numeric"
                                        placeholder="175"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editForm.can_nang_kg}
                                        onChangeText={(val) => setEditForm({ ...editForm, can_nang_kg: val })}
                                        keyboardType="numeric"
                                        placeholder="68"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Ngày sinh</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editForm.ngay_sinh}
                                        onChangeText={(val) => setEditForm({ ...editForm, ngay_sinh: val })}
                                        placeholder="DD/MM/YYYY"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Giới tính</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editForm.gioi_tinh}
                                        onChangeText={(val) => setEditForm({ ...editForm, gioi_tinh: val })}
                                        placeholder="Nam / Nữ"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Mục tiêu rèn luyện</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={editForm.muc_tieu_hien_tai}
                                    onChangeText={(val) => setEditForm({ ...editForm, muc_tieu_hien_tai: val })}
                                    placeholder="Tăng cơ, giảm mỡ, siết cơ..."
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Cấp độ hiện tại</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={editForm.cap_do_hien_tai}
                                    onChangeText={(val) => setEditForm({ ...editForm, cap_do_hien_tai: val })}
                                    placeholder="Mới bắt đầu / Trung cấp / Nâng cao"
                                    placeholderTextColor={COLORS.textLight}
                                />
                            </View>

                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setShowEditModal(false)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.cancelBtnText}>Hủy</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveBtnWrap, saving && { opacity: 0.7 }]}
                                    onPress={handleSaveProfile}
                                    disabled={saving}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={[COLORS.primary, COLORS.primaryDark]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.saveBtn}
                                    >
                                        {saving ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                                                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: THẺ VIP THÀNH VIÊN ĐIỆN TỬ */}
            <Modal visible={showCardModal} animationType="fade" transparent={true} onRequestClose={() => setShowCardModal(false)} >
                <View style={styles.modalOverlay}>
                    <View style={styles.vipCardContainer}>
                        {/* Thẻ thành viên thiết kế sang trọng */}
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark, '#04363E']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.vipCard}
                        >
                            <View style={styles.vipCardDecor} />
                            <View style={styles.vipCardBadgeTop}>
                                <View style={styles.flex}>
                                    <Text style={styles.vipCardBrand}>VISIONFIT GYM & FITNESS</Text>
                                    <Text style={styles.vipCardTier}>{member.hang_thanh_vien.toUpperCase()}</Text>
                                </View>
                                <TouchableOpacity style={styles.vipCardCloseBtn} onPress={() => setShowCardModal(false)} >
                                    <Ionicons name="close" size={20} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.vipChip}>
                                <Ionicons name="hardware-chip-outline" size={22} color="#7A5A1E" />
                            </View>

                            <View style={styles.vipCardBadgeBottom}>
                                <Text style={styles.vipCardNumber}>{member.ma_thanh_vien}</Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
                                    <View>
                                        <Text style={styles.vipCardSub}>HỘI VIÊN</Text>
                                        <Text style={styles.vipCardValue}>{member.ho_ten}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.vipCardSub}>HẠN SỬ DỤNG</Text>
                                        <Text style={styles.vipCardValue}>{member.ngay_het_han}</Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>

                        {/* QR Code Check-in */}
                        <View style={styles.qrCodeWrap}>
                            <View style={styles.qrBox}>
                                {member.ma_thanh_vien ? (
                                    <QRCode value={JSON.stringify({
                                                ma_thanh_vien: member.ma_thanh_vien,
                                                ho_ten: member.ho_ten,
                                                so_dien_thoai: member.so_dien_thoai,
                                                email: member.email,
                                                goi_tap: member.goi_tap,
                                                ngay_bat_dau: member.ngay_bat_dau,
                                                ngay_het_han: member.ngay_het_han,
                                            })} size={180}  color="#102F3A" backgroundColor="#FFFFFF" />
                                ) : (
                                    <Text style={styles.qrCodeNote}>
                                        Chưa có mã thành viên
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.qrCodeNote}>
                                Đưa mã này trước máy quét tại cổng để check-in
                            </Text>
                            <Text style={styles.qrBranchNote}>
                                Áp dụng tại: {member.co_so}
                            </Text>

                            <TouchableOpacity
                                style={styles.copyQrBtn}
                                onPress={handleCopyMemberCode}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="copy-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                                <Text style={styles.copyQrBtnText}>Sao chép mã thẻ hội viên</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL 3: CHỌN NHANH ẢNH ĐẠI DIỆN */}
            <Modal
                visible={showAvatarPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAvatarPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.avatarPickerContainer}>
                        <View style={styles.dragHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn ảnh đại diện</Text>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAvatarPicker(false)}>
                                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.avatarPickerSub}>
                            Chọn một hình ảnh đại diện phù hợp phong cách thể thao của bạn:
                        </Text>

                        <View style={styles.avatarGrid}>
                            {PRESET_AVATARS.map((url, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => handleSelectAvatar(url)}
                                    style={[
                                        styles.avatarOption,
                                        member.anh_dai_dien === url && styles.avatarOptionSelected,
                                    ]}
                                    activeOpacity={0.8}
                                >
                                    <Image source={{ uri: url }} style={styles.avatarOptionImg} />
                                    {member.anh_dai_dien === url && (
                                        <View style={styles.avatarCheckBadge}>
                                            <Ionicons name="checkmark" size={13} color={COLORS.white} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.customUploadBtn}
                            onPress={() => {
                                setShowAvatarPicker(false);
                                Alert.alert('Tải ảnh lên', 'Chọn ảnh từ thư viện máy ảnh của bạn');
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="images-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.customUploadBtnText}>Tải ảnh từ điện thoại</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL 4: BẢO MẬT & ĐỔI MẬT KHẨU */}
            <Modal
                visible={showPasswordModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.dragHandle} />
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
                                <Text style={styles.modalSubtitle}>Cập nhật mật khẩu bảo vệ tài khoản của bạn</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setShowPasswordModal(false)}
                            >
                                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Mật khẩu hiện tại *</Text>
                                <View style={styles.passwordInputWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        secureTextEntry={!showOldPass}
                                        value={passwordForm.currentPassword}
                                        onChangeText={(val) => setPasswordForm({ ...passwordForm, currentPassword: val })}
                                        placeholder="Nhập mật khẩu hiện tại..."
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                    <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)} style={styles.eyeBtn}>
                                        <Ionicons name={showOldPass ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Mật khẩu mới (tối thiểu 6 ký tự) *</Text>
                                <View style={styles.passwordInputWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        secureTextEntry={!showNewPass}
                                        value={passwordForm.newPassword}
                                        onChangeText={(val) => setPasswordForm({ ...passwordForm, newPassword: val })}
                                        placeholder="Nhập mật khẩu mới..."
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                    <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeBtn}>
                                        <Ionicons name={showNewPass ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Xác nhận mật khẩu mới *</Text>
                                <View style={styles.passwordInputWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        secureTextEntry={!showConfirmPass}
                                        value={passwordForm.confirmPassword}
                                        onChangeText={(val) => setPasswordForm({ ...passwordForm, confirmPassword: val })}
                                        placeholder="Nhập lại mật khẩu mới..."
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                                        <Ionicons name={showConfirmPass ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setShowPasswordModal(false)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.cancelBtnText}>Hủy</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveBtnWrap, changingPassword && { opacity: 0.7 }]}
                                    onPress={handleChangePassword}
                                    disabled={changingPassword}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={[COLORS.primary, COLORS.primaryDark]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.saveBtn}
                                    >
                                        {changingPassword ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <>
                                                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.white} />
                                                <Text style={styles.saveBtnText}>Cập nhật mật khẩu</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

/* COMPONENT: PROFILE ITEM DÙNG TRONG ACCORDION */
const ProfileItem = ({ icon, title, value, last = false }: any) => {
    return (
        <View style={[styles.profileItem, !last && styles.itemBorder]}>
            <View style={styles.itemIconWrap}>
                <Ionicons name={icon} size={18} color={COLORS.primary} />
            </View>

            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemValue}>{value}</Text>
            </View>
        </View>
    );
};

/* COMPONENT: SETTING ITEM DÙNG TRONG ACCORDION */
const SettingItem = ({ icon, title, onPress, last = false }: any) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.settingItem, !last && styles.itemBorder]}
            activeOpacity={0.7}
        >
            <View style={styles.settingIconWrap}>
                <Ionicons name={icon} size={19} color={COLORS.primary} />
            </View>

            <Text style={[styles.settingTitle, styles.flex]}>{title}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    scroll: {
        backgroundColor: COLORS.background,
    },

    scrollContent: {
        paddingBottom: 24,
    },

    flex: {
        flex: 1,
    },

    // HEADER GRADIENT
    header: {
        height: 190,
        paddingHorizontal: 16,
        paddingTop: 14,
        borderRadius: 28,
        marginHorizontal: 12,
        marginTop: 6,
        overflow: 'hidden',
    },

    decorCircle: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.07)',
        top: -80,
        right: -50,
    },

    decorCircleSmall: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255,255,255,0.07)',
        bottom: -50,
        left: -30,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.white,
    },

    glassBtn: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // PROFILE HERO CARD
    profileCard: {
        backgroundColor: COLORS.white,
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginTop: -80,
        borderRadius: 24,
        ...SHADOWS.card,
        shadowOpacity: 0.12,
        elevation: 6,
    },

    avatarContainer: {
        position: 'absolute',
        top: -48,
    },

    avatarImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: COLORS.white,
    },

    cameraBadge: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.primary,
        borderWidth: 2.5,
        borderColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },

    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    nameText: {
        fontSize: 21,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    badgeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FBD9A5',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        marginTop: 8,
    },

    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B47A30',
    },

    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: '#ECFDF5',
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accentGreen,
        marginRight: 6,
    },

    statusText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#059669',
    },

    profileActionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        alignSelf: 'stretch',
    },

    editProfileBtnWrap: {
        flex: 1,
    },

    editProfileBtn: {
        height: 46,
        borderRadius: 999,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    editProfileBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.white,
    },

    cardViewBtn: {
        height: 46,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FBD9A5',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    cardViewBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#B47A30',
    },

    // STATS PERFORMANCE
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
        marginBottom: 12,
        paddingHorizontal: 16,
    },

    sectionHeading: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    sectionHeadingIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#FFF1EC',
        alignItems: 'center',
        justifyContent: 'center',
    },

    statsCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.card,
        marginBottom: 8,
    },

    statItem: {
        flex: 1,
        alignItems: 'center',
    },

    statIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },

    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    statLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 1,
    },

    divider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.borderLight,
    },

    // COLLAPSIBLE ACCORDION
    collapsibleWrapper: {
        marginHorizontal: 16,
        marginTop: 14,
    },

    sectionAccordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        height: 64,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },

    accordionTitleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    accordionIcon: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },

    accordionTitle: {
        flexShrink: 1,
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '800',
    },

    chevronWrap: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: COLORS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },

    accordionContentCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        marginTop: 8,
        ...SHADOWS.card,
    },

    profileItem: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },

    itemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },

    itemIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: COLORS.surfaceTeal,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    itemContent: {
        flex: 1,
    },

    itemTitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },

    itemValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 2,
    },

    bmiBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 6,
    },

    bmiBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },

    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primarySoft,
        paddingHorizontal: 10,
        height: 32,
        borderRadius: 999,
    },

    copyBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.primary,
    },

    chatCoachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        height: 32,
        borderRadius: 999,
    },

    chatCoachBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.white,
    },

    // SETTINGS ITEM
    settingItem: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },

    settingSwitchItem: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },

    settingIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: COLORS.surfaceTeal,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    settingTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },

    settingSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },

    // LOGOUT BUTTON
    logoutButton: {
        marginHorizontal: 16,
        marginTop: 24,
        height: 50,
        borderRadius: 999,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    logoutText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.accentRed,
    },

    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 14,
    },

    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(4,28,35,0.55)',
        justifyContent: 'flex-end',
    },

    dragHandle: {
        width: 42,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.border,
        alignSelf: 'center',
        marginBottom: 14,
    },

    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 30,
        maxHeight: '88%',
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },

    modalSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },

    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    inputGroup: {
        marginBottom: 14,
    },

    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: 6,
    },

    textInput: {
        height: 50,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        fontSize: 14,
        color: COLORS.textPrimary,
    },

    modalActionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        paddingBottom: 10,
    },

    cancelBtn: {
        flex: 1,
        height: 50,
        borderRadius: 999,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },

    cancelBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },

    saveBtnWrap: {
        flex: 1.4,
    },

    saveBtn: {
        height: 50,
        borderRadius: 999,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },

    saveBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.white,
    },

    // VIP CARD MODAL
    vipCardContainer: {
        margin: 16,
        marginBottom: 40,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
    },

    vipCard: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        ...SHADOWS.glow,
    },

    vipCardDecor: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.07)',
        top: -80,
        right: -60,
    },

    vipCardBadgeTop: {
        width: '100%',
        padding: 16,
        paddingBottom: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    vipCardCloseBtn: {
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    vipChip: {
        width: 44,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.accentGold,
        marginLeft: 16,
        marginTop: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },

    vipCardBrand: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.white,
        letterSpacing: 1,
    },

    vipCardTier: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FBD9A5',
        marginTop: 3,
        letterSpacing: 0.5,
    },

    vipCardBadgeBottom: {
        width: '100%',
        padding: 16,
        paddingTop: 12,
    },

    vipCardNumber: {
        fontSize: 19,
        fontWeight: '800',
        color: COLORS.white,
        letterSpacing: 3,
    },

    vipCardSub: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    vipCardValue: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.white,
        marginTop: 2,
    },

    qrCodeWrap: {
        marginTop: 18,
        alignItems: 'center',
        width: '100%',
    },

    qrBox: {
        padding: 12,
        backgroundColor: COLORS.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },

    qrCodeNote: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 12,
        textAlign: 'center',
    },

    qrBranchNote: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
        textAlign: 'center',
    },

    copyQrBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        backgroundColor: COLORS.primarySoft,
        height: 48,
        borderRadius: 999,
        marginTop: 16,
    },

    copyQrBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },

    // AVATAR PICKER MODAL
    avatarPickerContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 30,
    },

    avatarPickerSub: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 16,
    },

    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        justifyContent: 'center',
        marginBottom: 20,
    },

    avatarOption: {
        position: 'relative',
        borderRadius: 38,
        padding: 3,
        borderWidth: 2.5,
        borderColor: 'transparent',
    },

    avatarOptionSelected: {
        borderColor: COLORS.primary,
    },

    avatarOptionImg: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },

    avatarCheckBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },

    customUploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 999,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: COLORS.borderFocus,
        backgroundColor: COLORS.surfaceTeal,
    },

    customUploadBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },

    passwordInputWrap: {
        height: 50,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },

    passwordInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textPrimary,
        height: '100%',
    },

    eyeBtn: {
        padding: 6,
    },
});

export default MemberProfile;
