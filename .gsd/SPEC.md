# SPEC.md — Project Specification

> **Status**: `FINALIZED`
> **Project Name**: Hayat (حياة) — Life Balance Tracker
> **Date**: 2026-03-23

## Vision

A mobile-first personal progress tracking app rooted in Islamic well-being principles and Cognitive Behavioral Therapy (CBT). Users track their daily actions across three life pillars — their relationship with Allah, with themselves, and with others — using an intuitive joystick-based gesture system. The app encourages mindful self-awareness by making behavioral patterns visible through creative visualizations, including a physics-based body-fill display that gives an instant emotional read on your life balance.

## Goals

1. **Effortless Logging** — Track positive/negative, direct/indirect actions across 3 life pillars using a joystick swipe gesture (< 2 seconds per log)
2. **Targeted Behavior Tracking** — Attach specific goals/targets to logs (e.g., "reduce social media") via swipe-and-hold gesture with sub-target selection
3. **Creative Visualization** — Display progress through both traditional analytics (bullet journal style charts) and a physics-based human body silhouette that fills with colored balls representing actions
4. **CBT-Driven Self-Awareness** — Encourage the CBT cycle (thoughts → feelings → behaviors) by surfacing behavioral patterns across customizable time periods
5. **Privacy-First Design** — Goal names can be masked with auto-assigned funny codenames from a pool of ~30, viewable only with a password
6. **Zero-Friction Goal Management** — Goals can be smoothly created, edited, paused, completed, or failed — with full history tracking
7. **Data Sovereignty** — All data stored locally on device, with export/import functionality for backups (no accounts, no cloud)

## Non-Goals (Out of Scope for v1)

- User accounts or authentication system
- Cloud sync or MongoDB backend (future milestone)
- Social/sharing features
- Multi-device sync
- Web version
- Gamification (badges, streaks, leaderboards)
- AI-powered insights or recommendations

## Core Concepts

### The 3 Pillars (Analogs)

Each pillar is represented by an interactive **joystick element** on the main screen, arranged in a **triangle layout** (Afterlife at the top, Self and Others at the bottom):

| Pillar | Arabic | Description | Example Actions |
|--------|--------|-------------|-----------------|
| **1. Afterlife** | الآخرة | Spiritual relationship — faith, worship, devotion | Prayer, Quran reading, dhikr, dua |
| **2. With Self** | مع النفس | Personal well-being — body, mind, soul | Exercise, meditation, study, rest, health |
| **3. With Others** | مع الناس | Social relationships — family, friends, community | Family time, helping others, good conversation |

**Important**: Targets/goals are strictly **per-pillar**. A target belongs to exactly one pillar and cannot span multiple pillars.

### Swipe Directions (Quick Log)

| Direction | Meaning | Example |
|-----------|---------|---------|
| ⬆️ **Up** | Direct positive action | "I prayed Fajr on time" |
| ⬇️ **Down** | Direct negative action | "I skipped prayer" |
| ➡️ **Right** | Indirect positive action | "I watched a video about health benefits of fasting" |
| ⬅️ **Left** | Indirect negative action | "I read something that weakened my motivation" |

### Swipe + Hold (Targeted Log)

After swiping in a direction, the user can **hold** to reveal their custom targets/goals for that pillar. They drag to a target to tag the log entry specifically. This creates a targeted log with both a direction (good/bad, direct/indirect) and a specific goal reference.

### Optional Notes

Each log entry can optionally include a short text note. Notes are not required for quick logging but can be added for context (e.g., "prayed at the masjid" or "watched a health documentary"). Notes can also be added/edited later from the log history.

### Privacy Codenames

Goals can be assigned a funny codename from a pre-built pool (~30 names like "Angry Birds", "Rubber Duck", "Moon Walker", etc.). The real name is hidden behind a password. This allows the app to be used in public without revealing personal goals.

### Daily Review (Notification-Based)

The app sends a configurable daily notification reminding the user to log what they did today. Tapping the notification opens the app's Home screen where the user can quickly log all their actions for the day via the joystick system. There is no separate daily review screen — the review IS the act of logging, prompted by the notification.

### Time Periods

Users can define custom time periods (weekly, monthly, Ramadan, custom date range) to evaluate their behavior patterns and set goals within those windows.

## Users

**Primary**: An individual Muslim who wants to become more self-aware of their behavioral patterns across the three key life pillars. They value privacy, simplicity, and meaningful self-reflection over social features.

**Usage context**: Quick logging throughout the day (1-2 second interactions), followed by periodic reviews (daily, weekly, or at custom intervals). The app should feel personal, like a private journal — not like a social platform.

## Constraints

- **Platform**: Mobile-first (iOS + Android) via React Native + Expo
- **Storage**: Local-only (no server required for v1)
- **Gestures**: Must feel smooth and responsive (60fps) — gestures run on native UI thread
- **Privacy**: No data leaves the device unless explicitly exported by user
- **Language**: English UI first, with RTL/Arabic support planned for future
- **Accessibility**: Must work with one hand (joystick interaction designed for thumb reach)

## Success Criteria

- [ ] User can log an action in under 2 seconds via joystick swipe
- [ ] User can attach a specific target to a log via swipe-and-hold in under 4 seconds
- [ ] All 3 pillar joysticks visible in triangle layout on main screen
- [ ] Analytics show bullet-journal-style charts for any time period
- [ ] Physics body-fill visualization renders colored balls correctly with gravity
- [ ] Goals can be created, edited, masked (codename), completed, and archived
- [ ] Targets are strictly per-pillar (cannot span multiple pillars)
- [ ] Data persists across app restarts (local storage)
- [ ] Export produces a JSON/encrypted file; import restores all data
- [ ] App runs fully offline with zero network requirements
- [ ] Daily review notification prompts user to log at configured time
