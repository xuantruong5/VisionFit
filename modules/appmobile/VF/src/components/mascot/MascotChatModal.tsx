import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Keyboard,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MascotSpecies, MascotStage, ChatMessage } from './types';
import { getMascotImage } from './mascotImages';
import { getAIResponse, clearAssistantCache } from './mascotChatService';
import { MascotSelectorModal } from './MascotSelectorModal';
import { MascotVectorRig } from './MascotVectorRig';
import {
  triggerMascotState,
  triggerWorkoutStart,
  triggerWaterReminderSetting,
} from './mascotEvents';
import { navigateToWorkoutPlan } from '../../general/rootNavigation';
import { notify } from '../../general/notification';
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
  { label: '🏋️ Tôi muốn tập luyện', query: 'Tôi muốn tập luyện' },
  { label: '📊 Chỉ số dinh dưỡng', query: 'Cho tôi biết chỉ số thể trạng và dinh dưỡng calo của tôi' },
  { label: '🥗 Thực đơn giảm mỡ', query: 'Gợi ý thực đơn ăn giảm mỡ Eat Clean' },
  { label: '📅 Lịch tập hôm nay', query: 'Lịch tập hôm nay của tôi' },
  { label: '💪 Gợi ý khởi động', query: 'Gợi ý bài tập khởi động chuẩn' },
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
  const inputRef = useRef<any>(null);
  const isShiftRef = useRef(false);
  const justSentRef = useRef(false);
  const isSendingRef = useRef(false);
  const lastTokenRef = useRef<string | null | undefined>(undefined);
  const justSentTimerRef = useRef<any>(null);

  const clearInput = () => {
    setInputText('');
    inputRef.current?.clear();
  };

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

  const createWelcomeMessage = (species: MascotSpecies): ChatMessage => ({
    id: 'welcome',
    sender: 'assistant',
    text: getWelcomeText(species),
    time: 'Vừa xong',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    createWelcomeMessage(currentSpecies),
  ]);

  // Nếu người dùng đăng xuất / đăng nhập / chuyển sang tài khoản khác, tự động xóa lịch sử chat và cache ngữ cảnh cũ
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    AsyncStorage.getItem('token')
      .then((token) => {
        if (!isMounted) return;
        if (lastTokenRef.current !== undefined && lastTokenRef.current !== token) {
          clearAssistantCache();
          setMessages([createWelcomeMessage(currentSpecies)]);
        }
        lastTokenRef.current = token;
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [visible, currentSpecies]);

  useEffect(() => {
    return () => {
      if (justSentTimerRef.current) {
        clearTimeout(justSentTimerRef.current);
      }
    };
  }, []);

  // Xử lý nút Back vật lý trên Android: đóng khung chat thay vì thoát/lùi màn hình bên dưới
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectorVisible) {
        setSelectorVisible(false);
        return true;
      }
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, selectorVisible, onClose]);

  // Cập nhật câu chào khi đổi linh vật (nếu chưa có tin nhắn người dùng)
  useEffect(() => {
    setMessages((prev) => {
      const hasUserMsg = prev.some((m) => m.sender === 'user');
      if (!hasUserMsg) {
        return [createWelcomeMessage(currentSpecies)];
      }
      return prev;
    });
  }, [currentSpecies]);

  const handleKeyPress = (e: any) => {
    const key = e.nativeEvent?.key;
    const isShift = Boolean(
      e.nativeEvent?.shiftKey ||
      (e.nativeEvent as any)?.modifiers?.includes?.('shift')
    );
    isShiftRef.current = isShift;

    if (key === 'Enter') {
      if (!isShift) {
        const query = inputText.trim();
        if (query && !isSendingRef.current) {
          justSentRef.current = true;
          if (justSentTimerRef.current) clearTimeout(justSentTimerRef.current);
          justSentTimerRef.current = setTimeout(() => {
            justSentRef.current = false;
          }, 80);
          clearInput();
          handleSend(query);
        }
      }
    }
  };

  const handleInputChange = (text: string) => {
    if (justSentRef.current) {
      justSentRef.current = false;
      clearInput();
      return;
    }

    const isSingleNewlineAdded =
      text.length === inputText.length + 1 &&
      (text.endsWith('\n') || text.endsWith('\r\n'));

    if (!isShiftRef.current && isSingleNewlineAdded) {
      const trimmed = text.replace(/[\r\n]+$/, '').trim();
      clearInput();
      if (trimmed && !isSendingRef.current) {
        handleSend(trimmed);
      }
      return;
    }

    if (text === '\n' || text === '\r\n') {
      clearInput();
      return;
    }

    setInputText(text);
    isShiftRef.current = false;
  };

  const handleSend = async (customQuery?: string) => {
    const textToSend = (customQuery ?? inputText).trim();
    if (!textToSend || isSendingRef.current || isTyping) return;

    isSendingRef.current = true;
    clearInput();

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: nowTime,
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    triggerMascotState('thinking');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await getAIResponse(textToSend, currentSpecies, historyPayload);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: res.intent,
        action: res.action || null,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Biểu cảm linh vật theo ngữ cảnh phân tích từ AI
      const emotion = res.emotion || 'explaining';
      if (emotion === 'encouraging' || emotion === 'celebrating') {
        triggerMascotState('celebrating', 4500);
      } else if (emotion === 'caring' || emotion === 'apologetic') {
        triggerMascotState('error', 3500);
      } else {
        triggerMascotState('speaking', 4000);
      }

      // Nhắc nhở uống nước: Bật / tắt thật sự timer trong FloatingMascotWidget
      if (res.action?.type === 'SET_WATER_REMINDER') {
        const isEnabled =
          res.action.params?.enabled !== false &&
          (res.action as any).enabled !== false;
        const intervalHours =
          Number(res.action.params?.interval_hours || (res.action as any).interval_hours) || 2;

        triggerWaterReminderSetting(isEnabled, intervalHours);
        notify({
          type: isEnabled ? 'success' : 'info',
          message: isEnabled
            ? `💧 Đã bật nhắc uống nước mỗi ${intervalHours} tiếng một lần!`
            : '🔕 Đã tắt tính năng nhắc uống nước.',
        });
        triggerMascotState('speaking', 3500);
      }
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
      isSendingRef.current = false;
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const headerMascotImg = getMascotImage(currentSpecies, currentStage);

  // Render đoạn text hỗ trợ in đậm **bold** nội tuyến
  const renderInlineBoldText = (text: string, baseStyle: any) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Text style={baseStyle}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return (
              <Text key={idx} style={{ fontWeight: '700', color: COLORS.textDark }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <React.Fragment key={idx}>{part}</React.Fragment>;
        })}
      </Text>
    );
  };

  // Tính độ rộng đồng nhất cho từng cột của bảng Markdown để mọi dòng thẳng tắp với tiêu đề
  const computeColumnWidths = (headers: string[], rows: string[][]): number[] => {
    const colCount = headers.length;
    const widths = Array.from({ length: colCount }, (_, colIdx) => {
      const headerLen = (headers[colIdx] || '').length;
      const maxCellLen = rows.reduce((max, row) => {
        const clean = (row[colIdx] || '').replace(/\*\*/g, '');
        return Math.max(max, clean.length);
      }, 0);
      const longest = Math.max(headerLen, maxCellLen);

      const headerLower = (headers[colIdx] || '').toLowerCase();
      if (colIdx === 0 && (headerLower === 'stt' || headerLower === '#')) {
        return 46;
      }
      if (colIdx === 0 && (headerLower.includes('bữa') || headerLower === 'bua')) {
        return Math.max(70, Math.min(92, longest * 8 + 24));
      }
      // Ước lượng hợp lý theo độ dài ký tự, giữ gọn gàng trên màn hình mobile
      const estimated = Math.round(longest * 7.2 + 24);
      const minW = colIdx === 0 ? 74 : 78;
      const maxW = colCount <= 3 ? 165 : 155;
      return Math.max(minW, Math.min(maxW, estimated));
    });

    // Nếu bảng ít cột (2 cột) hẹp hơn 240px -> phóng tỷ lệ nhẹ để vừa vặn khung, không dư khoảng trắng
    const sum = widths.reduce((a, b) => a + b, 0);
    if (sum > 0 && sum < 240) {
      const ratio = 240 / sum;
      return widths.map((w) => Math.round(w * ratio));
    }
    return widths;
  };

  const renderFormattedAiMessage = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    const isPipeRow = (l: string) => {
      const t = l.trim();
      return t.includes('|') && (t.startsWith('|') || t.endsWith('|') || t.split('|').length >= 3);
    };
    const isSepRow = (l: string) => {
      const t = l.trim();
      return t.includes('|') && /^\|?[\s:\-+|]+\|?$/.test(t) && t.includes('-');
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Kiểm tra Bảng Markdown
      if (isPipeRow(trimmed)) {
        let sepIdx = -1;
        for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
          if (!lines[j].trim()) continue;
          if (isSepRow(lines[j].trim())) {
            sepIdx = j;
            break;
          }
          break;
        }

        if (sepIdx !== -1) {
          const rawHeader = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
          const cleanHeader = rawHeader.endsWith('|') ? rawHeader.slice(0, -1) : rawHeader;
          const headers = cleanHeader.split('|').map((c) => c.trim().replace(/\*\*/g, ''));

          i = sepIdx + 1;
          const rows: string[][] = [];
          while (i < lines.length) {
            const rowTrim = lines[i].trim();
            if (!rowTrim) {
              i++;
              continue;
            }
            if (isPipeRow(rowTrim) && !isSepRow(rowTrim)) {
              const rawRow = rowTrim.startsWith('|') ? rowTrim.slice(1) : rowTrim;
              const cleanRow = rawRow.endsWith('|') ? rawRow.slice(0, -1) : rawRow;
              const rawCells = cleanRow.split('|').map((c) => c.trim());
              // Chuẩn hóa số cột của từng dòng khớp chính xác với headers
              const normalizedCells = Array.from({ length: headers.length }, (_, idx) => rawCells[idx] ?? '—');
              rows.push(normalizedCells);
              i++;
            } else {
              break;
            }
          }

          const colWidths = computeColumnWidths(headers, rows);
          const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);

          elements.push(
            <View key={`tbl-${i}`} style={styles.tableWrapper}>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.tableScrollContent}
              >
                <View style={[styles.tableBox, { width: totalWidth }]}>
                  <View style={styles.tableHeaderRow}>
                    {headers.map((h, hIdx) => (
                      <View
                        key={`th-${hIdx}`}
                        style={[
                          styles.tableThCell,
                          { width: colWidths[hIdx] },
                          hIdx === headers.length - 1 && styles.tableLastCol,
                        ]}
                      >
                        <Text style={styles.tableThText} numberOfLines={2}>
                          {h}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {rows.map((row, rIdx) => (
                    <View
                      key={`tr-${rIdx}`}
                      style={[
                        styles.tableTrRow,
                        rIdx % 2 === 1 && styles.tableTrEven,
                        rIdx === rows.length - 1 && styles.tableLastRow,
                      ]}
                    >
                      {row.map((cell, cIdx) => {
                        const cleanCell = cell.replace(/\*\*/g, '');
                        const isNumericCell = /^(\d+([.,]\d+)?\s*(kcal|g|kg|cm|buổi|hiệp|reps)?|—)$/i.test(cleanCell);
                        return (
                          <View
                            key={`td-${cIdx}`}
                            style={[
                              styles.tableTdCell,
                              { width: colWidths[cIdx] },
                              cIdx === headers.length - 1 && styles.tableLastCol,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tableTdText,
                                cIdx === 0 && styles.tableTdFirstText,
                                isNumericCell && styles.tableTdNumText,
                              ]}
                            >
                              {cleanCell}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          );
          continue;
        }
      }

      // 1. Phân cách ngang: '---', '***'
      if (/^[-*_]{3,}$/.test(trimmed)) {
        elements.push(<View key={`div-${i}`} style={styles.dividerLine} />);
        i++;
        continue;
      }

      // 2. Tiêu đề Markdown: '# ', '## ', '### '
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const cleanText = headingMatch[2].replace(/\*\*/g, '');
        elements.push(
          <View key={`h-${i}`} style={styles.headingBadge}>
            <Text style={styles.headingBadgeText}>- {cleanText}</Text>
          </View>
        );
        i++;
        continue;
      }

      // 3. Tiêu đề đóng khung dạng 【 TIÊU ĐỀ 】
      if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
        elements.push(
          <View key={`badge-${i}`} style={styles.headingBadge}>
            <Text style={styles.headingBadgeText}>{trimmed}</Text>
          </View>
        );
        i++;
        continue;
      }

      // 3.5. Hình ảnh Markdown: ![alt](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
      if (imgMatch) {
        const altText = imgMatch[1];
        const imgUrl = imgMatch[2];
        elements.push(
          <View key={`img-${i}`} style={styles.imageWrapper}>
            <Image
              source={{ uri: imgUrl }}
              style={styles.chatInlineImage}
              resizeMode="cover"
            />
            {altText ? <Text style={styles.chatImageCaption}>{altText}</Text> : null}
          </View>
        );
        i++;
        continue;
      }

      // 4. Dòng thông thường (hỗ trợ **in đậm** inline)
      if (!trimmed) {
        elements.push(<View key={`sp-${i}`} style={{ height: 4 }} />);
      } else {
        elements.push(
          <View key={`txt-${i}`}>
            {renderInlineBoldText(line, [styles.bubbleText, styles.bubbleTextAi])}
          </View>
        );
      }
      i++;
    }

    return elements;
  };

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
                {currentStage === 'champion'
                  ? 'Cấp 4 (Quán quân 🏆)'
                  : currentStage === 'strong'
                  ? 'Cấp 3 (Mạnh mẽ 💪)'
                  : currentStage === 'active'
                  ? 'Cấp 2 (Năng động ⚡)'
                  : 'Cấp 1 (Khởi đầu 🌱)'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.bearBtn}
              onPress={() => setSelectorVisible(true)}
              activeOpacity={0.8}
              accessibilityLabel="Chọn linh vật và xem 4 cấp độ"
            >
              <Image
                source={
                  currentSpecies === 'cat'
                    ? require('../../assets/mascot/cat_starter.png')
                    : require('../../assets/mascot/bear_starter.png')
                }
                style={styles.bearBtnImg}
                resizeMode="contain"
              />
              <Text style={styles.bearBtnText}>Đổi Mascot</Text>
            </TouchableOpacity>

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
            const showWorkoutButton =
              !isUser &&
              msg.id !== 'welcome' &&
              (msg.action?.type === 'NAVIGATE_WORKOUT' || msg.intent === 'workout_navigation');

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
                  {isUser ? (
                    <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
                      {msg.text}
                    </Text>
                  ) : (
                    <>
                      {renderFormattedAiMessage(msg.text)}
                      {showWorkoutButton && (
                        <TouchableOpacity
                          style={styles.workoutActionBtn}
                          onPress={() => {
                            triggerWorkoutStart();
                            navigateToWorkoutPlan();
                            onClose();
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.workoutActionBtnText}>🏋️ Mở Kế hoạch tập ngay ➔</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
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
                disabled={isTyping}
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
            ref={inputRef}
            style={styles.input}
            placeholder="Hỏi VIF điều bạn đang quan tâm..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={handleInputChange}
            onKeyPress={handleKeyPress}
            blurOnSubmit={false}
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
              (!inputText.trim() || isTyping) && styles.sendBtnDisabled,
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
    maxWidth: '84%',
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
  headingBadge: {
    backgroundColor: '#EAF5F2',
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginVertical: 4,
  },
  headingBadgeText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subheadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 6,
    marginBottom: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E6EFF1',
    marginVertical: 6,
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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 26,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF4F6',
    gap: 10,
  },
  tableWrapper: {
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E8E4',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tableScrollContent: {
    flexGrow: 1,
  },
  tableBox: {
    alignSelf: 'flex-start',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1.5,
    borderBottomColor: '#0E6642',
  },
  tableThCell: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255, 255, 255, 0.25)',
  },
  tableThText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableTrRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E6EFF1',
    backgroundColor: '#FFFFFF',
  },
  tableTrEven: {
    backgroundColor: '#F8FCFA',
  },
  tableLastRow: {
    borderBottomWidth: 0,
  },
  tableLastCol: {
    borderRightWidth: 0,
  },
  tableTdCell: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#EDF3F1',
  },
  tableTdText: {
    color: COLORS.textDark,
    fontSize: 12,
    lineHeight: 16,
  },
  tableTdFirstText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  tableTdNumText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  workoutActionBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  imageWrapper: {
    marginVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    width: '100%',
  },
  chatInlineImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  chatImageCaption: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default MascotChatModal;
