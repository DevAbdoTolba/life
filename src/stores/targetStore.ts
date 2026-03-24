import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database';
import type { Target, TargetStatus, TargetHistoryEntry } from '../database/types';

interface TargetState {
  targets: Target[];
  isLoading: boolean;

  // Actions
  loadTargets: () => Promise<void>;
  addTarget: (pillarId: number, realName: string, codename?: string | null) => Promise<void>;
  updateTargetStatus: (id: string, newStatus: TargetStatus) => Promise<void>;
  toggleMask: (id: string) => Promise<void>;
  getTargetsByPillar: (pillarId: number) => Target[];
  deleteTarget: (id: string) => Promise<void>;
  updateTargetName: (id: string, realName: string) => Promise<void>;
  getTargetHistory: (targetId: string) => Promise<TargetHistoryEntry[]>;
}

export const useTargetStore = create<TargetState>((set, get) => ({
  targets: [],
  isLoading: false,

  loadTargets: async () => {
    set({ isLoading: true });
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        pillar_id: number;
        real_name: string;
        codename: string | null;
        is_masked: number;
        status: TargetStatus;
        created_at: string;
        updated_at: string;
      }>(
        `SELECT id, pillar_id, real_name, codename, is_masked, status, created_at, updated_at
         FROM targets
         WHERE status != 'deleted'
         ORDER BY created_at DESC`
      );

      const targets: Target[] = rows.map((row) => ({
        id: row.id,
        pillarId: row.pillar_id,
        realName: row.real_name,
        codename: row.codename,
        isMasked: row.is_masked === 1,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      set({ targets, isLoading: false });
    } catch (error) {
      console.error('[TargetStore] Failed to load targets:', error);
      set({ isLoading: false });
    }
  },

  addTarget: async (pillarId, realName, codename = null) => {
    const db = getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO targets (id, pillar_id, real_name, codename, is_masked, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
      [id, pillarId, realName, codename, codename ? 1 : 0, now, now]
    );

    const newTarget: Target = {
      id,
      pillarId,
      realName,
      codename,
      isMasked: codename !== null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      targets: [newTarget, ...state.targets],
    }));
  },

  updateTargetStatus: async (id, newStatus) => {
    const db = getDatabase();
    const now = new Date().toISOString();
    const target = get().targets.find((t) => t.id === id);
    if (!target) return;

    const oldStatus = target.status;

    // Update target
    await db.runAsync(
      `UPDATE targets SET status = ?, updated_at = ? WHERE id = ?`,
      [newStatus, now, id]
    );

    // Record history
    const historyId = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO target_history (id, target_id, old_status, new_status, changed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [historyId, id, oldStatus, newStatus, now]
    );

    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, status: newStatus, updatedAt: now } : t
      ),
    }));
  },

  toggleMask: async (id) => {
    const db = getDatabase();
    const target = get().targets.find((t) => t.id === id);
    if (!target) return;

    const newMasked = !target.isMasked;
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE targets SET is_masked = ?, updated_at = ? WHERE id = ?`,
      [newMasked ? 1 : 0, now, id]
    );

    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, isMasked: newMasked, updatedAt: now } : t
      ),
    }));
  },

  getTargetsByPillar: (pillarId) => {
    return get().targets.filter(
      (t) => t.pillarId === pillarId && t.status === 'active'
    );
  },

  deleteTarget: async (id) => {
    const db = getDatabase();
    const now = new Date().toISOString();
    const target = get().targets.find((t) => t.id === id);
    if (!target) return;

    await db.runAsync(
      `UPDATE targets SET status = 'deleted', updated_at = ? WHERE id = ?`,
      [now, id]
    );

    const historyId = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO target_history (id, target_id, old_status, new_status, changed_at) VALUES (?, ?, ?, ?, ?)`,
      [historyId, id, target.status, 'deleted', now]
    );

    set((state) => ({
      targets: state.targets.filter((t) => t.id !== id),
    }));
  },

  updateTargetName: async (id, realName) => {
    const db = getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE targets SET real_name = ?, updated_at = ? WHERE id = ?`,
      [realName, now, id]
    );
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, realName, updatedAt: now } : t
      ),
    }));
  },

  getTargetHistory: async (targetId: string) => {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      target_id: string;
      old_status: TargetStatus;
      new_status: TargetStatus;
      changed_at: string;
    }>(
      `SELECT id, target_id, old_status, new_status, changed_at
       FROM target_history
       WHERE target_id = ?
       ORDER BY changed_at DESC`,
      [targetId]
    );

    return rows.map((r) => ({
      id: r.id,
      targetId: r.target_id,
      oldStatus: r.old_status,
      newStatus: r.new_status,
      changedAt: r.changed_at,
    }));
  },
}));
