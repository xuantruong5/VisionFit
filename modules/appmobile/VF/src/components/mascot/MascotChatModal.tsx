import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MascotSpecies, MascotStage, ChatMessage } from './types';
import { getMascotImage } from './mascotImages';
import { getAIResponse } from './mascotChatService';
import { MascotSelectorModal } from './MascotSelectorModal';
import { MascotVectorRig } from './MascotVectorRig';
import { triggerMascotState } from './mascotEvents';
import { COLORS, SHADOWS } from '../../general/theme';

interface MascotChatModalProps {
  visible: boolean;
  currentSpecies: MascotSpecies;
  currentStage?: MascotStage;
  onClose: () => void;
  onSpeciesChange: (species: MascotSpecies) => void;
  onStageChange?: (stage: MascotStage) => void;
}

const QUICK_SUGGESTIONS = [
  { label: '📅 Lịch tập hôm nay', query: 'Lịch tập hôm nay của tôi' },
  { label: '💪 Gợi ý khởi động', query: 'Gợi ý bài tập khởi động chuẩn' },
  { label: '🥗 Thực đơn giảm mỡ', query: 'Gợi ý thực đơn ăn giảm mỡ Eat Clean' },
  { label: '🎟 Gói tập của tôi', query: 'Gói tập của tôi còn bao nhiêu buổi?' },
];

