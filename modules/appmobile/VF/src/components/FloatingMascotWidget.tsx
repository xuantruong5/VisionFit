import React, { Component, useEffect, useRef, useState, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Text,
} from 'react-native';

// 1. Error Boundary chống sập ứng dụng 100%
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.warn('[FloatingMascotWidget] Mascot error safely isolated:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// 2. Component Draggable Mascot thuần React Native (Tương thích 100% Android, iOS)
const WIDGET_WIDTH = 76;
const WIDGET_HEIGHT = 88;

const MascotDraggableCore: React.FC = () => {
  const [screen, setScreen] = useState(Dimensions.get('window'));
  const [greetingText, setGreetingText] = useState<string | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  // Vị trí kéo thả (Animated)
  const pan = useRef(
    new Animated.ValueXY({
      x: Math.max(16, Dimensions.get('window').width - WIDGET_WIDTH - 20),
      y: Math.max(16, Dimensions.get('window').height - WIDGET_HEIGHT - 100),
    })
  ).current;

  // Animation co giãn khi ấn hoặc vẫy chào
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const currentPos = useRef({
    x: Math.max(16, Dimensions.get('window').width - WIDGET_WIDTH - 20),
    y: Math.max(16, Dimensions.get('window').height - WIDGET_HEIGHT - 100),
  });

  // Lắng nghe thay đổi kích thước màn hình
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreen(window);
      // Giới hạn lại toạ độ nếu xoay màn hình
      const clampedX = Math.min(Math.max(8, currentPos.current.x), window.width - WIDGET_WIDTH - 8);
      const clampedY = Math.min(Math.max(8, currentPos.current.y), window.height - WIDGET_HEIGHT - 8);
      currentPos.current = { x: clampedX, y: clampedY };
      pan.setValue({ x: clampedX, y: clampedY });
    });
    return () => {
      try {
        sub?.remove?.();
      } catch (e) {}
    };
  }, [pan]);

  const triggerGreeting = (customText?: string) => {
    setGreetingText(customText || 'Chào bạn! Mình là VIF 👋');
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.18, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setGreetingText(null);
    }, 2800);
  };

  // Lắng nghe sự kiện tập luyện toàn cục (cả window nếu chạy web)
  useEffect(() => {
    let cleanupWeb: (() => void) | null = null;
    if (typeof window !== 'undefined' && window.addEventListener) {
      const onStart = () => setIsWorkoutActive(true);
      const onPause = () => setIsWorkoutActive(false);
      const onComplete = () => {
        setIsWorkoutActive(false);
        triggerGreeting('Tuyệt vời! Hoàn thành buổi tập 🎉');
      };
      window.addEventListener('vif:workout-start', onStart);
      window.addEventListener('vif:workout-pause', onPause);
      window.addEventListener('vif:workout-complete', onComplete);
      cleanupWeb = () => {
        window.removeEventListener('vif:workout-start', onStart);
        window.removeEventListener('vif:workout-pause', onPause);
        window.removeEventListener('vif:workout-complete', onComplete);
      };
    }
    return () => {
      if (cleanupWeb) cleanupWeb();
    };
  }, []);

  // Quản lý PanResponder để kéo thả mượt mà trên cảm ứng & chuột
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        Animated.spring(scaleAnim, { toValue: 1.12, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gesture) => {
        const nextX = currentPos.current.x + gesture.dx;
        const nextY = currentPos.current.y + gesture.dy;
        const clampedX = Math.min(Math.max(8, nextX), screen.width - WIDGET_WIDTH - 8);
        const clampedY = Math.min(Math.max(8, nextY), screen.height - WIDGET_HEIGHT - 8);
        pan.setValue({ x: clampedX, y: clampedY });
      },
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
        const hasMoved = Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6;
        if (!hasMoved) {
          // Nhấp nhẹ -> kích hoạt chào
          triggerGreeting();
        } else {
          // Kéo thả -> cập nhật vị trí mới đã giới hạn biên
          const nextX = currentPos.current.x + gesture.dx;
          const nextY = currentPos.current.y + gesture.dy;
          const clampedX = Math.min(Math.max(8, nextX), screen.width - WIDGET_WIDTH - 8);
          const clampedY = Math.min(Math.max(8, nextY), screen.height - WIDGET_HEIGHT - 8);
          currentPos.current = { x: clampedX, y: clampedY };
          pan.setValue({ x: clampedX, y: clampedY });
        }
      },
    })
  ).current;

  // Chọn hình ảnh phù hợp (Starter bình thường, Active khi đang tập luyện)
  const mascotSource = isWorkoutActive
    ? require('../assets/mascot/bear_active.png')
    : require('../assets/mascot/bear_starter.png');

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {greetingText && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{greetingText}</Text>
        </View>
      )}

      <Image
        source={mascotSource}
        style={styles.image}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    zIndex: 99999,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  bubble: {
    position: 'absolute',
    top: -38,
    backgroundColor: '#168B67',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

// 3. Export an toàn tuyệt đối
export const FloatingMascotWidget: React.FC = () => {
  return (
    <MascotErrorBoundary>
      <MascotDraggableCore />
    </MascotErrorBoundary>
  );
};

export default FloatingMascotWidget;
