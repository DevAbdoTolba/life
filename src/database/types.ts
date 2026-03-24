// Type definitions for all data entities

export type SwipeDirectionType = 'up' | 'down' | 'left' | 'right';
export type TargetStatus = 'active' | 'paused' | 'completed' | 'failed' | 'reduced' | 'increased' | 'deleted';

export interface Log {
  id: string;
  pillarId: number;
  direction: SwipeDirectionType;
  targetId: string | null;
  note: string | null;
  createdAt: string; // ISO 8601
}

export interface Target {
  id: string;
  pillarId: number;
  realName: string;
  codename: string | null;
  isMasked: boolean;
  status: TargetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TargetHistoryEntry {
  id: string;
  targetId: string;
  oldStatus: TargetStatus;
  newStatus: TargetStatus;
  changedAt: string;
}

export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}
