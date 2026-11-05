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
        Animated.timing(earTwitchAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(earTwitchAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(earTwitchAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(earTwitchAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(earTwitchAnim, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(earTwitchAnim, { toValue: 0, duration: 90, useNativeDriver: true }),
      ])
    );

    // 2. Đầu hơi nghiêng và nhô nhẹ nhìn lén vào trong màn hình
    const headTiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(headTiltAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(headTiltAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
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

  // HÀM HÚT VÀO MÉP VIỀN (EDGE SNAPPING -> DOCKED PEEKING)
  const dockToEdge = (side: 'left' | 'right') => {
    setIsPeeking(true);
    setPeekingSide(side);
    isPeekingRef.current = true;
    peekingSideRef.current = side;

    // Vị trí mép viền: Thu nửa thân vào sau mép viền (giấu bụng và chân ra ngoài màn hình)
    const targetX = side === 'left' ? -WIDGET_WIDTH * 0.52 : screen.width - WIDGET_WIDTH * 0.48;

    Animated.parallel([
      Animated.spring(panX, {
        toValue: targetX,
        friction: 6.5,
        tension: 85,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(dockSnapAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
        Animated.spring(dockSnapAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
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
        Animated.timing(dockSnapAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.spring(dockSnapAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
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

        const minX = -WIDGET_WIDTH * 0.55;
        const maxX = screen.width - WIDGET_WIDTH * 0.45;
        const maxTop = screen.height - WIDGET_HEIGHT - 30;

        let nextX = dragOffsetRef.current.startX + deltaX;
        // Nếu vẫn đang giữ núp và chỉ di chuyển dọc theo viền
        if (isPeekingRef.current) {
          if (peekingSideRef.current === 'left' && deltaX < 10) {
            nextX = -WIDGET_WIDTH * 0.52;
          } else if (peekingSideRef.current === 'right' && deltaX > -10) {
            nextX = screen.width - WIDGET_WIDTH * 0.48;
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
    outputRange: ['6deg', '13deg'],
  });

  const headBobX = headTiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2.5],
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
      {/* LỚP 1: ĐẦU & TAI CỬ ĐỘNG TÒ MÒ LÓ RA TỪ MÉP VIỀN */}
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

          {/* Nửa thân sau tường (tạo chiều sâu đổ bóng) */}
          <Path
            d="M 38 45 C 34 55, 34 85, 42 95 L 52 95 L 52 45 Z"
            fill={colors.furMain}
            opacity={0.35}
          />

          {/* Tai sau (Back Ear - mép ngoài) */}
          {isCat ? (
            <Path
              d="M 36 34 L 42 16 Q 48 18 48 30 Z"
              fill={colors.furMain}
              stroke={colors.outline}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          ) : (
            <Circle
              cx="40"
              cy="28"
              r="10"
              fill={colors.furMain}
              stroke={colors.outline}
              strokeWidth="2.2"
            />
          )}

          {/* Khối đầu tròn trĩnh nghiêng ló ra */}
          <Path
            d="M 44 32 C 64 28, 84 38, 86 60 C 88 82, 68 94, 46 90 C 44 70, 44 48, 44 32 Z"
            fill="url(#peekingFurGrad)"
            stroke={colors.outline}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Sọc vằn trên trán / má cho mèo */}
          {isCat && (
            <>
              <Path d="M 72 38 L 65 43" stroke={colors.furStripe} strokeWidth="2.2" strokeLinecap="round" />
              <Path d="M 78 44 L 70 48" stroke={colors.furStripe} strokeWidth="2" strokeLinecap="round" />
              <Path d="M 83 62 L 77 64" stroke={colors.furStripe} strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}

          {/* Đai đầu thể thao VisionFit */}
          <Path
            d="M 48 38 C 62 38, 76 45, 80 54"
            stroke={colors.brandGreen}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Huy hiệu trên đai đầu */}
          <Circle cx="66" cy="45" r="3" fill="#FFFFFF" />
          <Circle cx="66" cy="45" r="1.5" fill={colors.brandGreen} />

          {/* Mõm trắng kem */}
          <Ellipse
            cx="70"
            cy="68"
            rx="11"
            ry="9"
            fill={colors.snout}
            stroke={colors.outline}
            strokeWidth="1.6"
          />

          {/* Mũi nhỏ xinh */}
          <Polygon
            points="70,64 66,60 74,60"
            fill={colors.nose}
            stroke={colors.outline}
            strokeWidth="1"
          />

          {/* Miệng mèo chúm chím hình số 3 nằm ngang / chữ w */}
          <Path
            d="M 66 67 Q 70 70 74 67"
            stroke={colors.outline}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Má hồng đào thẹn thùng */}
          <Ellipse cx="75" cy="75" rx="4.5" ry="3" fill={colors.blush} opacity={0.65} />

          {/* Ria mép mèo */}
          {isCat && (
            <>
              <Line x1="74" y1="65" x2="89" y2="62" stroke={colors.outline} strokeWidth="1.4" strokeLinecap="round" />
              <Line x1="75" y1="69" x2="91" y2="70" stroke={colors.outline} strokeWidth="1.4" strokeLinecap="round" />
              <Line x1="74" y1="73" x2="88" y2="78" stroke={colors.outline} strokeWidth="1.4" strokeLinecap="round" />
            </>
          )}

          {/* HAI MẮT TO TRÒN LONG LANH NHÌN LÉN VÀO MÀN HÌNH */}
          {/* Mắt ngoài (mắt chính nhìn vào màn hình) */}
          <Ellipse cx="68" cy="55" rx="7.5" ry="9" fill={colors.eyes} />
          {/* Đốm sáng long lanh lớn */}
          <Circle cx="66" cy="52" r="3" fill="#FFFFFF" />
          {/* Đốm sáng nhỏ phụ */}
          <Circle cx="71" cy="58" r="1.5" fill="#FFFFFF" />

          {/* Mắt trong (hé nhìn một phần) */}
          <Ellipse cx="53" cy="53" rx="5" ry="7" fill={colors.eyes} />
          <Circle cx="52" cy="50" r="2" fill="#FFFFFF" />
        </Svg>

        {/* TAI TRƯỚC: GẮN TRONG ANIMATED VIEW ĐỂ KHẼ NHÚC NHÍCH TÒ MÒ (PEEKING-EARS TWITCH) */}
        <Animated.View
          style={[
            peekingStyles.twitchEarWrapper,
            {
              transform: [{ rotate: earRotate }],
            },
          ]}
        >
          <Svg width={40} height={40} viewBox="0 0 40 40">
            {isCat ? (
              <>
                {/* Vành tai ngoài */}
                <Path
                  d="M 10 32 L 24 6 Q 34 16 28 36 Z"
                  fill={colors.furMain}
                  stroke={colors.outline}
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                {/* Lòng tai hồng */}
                <Path
                  d="M 14 30 L 22 12 Q 28 18 24 32 Z"
                  fill={colors.furInner}
                />
                {/* Sọc vằn tai */}
                <Path d="M 23 20 L 27 23" stroke={colors.furStripe} strokeWidth="1.6" strokeLinecap="round" />
              </>
            ) : (
              <>
                <Circle cx="20" cy="20" r="12" fill={colors.furMain} stroke={colors.outline} strokeWidth="2.4" />
                <Circle cx="20" cy="20" r="7" fill={colors.furInner} />
              </>
            )}
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* LỚP 2: HAI BÀN TAY BÁM CHẶT MÉP VIỀN MÀN HÌNH (PAWS ON EDGE) */}
      {/* Vị trí mép viền điện thoại là trục x = 52. Paws được vẽ đè lên trên mép viền để tạo cảm giác bám vào mép tường */}
      <View style={peekingStyles.pawsOverlay} pointerEvents="none">
        <Svg width={width} height={height} viewBox="0 0 100 120">
          {/* Đường bóng đổ nhẹ mép màn hình (Edge Depth Shadow) */}
          <Line x1="52" y1="20" x2="52" y2="105" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />

          {/* BÀN TAY TRÊN (UPPER PAW) BÁM MÉP VIỀN */}
          <G transform="translate(0, 0)">
            {/* Cổ tay nhô từ sau viền */}
            <Path
              d="M 44 42 L 52 42 L 52 54 L 44 54 Z"
              fill={colors.furMain}
            />
            {/* 3 ngón tay tròn trĩnh bám tràn qua mép viền (x >= 52) */}
            <Circle cx="54" cy="42" r="3.6" fill={colors.snout} stroke={colors.outline} strokeWidth="1.6" />
            <Circle cx="57" cy="47" r="3.8" fill={colors.snout} stroke={colors.outline} strokeWidth="1.6" />
            <Circle cx="54" cy="52" r="3.6" fill={colors.snout} stroke={colors.outline} strokeWidth="1.6" />
            {/* Đệm thịt móng tay hồng đào cực xinh */}
            <Circle cx="54.5" cy="42" r="1.6" fill={colors.pawPad} />
            <Circle cx="57.5" cy="47" r="1.8" fill={colors.pawPad} />
            <Circle cx="54.5" cy="52" r="1.6" fill={colors.pawPad} />
          </G>

          {/* BÀN TAY DƯỚI (LOWER PAW) BÁM MÉP VIỀN */}
          <G transform="translate(0, 0)">
            {/* Cổ tay nhô từ sau viền */}
            <Path
              d="M 44 72 L 52 72 L 52 84 L 44 84 Z"
              fill={colors.furMain}
            />
            {/* 3 ngón tay bám qua mép viền */}
            <Circle cx="54" cy="72" r="3.6" fill={colors.snout} stroke={colors.outline} strokeWidth="1.6" />
            <Circle cx="57" cy="77" r="3.8" fill={colors.snout} stroke={colors.outline} strokeWidth="1.6" />
            <Circle cx="54" cy="82" r="3.6" fill={colors.snout} stroke={colors.outline} strokeWidth="1.6" />
            {/* Đệm thịt móng tay */}
            <Circle cx="54.5" cy="72" r="1.6" fill={colors.pawPad} />
            <Circle cx="57.5" cy="77" r="1.8" fill={colors.pawPad} />
            <Circle cx="54.5" cy="82" r="1.6" fill={colors.pawPad} />
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
    top: 8,
    left: 48,
    width: 40,
    height: 40,
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
