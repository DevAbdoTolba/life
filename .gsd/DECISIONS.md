# DECISIONS.md — Architecture Decision Records

## ADR-001: Framework Choice — React Native + Expo
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need a cross-platform mobile framework that handles complex gestures (swipe, hold, drag), 2D physics rendering, and local storage.
**Decision**: React Native + Expo with TypeScript
**Rationale**: Developer has JS/Node expertise, Expo simplifies builds, RNGH+Reanimated proven for gesture-heavy apps, Matter.js+Skia available for physics viz.
**Alternatives Rejected**: Flutter (would require learning Dart), SwiftUI (iOS only)

## ADR-002: Local Storage — Expo SQLite
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need reliable local database for logs, goals, and targets. No cloud sync needed for v1.
**Decision**: Expo SQLite as primary database, MMKV for settings/preferences
**Rationale**: Built-in to Expo (zero config), sufficient for local-only use case. WatermelonDB adds unneeded sync complexity for v1.
**Migration Path**: Can migrate to WatermelonDB if cloud sync is added in v1.1

## ADR-003: No Cloud Sync for v1
**Date**: 2026-03-23
**Status**: Accepted
**Context**: User wants data sovereignty. All data local. Export/import for backups.
**Decision**: Fully local app with JSON export/import. No accounts, no server, no sync.
**Rationale**: Simplicity, privacy, faster development. Cloud sync planned for v1.1 milestone.

## ADR-004: Privacy — Codename Pool
**Date**: 2026-03-23
**Status**: Accepted
**Context**: User wants to mask goal names for public privacy (e.g., someone looking at phone screen).
**Decision**: Pool of ~30 pre-built funny codenames auto-assigned to goals. Real name hidden behind password.
**Rationale**: More fun and less effort than user typing custom codenames. Password unlock prevents casual snooping.

## ADR-005: Visualization — Matter.js + Skia
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need physics-based body-fill visualization where colored balls fill a human silhouette.
**Decision**: Matter.js for physics calculations, React Native Skia for rendering.
**Rationale**: Proven combination in Expo ecosystem. Lightweight (no full game engine needed). Well-documented.

## ADR-006: No MongoDB Realm
**Date**: 2026-03-23
**Status**: Accepted
**Context**: MongoDB Atlas Device Sync (Realm) is being deprecated September 2025.
**Decision**: Do not use Realm. If sync is needed later, use WatermelonDB sync protocol with custom Node.js/Express/MongoDB backend.
**Rationale**: Cannot build on a platform being sunset. Custom sync gives more control anyway.

---

## Phase 1 Discussion Decisions (2026-03-23)

## ADR-007: Pillar 1 Naming — "Afterlife" (not "Allah")
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Pillar 1 represents the spiritual/faith relationship. Original naming used "With Allah" directly.
**Decision**: Rename to "Afterlife" (الآخرة) out of respect.
**Rationale**: More respectful usage. "Afterlife" captures the spiritual dimension — praying, reading Quran, worship — as actions oriented toward the hereafter.

## ADR-008: Dark Mode Only
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need to decide between dark mode, light mode, or both.
**Decision**: Dark mode only for v1. No light mode toggle.
**Rationale**: Feels more personal and journal-like. Reduces design/theming scope. Can add light mode in future if requested.

## ADR-009: Minimalist Typography
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need to select a font style for the app.
**Decision**: Clean minimalist sans-serif font (Inter or similar).
**Rationale**: Matches the app's philosophy of simplicity and focus. Inter has excellent readability on mobile at all sizes.

## ADR-010: Triangle Joystick Layout
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need to decide how to arrange the 3 joysticks on the main screen. Options were vertical stack, triangle, or bottom bar.
**Decision**: Triangle layout — Afterlife at the top, Self bottom-left, Others bottom-right.
**Rationale**: Gives Afterlife visual priority at the top. Natural triangle arrangement avoids scrolling. All 3 joysticks visible simultaneously.

## ADR-011: Targets Are Strictly Per-Pillar
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need to decide if a target/goal can span multiple pillars.
**Decision**: Each target belongs to exactly one pillar. No cross-pillar targets.
**Rationale**: Keeps the data model simple and the joystick hold menu clean. If something touches two pillars, create two separate targets.

## ADR-012: Daily Review = Notification, Not a Screen
**Date**: 2026-03-23
**Status**: Accepted
**Context**: Daily review was originally a separate tab/screen. User clarified it should be simpler.
**Decision**: Daily review is a scheduled notification that prompts the user to open the app and log. No separate review screen — the review IS the act of logging from Home.
**Rationale**: Keeps the app lightweight. The user's mental model is "notification reminds me → I open app → I log via joysticks." No extra UI needed.
