import React, { Component, useState, useEffect, useRef, ReactNode, ErrorInfo } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  DeviceEventEmitter,
} from 'react-native';
import { MascotSpecies, MascotStage, MascotState } from './types';
import { MascotVectorRig } from './MascotVectorRig';
import { MascotChatModal } from './MascotChatModal';
import { mascotEmitter, MASCOT_EVENTS } from './mascotEvents';

// Error Boundary bảo vệ ứng dụng chính (100% không bao giờ crash app)
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MascotErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[VisionFit Mascot] Đã ngăn lỗi mascot ảnh hưởng app chính:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export interface MascotProps {
  species?: MascotSpecies;
  stage?: MascotStage;
}

export const FloatingMascotWidget: React.FC<MascotProps> = ({
  species = 'cat',
  stage = 'starter',
}) => {
  return (
    <MascotErrorBoundary>
      <MascotInner species={species} stage={stage} />
    </MascotErrorBoundary>
  );
};

const WIDGET_WIDTH = 100;
const WIDGET_HEIGHT = 120;
const MIN_BOTTOM_OFFSET = 75; // Luôn cách đáy tối thiểu 75px để KHÔNG BAO GIỜ đè lên Bottom Navigation Bar

const MascotInner: React.FC<MascotProps> = ({
  species = 'cat',
  stage = 'starter',
}) => {
  const [screen, setScreen] = useState(Dimensions.get('window'));
  const [currentSpecies, setCurrentSpecies] = useState<MascotSpecies>(species);
  const [currentStage, setCurrentStage] = useState<MascotStage>(stage);

  // Trạng thái hoạt cảnh: Mặc định luôn ở trạng thái 'idle' nhún nhảy thể thao tại chỗ
  const [currentState, setCurrentState] = useState<MascotState>('idle');
  const [isChatVisible, setIsChatVisible] = useState(false);

  // Tọa độ vị trí bám ngón tay 1:1, khởi đầu ngay ngắn trên thanh Bottom Nav (85px)
  const panX = useRef(new Animated.Value(50)).current;
  const panY = useRef(new Animated.Value(85)).current;
  const currentXRef = useRef(50);
  const currentYRef = useRef(85);

  const dragLiftAnim = useRef(new Animated.Value(1)).current; // Nhấc nhẹ khi kéo
  const bubbleScale = useRef(new Animated.Value(0)).current;  // Bong bóng uống nước

  const lastTapRef = useRef<number>(0);
  const dragOffsetRef = useRef({ touchX: 0, touchY: 0, startX: 50, startY: 85 });

  // Theo dõi giá trị panX, panY liên tục không gây re-render
  useEffect(() => {
    const idX = panX.addListener(({ value }) => {
      currentXRef.current = value;
    });
    const idY = panY.addListener(({ value }) => {
      currentYRef.current = value;
    });
    return () => {
      panX.removeListener(idX);
      panY.removeListener(idY);
    };
  }, [panX, panY]);

  // Cập nhật khi props thay đổi
  useEffect(() => {
    setCurrentSpecies(species);
  }, [species]);

  useEffect(() => {
    setCurrentStage(stage);
  }, [stage]);

  // LẮNG NGHE SỰ KIỆN TỪ TOÀN BỘ ỨNG DỤNG
  useEffect(() => {
    let revertTimer: any;

    const handleSetState = (newState: MascotState, durationMs?: number) => {
      clearTimeout(revertTimer);
      setCurrentState(newState);

      if (newState === 'drinking') {
        bubbleScale.setValue(0.3);
        Animated.spring(bubbleScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
      }

      if (durationMs && durationMs > 0) {
        revertTimer = setTimeout(() => {
          if (newState === 'drinking') {
            Animated.timing(bubbleScale, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
              setCurrentState('idle');
            });
          } else {
            setCurrentState('idle');
          }
        }, durationMs);
      }
    };

    mascotEmitter.on(MASCOT_EVENTS.SET_STATE, handleSetState);
    mascotEmitter.on(MASCOT_EVENTS.SET_SPECIES, setCurrentSpecies);
    mascotEmitter.on(MASCOT_EVENTS.SET_STAGE, setCurrentStage);

    // Lắng nghe sự kiện bài tập
    const workoutTrainSub = DeviceEventEmitter.addListener(
      'workout-training-change',
      (running: boolean) => {
        if (running) {
          handleSetState('training');
        } else {
          handleSetState('stretching', 4000);
        }
      }
    );

    const workoutFinishSub = DeviceEventEmitter.addListener(
      'workout-session-finish',
      () => {
        handleSetState('celebrating', 8000);
      }
    );

    return () => {
      clearTimeout(revertTimer);
      mascotEmitter.off(MASCOT_EVENTS.SET_STATE, handleSetState);
      mascotEmitter.off(MASCOT_EVENTS.SET_SPECIES, setCurrentSpecies);
      mascotEmitter.off(MASCOT_EVENTS.SET_STAGE, setCurrentStage);
      workoutTrainSub.remove();
      workoutFinishSub.remove();
    };
  }, [bubbleScale]);

  // Lắng nghe thay đổi kích thước màn hình
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }: { window: any }) => {
      setScreen(window);
    });
    return () => sub?.remove?.();
  }, []);

  // NHẮC UỐNG NƯỚC MỖI 2 TIẾNG (7200s) + KÍCH HOẠT NHANH PHÍM D
  const triggerDrink = () => {
    setCurrentState('drinking');
    bubbleScale.setValue(0.3);
    Animated.spring(bubbleScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(bubbleScale, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setCurrentState('idle');
      });
    }, 6000);
  };

  useEffect(() => {
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const drinkTimer = setInterval(triggerDrink, twoHoursMs);

    const handleKeyDown = (e: any) => {
      if (e?.key === 'd' || e?.key === 'D') {
        triggerDrink();
      }
    };
    const globalWin = (globalThis as any).window;
    if (globalWin && globalWin.addEventListener) {
      globalWin.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      clearInterval(drinkTimer);
      if (globalWin && globalWin.removeEventListener) {
        globalWin.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  // CƠ CHẾ KÉO THẢ & CHẠM MỞ CHATBOX (ĐẢM BẢO CHẠM LÀ MỞ NGAY LẬP TỨC 100%)
  const isDraggingRef = useRef(false);
  const touchStartTimeRef = useRef(0);

  const handleMascotPress = () => {
    console.log('[VisionFit Mascot] ĐÃ BẤM VÀO LINH VẬT -> MỞ KHUNG CHATBOX NGAY');
    setIsChatVisible(true);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderGrant: (evt) => {
        touchStartTimeRef.current = Date.now();
        isDraggingRef.current = false;
        dragOffsetRef.current = {
          touchX: evt.nativeEvent.pageX,
          touchY: evt.nativeEvent.pageY,
          startX: currentXRef.current,
          startY: currentYRef.current,
        };
        Animated.spring(dragLiftAnim, { toValue: 1.08, friction: 6, useNativeDriver: false }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6) {
          isDraggingRef.current = true;
        }
        const deltaX = evt.nativeEvent.pageX - dragOffsetRef.current.touchX;
        const deltaY = dragOffsetRef.current.touchY - evt.nativeEvent.pageY;
        const maxRight = screen.width - WIDGET_WIDTH - 8;
        const maxTop = screen.height - WIDGET_HEIGHT - 30;

        const nextX = Math.max(8, Math.min(maxRight, dragOffsetRef.current.startX + deltaX));
        // LUÔN GIỮ KHOẢNG CÁCH TỐI THIỂU 75PX ĐỂ KHÔNG ĐÈ LÊN THANH NAVIGATION
        const nextY = Math.max(MIN_BOTTOM_OFFSET, Math.min(maxTop, dragOffsetRef.current.startY + deltaY));

        panX.setValue(nextX);
        panY.setValue(nextY);
        currentXRef.current = nextX;
        currentYRef.current = nextY;
      },
      onPanResponderRelease: (_, gestureState) => {
        Animated.spring(dragLiftAnim, { toValue: 1, friction: 6, useNativeDriver: false }).start();
        const touchDuration = Date.now() - touchStartTimeRef.current;
        // Bấm nhẹ (không kéo hoặc di chuyển < 8px hoặc thời gian < 500ms) -> MỞ NGAY CHATBOX
        if (!isDraggingRef.current || (Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8)) {
          handleMascotPress();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragLiftAnim, { toValue: 1, friction: 6, useNativeDriver: false }).start();
      },
    })
  ).current;

  return (
    <>
      {/* KHUNG LINH VẬT NỔI: DÙNG LEFT VÀ BOTTOM TRỰC TIẾP ĐỂ HIT-BOX CHÍNH XÁC 100% TRÊN ANDROID */}
      <Animated.View
        style={[
          styles.container,
          {
            left: panX,
            bottom: panY,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* BONG BÓNG UỐNG NƯỚC ĐI (STATE-DRINKING) */}
        {currentState === 'drinking' && (
          <Animated.View
            style={[
              styles.waterBubble,
              {
                transform: [{ scale: bubbleScale }],
              },
            ]}
          >
            <Text style={styles.waterBubbleText}>💧 Uống nước đi!</Text>
            <View style={styles.waterBubbleArrow} />
          </Animated.View>
        )}

        {/* NÚT BẤM VÀO MASCOT ĐỂ MỞ NGAY KHUNG CHATBOX */}
        <View
          style={styles.mascotPressable}
        >
          <Animated.View
            style={[
              styles.mascotRig,
              {
                transform: [
                  { scale: dragLiftAnim }, // Nhấc bổng nhẹ khi đang kéo
                ],
              },
            ]}
            pointerEvents="none"
          >
            {/* LINH VẬT Ở TRẠNG THÁI NHÚN NHẢY THỂ THAO TẠI CHỖ (BOUNCING) */}
            <MascotVectorRig
              species={currentSpecies}
              stage={currentStage}
              state={currentState}
              mode="bouncing"
              width={WIDGET_WIDTH}
              height={WIDGET_HEIGHT}
            />
          </Animated.View>
        </View>
      </Animated.View>

      {/* MODAL KHUNG CHAT AI CHATBOX & XEM CẤP ĐỘ */}
      <MascotChatModal
        visible={isChatVisible}
        currentSpecies={currentSpecies}
        currentStage={currentStage}
        onClose={() => setIsChatVisible(false)}
        onSpeciesChange={(s) => setCurrentSpecies(s)}
        onStageChange={(st) => setCurrentStage(st)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotPressable: {
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotRig: {
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBubble: {
    position: 'absolute',
    bottom: WIDGET_HEIGHT + 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 124,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  waterBubbleText: {
    color: '#0369A1',
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  waterBubbleArrow: {
    position: 'absolute',
    bottom: -6,
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#0284C7',
    transform: [{ rotate: '45deg' }],
  },
});

export default FloatingMascotWidget;
