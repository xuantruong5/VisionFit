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
const EDGE_PEEK_THRESHOLD = 20; // Khoảng cách <= 20px tới mép viền sẽ kích hoạt chế độ Núp mép màn hình
const BORDER_X = 26; // Trục mép viền điện thoại trong hệ tọa độ linh vật để bám mép chuẩn xác

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

    // Vị trí mép viền: Trục BORDER_X = 26 tiếp xúc hoàn hảo với mép điện thoại
    const targetX = side === 'left' ? -BORDER_X : screen.width - (WIDGET_WIDTH - BORDER_X);

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

        const minX = -BORDER_X;
        const maxX = screen.width - (WIDGET_WIDTH - BORDER_X);
        const maxTop = screen.height - WIDGET_HEIGHT - 30;

        let nextX = dragOffsetRef.current.startX + deltaX;
        // Nếu vẫn đang giữ núp và chỉ di chuyển dọc theo viền
        if (isPeekingRef.current) {
          if (peekingSideRef.current === 'left' && deltaX < 10) {
            nextX = -BORDER_X;
          } else if (peekingSideRef.current === 'right' && deltaX > -10) {
            nextX = screen.width - (WIDGET_WIDTH - BORDER_X);
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

        // NẾU KÉO THẢ: KIỂM TRA KHOẢNG CÁCH TỚI MÉP VIỀN (<= 20PX) -> TỰ ĐỘNG HÚT VÀO MÉP
        const distToLeft = currentXRef.current;
        const distToRight = screen.width - (currentXRef.current + WIDGET_WIDTH);

        if (distToLeft <= EDGE_PEEK_THRESHOLD) {
          dockToEdge('left');
        } else if (distToRight <= EDGE_PEEK_THRESHOLD) {
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
                earTwitchAnim={earTwitchAnim}
                headTiltAnim={headTiltAnim}
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
  species: MascotSpecies;
  stage: MascotStage;
  side: 'left' | 'right';
  earTwitchAnim: Animated.Value;
  headTiltAnim: Animated.Value;
  width: number;
  height: number;
}

const MascotPeekingRig: React.FC<MascotPeekingRigProps> = ({
  species = 'cat',
  stage = 'starter',
  side = 'left',
  earTwitchAnim,
  headTiltAnim,
  width,
  height,
}) => {
  const isCat = species === 'cat';
  const colors = isCat
    ? {
        furMain: '#F48B3E',
        furStripe: '#C85617',
        furInner: '#F69A94',
        snout: '#FFF3E0',
        nose: '#F27878',
        eyes: '#381C0E',
        blush: '#F47C7C',
        brandGreen: '#168B67',
        outline: '#4A2511',
        pawPad: '#F47C7C',
      }
    : {
        furMain: '#B9855A',
        furStripe: '#9B6B43',
        furInner: '#E2B68E',
        snout: '#FBEAD2',
        nose: '#4A2B18',
        eyes: '#3B2010',
        blush: '#EA8B91',
        brandGreen: '#168B67',
        outline: '#4A2B18',
        pawPad: '#E2B68E',
      };

  const earRotate = earTwitchAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '12deg'],
  });

  const headRotate = headTiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['4deg', '11deg'],
  });

  const headBobX = headTiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  return (
    <View
      style={[
        peekingStyles.container,
        {
          width,
          height,
          transform: side === 'right' ? [{ scaleX: -1 }] : [],
        },
      ]}
    >
      {/* LỚP 1: THÂN & ĐẦU & TAI CỬ ĐỘNG TÒ MÒ LÓ RA TỪ MÉP VIỀN */}
      <Animated.View
        style={[
          peekingStyles.headWrapper,
          {
            transform: [
              { rotate: headRotate },
              { translateX: headBobX },
            ],
          },
        ]}
      >
        <Svg width={width} height={height} viewBox="0 0 100 120">
          <Defs>
            <LinearGradient id="peekingFurGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.furMain} />
              <Stop offset="100%" stopColor={colors.furStripe} />
            </LinearGradient>
          </Defs>

          {/* Đường chiều sâu bóng mép viền điện thoại */}
          <Line x1="26" y1="15" x2="26" y2="115" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />

          {/* Thân sau viền (giấu nửa thân, bụng và chân ra ngoài màn hình) */}
          <Path
            d="M 14 74 C 18 68, 22 66, 30 72 C 36 76, 38 88, 36 102 C 34 108, 24 112, 14 110 Z"
            fill={colors.furMain}
            stroke={colors.outline}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Mảng lông bụng kem hé lộ một phần nhỏ */}
          <Path
            d="M 26 80 C 30 80, 34 86, 33 98 C 29 104, 26 104, 26 104 Z"
            fill={colors.snout}
            opacity={0.85}
          />

          {/* Tai sau (Back Ear - mép ngoài gần viền) */}
          {isCat ? (
            <Path
              d="M 26 24 L 32 6 Q 40 10 40 20 Z"
              fill={colors.furMain}
              stroke={colors.outline}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          ) : (
            <Circle
              cx="32"
              cy="18"
              r="10"
              fill={colors.furMain}
              stroke={colors.outline}
              strokeWidth="2.2"
            />
          )}

          {/* Khối đầu tròn trĩnh kawaii ló ra từ mép viền (x: 24 -> 90) */}
          <Path
            d="M 24 40 C 24 22, 42 16, 56 16 C 74 16, 90 28, 90 48 C 90 66, 76 76, 56 76 C 40 76, 26 68, 24 50 Z"
            fill="url(#peekingFurGrad)"
            stroke={colors.outline}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Sọc vằn trên đầu cho mèo */}
          {isCat && (
            <>
              <Path d="M 52 17 L 52 24" stroke={colors.furStripe} strokeWidth="2.2" strokeLinecap="round" />
              <Path d="M 45 19 L 47 25" stroke={colors.furStripe} strokeWidth="1.8" strokeLinecap="round" />
              <Path d="M 59 19 L 57 25" stroke={colors.furStripe} strokeWidth="1.8" strokeLinecap="round" />
              <Path d="M 87 46 L 80 48" stroke={colors.furStripe} strokeWidth="2" strokeLinecap="round" />
              <Path d="M 88 53 L 81 54" stroke={colors.furStripe} strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}

          {/* Đốm lông mày đặc trưng cho chó Shiba */}
          {!isCat && (
            <>
              <Circle cx="44" cy="38" r="3.5" fill={colors.snout} />
              <Circle cx="66" cy="40" r="3.5" fill={colors.snout} />
            </>
          )}

          {/* Đai đầu thể thao VisionFit màu xanh lá thương hiệu */}
          <Path
            d="M 28 32 C 44 26, 68 28, 85 38"
            stroke={colors.brandGreen}
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Huy hiệu VisionFit chính giữa đai */}
          <Circle cx="56" cy="31" r="3.2" fill="#FFFFFF" />
          <Circle cx="56" cy="31" r="1.6" fill={colors.brandGreen} />

          {/* Mõm kem sáng */}
          <Ellipse
            cx="56"
            cy="58"
            rx="10.5"
            ry="8.5"
            fill={colors.snout}
            stroke={colors.outline}
            strokeWidth="1.6"
          />

          {/* Mũi nhỏ xinh */}
          <Polygon
            points="56,56 52.5,52 59.5,52"
            fill={colors.nose}
            stroke={colors.outline}
            strokeWidth="1"
          />

          {/* Miệng mèo / chó cười chúm chím */}
          <Path
            d="M 52 59 Q 56 63 56 59 Q 56 63 60 59"
            stroke={colors.outline}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />

          {/* Má hồng đào thẹn thùng */}
          <Ellipse cx="38" cy="56" rx="4" ry="2.6" fill={colors.blush} opacity={0.65} />
          <Ellipse cx="74" cy="58" rx="4.5" ry="2.8" fill={colors.blush} opacity={0.65} />

          {/* Ria mép mèo */}
          {isCat && (
            <>
              <Line x1="66" y1="58" x2="84" y2="55" stroke={colors.outline} strokeWidth="1.4" strokeLinecap="round" />
              <Line x1="67" y1="61" x2="86" y2="62" stroke={colors.outline} strokeWidth="1.4" strokeLinecap="round" />
              <Line x1="66" y1="64" x2="83" y2="69" stroke={colors.outline} strokeWidth="1.4" strokeLinecap="round" />
              <Line x1="36" y1="56" x2="28" y2="54" stroke={colors.outline} strokeWidth="1.2" strokeLinecap="round" />
              <Line x1="35" y1="60" x2="28" y2="61" stroke={colors.outline} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}

          {/* HAI MẮT TO TRÒN LONG LANH NHÌN LÉN VÀO MÀN HÌNH (100% VISIBLE, KHÔNG BỊ ĐÈ) */}
          {/* Mắt trái (trong) */}
          <Ellipse cx="44" cy="48" rx="6.5" ry="8" fill={colors.eyes} />
          <Circle cx="43" cy="45" r="2.6" fill="#FFFFFF" />
          <Circle cx="46.5" cy="50" r="1.3" fill="#FFFFFF" />

          {/* Mắt phải (ngoài - to tròn nhìn lén) */}
          <Ellipse cx="68" cy="50" rx="7.5" ry="9" fill={colors.eyes} />
          <Circle cx="66" cy="47" r="3" fill="#FFFFFF" />
          <Circle cx="71" cy="52" r="1.5" fill="#FFFFFF" />
        </Svg>

        {/* TAI TRƯỚC: GẮN TRONG ANIMATED VIEW ĐỂ KHẼ NHÚC NHÍCH TÒ MÒ */}
        <Animated.View
          style={[
            peekingStyles.twitchEarWrapper,
            {
              transform: [{ rotate: earRotate }],
            },
          ]}
        >
          <Svg width={36} height={36} viewBox="0 0 36 36">
            {isCat ? (
              <>
                <Path
                  d="M 6 28 L 20 4 Q 30 14 26 32 Z"
                  fill={colors.furMain}
                  stroke={colors.outline}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <Path
                  d="M 10 26 L 19 10 Q 25 16 23 28 Z"
                  fill={colors.furInner}
                />
                <Path d="M 20 18 L 24 21" stroke={colors.furStripe} strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <Circle cx="18" cy="18" r="11" fill={colors.furMain} stroke={colors.outline} strokeWidth="2.2" />
                <Circle cx="18" cy="18" r="6" fill={colors.furInner} />
              </>
            )}
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* LỚP 2: HAI BÀN TAY BÁM MÉP VIỀN MÀN HÌNH (PAWS ON EDGE - TỰA BÁM NGAY DƯỚI ĐẦU TẠI X = 26) */}
      <View style={peekingStyles.pawsOverlay} pointerEvents="none">
        <Svg width={width} height={height} viewBox="0 0 100 120">
          {/* BÀN TAY TRÊN (UPPER PAW) BÁM MÉP VIỀN */}
          <G transform="translate(0, 0)">
            {/* Cổ tay nhô từ sau viền x = 26 */}
            <Path
              d="M 14 76 C 18 75, 22 75, 26 76 L 26 88 C 22 89, 18 89, 14 88 Z"
              fill={colors.furMain}
              stroke={colors.outline}
              strokeWidth="1.8"
            />
            {/* 3 ngón tay tròn trĩnh bám tràn qua mép viền (x >= 26) */}
            <Circle cx="29" cy="78" r="3.2" fill={colors.snout} stroke={colors.outline} strokeWidth="1.5" />
            <Circle cx="33.5" cy="82.5" r="3.6" fill={colors.snout} stroke={colors.outline} strokeWidth="1.5" />
            <Circle cx="29" cy="87" r="3.2" fill={colors.snout} stroke={colors.outline} strokeWidth="1.5" />
            {/* Đệm thịt móng tay hồng đào cực xinh */}
            <Circle cx="29" cy="78" r="1.4" fill={colors.pawPad} />
            <Circle cx="34" cy="82.5" r="1.6" fill={colors.pawPad} />
            <Circle cx="29" cy="87" r="1.4" fill={colors.pawPad} />
          </G>

          {/* BÀN TAY DƯỚI (LOWER PAW) BÁM MÉP VIỀN */}
          <G transform="translate(0, 0)">
            {/* Cổ tay nhô từ sau viền x = 26 */}
            <Path
              d="M 14 92 C 18 91, 22 91, 26 92 L 26 104 C 22 105, 18 105, 14 104 Z"
              fill={colors.furMain}
              stroke={colors.outline}
              strokeWidth="1.8"
            />
            {/* 3 ngón tay bám qua mép viền */}
            <Circle cx="29" cy="94" r="3.2" fill={colors.snout} stroke={colors.outline} strokeWidth="1.5" />
            <Circle cx="33.5" cy="98.5" r="3.6" fill={colors.snout} stroke={colors.outline} strokeWidth="1.5" />
            <Circle cx="29" cy="103" r="3.2" fill={colors.snout} stroke={colors.outline} strokeWidth="1.5" />
            {/* Đệm thịt móng tay */}
            <Circle cx="29" cy="94" r="1.4" fill={colors.pawPad} />
            <Circle cx="34" cy="98.5" r="1.6" fill={colors.pawPad} />
            <Circle cx="29" cy="103" r="1.4" fill={colors.pawPad} />
          </G>
        </Svg>
      </View>
    </View>
  );
};

const peekingStyles = StyleSheet.create({
  container: {
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headWrapper: {
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  twitchEarWrapper: {
    position: 'absolute',
    top: 4,
    left: 60,
    width: 36,
    height: 36,
  },
  pawsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
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
