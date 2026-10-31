import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../../../general/theme';

interface ExerciseFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (selectedFilters: any) => void;
}

const LOCATIONS = ['Gym', 'Nhà', 'Ngoài trời'];

const MUSCLES = [
  'Cổ', 'Cơ delta trước', 'Cơ delta giữa', 'Cơ delta sau',
  'Ngực', 'Cơ tay trước', 'Cơ tay sau', 'Cẳng tay',
  'Cơ bụng', 'Cơ xiên', 'Lưng', 'Cơ lưng rộng', 'Cơ thang',
  'Cơ dựng cột sống', 'Cơ mông', 'Cơ đùi trước',
  'Hip adductor', 'Cơ đùi sau', 'Bắp chân', 'Kéo giãn',
];

const EQUIPMENTS = [
  'Với thiết bị', 'Không có thiết bị', 'Tạ đôi', 'Tạ chuông',
  'Bóng tạ Medicine Ball', 'Thanh tạ', 'Bóng tập stability',
  'Plyobox / bục nhảy', 'TRX', 'Dây', 'Xà đơn', 'Xà kép',
  'Con lăn tập bụng', 'Máy tập cardio', 'Dây nhảy', 'Ghế đa năng',
  'Máy Smith', 'Máy Hack', 'Máy kéo xà trợ lực',
];

const ExerciseFilterModal: React.FC<ExerciseFilterModalProps> = ({
  visible,
  onClose,
  onApply,
}) => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);

  const toggleSelection = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleReset = () => {
    setSelectedLocations([]);
    setSelectedMuscles([]);
    setSelectedEquipments([]);
  };

  const handleApply = () => {
    onApply({
      locations: selectedLocations,
      muscles: selectedMuscles,
      equipments: selectedEquipments,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Thanh kéo trên cùng */}
              <View style={styles.dragHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Bộ lọc bài tập</Text>
                <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
                  <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollBody}
              >
                {/* 1. Nơi tập luyện */}
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Nơi tập luyện</Text>
                </View>
                <View style={styles.tagWrap}>
                  {LOCATIONS.map((loc) => {
                    const isSelected = selectedLocations.includes(loc);
                    return (
                      <TouchableOpacity
                        key={loc}
                        activeOpacity={0.7}
                        style={[styles.tag, styles.locTag, isSelected && styles.tagSelected]}
                        onPress={() => toggleSelection(loc, selectedLocations, setSelectedLocations)}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            styles.locTagText,
                            isSelected && styles.tagTextSelected,
                          ]}
                        >
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Cơ bắp hoạt động */}
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Cơ bắp hoạt động</Text>
                </View>
                <View style={styles.tagWrap}>
                  {MUSCLES.map((muscle) => {
                    const isSelected = selectedMuscles.includes(muscle);
                    return (
                      <TouchableOpacity
                        key={muscle}
                        activeOpacity={0.7}
                        style={[styles.tag, styles.muscleTag, isSelected && styles.tagSelected]}
                        onPress={() => toggleSelection(muscle, selectedMuscles, setSelectedMuscles)}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            styles.muscleTagText,
                            isSelected && styles.tagTextSelected,
                          ]}
                        >
                          {muscle}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 3. Thiết bị sử dụng */}
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Thiết bị sử dụng</Text>
                </View>
                <View style={styles.tagWrap}>
                  {EQUIPMENTS.map((eq) => {
                    const isSelected = selectedEquipments.includes(eq);
                    return (
                      <TouchableOpacity
                        key={eq}
                        activeOpacity={0.7}
                        style={[styles.tag, styles.equipTag, isSelected && styles.tagSelected]}
                        onPress={() => toggleSelection(eq, selectedEquipments, setSelectedEquipments)}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            styles.equipTagText,
                            isSelected && styles.tagTextSelected,
                          ]}
                        >
                          {eq}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Nút hành động đáy */}
              <View style={styles.footerActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.btnReset}
                  onPress={handleReset}
                >
                  <Text style={styles.btnResetText}>BỎ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.btnApply}
                  onPress={handleApply}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnApplyGradient}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.btnApplyText}>HOÀN TẤT</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ExerciseFilterModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 30, 36, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 10,
    paddingBottom: 24,
  },
  dragHandle: {
    width: 44,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tintTeal: {
    backgroundColor: COLORS.surfaceTeal,
  },
  tintGreen: {
    backgroundColor: '#ECFDF5',
  },
  tintAmber: {
    backgroundColor: '#FFF7ED',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    height: 36,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  locTag: {
    backgroundColor: COLORS.white,
  },
  locTagText: {
    color: COLORS.textSecondary,
  },
  muscleTag: {
    backgroundColor: COLORS.white,
  },
  muscleTagText: {
    color: COLORS.textSecondary,
  },
  equipTag: {
    backgroundColor: COLORS.white,
  },
  equipTagText: {
    color: COLORS.textSecondary,
  },
  tagSelected: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 12,
  },
  btnReset: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  btnResetText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  btnApply: {
    flex: 1.5,
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnApplyGradient: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnApplyText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
