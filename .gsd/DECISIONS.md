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
