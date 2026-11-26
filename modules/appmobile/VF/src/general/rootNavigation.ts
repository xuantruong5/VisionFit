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
 * Chuyển tới màn hình "Kế hoạch tập luyện" (dành cho hội viên ĐÃ đăng ký chương trình tập)
 */
export function navigateToWorkoutPlan() {
  DeviceEventEmitter.emit('SWITCH_TO_WORKOUT_PLAN');

  if (navigationRef.isReady()) {
    try {
      (navigationRef as any).navigate('MemberTabs', {
        screen: 'Kế Hoạch Tập',
        params: {
          screen: 'headerPage',
          params: { initialTab: 'Kế hoạch tập' },
        },
      });
    } catch (_) {
      try {
        (navigationRef as any).navigate('headerPage', { initialTab: 'Kế hoạch tập' });
      } catch (e) {
        console.warn('[RootNavigation] Không tìm thấy màn hình kế hoạch tập:', e);
      }
    }
  }
}

/**
 * Chuyển tới màn hình ĐĂNG KÝ CHƯƠNG TRÌNH TẬP (dành cho hội viên CHƯA đăng ký chương trình)
 */
export function navigateToRegisterProgram() {
  if (navigationRef.isReady()) {
    try {
      (navigationRef as any).navigate('MemberTabs', {
        screen: 'Kế Hoạch Tập',
        params: {
          screen: 'WorkoutPlanScreen',
        },
      });
    } catch (_) {
      try {
        (navigationRef as any).navigate('WorkoutPlanScreen');
      } catch (e) {
        console.warn('[RootNavigation] Không tìm thấy màn hình đăng ký chương trình:', e);
      }
    }
  }
}

/**
 * Chuyển tới màn hình CẬP NHẬT CHỈ SỐ CƠ THỂ (AiConsultationScreen)
 */
export function navigateToBodyMetrics() {
  if (navigationRef.isReady()) {
    try {
      (navigationRef as any).navigate('AiConsultationScreen');
    } catch (_) {
      try {
        (navigationRef as any).navigate('MemberTabs', {
          screen: 'Kế Hoạch Tập',
          params: { screen: 'AiConsultationScreen' },
        });
      } catch (e) {
        console.warn('[RootNavigation] Không tìm thấy màn hình cập nhật chỉ số:', e);
      }
    }
  }
}

/**
 * Chuyển tới màn hình ĐĂNG KÝ GÓI TẬP (WorkoutSelectionScreen)
 */
export function navigateToRegisterPackage() {
  if (navigationRef.isReady()) {
    try {
      (navigationRef as any).navigate('WorkoutSelectionScreen');
    } catch (_) {
      try {
        (navigationRef as any).navigate('MyPackagesScreen');
      } catch (e) {
        console.warn('[RootNavigation] Không tìm thấy màn hình gói tập:', e);
      }
    }
  }
}
