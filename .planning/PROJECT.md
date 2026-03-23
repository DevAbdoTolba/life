# Hayat (حياة) — Life Balance Tracker

## What This Is
A mobile-first personal progress tracking app rooted in Islamic well-being principles and Cognitive Behavioral Therapy (CBT). Users track daily actions across three life pillars — Afterlife, Self, and Others — using an intuitive joystick-based gesture system with physics-based visualizations.

## Core Value
Effortless behavioral self-awareness through gesture-driven logging and creative visualization, enabling mindful life balance without friction.

## Requirements

### Validated
- [x] LOG-01: 3 joystick analogs on main screen (one per pillar) — Phase 1-2
- [x] LOG-02: Swipe in 4 directions to log actions (up/down/left/right) — Phase 2
- [x] LOG-03: Swipe + hold to reveal and select specific targets — Phase 2
- [x] DATA-01: Local data persistence (SQLite) — Phase 1
- [x] GOAL-01: Goal/target management with lifecycle tracking — Phase 3
- [x] PRIV-01: Privacy codenames (pool of ~30 funny names, password-protected reveal) — Phase 3
- [x] VIZ-01: Bullet journal style analytics (bar, donut, trend charts) — Phase 4
- [x] VIZ-02: Physics body-fill visualization (Matter.js + Skia) — Phase 4
- [x] VIZ-03: Custom time periods (Today/Week/Month/Custom) — Phase 4
- [x] VIZ-04: Period comparison (this week vs last week) — Phase 4
- [x] VIZ-05: Target-specific analytics (individual target trends) — Phase 4
- [x] DATA-02: Export all data as JSON backup file — Phase 5
- [x] DATA-03: Import and restore from backup with validation — Phase 5
- [x] NOTIFY-01: Daily review notification at configurable time — Phase 5
- [x] NOTIFY-02: Period review reminders (weekly) — Phase 5
- [x] POLISH-01: Onboarding flow (3 pillars + gesture tutorial) — Phase 5
- [x] POLISH-02: Settings screen (reminders, privacy, data management) — Phase 5
- [x] POLISH-03: App icon and splash screen — Phase 5

### Active
No active requirements — all v1 requirements validated.

### Out of Scope
- User accounts or authentication — local-only for v1
- Cloud sync or MongoDB backend — deferred to v1.1
- Social/sharing features — deferred to v1.2
- Multi-device sync — requires cloud sync
- Web version — mobile-first
- Gamification (badges, streaks) — not aligned with core value
- AI-powered insights — deferred to v1.4

## Context
The app uses a joystick metaphor where each of 3 life pillars (Afterlife, Self, Others) is a physical control. The 4-direction swipe creates a 2x2 matrix (positive/negative x direct/indirect) mapping to CBT behavioral tracking. Hold-to-target adds depth without UI clutter. A physics-based body-fill visualization gives an instant emotional read on life balance.

Tech stack: React Native + Expo, TypeScript, RNGH v2 + Reanimated v3, Matter.js + Skia, Expo SQLite, Zustand + MMKV.

## Constraints
- **Platform**: Mobile (iOS + Android) via React Native + Expo
- **Storage**: Local-only, no server for v1
- **Performance**: Gestures must run on native UI thread at 60fps
- **Privacy**: No data leaves device unless user exports
- **Design**: Dark mode only, minimalist sans-serif (Inter)
- **Interaction**: One-hand thumb-reachable joystick design

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native + Expo (ADR-001) | JS expertise, cross-platform, proven gesture stack | ✓ Good |
| Expo SQLite over WatermelonDB (ADR-002) | Local-only v1, zero config, can migrate later | ✓ Good |
| No cloud sync v1 (ADR-003) | Privacy, simplicity, faster dev | ✓ Good |
| Codename pool for privacy (ADR-004) | Fun, low effort, password unlock | ✓ Good |
| Matter.js + Skia for physics (ADR-005) | Lightweight, proven in Expo ecosystem | ✓ Good |
| No MongoDB Realm (ADR-006) | Deprecated Sept 2025 | ✓ Good |
| "Afterlife" not "Allah" (ADR-007) | More respectful naming | ✓ Good |
| Dark mode only (ADR-008) | Personal/journal feel, reduces scope | ✓ Good |
| Triangle joystick layout (ADR-010) | Afterlife priority at top, no scrolling | ✓ Good |
| Targets strictly per-pillar (ADR-011) | Simple data model, clean hold menu | ✓ Good |
| Daily review = notification only (ADR-012) | Lightweight, no extra screen | ✓ Good |
| Haptic + animation only for confirmation (ADR-013) | Zero friction for <2s logging | ✓ Good |
| Composed Pan+LongPress gestures (ADR-016) | Native thread, 60fps, clean separation | ✓ Good |
| Joysticks only on home (ADR-020) | Clean interaction space, no scroll conflicts | ✓ Good |
| Split analytics execution (ADR-022) | Charts first, physics second — reduces risk | ✓ Good |
| react-native-gifted-charts (ADR-024) | Native-optimized, highest perf priority | ✓ Good |
| Simplified physics boundary (ADR-025) | 60fps with cartoonish segmented SVG | ✓ Good |
| Physics ball aggregation (ADR-026) | Prevents memory overflow on high log counts | ✓ Good |
| expo-notifications local-only (ADR-027) | DAILY + WEEKLY triggers, no server needed | ✓ Good |
| FlatList onboarding carousel (ADR-028) | No extra deps, pagingEnabled + Reanimated | ✓ Good |

*Last updated: 2026-03-23 after Phase 5 completion — v1.0 milestone complete*
