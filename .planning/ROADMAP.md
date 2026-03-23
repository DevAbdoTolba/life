# Roadmap: Hayat (Life Balance Tracker)

## Overview
Build a gesture-driven life balance tracker from foundation through analytics to launch-ready polish. Phases 01-03 (foundation, joystick interaction, goals/privacy) are complete. Phase 04 (analytics & visualization) is next, followed by Phase 05 (polish & launch prep).

## Phases

- [x] **Phase 01: Foundation & Project Setup** - Expo project, design system, database, navigation shell
- [x] **Phase 02: Core Interaction — The Joystick System** - Pan gestures, swipe logging, radial target menu, triangle layout
- [x] **Phase 03: Goals, Targets & Privacy** - CRUD goals, lifecycle tracking, privacy codenames, auth
- [ ] **Phase 04: Analytics & Visualization** - Bullet journal charts, physics body-fill, time periods
- [ ] **Phase 05: Polish, Export & Launch Prep** - Export/import, notifications, onboarding, performance

## Phase Details

### Phase 01: Foundation & Project Setup
**Goal**: Set up the Expo project, configure all dependencies, define data models, implement local storage layer, and establish the app shell with navigation.
**Depends on**: Nothing (first phase)
**Requirements**: [LOG-01, DATA-01, DATA-04]
**Success Criteria** (what must be TRUE):
  1. Expo app boots with TypeScript, all dependencies installed
  2. SQLite schema handles logs, pillars, targets, goals, periods
  3. Zustand stores with MMKV persistence operational
  4. Tab navigation (Home, Analytics, Goals, Settings) working
  5. Design system defined (dark mode, colors, typography, spacing)
**Plans**: 4 plans

Plans:
- [x] 01-01: Project initialization & dependencies
- [x] 01-02: Design system & theme configuration
- [x] 01-03: Database schema & state management
- [x] 01-04: Navigation shell & reusable components

### Phase 02: Core Interaction — The Joystick System
**Goal**: Build the heart of the app — 3 interactive joystick analogs with swipe-to-log and swipe+hold-to-target gestures.
**Depends on**: Phase 01
**Requirements**: [LOG-01, LOG-02, LOG-03, LOG-04]
**Success Criteria** (what must be TRUE):
  1. Joystick knob follows thumb via Pan gesture on native UI thread at 60fps
  2. 4-directional swipe detection with 45-degree wedge algorithm
  3. Quick swipe creates a log entry in SQLite
  4. Swipe + hold reveals radial menu for target selection
  5. 3 joysticks visible in triangle layout on home screen
  6. Haptic feedback and color flash animation on swipe
**Plans**: 4 plans

Plans:
- [x] 02-01: Core Joystick component (wave 1)
- [x] 02-02: Swipe logging and haptic feedback (wave 1)
- [x] 02-03: Radial menu for target selection (wave 2)
- [x] 02-04: Integration and visual polish (wave 2)

### Phase 03: Goals, Targets & Privacy
**Goal**: Build the goal/target management system with full lifecycle tracking and the privacy codename feature.
**Depends on**: Phase 02
**Requirements**: [GOAL-01, GOAL-02, GOAL-03, PRIV-01, PRIV-02]
**Success Criteria** (what must be TRUE):
  1. Goals can be created, edited, masked, completed, paused, and archived
  2. Full goal history/changelog tracking
  3. Privacy codenames auto-assigned from pool of ~30
  4. Password-protected reveal for real goal names
  5. Targets appear in joystick hold radial menu
**Plans**: 4 plans

Plans:
- [x] 03-01: Goals CRUD screen (wave 1)
- [x] 03-02: Goal lifecycle and history tracking (wave 1)
- [x] 03-03: Privacy codename system (wave 2)
- [x] 03-04: Integration and polish (wave 2)

### Phase 04: Analytics & Visualization
**Goal**: Build both the traditional analytics view (bullet journal style) and the creative physics body-fill visualization.
**Depends on**: Phase 03
**Requirements**: [VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05]
**Success Criteria** (what must be TRUE):
  1. Log history view filterable by pillar/direction
  2. Bullet journal style charts (bar, pie, trend lines) render correctly
  3. Time period selector works (today, week, month, custom range)
  4. Human body silhouette SVG renders with Matter.js physics balls
  5. Colored balls fill body in log order with correct pillar colors
  6. Period comparison view shows this week vs last week
  7. Target-specific analytics show individual target trends
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Install chart dependencies, data aggregation layer, analytics screen scaffold with period selector
- [ ] 04-02-PLAN.md — Build chart components (bar, donut, trend line, summary stats) and wire into analytics screen
- [ ] 04-03-PLAN.md — Physics body-fill visualization (SVG body, Matter.js engine, Skia canvas, full-screen modal)
- [ ] 04-04-PLAN.md — Comparison cards, target analytics, body-fill preview card, final integration

### Phase 05: Polish, Export & Launch Prep
**Goal**: Final polish — export/import, reminders, onboarding, performance optimization, and launch preparation.
**Depends on**: Phase 04
**Requirements**: [DATA-02, DATA-03, NOTIFY-01, NOTIFY-02, POLISH-01, POLISH-02, POLISH-03]
**Success Criteria** (what must be TRUE):
  1. Export produces JSON file with all data
  2. Import restores from backup with validation
  3. Daily review notification at configurable time
  4. Onboarding explains 3 pillars + gesture tutorial
  5. Settings screen functional (reminders, password, data management)
  6. App icon and splash screen designed
  7. Performance optimized (gesture fps, Skia rendering, SQLite queries)
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 01. Foundation | 4/4 | Complete | 2026-03-23 |
| 02. Joystick System | 4/4 | Complete | 2026-03-23 |
| 03. Goals & Privacy | 4/4 | Complete | 2026-03-23 |
| 04. Analytics & Viz | 1/4 | In Progress|  |
| 05. Polish & Launch | 0/0 | Not started | - |
