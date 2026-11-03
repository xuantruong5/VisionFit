export const COLORS = {
  primary: '#0F5468',
  primaryDark: '#0A3E4F',
  primaryLight: '#E4EEF2',
  primarySoft: '#EBF3F6',
  
  // Nền
  background: '#F3F8FA',
  cardBg: '#FFFFFF',
  surfaceTeal: '#E6F0F4',
  
  // Chữ
  textPrimary: '#10303C',
  textDark: '#10303C',
  textSecondary: '#2D4F5C',
  textMuted: '#6F8F9C',
  textLight: '#9EB8C3',
  
  // Viền
  border: '#DDE8EC',
  borderLight: '#EAF2F5',
  borderFocus: '#8DB3C2',
  
  // Màu bổ trợ / Trạng thái
  accentOrange: '#FF6B4A',
  accentGold: '#E3B04B',
  accentGreen: '#10B981',
  accentBlue: '#2A85D0',
  accentRed: '#EF4444',
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#0A3E4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  glow: {
    shadowColor: '#0F5468',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Phong cách pastel mềm mại: bo tròn lớn, không viền, bóng rất nhẹ
export const PASTEL = {
  background: '#F2F6F5',
  surface: '#FFFFFF',
  surfaceSoft: '#F7FAF9',
  ink: '#1B3540',
  inkSoft: '#5E7B80',
  inkMuted: '#94AAAE',
  dark: '#0F5468',
  teal: '#0F5468',
  tealSoft: '#D6E6EC',
  mint: '#DDF2E6',
  mintInk: '#2E8A5E',
  peach: '#FCE6DA',
  peachInk: '#D9774A',
  butter: '#FBF0CF',
  butterInk: '#B98A1C',
  lilac: '#ECE6F7',
  lilacInk: '#7B62B8',
  track: '#E6EEED',
};

export const RADIUS = {
  sm: 14,
  md: 20,
  lg: 28,
  pill: 999,
};

export const SOFT_SHADOW = {
  shadowColor: '#1B3540',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 2,
};

// Phong cách xanh sage (trainer): dịu, ấm, tự nhiên
export const SAGE = {
  background: '#F1F2EC',
  surface: '#FFFFFF',
  surfaceSoft: '#F6F7F1',
  ink: '#2E3A2B',
  inkSoft: '#6B7565',
  inkMuted: '#A3AA9C',
  dark: '#8A9E74',
  teal: '#7A9161',
  tealSoft: '#E6EFD0',
  mint: '#E2ECD4',
  mintInk: '#5E7B45',
  peach: '#F5E6D6',
  peachInk: '#A9744A',
  butter: '#F1EFCF',
  butterInk: '#86843A',
  lilac: '#E9E6F0',
  lilacInk: '#6E6590',
  track: '#E6E8DF',
};

// Bộ màu trainer: dùng chung màu xanh teal với member
export const TRAINER_COLORS = {
  ...COLORS,
};

export const TRAINER_SHADOWS = {
  small: SOFT_SHADOW,
  card: SOFT_SHADOW,
  glow: SOFT_SHADOW,
};
