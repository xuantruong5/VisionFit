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
  LogBox,
} from 'react-native';

LogBox.ignoreLogs([
  "Style property 'bottom' is not supported",
  "Style property 'left' is not supported",
  "Attempting to run JS driven animation",
]);
import Svg, {
  G,
  Path,
  Circle,
  Ellipse,
  Polygon,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
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
const EDGE_PEEK_THRESHOLD = 18; // Khoảng cách <= 18px tới mép viền sẽ kích hoạt chế độ Núp mép màn hình

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

  // CHẾ ĐỘ NÚP MÉP MÀN HÌNH (EDGE PEEKING / DOCKED MODE)
  const [isPeeking, setIsPeeking] = useState(false);
  const [peekingSide, setPeekingSide] = useState<'left' | 'right' | null>(null);
  const isPeekingRef = useRef(false);
  const peekingSideRef = useRef<'left' | 'right' | null>(null);

  // Tọa độ vị trí bám ngón tay 1:1, khởi đầu ngay ngắn trên thanh Bottom Nav (85px)
  const panX = useRef(new Animated.Value(50)).current;
  const panY = useRef(new Animated.Value(85)).current;
  const currentXRef = useRef(50);
  const currentYRef = useRef(85);

  const dragLiftAnim = useRef(new Animated.Value(1)).current; // Nhấc nhẹ khi kéo
  const bubbleScale = useRef(new Animated.Value(0)).current;  // Bong bóng uống nước

  // Animation cho chế độ núp ló đầu (Tai khẽ động đậy & đầu nhún tò mò)
  const earTwitchAnim = useRef(new Animated.Value(0)).current;
  const headTiltAnim = useRef(new Animated.Value(0)).current;
  const dockSnapAnim = useRef(new Animated.Value(1)).current;

  const dragOffsetRef = useRef({
    touchX: 0,
    touchY: 0,
    startX: 50,
    startY: 85,
    wasPeeking: false,
    peekingSide: null as 'left' | 'right' | null,
  });

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

  // VÒNG LẶP HOẠT ẢNH CHO CHẾ ĐỘ NÚP LÓ ĐẦU (TAI KHẼ ĐỘNG ĐẬY TÒ MÒ & ĐẦU NGHIÊNG)
  useEffect(() => {
    if (!isPeeking) {
      earTwitchAnim.setValue(0);
      headTiltAnim.setValue(0);
      return;
    }

    // 1. Tai khẽ nhúc nhích tò mò theo chu kỳ
    const earTwitchLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(earTwitchAnim, { toValue: 1, duration: 110, useNativeDriver: false }),
        Animated.timing(earTwitchAnim, { toValue: -1, duration: 120, useNativeDriver: false }),
        Animated.timing(earTwitchAnim, { toValue: 1, duration: 110, useNativeDriver: false }),
        Animated.timing(earTwitchAnim, { toValue: 0, duration: 120, useNativeDriver: false }),
        Animated.delay(2200),
        Animated.timing(earTwitchAnim, { toValue: -1, duration: 90, useNativeDriver: false }),
        Animated.timing(earTwitchAnim, { toValue: 0, duration: 90, useNativeDriver: false }),
      ])
    );

    // 2. Đầu hơi nghiêng và nhô nhẹ nhìn lén vào trong màn hình
    const headTiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(headTiltAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(headTiltAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ])
    );

    earTwitchLoop.start();
    headTiltLoop.start();

    return () => {
      earTwitchLoop.stop();
      headTiltLoop.stop();
    };
  }, [isPeeking, earTwitchAnim, headTiltAnim]);

  // LẮNG NGHE SỰ KIỆN TỪ TOÀN BỘ ỨNG DỤNG
  useEffect(() => {
    let revertTimer: any;

    const handleSetState = (newState: MascotState, durationMs?: number) => {
      clearTimeout(revertTimer);
      setCurrentState(newState);

      if (newState === 'drinking') {
        bubbleScale.setValue(0.3);
        Animated.spring(bubbleScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: false }).start();
      }

      if (durationMs && durationMs > 0) {
        revertTimer = setTimeout(() => {
          if (newState === 'drinking') {
            Animated.timing(bubbleScale, { toValue: 0, duration: 250, useNativeDriver: false }).start(() => {
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
    Animated.spring(bubbleScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: false }).start();

    setTimeout(() => {
      Animated.timing(bubbleScale, { toValue: 0, duration: 250, useNativeDriver: false }).start(() => {
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

  // HÀM HÚT VÀO MÉP VIỀN (EDGE SNAPPING -> DOCKED PEEKING)
  const dockToEdge = (side: 'left' | 'right') => {
    setIsPeeking(true);
    setPeekingSide(side);
    isPeekingRef.current = true;
    peekingSideRef.current = side;

    // Nhô đúng nửa mặt và 2 bàn tay ra khỏi mép trái (-42%) hoặc mép phải (58%)
    const targetX = side === 'left' ? -WIDGET_WIDTH * 0.42 : screen.width - WIDGET_WIDTH * 0.58;

    Animated.parallel([
      Animated.spring(panX, {
        toValue: targetX,
        friction: 6.5,
        tension: 85,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(dockSnapAnim, { toValue: 1.15, duration: 120, useNativeDriver: false }),
        Animated.spring(dockSnapAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: false }),
      ]),
    ]).start();
  };

  // HÀM THOÁT CHẾ ĐỘ NÚP (UNDOCK -> BUNG TOÀN BỘ CƠ THỂ RA)
  const undockToNormal = (preferredSide?: 'left' | 'right') => {
    const side = preferredSide || peekingSideRef.current || 'left';
    setIsPeeking(false);
    setPeekingSide(null);
    isPeekingRef.current = false;
    peekingSideRef.current = null;

    const targetX = side === 'left' ? 24 : screen.width - WIDGET_WIDTH - 24;

    Animated.parallel([
      Animated.spring(panX, {
        toValue: targetX,
        friction: 6,
        tension: 75,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(dockSnapAnim, { toValue: 1.1, duration: 100, useNativeDriver: false }),
        Animated.spring(dockSnapAnim, { toValue: 1, friction: 6, useNativeDriver: false }),
      ]),
    ]).start();
  };

  // CƠ CHẾ KÉO THẢ & CHẠM MỞ CHATBOX
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
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: (evt) => {
        touchStartTimeRef.current = Date.now();
        isDraggingRef.current = false;
        dragOffsetRef.current = {
          touchX: evt.nativeEvent.pageX,
          touchY: evt.nativeEvent.pageY,
          startX: currentXRef.current,
          startY: currentYRef.current,
          wasPeeking: isPeekingRef.current,
          peekingSide: peekingSideRef.current,
        };
        Animated.spring(dragLiftAnim, { toValue: 1.08, friction: 6, useNativeDriver: false }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        const deltaX = evt.nativeEvent.pageX - dragOffsetRef.current.touchX;
        const deltaY = dragOffsetRef.current.touchY - evt.nativeEvent.pageY;

        if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
          isDraggingRef.current = true;
        }

        // THOÁT CHẾ ĐỘ NÚP: KHI KÉO RA NGOÀI >= 10PX VỀ PHÍA GIỮA MÀN HÌNH -> BUNG TOÀN BỘ CƠ THỂ
        if (isPeekingRef.current) {
          const pulledAway =
            (peekingSideRef.current === 'left' && deltaX >= 10) ||
            (peekingSideRef.current === 'right' && deltaX <= -10);

          if (pulledAway) {
            setIsPeeking(false);
            setPeekingSide(null);
            isPeekingRef.current = false;
            peekingSideRef.current = null;
          }
        }

        const minX = -WIDGET_WIDTH * 0.45;
        const maxX = screen.width - WIDGET_WIDTH * 0.55;
        const maxTop = screen.height - WIDGET_HEIGHT - 30;

        let nextX = dragOffsetRef.current.startX + deltaX;
        // Nếu vẫn đang giữ núp và chỉ di chuyển dọc theo viền
        if (isPeekingRef.current) {
          if (peekingSideRef.current === 'left' && deltaX < 10) {
            nextX = -WIDGET_WIDTH * 0.42;
          } else if (peekingSideRef.current === 'right' && deltaX > -10) {
            nextX = screen.width - WIDGET_WIDTH * 0.58;
          }
        } else {
          nextX = Math.max(minX, Math.min(maxX, nextX));
        }

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
        const isTap = !isDraggingRef.current || (Math.abs(gestureState.dx) < 7 && Math.abs(gestureState.dy) < 7);

        // NẾU BẤM NHẸ (TAP):
        if (isTap) {
          if (isPeekingRef.current) {
            // Đang núp mà người dùng bấm vào -> Tự động bung toàn bộ cơ thể ra và mở chatbox
            undockToNormal();
            setTimeout(() => {
              handleMascotPress();
            }, 260);
          } else {
            handleMascotPress();
          }
          return;
        }

        // NẾU KÉO THẢ: KIỂM TRA KHOẢNG CÁCH TỚI MÉP VIỀN (<= 18PX) -> TỰ ĐỘNG HÚT VÀO MÉP
        const newX = currentXRef.current;

        if (newX <= 18) {
          dockToEdge('left');
        } else if (newX >= screen.width - WIDGET_WIDTH - 18) {
          dockToEdge('right');
        } else {
          // Thả ở giữa màn hình -> Giữ nguyên tư thế hoạt động bình thường
          if (isPeekingRef.current) {
            setIsPeeking(false);
            setPeekingSide(null);
            isPeekingRef.current = false;
            peekingSideRef.current = null;
          }
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
            transform: [
              { scale: Animated.multiply(dragLiftAnim, dockSnapAnim) },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* BONG BÓNG UỐNG NƯỚC ĐI (STATE-DRINKING) */}
        {currentState === 'drinking' && !isPeeking && (
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
        <View style={styles.mascotPressable}>
          <View style={styles.mascotRig} pointerEvents="none">
            {isPeeking ? (
              /* TƯ THẾ NÚP LÓ ĐẦU BÁM MÉP VIỀN (PEEKING / DOCKED MODE) */
              <MascotPeekingRig
                species={currentSpecies}
                stage={currentStage}
                side={peekingSide || 'left'}
                width={WIDGET_WIDTH}
                height={WIDGET_HEIGHT}
              />
            ) : (
              /* LINH VẬT Ở TRẠNG THÁI NHÚN NHẢY THỂ THAO BÌNH THƯỜNG (BOUNCING) */
              <MascotVectorRig
                species={currentSpecies}
                stage={currentStage}
                state={currentState}
                mode="bouncing"
                width={WIDGET_WIDTH}
                height={WIDGET_HEIGHT}
              />
            )}
          </View>
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

// =====================================================================
// COMPONENT TƯ THẾ NÚP LÓ ĐẦU BÁM MÉP VIỀN MÀN HÌNH (PEEKING RIG)
// =====================================================================
interface MascotPeekingRigProps {
  species?: MascotSpecies;
  stage?: MascotStage;
  side: 'left' | 'right';
  width: number;
  height: number;
}

const MascotPeekingRig: React.FC<MascotPeekingRigProps> = ({
  side = 'left',
  width,
  height,
}) => {
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: false,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: false,
        }),
      ])
    );
    breatheLoop.start();
    return () => breatheLoop.stop();
  }, [breatheAnim]);

  const translateY = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const rotate = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1.5deg'],
  });

  return (
    <Animated.View
      style={[
        peekingStyles.container,
        {
          width,
          height,
          transform: [
            { translateY },
            { rotate },
            ...(side === 'right' ? [{ scaleX: -1 }] : []),
          ],
        },
      ]}
    >
      <Svg width={width} height={height} viewBox="0 0 200 240">
        <G>
          {/* Đầu mèo */}
          <G>
            <Path d="M 52 42 L 67 18 L 84 32 Z" fill="#F97316" stroke="#1E293B" strokeWidth={3.2} />
            <Path d="M 148 42 L 133 18 L 116 32 Z" fill="#F97316" stroke="#1E293B" strokeWidth={3.2} />
            <Ellipse cx="100" cy="74" rx="46" ry="38" fill="#F97316" stroke="#1E293B" strokeWidth={3.2} />
            {/* Mắt to tròn long lanh nhìn vào màn hình */}
            <Ellipse cx="80" cy="74" rx="6" ry="7.5" fill="#1E293B" />
            <Circle cx="78" cy="71" r="2.2" fill="#FFFFFF" />
            <Ellipse cx="120" cy="74" rx="6" ry="7.5" fill="#1E293B" />
            <Circle cx="118" cy="71" r="2.2" fill="#FFFFFF" />
            {/* Mũi & miệng cười mỉm */}
            <Polygon points="100,82 96,78 104,78" fill="#FB7185" />
            <Path d="M 95 86 Q 100 90 105 86" fill="none" stroke="#1E293B" strokeWidth={2.4} strokeLinecap="round" />
            {/* Băng đô trán */}
            <Path d="M 56 64 C 74 54 126 54 144 64 L 144 72 C 126 62 74 62 56 72 Z" fill="#168B67" stroke="#1E293B" strokeWidth={2.8} />
            <Circle cx="100" cy="63" r="3.2" fill="#FFFFFF" stroke="#1E293B" strokeWidth={1.2} />
          </G>

          {/* Hai bàn tay bám mép đặt ngang đối xứng ngay dưới cằm */}
          <G>
            {/* Tay trái gác mép */}
            <Ellipse cx="72" cy="104" rx="10" ry="7.5" fill="#F97316" stroke="#1E293B" strokeWidth={2.8} />
            <Circle cx="66" cy="104" r="2" fill="#FEF3C7" />
            <Circle cx="72" cy="102" r="2.2" fill="#FEF3C7" />
            <Circle cx="78" cy="104" r="2" fill="#FEF3C7" />

            {/* Tay phải gác mép */}
            <Ellipse cx="128" cy="104" rx="10" ry="7.5" fill="#F97316" stroke="#1E293B" strokeWidth={2.8} />
            <Circle cx="122" cy="104" r="2" fill="#FEF3C7" />
            <Circle cx="128" cy="102" r="2.2" fill="#FEF3C7" />
            <Circle cx="134" cy="104" r="2" fill="#FEF3C7" />
          </G>
        </G>
      </Svg>
    </Animated.View>
  );
};

const peekingStyles = StyleSheet.create({
  container: {
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
