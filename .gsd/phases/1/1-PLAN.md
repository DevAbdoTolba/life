---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Project Initialization & Dependencies

## Objective
Initialize the Expo project with TypeScript and install all required dependencies. After this plan, we have a blank Expo app that boots on a device/simulator with all libraries configured.

## Context
- .gsd/SPEC.md — Project requirements
- .gsd/RESEARCH.md — Tech stack decisions (lines 34-53)
- .gsd/DECISIONS.md — ADR-001 (React Native + Expo), ADR-002 (Expo SQLite)

## Tasks

<task type="auto">
  <name>Initialize Expo project with TypeScript</name>
  <files>
    - package.json (created)
    - tsconfig.json (created)
    - app.json (created)
    - app/ directory (created by expo-router)
  </files>
  <action>
    1. Run `npx -y create-expo-app@latest ./ --template tabs` to scaffold an Expo project with TypeScript in the current directory
       - If the directory is not empty, may need to use a temp directory and move files — handle accordingly
       - IMPORTANT: run `--help` first to verify available flags
    2. Update `app.json` with app metadata:
       - name: "Hayat"
       - slug: "hayat"
       - scheme: "hayat"
       - version: "1.0.0"
       - orientation: "portrait"
       - userInterfaceStyle: "dark" (dark mode only)
       - icon/splash: leave defaults for now
    3. Verify the app compiles: `npx expo start --clear` (just verify it starts, then stop)
  </action>
  <verify>
    - `npx expo start --clear` starts without errors
    - `package.json` exists with expo dependencies
    - TypeScript compiles without errors
  </verify>
  <done>Expo app boots successfully with TypeScript configured and dark mode set in app.json</done>
</task>

<task type="auto">
  <name>Install all project dependencies</name>
  <files>
    - package.json (modified)
  </files>
  <action>
    Install the following packages using `npx expo install` (for Expo-compatible versions) or `npm install`:

    **Expo-compatible (use `npx expo install`):**
    - expo-sqlite
    - expo-crypto
    - expo-secure-store
    - expo-file-system
    - expo-sharing
    - expo-notifications
    - expo-haptics
    - expo-font
    - expo-splash-screen
    - react-native-gesture-handler
    - react-native-reanimated
    - @shopify/react-native-skia
    - react-native-safe-area-context

    **NPM packages (use `npm install`):**
    - zustand
    - react-native-mmkv
    - matter-js
    - @types/matter-js (dev dependency)
    - uuid
    - @types/uuid (dev dependency)

    Do NOT install victory-native yet (not needed until Phase 4).

    After install, verify no peer dependency conflicts.
  </action>
  <verify>
    - `npm ls zustand` shows installed
    - `npm ls react-native-reanimated` shows installed
    - `npm ls expo-sqlite` shows installed
    - `npm ls @shopify/react-native-skia` shows installed
    - `npm ls matter-js` shows installed
    - `npx expo start --clear` still boots without errors after all installs
  </verify>
  <done>All Phase 1-4 dependencies installed. App still boots cleanly. Zero peer dependency errors.</done>
</task>

## Success Criteria
- [ ] Expo app initializes and boots on device/simulator
- [ ] TypeScript compiles without errors
- [ ] app.json configured with "Hayat" name, portrait orientation, dark mode
- [ ] All core dependencies installed (gesture handler, reanimated, skia, sqlite, zustand, matter-js, mmkv)
- [ ] No peer dependency conflicts
