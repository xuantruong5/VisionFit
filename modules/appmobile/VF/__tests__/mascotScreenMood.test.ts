import {
  SCREEN_MOODS,
  WATER_REMINDER_MESSAGES,
  getScreenMood,
  pickWaterReminderMessage,
} from '../src/components/mascot/mascotScreenMood';
import { ALL_MASCOT_STATES } from '../src/components/mascot/types';

describe('mascotScreenMood (Task 5.2 biểu cảm theo màn hình, Task 6.2 nội dung nhắc nước)', () => {
  test('màn hình tập luyện, chọn chương trình, dinh dưỡng, tiến độ có biểu cảm khác nhau', () => {
    expect(getScreenMood('headerPage')?.state).toBe('training');
    expect(getScreenMood('WorkoutPlanScreen')?.state).toBe('greeting');
    expect(getScreenMood('DietScreen')?.state).toBe('speaking');
    expect(getScreenMood('ReportPage')?.state).toBe('celebrating');
    expect(getScreenMood('AiConsultationScreen')?.state).toBe('thinking');
  });

  test('màn hình không có trong bảng (vd: màn PT, Login) thì không đổi biểu cảm', () => {
    expect(getScreenMood('Login')).toBeNull();
    expect(getScreenMood('TrainerChat')).toBeNull();
    expect(getScreenMood(undefined)).toBeNull();
  });

  test('mọi biểu cảm dùng đúng trạng thái linh vật đã vẽ, có câu nói và thời lượng hợp lý', () => {
    const validStates = new Set<string>([...ALL_MASCOT_STATES.map((s) => s.key), 'idle', 'thinking', 'speaking', 'error']);
    for (const [route, mood] of Object.entries(SCREEN_MOODS)) {
      expect(validStates.has(mood.state)).toBe(true);
      expect(mood.message.length).toBeGreaterThan(0);
      expect(mood.message.length).toBeLessThanOrEqual(60);
      expect(mood.durationMs).toBeGreaterThanOrEqual(3000);
      expect(route).toBeTruthy();
    }
  });

  test('câu nhắc uống nước luân phiên theo giờ, luôn thuộc danh sách', () => {
    const seen = new Set<string>();
    for (let h = 0; h < 24; h++) {
      const msg = pickWaterReminderMessage(new Date(2026, 10, 28, h, 0, 0));
      expect(WATER_REMINDER_MESSAGES).toContain(msg);
      seen.add(msg);
    }
    expect(seen.size).toBe(WATER_REMINDER_MESSAGES.length);
  });
});
