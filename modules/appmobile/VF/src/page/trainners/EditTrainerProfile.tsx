import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';
import apiFitlife from '../../general/api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80';

const ALL_SPECIALTIES = [
  'Strength Training',
  'Cardio',
  'Giảm mỡ',
  'Phục hồi chức năng',
  'Yoga',
  'Boxing',
  'Dinh dưỡng',
  'Tăng cơ',
  'Calisthenics',
];

const EditTrainerProfile = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [coSo, setCoSo] = useState('VisionFit Center - Quận 1');
  const [moTa, setMoTa] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<Array<{ title: string; org: string }>>([]);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [avatarError, setAvatarError] = useState(false);
  const [newAvatarAsset, setNewAvatarAsset] = useState<any>(null);

  // Modal thêm chứng chỉ
  const [showCertModal, setShowCertModal] = useState(false);
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertOrg, setNewCertOrg] = useState('');

  // Modal thông báo kết quả
  const [popup, setPopup] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Tải dữ liệu hồ sơ từ Database
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFitlife.get('/trainer/profile');
      if (res.data?.status && res.data?.data) {
        const d = res.data.data;
        setHoTen(d.ho_ten || '');
        setEmail(d.email || '');
        setSoDienThoai(d.so_dien_thoai || '');
        setCoSo(d.co_so || 'VisionFit Center - Quận 1');
        setMoTa(d.mo_ta || '');
        setSpecialties(Array.isArray(d.chuyen_mon) ? d.chuyen_mon : []);
        setCertificates(Array.isArray(d.chung_chi) ? d.chung_chi : []);
        if (d.hinh_anh) {
          setAvatar(d.hinh_anh);
        }
      }
    } catch (error: any) {
      console.log('Lỗi tải hồ sơ trainer:', error);
      setPopup({
        visible: true,
        type: 'error',
        title: 'Lỗi tải dữ liệu',
        message: error.response?.data?.message || 'Không thể tải thông tin hồ sơ của bạn.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Chọn ảnh từ thư viện
  const handlePickAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel || result.errorCode) return;

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setAvatar(asset.uri);
          setNewAvatarAsset(asset);
        }
      }
    } catch (err) {
      console.log('Lỗi chọn ảnh:', err);
    }
  };

  // Toggle chuyên môn
  const toggleSpecialty = (item: string) => {
    if (specialties.includes(item)) {
      setSpecialties(specialties.filter((s) => s !== item));
    } else {
      setSpecialties([...specialties, item]);
    }
  };

  // Thêm chứng chỉ
  const handleAddCertificate = () => {
    if (!newCertTitle.trim()) {
      return;
    }
    const item = {
      title: newCertTitle.trim(),
      org: newCertOrg.trim() || 'Tổ chức cấp chứng chỉ',
    };
    setCertificates([...certificates, item]);
    setNewCertTitle('');
    setNewCertOrg('');
    setShowCertModal(false);
  };

  // Xóa chứng chỉ
  const handleDeleteCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  // Lưu hồ sơ vào Database
  const handleSave = async () => {
    if (!hoTen.trim()) {
      setPopup({
        visible: true,
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập họ và tên của bạn.',
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('ho_ten', hoTen.trim());
      formData.append('so_dien_thoai', soDienThoai.trim());
      formData.append('mo_ta', moTa.trim());
      formData.append('chuyen_mon', JSON.stringify(specialties));
      formData.append('chung_chi', JSON.stringify(certificates));

      if (newAvatarAsset?.uri) {
        const ext = newAvatarAsset.type?.includes('png') ? 'png' : 'jpg';
        const fileName = newAvatarAsset.fileName || `trainer_${Date.now()}.${ext}`;
        const fileType = newAvatarAsset.type || 'image/jpeg';

        formData.append('avatar', {
          uri: Platform.OS === 'android' ? newAvatarAsset.uri : newAvatarAsset.uri.replace('file://', ''),
          name: fileName,
          type: fileType,
        } as any);
      }

      const res = await apiFitlife.post('/trainer/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.status) {
        setPopup({
          visible: true,
          type: 'success',
          title: 'Thành công!',
          message: 'Thông tin hồ sơ huấn luyện viên đã được lưu thành công vào hệ thống.',
          onConfirm: () => navigation?.goBack?.(),
        });
      }
    } catch (error: any) {
      console.log('Lỗi cập nhật hồ sơ:', error);
      setPopup({
        visible: true,
        type: 'error',
        title: 'Lỗi cập nhật',
        message: error.response?.data?.message || 'Không thể lưu hồ sơ, vui lòng thử lại.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="close" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={styles.headerSpace} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin hồ sơ...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* 1. ẢNH ĐẠI DIỆN */}
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: !avatarError && avatar && (avatar.startsWith('http') || avatar.startsWith('file://')) ? avatar : DEFAULT_AVATAR }}
              onError={() => setAvatarError(true)}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8} onPress={handlePickAvatar}>
              <Ionicons name="camera" size={17} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Chạm vào biểu tượng máy ảnh để đổi avatar</Text>

          {/* 2. THÔNG TIN CÁ NHÂN */}
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          {/* Họ và tên */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              <TextInput
                style={styles.input}
                value={hoTen}
                onChangeText={setHoTen}
                placeholder="Nhập họ và tên..."
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          {/* Email (Readonly) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.labelBadge}>Tài khoản đăng nhập</Text>
            </View>
            <View style={[styles.inputRow, styles.inputRowDisabled]}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textLight} />
              <TextInput
                style={[styles.input, { color: COLORS.textMuted }]}
                value={email}
                editable={false}
              />
              <Ionicons name="lock-closed" size={16} color={COLORS.textLight} />
            </View>
          </View>

          {/* Số điện thoại */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              <TextInput
                style={styles.input}
                value={soDienThoai}
                onChangeText={setSoDienThoai}
                placeholder="Nhập số điện thoại..."
                placeholderTextColor={COLORS.textLight}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Cơ sở làm việc (Readonly) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Cơ sở làm việc</Text>
              <Text style={styles.labelBadge}>Do hệ thống phân công</Text>
            </View>
            <View style={[styles.inputRow, styles.inputRowDisabled]}>
              <Ionicons name="location-outline" size={18} color={COLORS.textLight} />
              <TextInput
                style={[styles.input, { color: COLORS.textMuted }]}
                value={coSo}
                editable={false}
              />
              <Ionicons name="business-outline" size={16} color={COLORS.textLight} />
            </View>
          </View>

          {/* Giới thiệu bản thân */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới thiệu bản thân</Text>
            <TextInput
              style={styles.bio}
              multiline
              textAlignVertical="top"
              value={moTa}
              onChangeText={setMoTa}
              placeholder="Nhập thông tin giới thiệu, kinh nghiệm của bạn..."
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* 3. CHUYÊN MÔN */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleNoMargin}>Chuyên môn giảng dạy</Text>
            <Text style={styles.sectionSubtitle}>Chọn các thế mạnh của bạn</Text>
          </View>
          <View style={styles.chipWrap}>
            {ALL_SPECIALTIES.map((item) => {
              const active = specialties.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.8}
                  onPress={() => toggleSpecialty(item)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  {active && <Ionicons name="checkmark" size={14} color={COLORS.white} style={{ marginRight: 4 }} />}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 4. CHỨNG CHỈ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleNoMargin}>Chứng chỉ & Bằng cấp</Text>
            <Text style={styles.sectionSubtitle}>{certificates.length} chứng chỉ</Text>
          </View>
          <View style={styles.card}>
            {certificates.map((item, index) => (
              <View
                key={`${item.title}_${index}`}
                style={[styles.certRow, index < certificates.length - 1 && styles.rowBorder]}
              >
                <View style={styles.certIconWrap}>
                  <Ionicons name="ribbon-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.certTitle}>{item.title}</Text>
                  <Text style={styles.certOrg}>{item.org}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteCertificate(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.certDeleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.accentRed} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addCert}
              activeOpacity={0.7}
              onPress={() => setShowCertModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addCertText}>Thêm chứng chỉ mới</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* FOOTER */}
      {!loading && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.saveText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL THÊM CHỨNG CHỈ */}
      <Modal
        visible={showCertModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCertModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCertModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="ribbon" size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Thêm chứng chỉ mới</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCertModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.modalInputLabel}>Tên chứng chỉ / Bằng cấp</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: NASM Certified Personal Trainer"
                placeholderTextColor={COLORS.textLight}
                value={newCertTitle}
                onChangeText={setNewCertTitle}
              />

              <Text style={[styles.modalInputLabel, { marginTop: 12 }]}>Đơn vị cấp / Năm cấp</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: NASM • 2023"
                placeholderTextColor={COLORS.textLight}
                value={newCertOrg}
                onChangeText={setNewCertOrg}
              />
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCertModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddCertificate}
              >
                <Text style={styles.modalSubmitText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* CUSTOM POPUP THÔNG BÁO (SUCCESS / ERROR) */}
      <Modal
        visible={popup.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPopup((p) => ({ ...p, visible: false }))}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View
              style={[
                styles.popupIconCircle,
                popup.type === 'success' && { backgroundColor: '#ECFDF5' },
                popup.type === 'warning' && { backgroundColor: '#FFFBEB' },
                popup.type === 'error' && { backgroundColor: '#FEF2F2' },
              ]}
            >
              <Ionicons
                name={
                  popup.type === 'success'
                    ? 'checkmark-circle'
                    : popup.type === 'warning'
                    ? 'alert-circle'
                    : 'close-circle'
                }
                size={38}
                color={
                  popup.type === 'success'
                    ? '#10B981'
                    : popup.type === 'warning'
                    ? '#F59E0B'
                    : '#EF4444'
                }
              />
            </View>

            <Text style={styles.popupTitle}>{popup.title}</Text>
            <Text style={styles.popupMessage}>{popup.message}</Text>

            <TouchableOpacity
              style={styles.popupBtn}
              activeOpacity={0.8}
              onPress={() => {
                setPopup((p) => ({ ...p, visible: false }));
                popup.onConfirm?.();
              }}
            >
              <Text style={styles.popupBtnText}>HOÀN TẤT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EditTrainerProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SOFT_SHADOW,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSpace: {
    width: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: 14,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  avatarHint: {
    textAlign: 'center',
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleNoMargin: {
    fontSize: 16.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 4,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
    marginLeft: 4,
  },
  labelBadge: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    ...SOFT_SHADOW,
  },
  inputRowDisabled: {
    backgroundColor: '#F8FAFB',
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  bio: {
    minHeight: 100,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    ...SOFT_SHADOW,
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    ...SOFT_SHADOW,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    ...SOFT_SHADOW,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  certIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  certTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  certOrg: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  certDeleteBtn: {
    padding: 6,
  },
  addCert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  addCertText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  // MODAL CHỨNG CHỈ
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modalSubmitBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // POPUP
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  popupCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  popupIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  popupMessage: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  popupBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
