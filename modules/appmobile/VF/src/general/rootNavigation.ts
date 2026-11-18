import { createNavigationContainerRef } from '@react-navigation/native';
import { DeviceEventEmitter } from 'react-native';

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Chuyển tới màn hình bất kỳ một cách an toàn từ bất cứ đâu trong app
 */
export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    try {
      (navigationRef as any).navigate(name, params);
    } catch (e) {
      console.warn('[RootNavigation] Lỗi chuyển trang:', e);
    }
  }
}

/**
 * Tự động chuyển người dùng tới màn hình "Kế hoạch tập luyện"
 * Nhảy trực tiếp vào màn hình Kế hoạch tập (headerPage với tab Kế hoạch tập hoặc WorkoutPlanScreen)
 */
export function navigateToWorkoutPlan() {
  // Phát tín hiệu chuyển trực tiếp sang tab 'Kế hoạch tập' nếu headerPage đang hiển thị
  DeviceEventEmitter.emit('SWITCH_TO_WORKOUT_PLAN');

  if (navigationRef.isReady()) {
    try {
      // 1. Chuyển vào MemberTabs -> Kế Hoạch Tập -> headerPage với tab 'Kế hoạch tập'
      (navigationRef as any).navigate('MemberTabs', {
        screen: 'Kế Hoạch Tập',
        params: {
          screen: 'headerPage',
          params: { initialTab: 'Kế hoạch tập' },
        },
      });
    } catch (_) {
      try {
        // 2. Thử chuyển trực tiếp vào headerPage
        (navigationRef as any).navigate('headerPage', { initialTab: 'Kế hoạch tập' });
      } catch (__) {
        try {
          // 3. Dự phòng mở WorkoutPlanScreen
          (navigationRef as any).navigate('MemberTabs', {
            screen: 'Kế Hoạch Tập',
            params: { screen: 'WorkoutPlanScreen' },
          });
        } catch (___) {
          try {
            (navigationRef as any).navigate('WorkoutPlanScreen');
          } catch (e) {
            console.warn('[RootNavigation] Không tìm thấy màn hình kế hoạch tập:', e);
          }
        }
      }
    }
  }
}
