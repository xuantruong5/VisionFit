import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MascotSpecies, MascotStage, MascotState, ALL_MASCOT_STATES } from './types';
import { getStoredSpecies, setStoredSpecies } from './mascotStorage';
import {
  getProgressionData,
  recordWorkoutSession,
  setMockProgression,
  STAGES_CONFIG,
  MascotProgressionData,
} from './mascotProgression';
import { getMascotImage } from './mascotImages';
import { MascotVectorRig } from './MascotVectorRig';
import { triggerMascotState, mascotEmitter, MASCOT_EVENTS } from './mascotEvents';
import { notificationEmitter } from '../../general/notification';
import { COLORS, SHADOWS } from '../../general/theme';

interface MascotSelectorModalProps {
  visible: boolean;
  currentSpecies: MascotSpecies;
  onClose: () => void;
  onSelect: (species: MascotSpecies) => void;
  onStageChange?: (stage: MascotStage) => void;
}

export const MascotSelectorModal: React.FC<MascotSelectorModalProps> = ({
  visible,
  currentSpecies,
  onClose,
  onSelect,
  onStageChange,
}) => {
  const [activeTab, setActiveTab] = useState<'selector' | 'evolution' | 'lab'>('selector');
  const [selected, setSelected] = useState<MascotSpecies>(currentSpecies);
  const [labState, setLabState] = useState<MascotState>('training');
  const [labStage, setLabStage] = useState<MascotStage>('starter');
  const [progression, setProgression] = useState<MascotProgressionData>({
    currentStage: 'starter',
    totalWorkoutDays: 0,
    lastWorkoutDate: null,
    daysInactive: 0,
    wasResetDueToInactivity: false,
  });

  const loadData = async () => {
    const [data, storedSpecies] = await Promise.all([
      getProgressionData(),
      getStoredSpecies(),
    ]);
    setProgression(data);
    if (storedSpecies) {
      setSelected(storedSpecies);
    }
    if (onStageChange) onStageChange(data.currentStage);
  };

  useEffect(() => {
    if (visible) {
      setSelected(currentSpecies);
      loadData();
    }
  }, [visible, currentSpecies]);

  const handleConfirm = async () => {
    await setStoredSpecies(selected);
    mascotEmitter.emit(MASCOT_EVENTS.SET_SPECIES, selected);
    onSelect(selected);
    onClose();
  };

  // Demo: Ghi nhận 1 ngày tập luyện
  const handleAddWorkoutDay = async () => {
    const updated = await recordWorkoutSession();
    setProgression(updated);
    if (onStageChange) onStageChange(updated.currentStage);
    Alert.alert(
      'Tuyệt vời! 🎉',
      `Đã ghi nhận ngày tập hôm nay. Tổng số ngày tập: ${updated.totalWorkoutDays} ngày. Cấp độ hiện tại: ${updated.currentStage.toUpperCase()}`
    );
  };

  // Demo: Mô phỏng nghỉ tập 7 ngày để kiểm tra điều kiện reset về Cấp 1
  const handleSimulateInactivity = async () => {
    const updated = await setMockProgression(0, 7);
    setProgression(updated);
    if (onStageChange) onStageChange(updated.currentStage);
    Alert.alert(
      'Cảnh báo Kỷ luật ⚠️',
      'Đã mô phỏng 7 ngày liên tiếp không tập luyện! Linh vật đã bị kiệt sức và tự động RESET về Cấp 1 (Starter).'
    );
  };

  // Demo: Mô phỏng đạt 30 ngày (Lên cấp 2) hoặc 60/90 ngày
  const handleFastForward = async (days: number) => {
    const updated = await setMockProgression(days, 0);
    setProgression(updated);
    if (onStageChange) onStageChange(updated.currentStage);
    Alert.alert(
      'Thăng Cấp Thành Công! 🚀',
      `Linh vật đã tích lũy ${days} ngày tập luyện và tiến hóa lên: ${updated.currentStage.toUpperCase()}!`
    );
  };

  // Tìm thông tin cấp độ hiện tại
  const currentStageIndex = STAGES_CONFIG.findIndex(
    (s) => s.stage === progression.currentStage
  );
  const currentStageInfo = STAGES_CONFIG[currentStageIndex] || STAGES_CONFIG[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.tag}>
                <Ionicons name="sparkles" size={12} color={COLORS.primary} />
                <Text style={styles.tagText}>LINH VẬT ĐỒNG HÀNH</Text>
              </View>
              <Text style={styles.title}>
                {activeTab === 'selector'
                  ? 'Chọn Linh Vật Của Bạn'
                  : activeTab === 'evolution'
                  ? '4 Cấp Độ Tiến Hóa'
                  : '🧪 Mascot Lab Studio'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {/* TAB SWITCHER */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'selector' && styles.tabItemActive]}
              onPress={() => setActiveTab('selector')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="paw"
                size={16}
                color={activeTab === 'selector' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === 'selector' && styles.tabItemTextActive,
                ]}
              >
                Linh Vật
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'evolution' && styles.tabItemActive]}
              onPress={() => setActiveTab('evolution')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="trophy"
                size={16}
                color={activeTab === 'evolution' ? '#D97706' : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === 'evolution' && styles.tabItemTextActive,
                ]}
              >
                Tiến Hóa
              </Text>
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>Cấp {currentStageIndex + 1}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'lab' && styles.tabItemActive]}
              onPress={() => setActiveTab('lab')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="flask"
                size={16}
                color={activeTab === 'lab' ? '#7C3AED' : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === 'lab' && [styles.tabItemTextActive, { color: '#7C3AED' }],
                ]}
              >
                Mascot Lab
              </Text>
              <View style={[styles.pillBadge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[styles.pillBadgeText, { color: '#7C3AED' }]}>9 States</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* NỘI DUNG TAB 1: CHỌN LINH VẬT */}
          {activeTab === 'selector' && (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* THẺ GẤU VIF */}
                <TouchableOpacity
                  style={[
                    styles.mascotCard,
                    selected === 'bear' && styles.mascotCardSelected,
                  ]}
                  onPress={() => setSelected('bear')}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.avatarWrap}>
                      <Image
                        source={getMascotImage('bear', progression.currentStage)}
                        style={styles.cardMascotImg}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.mascotName}>Gấu VIF</Text>
                        {selected === 'bear' && (
                          <View style={styles.badgeSelected}>
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.badgeText}>Đang chọn</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.tagline}>Khỏe khoắn · Vui vẻ · Bền bỉ</Text>
                      <Text style={styles.desc}>
                        Đại diện cho sức mạnh và sự kiên trì. Luôn cổ vũ bạn hoàn
                        thành từng set tập nặng nhất!
                      </Text>
                      <Text style={styles.currentLevelText}>
                        Đang ở: {currentStageInfo.name}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* THẺ MÈO VIF */}
                <TouchableOpacity
                  style={[
                    styles.mascotCard,
                    selected === 'cat' && styles.mascotCardSelected,
                  ]}
                  onPress={() => setSelected('cat')}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.avatarWrap}>
                      <Image
                        source={getMascotImage('cat', progression.currentStage)}
                        style={styles.cardMascotImg}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.mascotName}>Mèo VIF</Text>
                        {selected === 'cat' && (
                          <View style={styles.badgeSelected}>
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.badgeText}>Đang chọn</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.tagline}>Nhanh nhẹn · Tinh nghịch · Linh hoạt</Text>
                      <Text style={styles.desc}>
                        Tượng trưng cho sự linh hoạt và phản xạ nhanh. Giúp các buổi
                        cardio và yoga thêm hào hứng!
                      </Text>
                      <Text style={styles.currentLevelText}>
                        Đang ở: {currentStageInfo.name}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Gợi ý chuyển sang tab cấp độ */}
                <TouchableOpacity
                  style={styles.viewStagesBanner}
                  onPress={() => setActiveTab('evolution')}
                  activeOpacity={0.85}
                >
                  <View style={styles.bannerIconBox}>
                    <Ionicons name="flame" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.bannerTextBox}>
                    <Text style={styles.bannerTitle}>Hành trình 4 Cấp Độ</Text>
                    <Text style={styles.bannerSubtitle}>
                      Tập 1 tháng lên 1 cấp · Nghỉ 1 tuần reset về Cấp 1!
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </ScrollView>

              {/* FOOTER */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnSecondaryText}>Giữ nguyên</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}>Xác nhận đồng hành</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* NỘI DUNG TAB 2: 4 CẤP ĐỘ TIẾN HÓA & ĐIỀU KIỆN */}
          {activeTab === 'evolution' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* KHUNG QUY TẮC KỶ LUẬT THÉP */}
              <View style={styles.rulesBox}>
                <View style={styles.rulesHeader}>
                  <Ionicons name="shield-checkmark" size={18} color="#D97706" />
                  <Text style={styles.rulesTitle}>LUẬT TIẾN HÓA & KỶ LUẬT THỂ LỰC</Text>
                </View>

                <View style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>1</Text>
                  </View>
                  <Text style={styles.ruleItemText}>
                    <Text style={styles.ruleBold}>Điều kiện lên cấp:</Text> Duy trì tập
                    luyện đều đặn <Text style={styles.ruleHighlight}>1 tháng (30 ngày)</Text> để
                    thăng tiến lên cấp tiếp theo.
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <View style={[styles.ruleBullet, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.ruleBulletText}>!</Text>
                  </View>
                  <Text style={styles.ruleItemText}>
                    <Text style={[styles.ruleBold, { color: '#EF4444' }]}>
                      Kỷ luật 1 tuần:
                    </Text>{' '}
                    Nếu bạn <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>nghỉ tập liên tiếp 7 ngày (1 tuần)</Text>,
                    linh vật sẽ bị kiệt sức và <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>TỰ ĐỘNG RESET VỀ CẤP 1</Text>!
                  </Text>
                </View>

                {/* Trạng thái hiện tại của người dùng */}
                <View style={styles.statusRow}>
                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Tổng ngày tập</Text>
                    <Text style={styles.statusValue}>{progression.totalWorkoutDays} ngày</Text>
                  </View>
                  <View style={styles.statusDivider} />
                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Cấp độ hiện tại</Text>
                    <Text style={[styles.statusValue, { color: currentStageInfo.color }]}>
                      Cấp {currentStageIndex + 1} ({progression.currentStage})
                    </Text>
                  </View>
                  <View style={styles.statusDivider} />
                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Nghỉ tập</Text>
                    <Text
                      style={[
                        styles.statusValue,
                        progression.daysInactive >= 5 ? { color: '#EF4444' } : { color: '#10B981' },
                      ]}
                    >
                      {progression.daysInactive}/7 ngày
                    </Text>
                  </View>
                </View>

                {progression.daysInactive > 0 && progression.daysInactive < 7 && (
                  <View style={styles.warningStrip}>
                    <Ionicons name="warning-outline" size={14} color="#D97706" />
                    <Text style={styles.warningStripText}>
                      Đã nghỉ {progression.daysInactive} ngày. Hãy tập trước khi chạm mốc 7 ngày nhé!
                    </Text>
                  </View>
                )}
              </View>

              {/* LỘ TRÌNH 4 CẤP ĐỘ */}
              <Text style={styles.sectionHeaderTitle}>
                Hành Trình 4 Cấp Độ Của {selected === 'bear' ? 'Gấu VIF' : 'Mèo VIF'}
              </Text>

              {STAGES_CONFIG.map((item, idx) => {
                const isCurrent = progression.currentStage === item.stage;
                const isUnlocked = currentStageIndex >= idx;
                const mascotImg = getMascotImage(selected, item.stage);

                return (
                  <View
                    key={item.stage}
                    style={[
                      styles.evolutionCard,
                      isCurrent && styles.evolutionCardCurrent,
                    ]}
                  >
                    <View style={styles.evoImageWrap}>
                      <Image
                        source={mascotImg}
                        style={styles.evoMascotImg}
                        resizeMode="contain"
                      />
                      {!isUnlocked && (
                        <View style={styles.lockOverlay}>
                          <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>

                    <View style={styles.evoInfo}>
                      <View style={styles.evoTitleRow}>
                        <View>
                          <Text style={styles.evoLevelName}>{item.name}</Text>
                          <Text style={styles.evoTitle}>{item.title}</Text>
                        </View>
                        {isCurrent ? (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Đang ở cấp này</Text>
                          </View>
                        ) : isUnlocked ? (
                          <View style={styles.unlockedBadge}>
                            <Ionicons name="checkmark" size={12} color="#10B981" />
                            <Text style={styles.unlockedBadgeText}>Đã mở khóa</Text>
                          </View>
                        ) : (
                          <View style={styles.lockedBadge}>
                            <Ionicons name="lock-closed" size={11} color={COLORS.textMuted} />
                            <Text style={styles.lockedBadgeText}>Chưa mở</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.conditionTag}>
                        <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                        <Text style={styles.conditionTagText}>
                          Yêu cầu: {item.requiredMonths} ({item.requiredDays} ngày)
                        </Text>
                      </View>

                      <Text style={styles.evoDesc}>{item.desc}</Text>
                    </View>
                  </View>
                );
              })}

              {/* THANH CÔNG CỤ THỬ NGHIỆM / TEST NHANH */}
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>🧪 Trải Nghiệm Thử Cơ Chế Cấp Độ & Kỷ Luật:</Text>
                <View style={styles.demoBtnRow}>
                  <TouchableOpacity
                    style={styles.demoBtn}
                    onPress={handleAddWorkoutDay}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.demoBtnText}>+1 Ngày tập</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.demoBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => handleFastForward(30)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flash" size={14} color="#FFFFFF" />
                    <Text style={styles.demoBtnText}>Lên Cấp 2 (30 ngày)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.demoBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => handleFastForward(90)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trophy" size={14} color="#FFFFFF" />
                    <Text style={styles.demoBtnText}>Lên Cấp 4 (90 ngày)</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.demoBtn, { backgroundColor: '#0284C7', width: '100%' }]}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      notificationEmitter.emit('mascot_action', { action: 'water' });
                    }, 350);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="water" size={14} color="#FFFFFF" />
                  <Text style={styles.demoBtnText}>💧 Thử Nhắc Uống Nước Ngay (Demo 2h)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoDangerBtn}
                  onPress={handleSimulateInactivity}
                  activeOpacity={0.8}
                >
                  <Ionicons name="warning" size={14} color="#EF4444" />
                  <Text style={styles.demoDangerBtnText}>
                    Mô phỏng nghỉ 7 ngày $\rightarrow$ Thử Phạt Reset về Cấp 1
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* NỘI DUNG TAB 3: MASCOT LAB (PHÒNG THỬ NGHIỆM 9 TRẠNG THÁI) */}
          {activeTab === 'lab' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* KHUNG PREVIEW TRỰC TIẾP ANIMATION */}
              <View style={styles.labPreviewCard}>
                <View style={styles.labStatusBar}>
                  <View style={styles.labStatusItem}>
                    <Text style={styles.labStatusLabel}>Loài:</Text>
                    <Text style={styles.labStatusValue}>
                      {selected === 'bear' ? '🐻 Gấu VIF' : '🐱 Mèo VIF'}
                    </Text>
                  </View>
                  <View style={styles.labStatusItem}>
                    <Text style={styles.labStatusLabel}>Cấp:</Text>
                    <Text style={styles.labStatusValue}>{labStage}</Text>
                  </View>
                  <View style={styles.labStatusItem}>
                    <Text style={styles.labStatusLabel}>Trạng thái:</Text>
                    <Text style={[styles.labStatusValue, { color: COLORS.primary }]}>{labState}</Text>
                  </View>
                </View>

                {/* SVG VECTOR ANIMATION LỚN THEO THỜI GIAN THỰC */}
                <View style={styles.labMascotBox}>
                  <MascotVectorRig
                    species={selected}
                    stage={labStage}
                    state={labState}
                    width={170}
                    height={204}
                  />
                </View>

                {/* NÚT ÁP DỤNG RA LINH VẬT NGOÀI MÀN HÌNH CHÍNH */}
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => {
                    triggerMascotState(labState);
                    mascotEmitter.emit(MASCOT_EVENTS.SET_SPECIES, selected);
                    mascotEmitter.emit(MASCOT_EVENTS.SET_STAGE, labStage);
                    onSelect(selected);
                    if (onStageChange) onStageChange(labStage);
                    Alert.alert(
                      'Đã Áp Dụng! ✨',
                      `Linh vật ${selected === 'bear' ? 'Gấu' : 'Mèo'} (${labStage}) đã được chuyển sang trạng thái "${labState}" trên màn hình chính.`
                    );
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.applyBtnText}>Áp Dụng Ra Màn Hình Chính</Text>
                </TouchableOpacity>
              </View>

              {/* 1. CHỌN NHÂN VẬT */}
              <View style={styles.labSection}>
                <Text style={styles.labSectionTitle}>1. Chọn Nhân Vật (Species)</Text>
                <View style={styles.labRow}>
                  <TouchableOpacity
                    style={[styles.labChoiceBtn, selected === 'bear' && styles.labChoiceBtnActive]}
                    onPress={() => setSelected('bear')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.labChoiceBtnText}>🐻 Gấu VIF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.labChoiceBtn, selected === 'cat' && styles.labChoiceBtnActive]}
                    onPress={() => setSelected('cat')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.labChoiceBtnText}>🐱 Mèo VIF</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. CẤP TIẾN HÓA */}
              <View style={styles.labSection}>
                <Text style={styles.labSectionTitle}>2. Cấp Tiến Hóa (4 Stages)</Text>
                <View style={styles.labGrid4}>
                  {(['starter', 'active', 'strong', 'champion'] as MascotStage[]).map((stg) => (
                    <TouchableOpacity
                      key={stg}
                      style={[styles.labStageBtn, labStage === stg && styles.labStageBtnActive]}
                      onPress={() => setLabStage(stg)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.labStageBtnText, labStage === stg && styles.labStageBtnTextActive]}>
                        {stg.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. 9 TRẠNG THÁI CẢM XÚC TỪ MASCOT LAB */}
              <View style={styles.labSection}>
                <Text style={styles.labSectionTitle}>3. 9 Trạng Thái Cảm Xúc (Mascot Lab States)</Text>
                <View style={styles.labGrid2}>
                  {ALL_MASCOT_STATES.map((item) => {
                    const isCurrent = labState === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.labStateCard, isCurrent && styles.labStateCardActive]}
                        onPress={() => setLabState(item.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.labStateIcon}>{item.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.labStateKey, isCurrent && styles.labStateKeyActive]}>
                            {item.key}
                          </Text>
                          <Text style={styles.labStateDesc}>{item.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 4. TÍN HIỆU BUỔI TẬP (WORKOUT SIGNALS) */}
              <View style={styles.labSection}>
                <Text style={styles.labSectionTitle}>4. Tín Hiệu Buổi Tập (Workout Signals)</Text>
                <View style={styles.labScenarioCol}>
                  <TouchableOpacity
                    style={[styles.scenarioBtn, { backgroundColor: '#0F5468' }]}
                    onPress={() => setLabState('training')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="barbell" size={16} color="#FFFFFF" />
                    <Text style={styles.scenarioBtnText}>Bắt Đầu Buổi Tập (Training - Cử tạ)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scenarioBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => setLabState('stretching')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="pause" size={16} color="#FFFFFF" />
                    <Text style={styles.scenarioBtnText}>Tạm Dừng Buổi Tập (Stretching - Vươn vai)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scenarioBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => setLabState('celebrating')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trophy" size={16} color="#FFFFFF" />
                    <Text style={styles.scenarioBtnText}>Hoàn Thành Buổi Tập (Celebrating - Ăn mừng)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scenarioBtn, { backgroundColor: '#0284C7' }]}
                    onPress={() => setLabState('drinking')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="water" size={16} color="#FFFFFF" />
                    <Text style={styles.scenarioBtnText}>💧 Nhắc Uống Nước Định Kỳ (Drinking - 2h)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 5. KỊCH BẢN PHẢN HỒI API (SCENARIOS) */}
              <View style={styles.labSection}>
                <Text style={styles.labSectionTitle}>5. Kịch Bản Phản Hồi API (Scenarios)</Text>
                <View style={styles.labScenarioCol}>
                  <TouchableOpacity
                    style={[styles.scenarioBtn, { backgroundColor: '#6366F1' }]}
                    onPress={() => {
                      setLabState('thinking');
                      setTimeout(() => {
                        setLabState('speaking');
                      }, 2000);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                    <Text style={styles.scenarioBtnText}>Gửi Tin & Nhận Trả Lời (Thinking ➔ Speaking)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scenarioBtn, { backgroundColor: '#EF4444' }]}
                    onPress={() => setLabState('error')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.scenarioBtnText}>Mô Phỏng Lỗi Mạng (Error - Bối rối)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 16,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F5F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F6',
    gap: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: '#F5F9F9',
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: '#E4F2F4',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  tabItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  pillBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pillBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 12,
  },
  mascotCard: {
    backgroundColor: '#F8FCFB',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E6EFF1',
    padding: 16,
  },
  mascotCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9F8',
    ...SHADOWS.small,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 80,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardMascotImg: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  mascotName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  badgeSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  desc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  currentLevelText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 4,
  },
  viewStagesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400E',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#F0F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  btnPrimary: {
    flex: 1.8,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...SHADOWS.small,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  // STYLES CHO TAB 2 EVOLUTION
  rulesBox: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
    paddingBottom: 8,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleBulletText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ruleItemText: {
    flex: 1,
    fontSize: 11.5,
    color: COLORS.textDark,
    lineHeight: 17,
  },
  ruleBold: {
    fontWeight: 'bold',
  },
  ruleHighlight: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3E8D6',
    marginTop: 4,
  },
  statusBox: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  statusValue: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 2,
  },
  statusDivider: {
    width: 1,
    backgroundColor: '#EAE2D5',
  },
  warningStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  warningStripText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 6,
    marginBottom: 2,
  },
  evolutionCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FCFB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E6EFF1',
    padding: 12,
    alignItems: 'center',
  },
  evolutionCardCurrent: {
    backgroundColor: '#F0F9F8',
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...SHADOWS.small,
  },
  evoImageWrap: {
    width: 72,
    height: 84,
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evoMascotImg: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evoInfo: {
    flex: 1,
  },
  evoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  evoLevelName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  evoTitle: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  currentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  unlockedBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '600',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  lockedBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF5F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
    gap: 4,
  },
  conditionTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  evoDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  demoSection: {
    backgroundColor: '#F3F8FA',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  demoTitle: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  demoDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  demoDangerBtnText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
  },
  /* Mascot Lab Testing Studio Styles */
  labPreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...SHADOWS.card,
  },
  labStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  labStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  labStatusLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  labStatusValue: {
    fontSize: 11.5,
    color: COLORS.textDark,
    fontWeight: '800',
  },
  labMascotBox: {
    width: 180,
    height: 216,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    marginTop: 12,
    width: '100%',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  labSection: {
    marginBottom: 16,
  },
  labSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  labRow: {
    flexDirection: 'row',
    gap: 10,
  },
  labChoiceBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  labChoiceBtnActive: {
    backgroundColor: '#E6F4F1',
    borderColor: COLORS.primary,
  },
  labChoiceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  labGrid4: {
    flexDirection: 'row',
    gap: 6,
  },
  labStageBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  labStageBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  labStageBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  labStageBtnTextActive: {
    color: '#B45309',
    fontWeight: '900',
  },
  labGrid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labStateCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  labStateCardActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#168B67',
  },
  labStateIcon: {
    fontSize: 18,
  },
  labStateKey: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
  },
  labStateKeyActive: {
    color: '#0E6349',
    fontWeight: '900',
  },
  labStateDesc: {
    fontSize: 9.5,
    color: '#64748B',
    lineHeight: 12,
  },
  labScenarioCol: {
    gap: 8,
  },
  scenarioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  scenarioBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default MascotSelectorModal;
