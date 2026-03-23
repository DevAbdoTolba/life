import { colors } from './colors';

export type PillarId = 1 | 2 | 3;
export type PillarKey = 'afterlife' | 'self' | 'others';

export interface Pillar {
  id: PillarId;
  key: PillarKey;
  name: string;
  arabic: string;
  emoji: string;
  positiveColor: string;
  negativeColor: string;
  description: string;
}

export const pillars: readonly Pillar[] = [
  {
    id: 1,
    key: 'afterlife',
    name: 'Afterlife',
    arabic: 'الآخرة',
    emoji: '🕌',
    positiveColor: colors.afterlifePositive,
    negativeColor: colors.afterlifeNegative,
    description: 'Spiritual relationship — faith, worship, devotion',
  },
  {
    id: 2,
    key: 'self',
    name: 'With Self',
    arabic: 'مع النفس',
    emoji: '💪',
    positiveColor: colors.selfPositive,
    negativeColor: colors.selfNegative,
    description: 'Personal well-being — body, mind, soul',
  },
  {
    id: 3,
    key: 'others',
    name: 'With Others',
    arabic: 'مع الناس',
    emoji: '🤝',
    positiveColor: colors.othersPositive,
    negativeColor: colors.othersNegative,
    description: 'Social relationships — family, friends, community',
  },
] as const;

export const getPillarById = (id: PillarId): Pillar => {
  const pillar = pillars.find((p) => p.id === id);
  if (!pillar) throw new Error(`Invalid pillar ID: ${id}`);
  return pillar;
};

export const getPillarByKey = (key: PillarKey): Pillar => {
  const pillar = pillars.find((p) => p.key === key);
  if (!pillar) throw new Error(`Invalid pillar key: ${key}`);
  return pillar;
};

// Swipe directions and their meaning
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';
export type Valence = 'positive' | 'negative';
export type ActionType = 'direct' | 'indirect';

export interface DirectionInfo {
  label: string;
  valence: Valence;
  type: ActionType;
  emoji: string;
}

export const swipeDirections: Record<SwipeDirection, DirectionInfo> = {
  up: {
    label: 'Direct Positive',
    valence: 'positive',
    type: 'direct',
    emoji: '⬆️',
  },
  down: {
    label: 'Direct Negative',
    valence: 'negative',
    type: 'direct',
    emoji: '⬇️',
  },
  right: {
    label: 'Indirect Positive',
    valence: 'positive',
    type: 'indirect',
    emoji: '➡️',
  },
  left: {
    label: 'Indirect Negative',
    valence: 'negative',
    type: 'indirect',
    emoji: '⬅️',
  },
} as const;

/**
 * Get the display color for a log entry based on pillar and direction.
 * Positive directions (up, right) use the pillar's positive color.
 * Negative directions (down, left) use the pillar's negative color.
 */
export const getLogColor = (pillarId: PillarId, direction: SwipeDirection): string => {
  const pillar = getPillarById(pillarId);
  const info = swipeDirections[direction];
  return info.valence === 'positive' ? pillar.positiveColor : pillar.negativeColor;
};
