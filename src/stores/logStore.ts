import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import type { Log, SwipeDirectionType } from '../database/types';
import type { DailyPillarCount } from '../types/analytics';
import type { PillarId, SwipeDirection } from '../constants/pillars';

interface LogState {
  todayLogs: Log[];
  isLoading: boolean;

  // Actions
  addLog: (
    pillarId: number,
    direction: SwipeDirectionType,
    targetId?: string | null,
    note?: string | null
  ) => Promise<void>;
  getTodayLogs: () => Promise<void>;
  getLogsByPeriod: (startDate: string, endDate: string) => Promise<Log[]>;
  getDailyLogsByPillar: (startDate: string, endDate: string) => Promise<DailyPillarCount[]>;
  getLogsByTarget: (targetId: string, startDate: string, endDate: string) => Promise<Log[]>;
  deleteLog: (id: string) => Promise<void>;
  updateLogNote: (id: string, note: string) => Promise<void>;
}

/**
 * Get the start of today as ISO string (midnight local time).
 */
function getTodayStart(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.toISOString();
}

export const useLogStore = create<LogState>((set, get) => ({
  todayLogs: [],
  isLoading: false,

  addLog: async (pillarId, direction, targetId = null, note = null) => {
    const db = getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO logs (id, pillar_id, direction, target_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, pillarId, direction, targetId, note, createdAt]
    );

    const newLog: Log = {
      id,
      pillarId,
      direction,
      targetId,
      note,
      createdAt,
    };

    set((state) => ({
      todayLogs: [newLog, ...state.todayLogs],
    }));
  },

  getTodayLogs: async () => {
    set({ isLoading: true });
    try {
      const db = getDatabase();
      const todayStart = getTodayStart();

      const rows = await db.getAllAsync<{
        id: string;
        pillar_id: number;
        direction: SwipeDirectionType;
        target_id: string | null;
        note: string | null;
        created_at: string;
      }>(
        `SELECT id, pillar_id, direction, target_id, note, created_at
         FROM logs
         WHERE created_at >= ?
         ORDER BY created_at DESC`,
        [todayStart]
      );

      const logs: Log[] = rows.map((row) => ({
        id: row.id,
        pillarId: row.pillar_id,
        direction: row.direction,
        targetId: row.target_id,
        note: row.note,
        createdAt: row.created_at,
      }));

      set({ todayLogs: logs, isLoading: false });
    } catch (error) {
      console.error('[LogStore] Failed to get today logs:', error);
      set({ isLoading: false });
    }
  },

  getLogsByPeriod: async (startDate, endDate) => {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      pillar_id: number;
      direction: SwipeDirectionType;
      target_id: string | null;
      note: string | null;
      created_at: string;
    }>(
      `SELECT id, pillar_id, direction, target_id, note, created_at
       FROM logs
       WHERE created_at >= ? AND created_at <= ?
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );

    return rows.map((row) => ({
      id: row.id,
      pillarId: row.pillar_id,
      direction: row.direction,
      targetId: row.target_id,
      note: row.note,
      createdAt: row.created_at,
    }));
  },

  getDailyLogsByPillar: async (startDate, endDate) => {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      day: string;
      pillar_id: number;
      direction: string;
      count: number;
    }>(
      `SELECT date(created_at) as day, pillar_id, direction, COUNT(*) as count
       FROM logs
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY day, pillar_id, direction
       ORDER BY day ASC`,
      [startDate, endDate]
    );
    return rows.map((row) => ({
      day: row.day,
      pillarId: row.pillar_id as PillarId,
      direction: row.direction as SwipeDirection,
      count: row.count,
    }));
  },

  getLogsByTarget: async (targetId, startDate, endDate) => {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      pillar_id: number;
      direction: SwipeDirectionType;
      target_id: string | null;
      note: string | null;
      created_at: string;
    }>(
      `SELECT id, pillar_id, direction, target_id, note, created_at
       FROM logs
       WHERE target_id = ? AND created_at >= ? AND created_at <= ?
       ORDER BY created_at ASC`,
      [targetId, startDate, endDate]
    );
    return rows.map((row) => ({
      id: row.id,
      pillarId: row.pillar_id,
      direction: row.direction,
      targetId: row.target_id,
      note: row.note,
      createdAt: row.created_at,
    }));
  },

  deleteLog: async (id) => {
    const db = getDatabase();
    await db.runAsync(`DELETE FROM logs WHERE id = ?`, [id]);
    set((state) => ({
      todayLogs: state.todayLogs.filter((log) => log.id !== id),
    }));
  },

  updateLogNote: async (id, note) => {
    const db = getDatabase();
    await db.runAsync(`UPDATE logs SET note = ? WHERE id = ?`, [note, id]);
    set((state) => ({
      todayLogs: state.todayLogs.map((log) =>
        log.id === id ? { ...log, note } : log
      ),
    }));
  },
}));
