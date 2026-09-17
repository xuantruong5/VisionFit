import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    TextInput,
    Alert,
    StatusBar,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Dữ liệu mẫu hồ sơ ban đầu (Frontend Mock Data)
const INITIAL_MEMBER = {
    ho_ten: 'Lê Hoàng Nam',
    email: 'nam.le@visionfit.vn',
    so_dien_thoai: '0901 234 567',
    anh_dai_dien: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    ngay_sinh: '15/08/1998',
    gioi_tinh: 'Nam',
    chieu_cao_cm: '175',
    can_nang_kg: '68',
    dang_nguoi: 'Cân đối',
    muc_tieu_hien_tai: 'Tăng cơ & Giảm mỡ',
    cap_do_hien_tai: 'Trung cấp (Intermediate)',
    noi_tap_uu_tien: 'Phòng gym VisionFit',
    hang_thanh_vien: 'Hội viên VIP Premium',
    goi_tap: 'Gói VIP Toàn Diện 12 Tháng',
    ngay_het_han: '18/12/2026',
    so_ngay_con_lai: 92,
    hlv_phu_trach: 'Trần Minh Tuấn (HLV Thể hình)',
    ma_thanh_vien: 'VF-892147',
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

    // Lưu thông tin chỉnh sửa
    const handleSaveProfile = () => {
        if (!editForm.ho_ten.trim()) {
            Alert.alert('Thông báo', 'Họ và tên không được để trống!');
            return;
        }
        if (!editForm.so_dien_thoai.trim()) {
            Alert.alert('Thông báo', 'Số điện thoại không được để trống!');
            return;
        }

        setMember({ ...editForm });
        setShowEditModal(false);
        Alert.alert('Cập nhật thành công', 'Thông tin hồ sơ hội viên của bạn đã được cập nhật!');
    };

    // Đổi ảnh đại diện
    const handleSelectAvatar = (url: string) => {
        setMember((prev) => ({ ...prev, anh_dai_dien: url }));
        setShowAvatarPicker(false);
        Alert.alert('Thành công', 'Đã thay đổi ảnh đại diện!');
    };

    // Sao chép mã hội viên
    const handleCopyMemberCode = () => {
        Alert.alert('Mã hội viên', `Đã sao chép mã thẻ: ${member.ma_thanh_vien}`);
    };

    // Xử lý Đăng xuất
    const handleLogout = () => {
        Alert.alert(
            'Xác nhận đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản VisionFit?',
            [
                { text: 'Ở lại', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Đã đăng xuất', 'Hẹn gặp lại bạn tại buổi tập tiếp theo!');
                        if (navigation?.navigate) {
                            navigation.navigate('AuthScreen');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* HEADER - TƯƠNG ĐỒNG WORKOUTPLANSCREEN */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : null)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={navigation?.canGoBack?.() ? 'chevron-back' : 'person-circle-outline'}
                        size={26}
                        color="#075E68"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Hồ sơ hội viên</Text>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setShowCardModal(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="qr-code-outline" size={24} color="#0D7F8D" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. HERO PROFILE CARD */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: member.anh_dai_dien }} style={styles.avatarImage} />
                        <TouchableOpacity
                            style={styles.cameraBadge}
                            onPress={() => setShowAvatarPicker(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="camera" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.nameText}>{member.ho_ten}</Text>

                    <View style={styles.badgeWrap}>
                        <Ionicons name="sparkles" size={13} color="#0D7F8D" style={{ marginRight: 5 }} />
                        <Text style={styles.badgeText}>{member.hang_thanh_vien}</Text>
                    </View>

                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>
                            Đang hoạt động • Còn {member.so_ngay_con_lai} ngày
                        </Text>
                    </View>

                    <View style={styles.profileActionRow}>
                        <TouchableOpacity
                            style={styles.editProfileBtn}
                            onPress={() => {
                                setEditForm({ ...member });
                                setShowEditModal(true);
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="create-outline" size={16} color="#0D7F8D" style={{ marginRight: 6 }} />
                            <Text style={styles.editProfileBtnText}>Chỉnh sửa hồ sơ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cardViewBtn}
                            onPress={() => setShowCardModal(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="card" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.cardViewBtnText}>Thẻ VIP</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. HIỆU SUẤT TẬP LUYỆN */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeading}>HIỆU SUẤT TẬP LUYỆN</Text>
                    <Ionicons name="flame" size={18} color="#FA3E3E" />
                </View>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#EAF9FB' }]}>
                            <Ionicons name="barbell-outline" size={20} color="#0D7F8D" />
                        </View>
                        <Text style={styles.statValue}>{member.thong_ke.so_buoi_tap}</Text>
                        <Text style={styles.statLabel}>Buổi tập</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#FFF4E5' }]}>
                            <Ionicons name="time-outline" size={20} color="#FF9800" />
                        </View>
                        <Text style={styles.statValue}>{member.thong_ke.tong_gio_tap}h</Text>
                        <Text style={styles.statLabel}>Giờ tập</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="calendar-outline" size={20} color="#10B981" />
                        </View>
                        <Text style={styles.statValue}>{member.thong_ke.tuan_duy_tri}</Text>
                        <Text style={styles.statLabel}>Tuần liên tục</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="flash-outline" size={20} color="#FA3E3E" />
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
                            <Ionicons name="person-outline" size={20} color="#0D7F8D" />
                            <Text style={styles.accordionTitle}>Thông tin cá nhân & Thể trạng</Text>
                        </View>
                        <Ionicons
                            name={expandPersonal ? 'chevron-up' : 'chevron-down'}
                            size={22}
                            color="#0D7F8D"
                        />
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
                                    <Ionicons name="fitness-outline" size={20} color="#0D7F8D" />
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
                            <Ionicons name="card-outline" size={20} color="#0D7F8D" />
                            <Text style={styles.accordionTitle}>Gói tập & Quyền lợi hội viên</Text>
                        </View>
                        <Ionicons
                            name={expandMembership ? 'chevron-up' : 'chevron-down'}
                            size={22}
                            color="#0D7F8D"
                        />
                    </TouchableOpacity>

                    {expandMembership && (
                        <View style={styles.accordionContentCard}>
                            <View style={[styles.profileItem, styles.itemBorder]}>
                                <View style={styles.itemIconWrap}>
                                    <Ionicons name="finger-print-outline" size={20} color="#0D7F8D" />
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
                                    <Ionicons name="copy-outline" size={16} color="#0D7F8D" />
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
                                    <Ionicons name="barbell-outline" size={20} color="#0D7F8D" />
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
                                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0D7F8D" />
                                    <Text style={styles.chatCoachBtnText}>Nhắn tin</Text>
                                </TouchableOpacity>
                            </View>
                            <ProfileItem
                                icon="location-outline"
                                title="Cơ sở tập luyện chính"
                                value={member.co_so}
                                last
                            />
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
                            <Ionicons name="settings-outline" size={20} color="#0D7F8D" />
                            <Text style={styles.accordionTitle}>Cài đặt & Tiện ích ứng dụng</Text>
                        </View>
                        <Ionicons
                            name={expandSettings ? 'chevron-up' : 'chevron-down'}
                            size={22}
                            color="#0D7F8D"
                        />
                    </TouchableOpacity>

                    {expandSettings && (
                        <View style={styles.accordionContentCard}>
                            {/* Switch: Nhận thông báo nhắc tập */}
                            <View style={[styles.settingSwitchItem, styles.itemBorder]}>
                                <View style={styles.settingIconWrap}>
                                    <Ionicons name="notifications-outline" size={20} color="#0D7F8D" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.settingTitle}>Nhận thông báo lịch tập</Text>
                                    <Text style={styles.settingSubtitle}>Nhắc nhở trước giờ tập 30 phút</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#9ED9DF', true: '#0D7F8D' }}
                                    thumbColor={remindWorkout ? '#FFFFFF' : '#EAF9FB'}
                                    ios_backgroundColor="#EAF9FB"
                                    onValueChange={() => setRemindWorkout(!remindWorkout)}
                                    value={remindWorkout}
                                />
                            </View>

                            {/* Switch: Đồng bộ thể chất Apple Health / Google Fit */}
                            <View style={[styles.settingSwitchItem, styles.itemBorder]}>
                                <View style={styles.settingIconWrap}>
                                    <Ionicons name="heart-circle-outline" size={20} color="#0D7F8D" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.settingTitle}>Đồng bộ Apple Health / Google Fit</Text>
                                    <Text style={styles.settingSubtitle}>Tự động cập nhật calo & bước chân</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#9ED9DF', true: '#0D7F8D' }}
                                    thumbColor={syncHealthData ? '#FFFFFF' : '#EAF9FB'}
                                    ios_backgroundColor="#EAF9FB"
                                    onValueChange={() => setSyncHealthData(!syncHealthData)}
                                    value={syncHealthData}
                                />
                            </View>

                            {/* Switch: Nhắc nhở uống nước */}
                            <View style={[styles.settingSwitchItem, styles.itemBorder]}>
                                <View style={styles.settingIconWrap}>
                                    <Ionicons name="water-outline" size={20} color="#0D7F8D" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.settingTitle}>Nhắc nhở bổ sung nước</Text>
                                    <Text style={styles.settingSubtitle}>Thông báo mỗi 2 giờ một lần</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#9ED9DF', true: '#0D7F8D' }}
                                    thumbColor={drinkWaterAlert ? '#FFFFFF' : '#EAF9FB'}
                                    ios_backgroundColor="#EAF9FB"
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
                                onPress={() => Alert.alert('Bảo mật', 'Tính năng đổi mật khẩu tài khoản đã sẵn sàng!')}
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
                    <Ionicons name="log-out-outline" size={20} color="#FA3E3E" style={{ marginRight: 8 }} />
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
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
                                <Text style={styles.modalSubtitle}>Cập nhật thông tin cá nhân & thể trạng</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setShowEditModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#11343A" />
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
                                    placeholderTextColor="#71949A"
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
                                    placeholderTextColor="#71949A"
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
                                    placeholderTextColor="#71949A"
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
                                        placeholderTextColor="#71949A"
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
                                        placeholderTextColor="#71949A"
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
                                        placeholderTextColor="#71949A"
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Giới tính</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editForm.gioi_tinh}
                                        onChangeText={(val) => setEditForm({ ...editForm, gioi_tinh: val })}
                                        placeholder="Nam / Nữ"
                                        placeholderTextColor="#71949A"
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
                                    placeholderTextColor="#71949A"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Cấp độ hiện tại</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={editForm.cap_do_hien_tai}
                                    onChangeText={(val) => setEditForm({ ...editForm, cap_do_hien_tai: val })}
                                    placeholder="Mới bắt đầu / Trung cấp / Nâng cao"
                                    placeholderTextColor="#71949A"
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
                                    style={styles.saveBtn}
                                    onPress={handleSaveProfile}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: THẺ VIP THÀNH VIÊN ĐIỆN TỬ */}
            <Modal
                visible={showCardModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowCardModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.vipCardContainer}>
                        {/* Thẻ thành viên thiết kế sang trọng */}
                        <View style={styles.vipCardBadgeTop}>
                            <View>
                                <Text style={styles.vipCardBrand}>VISIONFIT GYM & FITNESS</Text>
                                <Text style={styles.vipCardTier}>{member.hang_thanh_vien.toUpperCase()}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.vipCardCloseBtn}
                                onPress={() => setShowCardModal(false)}
                            >
                                <Ionicons name="close" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
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

                        {/* QR Code Check-in */}
                        <View style={styles.qrCodeWrap}>
                            <View style={styles.qrBox}>
                                <Ionicons name="qr-code" size={140} color="#11343A" />
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
                                <Ionicons name="copy-outline" size={16} color="#0D7F8D" style={{ marginRight: 6 }} />
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
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn ảnh đại diện</Text>
                            <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                                <Ionicons name="close" size={24} color="#11343A" />
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
                                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
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
                            <Ionicons name="images-outline" size={18} color="#0D7F8D" style={{ marginRight: 8 }} />
                            <Text style={styles.customUploadBtnText}>Tải ảnh từ điện thoại</Text>
                        </TouchableOpacity>
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
                <Ionicons name={icon} size={20} color="#0D7F8D" />
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
                <Ionicons name={icon} size={20} color="#0D7F8D" />
            </View>

            <Text style={styles.settingTitle}>{title}</Text>
            <Ionicons name="chevron-forward" size={18} color="#71949A" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4FAFB',
    },

    scrollContent: {
        paddingBottom: 40,
    },

    // HEADER THIẾT KẾ ĐỒNG BỘ VỚI WORKOUTPLANSCREEN
    header: {
        height: 72,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F0F1',
    },

    headerTitle: {
        fontSize: 21,
        fontWeight: '700',
        color: '#11343A',
    },

    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // PROFILE HERO CARD
    profileCard: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#B9E5E9',
        elevation: 2,
        shadowColor: '#78959A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },

    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },

    avatarImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: '#0D7F8D',
    },

    cameraBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0D7F8D',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    nameText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#11343A',
    },

    badgeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF9FB',
        borderWidth: 1,
        borderColor: '#9ED9DF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },

    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0D7F8D',
    },

    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 6,
    },

    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
    },

    profileActionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
        width: '100%',
    },

    editProfileBtn: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0D7F8D',
        backgroundColor: '#EAF9FB',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    editProfileBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0D7F8D',
    },

    cardViewBtn: {
        height: 42,
        paddingHorizontal: 18,
        borderRadius: 12,
        backgroundColor: '#0D7F8D',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    cardViewBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // STATS PERFORMANCE
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 20,
    },

    sectionHeading: {
        fontSize: 13,
        fontWeight: '700',
        color: '#71949A',
        letterSpacing: 0.6,
    },

    statsCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#B9E5E9',
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#78959A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        marginBottom: 8,
    },

    statItem: {
        flex: 1,
        alignItems: 'center',
    },

    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },

    statValue: {
        fontSize: 17,
        fontWeight: '700',
        color: '#11343A',
    },

    statLabel: {
        fontSize: 11,
        color: '#71949A',
        marginTop: 2,
    },

    divider: {
        width: 1,
        height: 36,
        backgroundColor: '#E8F0F1',
    },

    // COLLAPSIBLE ACCORDION CONTAINER - STYLE CHUẨN NHƯ WORKOUTPLANSCREEN
    collapsibleWrapper: {
        marginHorizontal: 16,
        marginTop: 14,
    },

    sectionAccordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 18,
        height: 60,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#B9E5E9',
        elevation: 2,
        shadowColor: '#78959A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },

    accordionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    accordionTitle: {
        color: '#11343A',
        fontSize: 15,
        fontWeight: '700',
    },

    accordionContentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#B9E5E9',
        paddingHorizontal: 16,
        marginTop: 8,
        elevation: 2,
        shadowColor: '#78959A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },

    profileItem: {
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },

    itemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F7F8',
    },

    itemIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#EAF9FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },

    itemContent: {
        flex: 1,
    },

    itemTitle: {
        fontSize: 12,
        color: '#71949A',
    },

    itemValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#11343A',
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
        backgroundColor: '#EAF9FB',
        borderWidth: 1,
        borderColor: '#B9E5E9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },

    copyBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0D7F8D',
    },

    chatCoachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EAF9FB',
        borderWidth: 1,
        borderColor: '#0D7F8D',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },

    chatCoachBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0D7F8D',
    },

    // SETTINGS ITEM
    settingItem: {
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
    },

    settingSwitchItem: {
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },

    settingIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: '#EAF9FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    settingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#11343A',
    },

    settingSubtitle: {
        fontSize: 11,
        color: '#71949A',
        marginTop: 2,
    },

    // LOGOUT BUTTON
    logoutButton: {
        marginHorizontal: 16,
        marginTop: 24,
        height: 50,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FECACA',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    logoutText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FA3E3E',
    },

    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#71949A',
        marginTop: 14,
    },

    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
    },

    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 36,
        maxHeight: '88%',
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F0F1',
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11343A',
    },

    modalSubtitle: {
        fontSize: 12,
        color: '#71949A',
        marginTop: 2,
    },

    modalCloseBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    inputGroup: {
        marginBottom: 14,
    },

    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#11343A',
        marginBottom: 6,
    },

    textInput: {
        height: 48,
        backgroundColor: '#F4FAFB',
        borderWidth: 1,
        borderColor: '#B9E5E9',
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 14,
        color: '#11343A',
    },

    modalActionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
        paddingBottom: 10,
    },

    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },

    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },

    saveBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#0D7F8D',
        justifyContent: 'center',
        alignItems: 'center',
    },

    saveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // VIP CARD MODAL
    vipCardContainer: {
        margin: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 20,
        alignItems: 'center',
        marginBottom: 50,
    },

    vipCardBadgeTop: {
        width: '100%',
        backgroundColor: '#0D7F8D',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    vipCardCloseBtn: {
        padding: 4,
    },

    vipCardBrand: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },

    vipCardTier: {
        fontSize: 11,
        fontWeight: '600',
        color: '#B9E5E9',
        marginTop: 2,
    },

    vipCardBadgeBottom: {
        width: '100%',
        backgroundColor: '#075E68',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        padding: 16,
    },

    vipCardNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
    },

    vipCardSub: {
        fontSize: 10,
        color: '#B9E5E9',
        fontWeight: '600',
    },

    vipCardValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
    },

    qrCodeWrap: {
        marginTop: 20,
        alignItems: 'center',
        width: '100%',
    },

    qrBox: {
        padding: 12,
        backgroundColor: '#F4FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#B9E5E9',
    },

    qrCodeNote: {
        fontSize: 13,
        fontWeight: '600',
        color: '#11343A',
        marginTop: 12,
        textAlign: 'center',
    },

    qrBranchNote: {
        fontSize: 11,
        color: '#71949A',
        marginTop: 4,
        textAlign: 'center',
    },

    copyQrBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF9FB',
        borderWidth: 1,
        borderColor: '#0D7F8D',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 16,
    },

    copyQrBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0D7F8D',
    },

    // AVATAR PICKER MODAL
    avatarPickerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 36,
    },

    avatarPickerSub: {
        fontSize: 13,
        color: '#71949A',
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
        borderRadius: 36,
        padding: 3,
        borderWidth: 2,
        borderColor: 'transparent',
    },

    avatarOptionSelected: {
        borderColor: '#0D7F8D',
    },

    avatarOptionImg: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },

    avatarCheckBadge: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#0D7F8D',
        justifyContent: 'center',
        alignItems: 'center',
    },

    customUploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0D7F8D',
        backgroundColor: '#EAF9FB',
    },

    customUploadBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0D7F8D',
    },
});

export default MemberProfile;
