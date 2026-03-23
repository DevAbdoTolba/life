---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Database Schema & State Management

## Objective
Design and implement the SQLite database schema for all app data (logs, targets, periods, settings) and create Zustand stores with MMKV persistence for in-memory state. After this plan, data can be written to and read from local storage.

## Context
- .gsd/SPEC.md — Core concepts (lines 31-70), data entities
- .gsd/DECISIONS.md — ADR-002 (Expo SQLite), ADR-011 (per-pillar targets)
- .gsd/RESEARCH.md — Tech stack (Expo SQLite, Zustand, MMKV)
- src/constants/pillars.ts — Pillar IDs and SwipeDirection enum (from Plan 1.2)

## Tasks

<task type="auto">
  <name>Create SQLite database layer</name>
  <files>
    - src/database/schema.ts (created)
    - src/database/db.ts (created)
    - src/database/migrations.ts (created)
    - src/database/index.ts (created)
  </files>
  <action>
    Create the database layer under `src/database/`:

    **schema.ts** — SQL CREATE TABLE statements:

    ```sql
    -- Action logs: the core data entity
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,           -- UUID
      pillar_id INTEGER NOT NULL,    -- 1 (afterlife), 2 (self), 3 (others)
      direction TEXT NOT NULL,       -- 'up', 'down', 'left', 'right'
      target_id TEXT,                -- nullable FK to targets.id
      note TEXT,                     -- optional text note
      created_at TEXT NOT NULL,      -- ISO 8601 timestamp
      _status TEXT DEFAULT 'active', -- for future sync compatibility
      _changed TEXT DEFAULT ''       -- for future sync compatibility
    );

    -- Goals/targets per pillar
    CREATE TABLE IF NOT EXISTS targets (
      id TEXT PRIMARY KEY,           -- UUID
      pillar_id INTEGER NOT NULL,    -- 1, 2, 3 — strictly per-pillar
      real_name TEXT NOT NULL,       -- the actual goal name (may be encrypted)
      codename TEXT,                 -- funny codename from pool (nullable if not masked)
      is_masked INTEGER DEFAULT 0,  -- 1 if codename is active
      status TEXT DEFAULT 'active',  -- active, paused, completed, failed, reduced, increased
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      _status TEXT DEFAULT 'active',
      _changed TEXT DEFAULT ''
    );

    -- Target lifecycle changelog
    CREATE TABLE IF NOT EXISTS target_history (
      id TEXT PRIMARY KEY,
      target_id TEXT NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      FOREIGN KEY (target_id) REFERENCES targets(id)
    );

    -- Custom evaluation periods
    CREATE TABLE IF NOT EXISTS periods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Key-value settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    ```

    **db.ts** — Database initialization and helper functions:
    - `initDatabase()`: Opens SQLite database, runs CREATE TABLE statements
    - `getDatabase()`: Returns the database instance (singleton)
    - Wrap in try/catch with meaningful error messages
    - Use `expo-sqlite` async API (SQLite.openDatabaseAsync)

    **migrations.ts** — Version tracking for future schema changes:
    - Store schema version in settings table
    - `runMigrations()`: Check current version, run any pending migrations
    - Start at version 1

    **index.ts** — Re-export initDatabase, getDatabase

    IMPORTANT: Include `_status` and `_changed` columns on logs and targets for future WatermelonDB migration compatibility (ADR-002).
  </action>
  <verify>
    - TypeScript compiles: `npx tsc --noEmit`
    - All 5 tables defined with correct columns
    - initDatabase creates tables without errors (test in app boot)
    - _status and _changed fields present on logs and targets tables
  </verify>
  <done>SQLite schema with 5 tables (logs, targets, target_history, periods, settings) created and initializes on app boot.</done>
</task>

