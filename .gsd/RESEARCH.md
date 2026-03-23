# RESEARCH.md — Technology Research

> **Date**: 2026-03-23
> **Status**: `COMPLETE`

## Framework Decision: React Native + Expo

### Research Summary

Evaluated three frameworks for a gesture-heavy, mobile-first tracking app with physics visualizations:

| Criteria | React Native + Expo | Flutter | SwiftUI |
|---|---|---|---|
| **Gesture System** | `react-native-gesture-handler` + `react-native-reanimated` — native UI thread, 60fps | Built-in `GestureDetector` + GestureArena — excellent | Native, excellent — but iOS only |
| **Physics + 2D Viz** | Matter.js + React Native Skia + Reanimated — proven combo | Custom rendering engine — capable | SpriteKit — powerful but iOS only |
| **Local Storage** | Expo SQLite, WatermelonDB, MMKV | Hive, Isar, ObjectBox | Core Data, SwiftData |
| **Export/Import** | `expo-file-system` + `expo-sharing` | path_provider + share_plus | FileManager + UIActivityViewController |
| **Cross-platform** | ✅ iOS + Android | ✅ iOS + Android | ❌ iOS only |
| **Developer Background** | ✅ JavaScript/Node.js (existing skills) | ❌ Dart (would need to learn) | ❌ Swift (would need to learn) |
| **Ecosystem Maturity** | Very mature, huge npm ecosystem | Mature, growing pub.dev | Mature but Apple-only |

### Decision: React Native + Expo ✅

**Rationale:**
1. Developer has existing JavaScript/Node.js expertise (see past projects with Express, MongoDB)
2. Cross-platform from day one (iOS + Android)
3. Proven gesture handling stack (RNGH + Reanimated) runs gestures on native UI thread
4. Matter.js + Skia combo is documented and proven in Expo for physics visualizations
5. Expo managed workflow simplifies builds, OTA updates, and device testing
6. If MongoDB sync is added later, the JS ecosystem makes this trivial (WatermelonDB sync protocol)

---

## Tech Stack (Finalized)

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | React Native + Expo (SDK 52+) | Cross-platform, managed workflow |
| **Language** | TypeScript | Type safety for data models |
| **Gestures** | `react-native-gesture-handler` v2 | Native thread gesture processing |
| **Animations** | `react-native-reanimated` v3 | Worklet-based UI thread animations |
| **Physics Engine** | Matter.js | 2D physics for body-fill visualization |
| **2D Rendering** | `@shopify/react-native-skia` | High-performance canvas for visualizations |
| **Local Database** | Expo SQLite + custom ORM layer | Reliable, reactive, no native module issues |
| **Key-Value Store** | `react-native-mmkv` | Fast settings/preferences storage |
| **Encryption** | `expo-crypto` | Password hashing for codename unlock |
| **Secure Storage** | `expo-secure-store` | Storing encryption keys safely |
| **File System** | `expo-file-system` + `expo-sharing` | Export/import backup files |
| **Charts** | `victory-native` | Bullet journal style analytics |
| **Notifications** | `expo-notifications` | Period review reminders |
| **Navigation** | `expo-router` (file-based routing) | Simple, declarative navigation |
| **State Management** | Zustand | Lightweight, no boilerplate |
| **Haptics** | `expo-haptics` | Tactile feedback on gestures |

---

## Key Technical Decisions

### Why NOT MongoDB Realm?
MongoDB Atlas Device Sync (Realm) is being **deprecated September 2025**. Cannot build on a dying platform. If cloud sync is needed later, we'll use WatermelonDB's sync protocol with a custom Node.js/Express/MongoDB backend.

### Why Expo SQLite over WatermelonDB for v1?
- v1 is local-only, no sync needed
- Expo SQLite is built-in, zero config
- WatermelonDB adds complexity that's only justified when sync is needed
- Can migrate to WatermelonDB in a future milestone if cloud sync is added

### Why Matter.js + Skia over a game engine?
- Matter.js is lightweight (just physics math, no rendering)
- Skia handles rendering at 60fps with hardware acceleration
- No need for a full game engine (Expo Game, Unity) — we just need balls falling with gravity
- Both are well-documented in the Expo ecosystem

### Why Zustand over Redux/MobX?
- Extremely lightweight (< 1KB)
- No boilerplate (no actions, reducers, etc.)
- Perfect for a personal app that doesn't need enterprise state management
- Easy to persist state with MMKV middleware
