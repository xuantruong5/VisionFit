import AsyncStorage from '@react-native-async-storage/async-storage';
import { MascotStage } from './types';

export interface MascotProgressionData {
  currentStage: MascotStage;
  totalWorkoutDays: number;
  lastWorkoutDate: string | null; // YYYY-MM-DD
  daysInactive: number;
  wasResetDueToInactivity: boolean;
}

const STORAGE_KEY = '@vif_mascot_progression';

export const STAGES_CONFIG = [
  {
    stage: 'starter' as MascotStage,
    level: 1,
    name: 'Cấp 1: Khởi Đầu',
    title: 'Tân Binh (Starter)',
    requiredDays: 0,
    requiredMonths: 'Khởi đầu',
    desc: 'Làm quen với lộ trình rèn luyện, thiết lập thói quen vận động mỗi ngày.',
    color: '#0F5468',
  },
  {
    stage: 'active' as MascotStage,
    level: 2,
    name: 'Cấp 2: Năng Động',
    title: 'Rèn Luyện (Active)',
    requiredDays: 30,
    requiredMonths: '1 tháng (30 ngày)',
    desc: 'Đeo băng trán thể thao, thể lực bắt đầu tăng trưởng rõ rệt.',
    color: '#10B981',
  },
  {
    stage: 'strong' as MascotStage,
    level: 3,
    name: 'Cấp 3: Bứt Phá',
    title: 'Mạnh Mẽ (Strong)',
    requiredDays: 60,
    requiredMonths: '2 tháng (60 ngày)',
    desc: 'Cơ bắp săn chắc, nâng cao mức tạ và hoàn thành các bài tập nặng.',
    color: '#3B82F6',
  },
  {
    stage: 'champion' as MascotStage,
    level: 4,
    name: 'Cấp 4: Quán Quân',
    title: 'Đỉnh Cao (Champion)',
    requiredDays: 90,
    requiredMonths: '3 tháng (90 ngày)',
    desc: 'Đạt đỉnh cao thể lực, đeo đai vô địch danh dự của VisionFit.',
    color: '#F59E0B',
  },
];

// Tính số ngày chênh lệch giữa 2 ngày YYYY-MM-DD
const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getTodayString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Xác định stage dựa trên tổng số ngày tập
export const calculateStageByDays = (totalDays: number): MascotStage => {
  if (totalDays >= 90) return 'champion';
  if (totalDays >= 60) return 'strong';
  if (totalDays >= 30) return 'active';
  return 'starter';
};

// Lấy dữ liệu tiến trình & Tự động kiểm tra điều kiện phạt nếu nghỉ 7 ngày
export const getProgressionData = async (): Promise<MascotProgressionData> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const today = getTodayString();

    let data: MascotProgressionData = raw
      ? JSON.parse(raw)
      : {
          currentStage: 'starter',
          totalWorkoutDays: 0,
          lastWorkoutDate: null,
          daysInactive: 0,
          wasResetDueToInactivity: false,
        };

    // Kiểm tra số ngày không tập
    if (data.lastWorkoutDate) {
      const daysDiff = getDaysDifference(data.lastWorkoutDate, today);
      data.daysInactive = daysDiff;

      // QUY TẮC KỶ LUẬT: Nếu 1 tuần (>= 7 ngày) không tập luyện -> Reset về Cấp 1
      if (daysDiff >= 7 && data.currentStage !== 'starter') {
        data.currentStage = 'starter';
        data.totalWorkoutDays = 0;
        data.wasResetDueToInactivity = true;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    }

    return data;
  } catch (error) {
    console.warn('[mascotProgression] Error reading progression:', error);
    return {
      currentStage: 'starter',
      totalWorkoutDays: 0,
      lastWorkoutDate: null,
      daysInactive: 0,
      wasResetDueToInactivity: false,
    };
  }
};

// Ghi nhận hoàn thành một ngày tập luyện
export const recordWorkoutSession = async (): Promise<MascotProgressionData> => {
  try {
    const data = await getProgressionData();
    const today = getTodayString();

    // Nếu hôm nay chưa tập thì cộng 1 ngày
    if (data.lastWorkoutDate !== today) {
      data.totalWorkoutDays += 1;
      data.lastWorkoutDate = today;
      data.daysInactive = 0;
      data.wasResetDueToInactivity = false;
      data.currentStage = calculateStageByDays(data.totalWorkoutDays);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.warn('[mascotProgression] Error recording workout:', error);
    return getProgressionData();
  }
};

// Hàm dành riêng cho việc test/demo: Đặt số ngày tập hoặc mô phỏng nghỉ tập
export const setMockProgression = async (
  days: number,
  daysInactive: number = 0
): Promise<MascotProgressionData> => {
  const today = new Date();
  const lastDate = new Date(today.getTime() - daysInactive * 24 * 60 * 60 * 1000);
  const y = lastDate.getFullYear();
  const m = String(lastDate.getMonth() + 1).padStart(2, '0');
  const d = String(lastDate.getDate()).padStart(2, '0');

  let stage = calculateStageByDays(days);
  let wasReset = false;

  if (daysInactive >= 7 && stage !== 'starter') {
    stage = 'starter';
    days = 0;
    wasReset = true;
  }

  const data: MascotProgressionData = {
    currentStage: stage,
    totalWorkoutDays: days,
    lastWorkoutDate: `${y}-${m}-${d}`,
    daysInactive,
    wasResetDueToInactivity: wasReset,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
};

