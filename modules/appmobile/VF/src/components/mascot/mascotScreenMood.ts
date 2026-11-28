import { MascotState } from './types';

/**
 * Biểu cảm của linh vật theo từng màn hình (Task 5.2).
 * Khi người dùng mở một màn hình, linh vật đổi tư thế + nói một câu ngắn phù hợp ngữ cảnh rồi trở về idle.
 * Chỉ áp dụng cho màn hình hội viên; màn hình không có trong bảng thì giữ nguyên trạng thái hiện tại.
 */
export interface ScreenMood {
  state: MascotState;
  message: string;
  durationMs: number;
}

const WORKOUT: ScreenMood = { state: 'training', message: 'Cố lên! Tập thật chuẩn nhé 💪', durationMs: 5000 };
const CHOOSE_PROGRAM: ScreenMood = { state: 'greeting', message: 'Chọn chương trình hợp với bạn nhé! 📋', durationMs: 4500 };
const FOOD: ScreenMood = { state: 'speaking', message: 'Ăn đủ chất, tập mới chất! 🥗', durationMs: 4500 };
const PROGRESS: ScreenMood = { state: 'celebrating', message: 'Xem bạn tiến bộ thế nào nè! 🎉', durationMs: 4500 };
const LEARN: ScreenMood = { state: 'stretching', message: 'Tra cứu kiến thức thôi! 📚', durationMs: 4000 };

export const SCREEN_MOODS: Record<string, ScreenMood> = {
  // Trang chủ hội viên
  MemberHome: { state: 'greeting', message: 'Chào bạn! Hôm nay tập gì nào? 👋', durationMs: 4500 },

  // Đang tập luyện
  headerPage: WORKOUT,
  ExercisePage: WORKOUT,
  WorkoutExercisePlan: WORKOUT,
  PhongTap: WORKOUT,

  // Chọn / đăng ký chương trình tập
  WorkoutPlanScreen: CHOOSE_PROGRAM,
  WorkoutLocationScreen: CHOOSE_PROGRAM,
  WorkoutDifficultyScreen: CHOOSE_PROGRAM,
  WorkoutProgramDetailScreen: CHOOSE_PROGRAM,

  // Dinh dưỡng
  DietScreen: FOOD,
  DietDetail: FOOD,
  FoodList: FOOD,
  FoodDetail: FOOD,
  FoodCategories: FOOD,

  // Tiến độ / báo cáo
  DashboardScreen: PROGRESS,
  ReportPage: PROGRESS,
  ResultPage: PROGRESS,
  WorkoutHistory: PROGRESS,

  // Chỉ số cơ thể
  AiConsultationScreen: { state: 'thinking', message: 'Nhập chỉ số để mình tính BMI cho bạn nhé! 🧮', durationMs: 4500 },

  // Sổ tay kiến thức
  SoTayHome: LEARN,
  ExerciseList: LEARN,
  ExerciseDetail: LEARN,
  ExerciseCategories: LEARN,
  EncyclopediaList: LEARN,
  EncyclopediaDetail: LEARN,
  NutritionCategories: LEARN,
  NutritionDetail: LEARN,
  NutritionProductList: LEARN,

  // Gói tập
  MyPackagesScreen: { state: 'speaking', message: 'Kiểm tra gói tập của bạn nhé! 🎟', durationMs: 4000 },
  WorkoutSelectionScreen: { state: 'speaking', message: 'Chọn gói tập phù hợp nào! 🎟', durationMs: 4000 },
};

export function getScreenMood(routeName?: string | null): ScreenMood | null {
  if (!routeName) {
    return null;
  }
  return SCREEN_MOODS[routeName] ?? null;
}

/** Câu nhắc uống nước luân phiên (Task 6.2) — tránh lặp đi lặp lại một câu. */
export const WATER_REMINDER_MESSAGES = [
  '💧 Uống nước đi!',
  '💧 Một ngụm nước cho cơ bắp nào!',
  '💧 2 tiếng rồi, uống nước thôi!',
  '💧 Đủ nước tập mới khỏe!',
  '💧 Nhấp một cốc nước nhé!',
];

export function pickWaterReminderMessage(now: Date = new Date()): string {
  return WATER_REMINDER_MESSAGES[now.getHours() % WATER_REMINDER_MESSAGES.length];
}
