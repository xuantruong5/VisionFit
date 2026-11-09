import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TRAINER_COLORS as COLORS, SOFT_SHADOW } from '../../general/theme';
import apiFitlife from '../../general/api';

const AddMember = ({ navigation }: any) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [trainerCode, setTrainerCode] = useState('PT000001');
  const [selected, setSelected] = useState('');
  const [pkg, setPkg] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
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

  const fetchCandidates = async (keyword = '') => {
    setLoading(true);
    try {
      const res = await apiFitlife.get('/trainer/candidates', { params: { search: keyword } });
      if (res.data?.success && res.data?.data) {
        const rawClients = res.data.data.clients || [];
        const rawPackages = res.data.data.goi_taps || [];
        setCandidates(rawClients);
        setPackages(rawPackages);
        if (res.data.data.trainer_code) {
          setTrainerCode(res.data.data.trainer_code);
        }
        if (rawClients.length > 0 && !selected) {
          setSelected(String(rawClients[0].id));
        }
        if (rawPackages.length > 0 && !pkg) {
          setPkg(String(rawPackages[0].id));
        }
      }
    } catch (error: any) {
      console.log('Lỗi lấy danh sách:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchCandidates(text);
  };

  const handleAddMember = async () => {
    if (!selected) {
      setPopup({
        visible: true,
        type: 'warning',
        title: 'Chưa chọn học viên',
        message: 'Vui lòng chọn 1 học viên từ danh sách trước khi thêm.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFitlife.post('/trainer/add-member', {
        id_hoi_vien: Number(selected),
        id_goi_tap: Number(pkg),
      });
      if (res.data?.status || res.data?.success) {
        setPopup({
          visible: true,
          type: 'success',
          title: 'Thành công!',
          message: res.data.message || 'Đã thêm học viên vào danh sách thành công!',
          onConfirm: () => navigation?.goBack?.(),
        });
      }
    } catch (error: any) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Không thể thêm học viên',
        message: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.roundBtn} activeOpacity={0.7} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="close" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm học viên</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* TÌM KIẾM */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc số điện thoại..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={handleSearch}
          />
        </View>

        {/* CHỌN HỘI VIÊN */}
        <Text style={styles.sectionTitle}>Hội viên trong hệ thống</Text>
        <View style={styles.card}>
          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={{ marginTop: 8, color: COLORS.textMuted, fontSize: 12 }}>Đang tải danh sách...</Text>
            </View>
          ) : candidates.length > 0 ? (
            candidates.map((item, index) => {
              const active = String(selected) === String(item.id);
              const avatar = item.anh_dai_dien || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => setSelected(String(item.id))}
                  style={[styles.memberRow, index < candidates.length - 1 && styles.rowBorder]}>
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                  <View style={styles.flex}>
                    <Text style={styles.memberName}>{item.ho_ten}</Text>
                    <Text style={styles.memberSub}>
                      {item.so_dien_thoai || 'Chưa có SĐT'} • {item.muc_tieu_hien_tai || 'Rèn luyện sức khỏe'}
                    </Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>Không tìm thấy hội viên phù hợp</Text>
            </View>
          )}
        </View>

        {/* CHỌN GÓI PT */}
        <Text style={styles.sectionTitle}>Gói huấn luyện</Text>
        {packages.map((item) => {
          const active = String(pkg) === String(item.id);
          const gia = item.gia ? Number(item.gia).toLocaleString('vi-VN') + ' ₫' : 'Miễn phí';
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => setPkg(String(item.id))}
              style={[styles.pkgCard, active && styles.pkgCardActive]}>
              <View style={styles.flex}>
                <Text style={styles.pkgName}>{item.ten_goi_tap}</Text>
                <Text style={styles.pkgNote}>{item.so_buoi_pt ? `${item.so_buoi_pt} buổi PT` : 'Gói tập'}</Text>
              </View>
              <Text style={styles.pkgPrice}>{gia}</Text>
            </TouchableOpacity>
          );
        })}

        {/* MỜI QUA MÃ */}
        <View style={styles.inviteCard}>
          <View style={styles.flex}>
            <Text style={styles.inviteTitle}>Hoặc gửi mã mời</Text>
            <Text style={styles.inviteSub}>Học viên nhập mã trong app để kết nối với bạn</Text>
          </View>
          <View style={styles.codePill}>
            <Text style={styles.codeText}>{trainerCode}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (!selected || submitting) && { opacity: 0.6 }]}
          activeOpacity={0.85}
          disabled={!selected || submitting}
          onPress={handleAddMember}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Thêm vào danh sách</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* POPUP THÔNG BÁO TÙY BIẾN */}
      <Modal
        visible={popup.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          const fn = popup.onConfirm;
          setPopup((prev) => ({ ...prev, visible: false }));
          if (fn) fn();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconBox,
                popup.type === 'success' && { backgroundColor: '#ECFDF5' },
                popup.type === 'warning' && { backgroundColor: '#FEF3C7' },
                popup.type === 'error' && { backgroundColor: '#FEE2E2' },
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
                size={40}
                color={
                  popup.type === 'success'
                    ? COLORS.accentGreen
                    : popup.type === 'warning'
                    ? '#D97706'
                    : '#EF4444'
                }
              />
            </View>
            <Text style={styles.modalTitle}>{popup.title}</Text>
            <Text style={styles.modalMessage}>{popup.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                popup.type === 'error' && { backgroundColor: '#EF4444' },
                popup.type === 'warning' && { backgroundColor: '#D97706' },
              ]}
              onPress={() => {
                const fn = popup.onConfirm;
                setPopup((prev) => ({ ...prev, visible: false }));
                if (fn) fn();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>
                {popup.type === 'success' ? 'HOÀN TẤT' : 'ĐỒNG Ý'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddMember;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
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
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    marginTop: 16,
    ...SOFT_SHADOW,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 14,
    ...SOFT_SHADOW,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  memberSub: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pkgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.transparent,
    ...SOFT_SHADOW,
  },
  pkgCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  pkgName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pkgNote: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  pkgPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24,
    padding: 16,
    marginTop: 14,
  },
  inviteTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inviteSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  codePill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.primaryDark,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  // POPUP MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 84, 104, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    ...SOFT_SHADOW,
  },
  modalIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.white,
  },
});
