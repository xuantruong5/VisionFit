export type MascotSpecies = 'bear' | 'cat';
export type MascotStage = 'starter' | 'active' | 'strong' | 'champion';
export type MascotMotionMode = 'roaming' | 'bouncing' | 'static';

export type MascotState =
  | 'idle'
  | 'walking'
  | 'greeting'
  | 'thinking'
  | 'speaking'
  | 'training'
  | 'celebrating'
  | 'error'
  | 'stretching'
  | 'drinking';

export interface MascotStateMeta {
  key: MascotState;
  label: string;
  icon: string;
  desc: string;
}

export const ALL_MASCOT_STATES: MascotStateMeta[] = [
  { key: 'walking', label: 'Đi tuần tra', icon: '🚶', desc: 'Bước so le dọc đáy màn hình' },
  { key: 'stretching', label: 'Vươn vai', icon: '🤸', desc: 'Khởi động, dãn cơ hai cánh tay' },
  { key: 'training', label: 'Tập cử tạ', icon: '🏋️', desc: 'Cử tạ bicep curls thể thao' },
  { key: 'celebrating', label: 'Ăn mừng', icon: '🎉', desc: 'Nhảy mừng chiến thắng chữ V' },
  { key: 'drinking', label: 'Uống nước', icon: '💧', desc: 'Cầm bình nước nhắc uống mỗi 2h' },
  { key: 'greeting', label: 'Vẫy chào', icon: '👋', desc: 'Giơ tay vẫy chào đón người dùng' },
  { key: 'thinking', label: 'Suy nghĩ', icon: '🤔', desc: 'Nghiêng đầu, chạm cằm, bong bóng ...' },
  { key: 'speaking', label: 'Trả lời', icon: '💬', desc: 'Mấp máy môi, làm cử chỉ tay' },
  { key: 'error', label: 'Bối rối', icon: '😅', desc: 'Chu môi áy náy khi gặp lỗi mạng' },
  { key: 'idle', label: 'Nghỉ ngơi', icon: '💤', desc: 'Thư giãn, thở nhịp nhàng' },
];

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}
