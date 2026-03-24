# Roadmap: Hayat (Life Balance Tracker)

## Milestones

- ✅ **v1.0 MVP** — Phases 01-08 (shipped 2026-03-24) — [archive](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Refinement & Polish** — Phases 09-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 01-08) — SHIPPED 2026-03-24</summary>

- [x] Phase 01: Foundation & Project Setup (4 plans) — completed 2026-03-23
- [x] Phase 02: Core Interaction — The Joystick System (4 plans) — completed 2026-03-23
- [x] Phase 03: Goals, Targets & Privacy (4 plans) — completed 2026-03-23
- [x] Phase 04: Analytics & Visualization (4 plans) — completed 2026-03-23
- [x] Phase 05: Polish, Export & Launch Prep (5 plans) — completed 2026-03-23
- [x] Phase 06: Swipe Note Entry (2 plans) — completed 2026-03-24
- [x] Phase 07: Integration Wiring Fixes (2 plans) — completed 2026-03-24
- [x] Phase 08: Custom Date Range Picker (2 plans) — completed 2026-03-24

</details>

### 🚧 v1.1 Refinement & Polish (In Progress)

**Milestone Goal:** Fix broken behaviors, correct UX misunderstandings, and elevate the visual/tactile experience of the joystick system.

- [x] **Phase 09: Foundation Fixes** — Repair screen wake lock and body-fill physics; remove hooks anti-pattern blocking visual work (completed 2026-03-24)
- [ ] **Phase 10: Gesture Interaction Overhaul** — Fix joystick hold behavior: center-hold toggles notes, directional hold fans targets at 30-degree intervals
- [ ] **Phase 11: Hold Interaction Visuals** — Quadrant separator lines, section fill on hold, and haptic feedback — all triggered at hold-start
- [ ] **Phase 12: Analytics & Layout** — Line chart for daily activity, joystick and activity list repositioned for thumb reach
- [ ] **Phase 13: Advanced Visual Polish** — Liquid joystick glow, background hue shift on drag, emoji clutter removed with pillar icons

## Phase Details

### Phase 9: Foundation Fixes
**Goal**: Shipped features that are currently non-functional work correctly and the codebase is safe to extend with new animated styles
**Depends on**: Phase 8 (v1.0 complete)
**Requirements**: BUG-01, BUG-02, HOOK-01
**Success Criteria** (what must be TRUE):
  1. Home screen does not dim or lock while a joystick gesture is in progress
  2. Body-fill visualization renders balls that fall and settle using physics when the screen loads
  3. Adding a new `useAnimatedStyle` call to `Joystick.tsx` does not produce non-deterministic behavior (hooks violation resolved)
**Plans**: 2 plans
Plans:
- [x] 09-01-PLAN.md — Inline hooks: remove createIndicatorStyle factory from Joystick.tsx and GestureSlide.tsx (HOOK-01)
- [x] 09-02-PLAN.md — Fix body-fill physics rendering and screen wake lock (BUG-01, BUG-02)

### Phase 10: Gesture Interaction Overhaul
**Goal**: The joystick hold gesture behaves as designed — center hold is a note-mode toggle, directional hold reveals a clean target fan, and notes are never prompted on plain swipes
**Depends on**: Phase 9
**Requirements**: BUG-03, BUG-04, UX-01
**Success Criteria** (what must be TRUE):
  1. Holding the joystick center triggers a vibration and activates note mode — no target menu appears
  2. Holding in a direction reveals targets fanned at 30-degree fixed intervals around the swipe direction
  3. Completing a swipe without a prior center-hold never opens the note prompt
  4. Releasing a directional hold dismisses the target fan without logging an entry
**Plans**: TBD
**UI hint**: yes

### Phase 11: Hold Interaction Visuals
**Goal**: The joystick communicates its four quadrants visually at rest and reacts with color and haptics the moment a hold begins
**Depends on**: Phase 10
**Requirements**: VIS-01, VIS-02, VIS-04
**Success Criteria** (what must be TRUE):
  1. Four separator lines are visible on the joystick base dividing it into quadrants at rest
  2. When a hold begins, the active quadrant fills with color and the app background shifts to match
  3. A haptic pulse fires at the instant hold-start is detected — before any target menu appears
**Plans**: TBD
**UI hint**: yes

### Phase 12: Analytics & Layout
**Goal**: The daily activity chart shows trend continuity with a line chart, and the home screen layout places joysticks and the activity list where thumbs naturally reach
**Depends on**: Phase 9
**Requirements**: UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. Daily activity displays as a line chart — individual data points connected by a continuous line, no bar overflow
  2. All three joystick analogs are positioned in the lower thumb-reach zone without scrolling
  3. The activity list sits below the viewport with only the most recent entry peeking up, scrollable on demand
**Plans**: TBD
**UI hint**: yes

### Phase 13: Advanced Visual Polish
**Goal**: The joystick feels alive — it glows and distorts like liquid when dragged, the background shifts hue toward the active pillar color, and the UI uses clean pillar icons instead of emoji
**Depends on**: Phase 11
**Requirements**: VIS-03, VIS-05, VIS-06
**Success Criteria** (what must be TRUE):
  1. The joystick ring shows an intensifying water-drop glow effect as drag distance increases
  2. The app background hue shifts smoothly toward the active pillar color while dragging and returns to neutral on release
  3. No emoji appear anywhere in the UI — each pillar is represented by its own simple icon
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Project Setup | v1.0 | 4/4 | Complete | 2026-03-23 |
| 2. Core Interaction — Joystick System | v1.0 | 4/4 | Complete | 2026-03-23 |
| 3. Goals, Targets & Privacy | v1.0 | 4/4 | Complete | 2026-03-23 |
| 4. Analytics & Visualization | v1.0 | 4/4 | Complete | 2026-03-23 |
| 5. Polish, Export & Launch Prep | v1.0 | 5/5 | Complete | 2026-03-23 |
| 6. Swipe Note Entry | v1.0 | 2/2 | Complete | 2026-03-24 |
| 7. Integration Wiring Fixes | v1.0 | 2/2 | Complete | 2026-03-24 |
| 8. Custom Date Range Picker | v1.0 | 2/2 | Complete | 2026-03-24 |
| 9. Foundation Fixes | v1.1 | 1/2 | In Progress|  |
| 10. Gesture Interaction Overhaul | v1.1 | 0/? | Not started | - |
| 11. Hold Interaction Visuals | v1.1 | 0/? | Not started | - |
| 12. Analytics & Layout | v1.1 | 0/? | Not started | - |
| 13. Advanced Visual Polish | v1.1 | 0/? | Not started | - |
