# Phase 05: Polish, Export & Launch Prep - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 05-polish-launch
**Areas discussed:** Export/Import Flow, Onboarding Experience, Notification Strategy, Settings Screen Layout, App Icon & Splash
**Mode:** Auto (--auto flag — all choices auto-selected to recommended defaults)

---

## Export/Import Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Share sheet from Settings | OS-native share sheet via expo-sharing | ✓ |
| Save to app directory | Write file to local storage only | |
| Clipboard export | Copy JSON to clipboard | |

**User's choice:** [auto] Share sheet from Settings (recommended default)
**Notes:** Single JSON file with all tables. Import validates schema, shows summary, requires confirmation. Full replace (not merge) for v1 simplicity.

---

## Onboarding Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Swipeable card carousel | 3-4 screens, familiar mobile pattern | ✓ |
| Full-screen walkthrough | Page-by-page with illustrations | |
| Inline tooltips | Contextual hints on first use | |

**User's choice:** [auto] Swipeable card carousel (recommended default)
**Notes:** Includes interactive gesture demo (practice swipe on dummy joystick). Skip button on all screens. Gated by settingsStore.onboardingComplete. Shows on first launch only.

---

## Notification Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| expo-notifications (local) | Expo ecosystem, well-documented | ✓ |
| react-native-push-notification | Community library, more config | |

**User's choice:** [auto] expo-notifications (recommended default)
**Notes:** Gentle neutral prompt style. Daily reminder at configurable time (default 21:00). Weekly period review on configurable day. Permission requested on first enable. No server component.

---

## Settings Screen Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped sections with headers | Reminders, Privacy, Data, About | ✓ |
| Flat list | Single scrollable list | |
| Tabbed settings | Sub-tabs within settings | |

**User's choice:** [auto] Grouped sections with headers (recommended default)
**Notes:** Card-based row items matching existing Card component. ScreenContainer scrollable. Data section has Export/Import buttons. Privacy section has PIN management and privacy toggle.

---

## App Icon & Splash

| Option | Description | Selected |
|--------|-------------|----------|
| Abstract geometric (balance/pillars) | Minimalist, dark aesthetic | ✓ |
| Calligraphy-based (حياة) | Arabic script focus | |
| Gradient abstract | Modern gradient approach | |

**User's choice:** [auto] Abstract geometric representing balance/three pillars (recommended default)
**Notes:** Splash uses dark background (#0A0A0F), centered icon with "Hayat" text. Uses existing expo-splash-screen integration.

---

## Claude's Discretion

- Onboarding illustration style
- Notification copy/wording
- Settings row component design
- Export file naming
- Performance profiling methodology
- Import progress indicator
- Carousel animation style

## Deferred Ideas

- SQLite → WatermelonDB migration (v1.1)
- Islamic calendar integration
- Neutral swipe (tap without direction)
- Home screen widget
- Light mode