export const MascotChatModal: React.FC<MascotChatModalProps> = ({
  visible,
  currentSpecies,
  currentStage = 'starter',
  onClose,
  onSpeciesChange,
  onStageChange,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<any>(null);

  // Lắng nghe độ cao bàn phím ảo để đẩy ô chatbox lên trên mép bàn phím một khoảng an toàn
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const getWelcomeText = (species: MascotSpecies) => {
    if (species === 'cat') {
      return 'Meo meo! Chào bạn nha! Mình là Mèo VIF tinh nghịch 🐱. Hôm nay bạn muốn tìm hiểu về lịch tập, thực đơn ăn uống hay bắt đầu tập luyện?';
    }
    return 'Xin chào bạn! Mình là Gấu VIF khỏe khoắn 🐻, người bạn đồng hành của bạn tại VisionFit. Hôm nay bạn muốn mình hỗ trợ về lịch tập hay dinh dưỡng nào?';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: getWelcomeText(currentSpecies),
      time: 'Vừa xong',
    },
  ]);

  // Cập nhật câu chào khi đổi linh vật
  useEffect(() => {
    setMessages((prev) => {
      const hasUserMsg = prev.some((m) => m.sender === 'user');
      if (!hasUserMsg) {
        return [
          {
            id: 'welcome',
            sender: 'assistant',
            text: getWelcomeText(currentSpecies),
            time: 'Vừa xong',
          },
        ];
      }
      return prev;
    });
  }, [currentSpecies]);

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || inputText.trim();
    if (!textToSend || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputText('');
    setIsTyping(true);
    triggerMascotState('thinking');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const reply = await getAIResponse(textToSend, currentSpecies);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      triggerMascotState('speaking', 4000);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Có chút trục trặc khi kết nối, bạn thử hỏi lại mình nhé!',
        time: 'Vừa xong',
      };
      setMessages((prev) => [...prev, errorMsg]);
      triggerMascotState('error', 3500);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const headerMascotImg = getMascotImage(currentSpecies, currentStage);

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { bottom: keyboardHeight }]}>
      <View style={styles.modalContainer}>
        {/* HEADER CHATBOX */}
        <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.mascotAvatarBox}>
                  <MascotVectorRig
                    species={currentSpecies}
                    stage={currentStage}
                    state={isTyping ? 'thinking' : 'speaking'}
                    width={46}
                    height={54}
                  />
                  <View style={styles.onlineDot} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>
                    {currentSpecies === 'bear' ? 'Gấu VIF Assistant' : 'Mèo VIF Assistant'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {currentStage === 'champion' ? 'Cấp 4 (Quán quân 🏆)' : currentStage === 'strong' ? 'Cấp 3 (Mạnh mẽ 💪)' : currentStage === 'active' ? 'Cấp 2 (Năng động ⚡)' : 'Cấp 1 (Khởi đầu 🌱)'}
                  </Text>
                </View>
              </View>

              {/* ACTION BUTTONS: NÚT XEM CẤP ĐỘ & NÚT ĐÓNG */}
              <View style={styles.headerActions}>
                {/* NÚT HÌNH CON GẤU ĐỂ ĐỔI LINH VẬT & XEM CẤP ĐỘ */}
                <TouchableOpacity
                  style={styles.bearBtn}
                  onPress={() => setSelectorVisible(true)}
                  activeOpacity={0.8}
                  accessibilityLabel="Chọn linh vật và xem 4 cấp độ"
                >
                  <Image
                    source={require('../../assets/mascot/bear_starter.png')}
                    style={styles.bearBtnImg}
                    resizeMode="contain"
                  />
                  <Text style={styles.bearBtnText}>Cấp độ</Text>
                </TouchableOpacity>

                {/* NÚT ĐÓNG */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>
            </View>

            {/* DANH SÁCH TIN NHẮN */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      isUser ? styles.messageRowUser : styles.messageRowAi,
                    ]}
                  >
                    {!isUser && (
                      <Image
                        source={headerMascotImg}
                        style={styles.smallAvatar}
                        resizeMode="contain"
                      />
                    )}
                    <View
                      style={[
                        styles.bubble,
                        isUser ? styles.bubbleUser : styles.bubbleAi,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          isUser ? styles.bubbleTextUser : styles.bubbleTextAi,
                        ]}
                      >
                        {msg.text}
                      </Text>
                      <Text
                        style={[
                          styles.msgTime,
                          isUser ? styles.msgTimeUser : styles.msgTimeAi,
                        ]}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* HIỆU ỨNG ĐANG SUY NGHĨ */}
              {isTyping && (
                <View style={[styles.messageRow, styles.messageRowAi]}>
                  <Image
                    source={headerMascotImg}
                    style={styles.smallAvatar}
                    resizeMode="contain"
                  />
                  <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.typingText}>VIF đang suy nghĩ...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* GỢI Ý CÂU HỎI NHANH */}
            <View style={styles.suggestionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScroll}
              >
                {QUICK_SUGGESTIONS.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestPill}
                    onPress={() => handleSend(s.query)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestPillText}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* KHUNG NHẬP CÂU HỎI */}
            <View style={styles.composerContainer}>
              <TextInput
                style={styles.input}
                placeholder="Hỏi VIF điều bạn đang quan tâm..."
                placeholderTextColor={COLORS.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
                onSubmitEditing={() => handleSend()}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  !inputText.trim() && styles.sendBtnDisabled,
                ]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isTyping}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
        </View>

        {/* MODAL CHỌN LINH VẬT GẤU HOẶC MÈO & 4 CẤP ĐỘ */}
        <MascotSelectorModal
          visible={selectorVisible}
          currentSpecies={currentSpecies}
          onClose={() => setSelectorVisible(false)}
          onSelect={(newSpecies) => {
            onSpeciesChange(newSpecies);
          }}
          onStageChange={onStageChange}
        />
      </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    zIndex: 999999,
    elevation: 999999,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: Platform.OS === 'ios' ? 54 : 36,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F6',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mascotAvatarBox: {
    width: 44,
    height: 48,
    marginRight: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotAvatar: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4F6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D4E6EB',
    gap: 4,
  },
  bearBtnImg: {
    width: 22,
    height: 22,
  },
  bearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F5F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FCFB',
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  smallAvatar: {
    width: 30,
    height: 36,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E6EFF1',
    ...SHADOWS.small,
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAi: {
    color: COLORS.textDark,
  },
  msgTime: {
    fontSize: 9.5,
    marginTop: 4,
  },
  msgTimeUser: {
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'right',
  },
  msgTimeAi: {
    color: COLORS.textMuted,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F6',
  },
  suggestionsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  suggestPill: {
    backgroundColor: '#F0F7F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2EEF0',
  },
  suggestPillText: {
    fontSize: 11.5,
    color: COLORS.primary,
    fontWeight: '600',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 18 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF4F6',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F4F8F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2EEF0',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  sendBtnDisabled: {
    backgroundColor: '#B5CCD2',
    elevation: 0,
    shadowOpacity: 0,
  },
});

export default MascotChatModal;
