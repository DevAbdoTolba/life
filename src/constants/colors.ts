export const colors = {
  // Dark theme base
  background: '#0A0A0F',
  surface: '#14141F',
  surfaceLight: '#1E1E2E',
  border: '#2A2A3A',
  
  // Text
  textPrimary: '#F0F0F5',
  textSecondary: '#8888A0',
  textMuted: '#555570',
  
  // Pillar positive colors (UP and RIGHT swipes)
  afterlifePositive: '#F5A623',  // Golden/Amber
  selfPositive: '#10B981',       // Emerald Green
  othersPositive: '#3B82F6',     // Sky Blue
  
  // Pillar negative colors (DOWN and LEFT swipes)
  afterlifeNegative: '#6B21A8',  // Deep Purple
  selfNegative: '#EF4444',       // Crimson Red
  othersNegative: '#64748B',     // Slate Gray
  
  // UI accent
  accent: '#F5A623',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorName = keyof typeof colors;
