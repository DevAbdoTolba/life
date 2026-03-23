# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0 — Personal Release

## Must-Haves (from SPEC)

- [ ] 3 joystick analogs on main screen (one per pillar)
- [ ] Swipe in 4 directions to log actions (up/down/left/right)
- [ ] Swipe + hold to reveal and select specific targets
- [ ] Local data persistence (SQLite)
- [ ] Goal/target management with lifecycle tracking
- [ ] Privacy codenames (pool of ~30 funny names, password-protected reveal)
- [ ] Bullet journal style analytics
- [ ] Physics body-fill visualization (Matter.js + Skia)
- [ ] Daily review notification (not a screen — prompts logging)
- [ ] Custom time periods for evaluation
- [ ] Export/import data as backup file
- [ ] Period review reminders

## Phases

### Phase 1: Foundation & Project Setup
**Status**: ✅ Complete
**Objective**: Set up the Expo project, configure all dependencies, define data models, implement local storage layer, and establish the app shell with navigation.
**Delivers**: A running app skeleton with working local database, navigation structure, and design system (colors, typography, theming).
**Key Tasks**:
- Initialize Expo project with TypeScript
- Install and configure all dependencies (gesture handler, reanimated, skia, etc.)
- Design and implement SQLite schema (logs, pillars, targets, goals, periods)
- Create Zustand stores with MMKV persistence
- Set up expo-router file-based navigation (Home, Analytics, Goals, Settings)
- Define design system:
  - **Dark mode only** (no light mode for v1)
  - **Color palette**: Afterlife (Gold #F5A623 / Purple #6B21A8), Self (Emerald #10B981 / Crimson #EF4444), Others (Blue #3B82F6 / Slate #64748B)
  - **Typography**: Minimalist font (Inter or similar clean sans-serif)
  - **Layout**: Triangle joystick arrangement (Afterlife top, Self bottom-left, Others bottom-right)
  - Spacing scale, border radii, shadows
- Create reusable UI components (buttons, cards, modals)

### Phase 2: Core Interaction — The Joystick System
**Status**: ⬜ Not Started
**Objective**: Build the heart of the app — 3 interactive joystick analogs with swipe-to-log and swipe+hold-to-target gestures.
**Delivers**: A fully functional main screen where users can log actions via joystick gestures with haptic feedback and smooth animations.
**Key Tasks**:
- Build the Joystick component with react-native-gesture-handler
- Implement 4-directional swipe detection with visual feedback
- Implement swipe + hold → target selection radial menu
- Add haptic feedback on swipe and selection
- Create log confirmation animation (the joystick snaps back with color flash)
- Wire joystick actions to SQLite (create log entries)
- Build the main screen with triangle layout (Afterlife top, Self bottom-left, Others bottom-right)
- Handle edge cases (accidental swipes, incomplete gestures)

### Phase 3: Goals, Targets & Privacy
**Status**: ⬜ Not Started
**Objective**: Build the goal/target management system with full lifecycle tracking and the privacy codename feature.
**Delivers**: Users can create, edit, mask, complete, pause, and archive goals. Goals appear as targets in the joystick hold menu.
**Key Tasks**:
- Create Goals screen with CRUD operations
- Implement goal lifecycle states (active, paused, completed, failed, reduced, increased)
- Build goal history/changelog tracking
- Implement privacy codename pool (~30 funny names) with auto-assignment
- Build password-protected reveal for real goal names
- Create target selection UI that appears on joystick hold
- Link targets to log entries in the database
- Build goal editing with smooth transitions

### Phase 4: Analytics & Visualization
**Status**: ⬜ Not Started
**Objective**: Build both the traditional analytics view (bullet journal style) and the creative physics body-fill visualization.
**Delivers**: Users can see their progress through charts and the human silhouette body-fill, filtered by custom time periods.
**Key Tasks**:
- Build log history view (accessible from Home, filterable by pillar/direction)
- Create bullet journal style charts (bar charts, pie charts, trend lines)
- Implement custom time period selector (today, week, month, Ramadan, custom range)
- Build the human body silhouette SVG/path
- Implement Matter.js physics world (gravity, collision, containment)
- Create colored ball rendering with Skia inside the body silhouette
- Animate balls filling the body in log order with correct pillar colors
- Build period comparison view (this week vs last week)
- Implement target-specific analytics (how is "social media" trending?)

### Phase 5: Polish, Export & Launch Prep
**Status**: ⬜ Not Started
**Objective**: Final polish — export/import, reminders, onboarding, performance optimization, and launch preparation.
**Delivers**: A complete, polished v1.0 ready for personal use with all data safety features.
**Key Tasks**:
- Build export functionality (JSON file with all data)
- Build import functionality (restore from backup file)
- Add data validation on import
- Implement daily review notification via expo-notifications (configurable time)
- Create onboarding flow (explain the 3 pillars + gesture tutorial)
- Performance optimization (gesture frame rate, Skia rendering, SQLite queries)
- App icon and splash screen design
- Final UX review and edge case handling
- Build Settings screen (reminder frequency, codename password, data management)

---

## Future Milestones (Post v1.0)

### v1.1 — Cloud Sync
- Node.js + Express + MongoDB Atlas backend
- WatermelonDB migration for sync protocol
- Offline-first with sync when online
- Multi-device support

### v1.2 — Social & Friends
- Optional user accounts
- Share progress with accountability partners
- Community goals/challenges

### v1.3 — Localization
- Arabic (RTL) UI support
- Other languages

### v1.4 — Advanced Insights
- AI-powered pattern recognition
- Personalized recommendations
- Predictive analytics
