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

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollBody}
              >
                {/* 1. Nơi tập luyện */}
                <Text style={styles.sectionTitle}>Nơi tập luyện</Text>
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
                <Text style={styles.sectionTitle}>Cơ bắp hoạt động</Text>
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
                <Text style={styles.sectionTitle}>Thiết bị sử dụng</Text>
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
                  <Text style={styles.btnApplyText}>HOÀN TẤT</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: 12,
    paddingBottom: 24,
  },
  dragHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#264653',
    marginTop: 14,
    marginBottom: 12,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 4,
  },
  locTag: {
    backgroundColor: '#E6F4F8',
  },
  locTagText: {
    color: '#2E7D9B',
  },
  muscleTag: {
    backgroundColor: '#E8F7EE',
  },
  muscleTagText: {
    color: '#2E7D5B',
  },
  equipTag: {
    backgroundColor: '#FEF3E7',
  },
  equipTagText: {
    color: '#B46C20',
  },
  tagSelected: {
    backgroundColor: '#0D7F8D',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  btnReset: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0D7F8D',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  btnResetText: {
    color: '#0D7F8D',
    fontSize: 15,
    fontWeight: '700',
  },
  btnApply: {
    flex: 1.5,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#00A896',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnApplyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
