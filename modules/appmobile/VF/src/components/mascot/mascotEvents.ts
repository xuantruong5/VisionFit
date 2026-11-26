import { EventEmitter } from 'events';
import { MascotState, MascotSpecies, MascotStage } from './types';

export const mascotEmitter = new EventEmitter();

// Tên các sự kiện
export const MASCOT_EVENTS = {
  SET_STATE: 'mascot:set_state',
  SET_SPECIES: 'mascot:set_species',
  SET_STAGE: 'mascot:set_stage',
  WORKOUT_START: 'mascot:workout_start',
  WORKOUT_PAUSE: 'mascot:workout_pause',
  WORKOUT_COMPLETE: 'mascot:workout_complete',
  DRINK_WATER: 'mascot:drink_water',
  SET_WATER_REMINDER: 'mascot:set_water_reminder',
  STRETCH: 'mascot:stretch',
  ERROR: 'mascot:error',
  AUTH_SESSION_CHANGED: 'mascot:auth_session_changed',
};

/**
 * Kích hoạt trạng thái tạm thời cho linh vật (ví dụ ăn mừng 4 giây rồi quay lại đi dạo)
 */
export function triggerMascotState(state: MascotState, durationMs?: number) {
  mascotEmitter.emit(MASCOT_EVENTS.SET_STATE, state, durationMs);
}

export function triggerWorkoutStart() {
  mascotEmitter.emit(MASCOT_EVENTS.SET_STATE, 'training');
}

export function triggerWorkoutPause() {
  mascotEmitter.emit(MASCOT_EVENTS.SET_STATE, 'stretching', 4500);
}

export function triggerWorkoutComplete() {
  mascotEmitter.emit(MASCOT_EVENTS.SET_STATE, 'celebrating', 5000);
}

export function triggerDrinkWater() {
  mascotEmitter.emit(MASCOT_EVENTS.SET_STATE, 'drinking', 6000);
}

export function triggerWaterReminderSetting(enabled: boolean, intervalHours: number = 2) {
  mascotEmitter.emit(MASCOT_EVENTS.SET_WATER_REMINDER, { enabled, intervalHours });
}

export function triggerMascotError() {
  mascotEmitter.emit(MASCOT_EVENTS.SET_STATE, 'error', 3500);
}

/**
 * Phát sự kiện khi người dùng đăng xuất hoặc đăng nhập tài khoản khác
 * để MascotChatModal hủy request đang chạy và xóa sạch lịch sử hội thoại/cache phiên cũ.
 */
export function triggerAuthSessionChanged() {
  mascotEmitter.emit(MASCOT_EVENTS.AUTH_SESSION_CHANGED);
}