<task type="auto">
  <name>Create Zustand stores with MMKV persistence</name>
  <files>
    - src/stores/logStore.ts (created)
    - src/stores/targetStore.ts (created)
    - src/stores/settingsStore.ts (created)
    - src/stores/storage.ts (created — MMKV instance)
    - src/stores/index.ts (created)
  </files>
  <action>
    Create Zustand stores under `src/stores/`:

    **storage.ts** — MMKV instance:
    - Create a single MMKV instance for Zustand persistence
    - Export `zustandStorage` adapter that implements Zustand's StateStorage interface

    **logStore.ts** — Log management:
    ```
    State:
    - todayLogs: Log[] (cached for quick display)
    - isLoading: boolean

    Actions:
    - addLog(pillarId, direction, targetId?, note?): Promise<void>
      → Inserts into SQLite, updates todayLogs
    - getTodayLogs(): Promise<Log[]>
      → Queries SQLite for today's entries
    - getLogsByPeriod(startDate, endDate): Promise<Log[]>
      → Queries SQLite with date range filter
    - deleteLog(id): Promise<void>
      → Soft delete or hard delete
    ```

    **targetStore.ts** — Target/goal management:
    ```
    State:
    - targets: Target[] (all active targets)
    - isLoading: boolean

    Actions:
    - loadTargets(): Promise<void>
    - addTarget(pillarId, realName, codename?): Promise<void>
    - updateTargetStatus(id, newStatus): Promise<void>
      → Also creates target_history entry
    - toggleMask(id): Promise<void>
    - getTargetsByPillar(pillarId): Target[]
    - deleteTarget(id): Promise<void>
    ```

    **settingsStore.ts** — App settings (persisted to MMKV):
    ```
    State:
    - privacyPassword: string | null
    - reminderTime: string (HH:mm format, default "21:00")
    - reminderEnabled: boolean
    - isPrivacyMode: boolean (are codenames showing?)
    - onboardingComplete: boolean

    Actions:
    - setPrivacyPassword(password): void
    - setReminderTime(time): void
    - toggleReminder(): void
    - togglePrivacyMode(): void
    - completeOnboarding(): void
    ```
    Use zustand/middleware `persist` with MMKV storage for settingsStore.
    logStore and targetStore interact with SQLite directly (not MMKV-persisted).

    **index.ts** — Re-export all stores.

    Define TypeScript interfaces for all data types:
    ```typescript
    interface Log {
      id: string;
      pillarId: number;
      direction: 'up' | 'down' | 'left' | 'right';
      targetId: string | null;
      note: string | null;
      createdAt: string;
    }

    interface Target {
      id: string;
      pillarId: number;
      realName: string;
      codename: string | null;
      isMasked: boolean;
      status: 'active' | 'paused' | 'completed' | 'failed' | 'reduced' | 'increased';
      createdAt: string;
      updatedAt: string;
    }
    ```
  </action>
  <verify>
    - TypeScript compiles: `npx tsc --noEmit`
    - All stores export correctly from index.ts
    - MMKV storage adapter works (settingsStore persists across reloads)
    - Log and Target interfaces match SQLite schema
  </verify>
  <done>3 Zustand stores created (logStore, targetStore, settingsStore). MMKV persistence configured for settings. SQLite CRUD operations implemented for logs and targets.</done>
</task>

<task type="auto">
  <name>Wire database initialization into app boot</name>
  <files>
    - app/_layout.tsx (modified — add DB init)
    - src/database/db.ts (may need adjustment)
  </files>
  <action>
    1. In `app/_layout.tsx`, add database initialization to the app boot sequence:
       - Call `initDatabase()` before rendering the app
       - Show splash screen until both fonts AND database are ready
       - Call `loadTargets()` from targetStore after DB init
       - Call `getTodayLogs()` from logStore after DB init
    2. Ensure proper error handling — if DB init fails, show an error screen
    3. Order: Load fonts → Init DB → Load initial data → Hide splash → Render app
  </action>
  <verify>
    - App boots with database initialized (no errors in console)
    - Tables are created on first boot
    - Second boot doesn't recreate tables (IF NOT EXISTS works)
  </verify>
  <done>Database initializes on app boot. Initial data loads into stores. Splash screen waits for everything.</done>
</task>

## Success Criteria
- [ ] 5 SQLite tables created successfully on app boot
- [ ] Zustand logStore can add/read/delete logs via SQLite
- [ ] Zustand targetStore can add/read/update targets via SQLite
- [ ] settingsStore persists to MMKV across app restarts
- [ ] WatermelonDB-compatible fields (_status, _changed) present
- [ ] TypeScript interfaces for Log, Target, Period, Setting defined
- [ ] App boots with DB + stores initialized, splash screen waits for everything
