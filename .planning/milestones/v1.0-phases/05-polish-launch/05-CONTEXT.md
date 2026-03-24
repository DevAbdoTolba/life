# Phase 05: Polish, Export & Launch Prep - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Final polish for launch readiness: export/import data backup, push notifications (daily review + period reminders), onboarding tutorial flow, full settings screen, app icon and splash screen, and performance optimization. This phase replaces the settings placeholder and adds all remaining v1 features before launch.

Requirements covered: DATA-02, DATA-03, NOTIFY-01, NOTIFY-02, POLISH-01, POLISH-02, POLISH-03.

</domain>

<decisions>
## Implementation Decisions

### Export/Import Flow
- **D-01:** Export triggered from Settings screen "Data" section — produces a single JSON file containing all tables (logs, targets, target_history, periods, settings)
- **D-02:** Export uses the OS share sheet (via expo-sharing) so user can save to Files, send via message, email, etc.
- **D-03:** Import reads a JSON file, validates schema structure, shows a summary of what will be imported (log count, target count, date range), and requires user confirmation before proceeding
- **D-04:** Import is full replace (not merge) — user is warned that existing data will be overwritten. Simplest approach for v1; merge complexity deferred

### Onboarding Experience
- **D-05:** Swipeable card carousel, 3-4 screens: (1) Welcome + 3 pillars concept, (2) Gesture tutorial with interactive practice swipe on a demo joystick, (3) Privacy/codename feature overview, (4) optional — analytics preview
- **D-06:** Interactive gesture demo on screen 2 — user practices a swipe on a dummy joystick to build muscle memory before the real app
- **D-07:** Skip button visible on all onboarding screens — respects user autonomy
- **D-08:** Onboarding shown on first launch only, gated by `settingsStore.onboardingComplete` (field already exists)
- **D-09:** After onboarding completion or skip, navigate to home tab and never show again

### Notification Strategy
- **D-10:** Use expo-notifications for both local daily reminders and period review notifications
- **D-11:** Daily reminder: gentle, neutral prompt (e.g., "Time for your daily check-in") — not gamified, aligns with mindful journaling tone
- **D-12:** Reminder time configurable in settings, default 21:00 (already in settingsStore.reminderTime)
- **D-13:** Period review: weekly summary notification on a configurable day, content mentions pillar activity counts for the past week
- **D-14:** Notification permission requested when user first enables reminders in settings — graceful fallback message if denied
- **D-15:** Notifications are purely local — no server component needed

### Settings Screen Layout
- **D-16:** Grouped sections with section headers: Reminders, Privacy, Data, About
- **D-17:** Reminders section: toggle enable/disable, time picker, weekly review day picker
- **D-18:** Privacy section: toggle privacy mode, change PIN (uses existing authStore/settingsStore)
- **D-19:** Data section: Export button, Import button, data stats (total logs, date range)
- **D-20:** About section: app version, credits
- **D-21:** ScreenContainer with scrollable=true, consistent with analytics screen pattern
- **D-22:** Section header + Card-based row items pattern — dark surface cards matching existing Card component

### App Icon & Splash Screen
- **D-23:** App icon: abstract geometric symbol representing balance/three pillars — minimalist, works on both light and dark OS backgrounds
- **D-24:** Splash screen: centered icon with "Hayat" app name text, dark background matching colors.background (#0A0A0F)
- **D-25:** Use expo-splash-screen (already imported in _layout.tsx) for splash management

### Performance Optimization
- **D-26:** Profile and optimize gesture fps (target: consistent 60fps on mid-range devices)
- **D-27:** Optimize Skia rendering in body-fill visualization — check for unnecessary re-renders
- **D-28:** SQLite query optimization — ensure indexes are hit for common analytics queries (already indexed on created_at, pillar_id)

### Claude's Discretion
- Onboarding illustration style and color palette for each screen
- Exact notification copy/wording
- Settings row component design (height, padding, icon usage)
- Export file naming convention (e.g., hayat-backup-2026-03-23.json)
- Performance profiling methodology and specific optimizations
- Import progress indicator design
- Carousel animation/transition style for onboarding

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Settings & State Management
- `src/stores/settingsStore.ts` — Has reminderEnabled, reminderTime, onboardingComplete, privacyPassword, isPrivacyMode fields already defined
- `src/stores/authStore.ts` — PIN-based unlock system, setPin/unlock/lock actions
- `src/stores/storage.ts` — MMKV-backed Zustand persistence layer

### Data Layer
- `src/database/schema.ts` — All 5 tables (logs, targets, target_history, periods, settings) that need export/import
- `src/database/db.ts` — Database initialization and access
- `src/database/types.ts` — TypeScript types for all database entities
- `src/stores/logStore.ts` — Log CRUD operations, query patterns for data export

### App Shell & Navigation
- `app/_layout.tsx` — Root layout with SplashScreen management, font loading, DB init — onboarding gate goes here
- `app/(tabs)/settings.tsx` — Current placeholder to be replaced with full settings screen
- `app/(tabs)/_layout.tsx` — Tab navigation configuration

### Design System
- `src/constants/colors.ts` — Dark theme palette, pillar colors
- `src/constants/theme.ts` — Typography (Inter family), spacing, border radius tokens
- `src/components/ui/` — Card, Button, Badge, Text, ScreenContainer components

### Requirements
- `.planning/REQUIREMENTS.md` §Notifications — NOTIFY-01, NOTIFY-02 acceptance criteria
- `.planning/REQUIREMENTS.md` §Data — DATA-02, DATA-03 acceptance criteria
- `.planning/REQUIREMENTS.md` §Polish — POLISH-01, POLISH-02, POLISH-03 acceptance criteria

### Prior Phase Context
- `.planning/phases/04-analytics-visualization/04-CONTEXT.md` — Established scrollable card-section pattern, ScreenContainer usage, journal-not-corporate aesthetic

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` component (`src/components/ui/Card.tsx`): Dark surface card — use for settings rows grouped in sections
- `ScreenContainer` (`src/components/ui/ScreenContainer.tsx`): Scrollable screen wrapper — use for settings screen
- `Button` (`src/components/ui/Button.tsx`): Themed button — use for Export/Import actions
- `Text` (`src/components/ui/Text.tsx`): Themed text component for consistent typography
- `settingsStore`: Already has reminderEnabled, reminderTime, onboardingComplete, privacyPassword, isPrivacyMode — minimal new state needed
- `authStore`: PIN management already implemented — settings privacy section wires into this

### Established Patterns
- Zustand stores with MMKV persistence for app settings
- SQLite for structured data (logs, targets, periods)
- StyleSheet.create with theme constants from `src/constants`
- Expo Router file-based routing with tab navigation
- SplashScreen.preventAutoHideAsync() → hideAsync() pattern in _layout.tsx
- Full-screen modal pattern (body-fill) for overlay views

### Integration Points
- `app/(tabs)/settings.tsx` — Replace placeholder with full settings screen
- `app/_layout.tsx` — Add onboarding gate check before showing main app (check settingsStore.onboardingComplete)
- `app/` directory — May need new route for onboarding screens (e.g., `app/onboarding.tsx`)
- Expo config (`app.json` / `app.config.ts`) — App icon and splash screen configuration
- `package.json` — Add expo-notifications, expo-sharing, expo-file-system, expo-document-picker dependencies

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The onboarding should feel warm and inviting while maintaining the dark minimalist aesthetic. The gesture demo during onboarding is the key differentiator — users need to physically try the swipe before using the real app.

</specifics>

<deferred>
## Deferred Ideas

- Data migration strategy from SQLite to WatermelonDB for v1.1 cloud sync (from STATE.md pending todos)
- Islamic calendar integration for Ramadan periods
- "Neutral" swipe (tap without direction) as a 5th action type
- Home screen widget support
- Light mode option

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-polish-launch*
*Context gathered: 2026-03-23*
