# Project Research Summary

**Project:** Hayat (حياة) — Life Balance Tracker
**Domain:** React Native + Expo gesture-driven mobile app — v1.1 Refinement & Polish
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

Hayat v1.1 is a polish-and-fix milestone for an existing gesture-driven React Native app (Expo SDK 55, RNGH v2, Reanimated 4.x, Skia 2.4.x, Matter.js, gifted-charts). The research consistently identifies two categories of work: (1) bug fixes for shipped-but-broken features — body-fill physics animation not rendering, hold gesture behavior broken, privacy mode store disconnected, screen dimming mid-interaction — and (2) UX polish additions — haptic feedback patterns, biometric auth, liquid joystick aesthetics, background hue shifts, 30-degree target fan geometry, and a line chart swap. The clear recommendation is to fix broken features first in a dedicated P1 phase before layering any polish, because several polish features depend on the fixed infrastructure (e.g., biometric auth requires the settingsStore privacy connection; hue shift requires gesture SharedValues to be lifted; liquid glow requires the boxShadow architecture decision to be made before adding more Skia layers).

The stack requires only two new packages — `expo-local-authentication` and `expo-keep-awake` — both first-party Expo SDK modules at SDK 55 versions. Every other v1.1 capability (haptics, Skia shadows, Reanimated color interpolation, LineChart) is served by existing dependencies. This keeps the build surface minimal and Expo Go compatibility intact for most features. The sole exception is biometric Face ID, which mandates a development build for iOS testing; this should be factored into phase planning so it does not block other work.

The dominant risk across all research is the intersection of the Reanimated/Skia thread boundary with animated effects. Three concrete landmines must be avoided: calling expo-haptics directly from gesture worklets (crashes), animating Skia blur radius per-frame on Android (30fps drop), and using Reanimated's `interpolateColor` for Skia canvas targets (black screen). A secondary systemic risk is the existing `createIndicatorStyle` hooks-in-a-function anti-pattern in `Joystick.tsx` — this must be refactored before any new `useAnimatedStyle` calls are added, or production builds will exhibit non-deterministic indicator behavior.

---

## Key Findings

### Recommended Stack

The existing validated stack handles all v1.1 features. Only two new installs are needed: `expo-local-authentication ~55.0.9` for biometric auth and `expo-keep-awake ~55.0.4` for the screen wake lock fix. Both are official Expo modules with zero native config overhead in the managed workflow. Everything else — haptics, Skia glow/shadows, Reanimated color interpolation, gifted-charts LineChart, Matter.js physics — is already installed.

**Core technologies (v1.1 additions):**
- `expo-local-authentication ~55.0.9`: biometric + PIN fallback auth — first-party Expo, FaceID plist auto-handled, `disableDeviceFallback: false` enables PIN by default
- `expo-keep-awake ~55.0.4`: screen wake lock scoped to home screen — investigate whether the existing RAF animation loop is the actual cause of "screen never dims" before installing
- `@shopify/react-native-skia 2.4.18` (existing): `Box`/`BoxShadow`/`BlurMask` for liquid joystick glow; use `BlurMask` not `ImageFilter.MakeBlur` to avoid Android GPU regression
- `react-native-reanimated 4.2.1` (existing): `interpolateColor` with HSV color space for background hue shift; runs on UI thread as worklet
- `react-native-gifted-charts ^1.4.76` (existing): `LineChart` with `dataSet` prop already available; straight swap from `BarChart`

**Version constraint:** FaceID requires a development build (Expo Go cannot test it). All other features work in Expo Go.

### Expected Features

Research distinguishes clearly between broken features that are P1 regressions and polish additions that are P2 enhancements.

**Must have — P1 (fixes broken behavior):**
- Screen keep-awake fix — hold gestures dim the screen mid-interaction, functional blocker
- Body-fill physics animation fix — VIZ-02 is a shipped feature currently rendering zero balls
- Joystick hold behavior fix — center-hold note toggle / direction-hold target fan interaction model is broken
- Privacy mode store connection fix — `settingsStore.isPrivacyMode` is disconnected, gates biometric auth
- Haptic on hold-start + swipe confirm — absence makes gestures feel unregistered (table stakes for gesture-first UX)
- Target fan at 30-degree fixed intervals — replaces variable-arc radial menu; pure math change in `useRadialMenu.ts`
- Line chart for daily activity — bar chart identified as wrong data visualization; per-day line chart is the correct form

**Must have — P2 (polish after P1 stable):**
- Biometric auth for privacy mode — requires P1 store fix; low cost once store is connected
- Joystick quadrant lines + hold color wash — visual hold-state confirmation; requires hold event fixed in P1
- Background hue shift on directional drag — differentiator; zero JS thread cost, runs as worklet
- Liquid joystick CSS boxShadow design — no new dependencies, purely visual; validate Android fps before finalizing

**Defer to v2+:**
- True liquid blob physics on joystick — needs second physics world competing with home screen 60fps budget
- Rich AHAP haptic patterns (Android advanced) — `performAndroidHapticsAsync` covers v1.1 needs adequately
- Biometric re-auth after inactivity timeout — useful for shared devices; not blocking

### Architecture Approach

The existing architecture is well-layered: Zustand stores for slow-changing auth/settings state, Reanimated SharedValues for 60fps gesture state, Skia canvases for GPU rendering, Matter.js for physics via RAF loop. V1.1 respects these boundaries rather than disrupting them. The main structural changes are: (1) lifting `dragIntensity` and `activeDirection` SharedValues from `Joystick` up to `HomeScreen` to drive background hue shift via Option A (props, not Zustand); (2) pre-allocating all Matter.js ball `Circle` slots in the Skia tree at mount time to fix the ref-not-triggering-re-render root cause of the physics bug; (3) wrapping biometric auth as a `useBiometricAuth` hook that gates `authStore.unlock()` + `settingsStore.togglePrivacyMode()` without replacing the PIN fallback path.

**Major components and v1.1 changes:**

1. `Joystick.tsx` — add haptic on `handleHoldStart`; add `holdOverlayStyle`; export SharedValues upward; fix `createIndicatorStyle` hooks violation before adding new animated styles
2. `JoystickGlow.tsx` (NEW) — Skia canvas behind ring driven by `dragIntensity` SharedValue; use `BlurMask` not blur filter
3. `useRadialMenu.ts` — change fan geometry to fixed 30-degree step: `step = 30`, `startAngle = baseAngle - (n-1)*15`
4. `useBodyFillPhysics.ts` + `BodyFillCanvas.tsx` — pre-allocate `MAX_BALLS` SharedValue slots at mount with sentinel `y=-9999`, render all slots, make them visible via position/radius updates
5. `useBiometricAuth.ts` (NEW) — `hasHardwareAsync` + `isEnrolledAsync` guard, `authenticateAsync`, boolean return; PIN fallback via existing `AuthModal`
6. `DailyActivityChart.tsx` (RENAME from `PillarBarChart.tsx`) — swap `BarChart` for `LineChart`, adapt data to `dataSet` format matching existing `TrendLineChart` pattern
7. `app/(tabs)/index.tsx` — create `bgIntensity`/`bgHue` SharedValues, apply `useAnimatedStyle` background, wrap in `Animated.View`
8. `app.json` — add `expo-local-authentication` plugin with `faceIDPermission` string

**Build order (dependency-ordered):** body-fill fix → haptics → target fan → line chart → biometric auth → background hue shift → liquid Skia glow → quadrant lines

### Critical Pitfalls

1. **Calling expo-haptics from a gesture worklet** — `expo-haptics` is a JS-thread API; calling it directly inside `onStart`/`onUpdate` worklets crashes ("Tried to synchronously call a non-worklet function on the UI thread"). Always use `runOnJS(triggerHaptic)()`. If haptic latency is unacceptable after shipping, swap to `react-native-nitro-haptics` which is worklet-safe.

2. **Animated Skia blur radius on Android tanks fps** — `ImageFilter.MakeBlur` or animated `dropShadow` inside a Skia canvas receiving per-frame SharedValue updates drops Android to 25–35fps. Use `BlurMask` instead; for the liquid effect, animate opacity of a static blurred layer rather than the blur radius itself. Test on Android, not iOS simulator.

3. **Reanimated `interpolateColor` vs Skia `interpolateColors`** — these are different functions with incompatible internal color formats. Using Reanimated's version on a Skia `color` prop produces a black canvas with no TypeScript error. Import `interpolateColors` from `@shopify/react-native-skia` for any Skia canvas color animations.

4. **Body-fill Canvas renders empty because ballStates is a useRef** — `useRef` mutations do not trigger React re-renders, so Skia never receives the initial `Circle` elements. Fix: pre-allocate `MAX_BALLS` slots at mount with sentinel positions so the stable Canvas tree exists before physics starts populating it.

5. **Face ID silently failing without `NSFaceIDUsageDescription`** — missing plugin config in `app.json` causes iOS to silently fall back to passcode (no crash, no error), making Face ID appear to "work" in tests while never actually using biometrics. Add the plugin entry with `faceIDPermission` and verify in the built `Info.plist` on a physical device.

6. **`createIndicatorStyle` hooks-in-a-function anti-pattern in `Joystick.tsx`** — calling `useAnimatedStyle` inside a helper function invoked four times during render violates Rules of Hooks. It works in development but causes non-deterministic indicator behavior in production. Fix this before adding any new animated styles.

---

## Implications for Roadmap

Based on combined research, four phases are recommended. P1 bug fixes and P2 polish are separated deliberately because several P2 features depend on P1 infrastructure being stable, and shipping broken features to users while working on aesthetics is poor sequencing.

### Phase 1: Critical Bug Fixes

**Rationale:** Three shipped features are currently broken (body-fill animation, hold behavior, privacy mode store) and one is a functional blocker (screen dimming mid-gesture). These must be resolved before polish work begins; some polish features (biometric, hue shift, quadrant lines) are architecturally gated on these fixes.

**Delivers:** A fully functional v1.1 foundation — physics visualization works, hold gesture works, privacy mode toggle is connected, screen stays awake during logging.

**Addresses:**
- Screen keep-awake fix (`expo-keep-awake` + AppState scoping)
- Body-fill physics animation (pre-allocated SharedValue slots in BodyFillCanvas)
- Joystick hold behavior (verify LongPress + Pan composed gesture, confirm `handleHoldStart` fires correctly)
- Privacy mode store connection (`settingsStore.isPrivacyMode` wired to `authStore`)

**Avoids:** Physics RAF loop never stopping (raise `VELOCITY_THRESHOLD` to 1.0); wake lock battery drain (use imperative API + AppState, never `useKeepAwake` in persistent root).

**Research flag:** Standard patterns — no phase research needed. Root causes are identified with high confidence.

---

### Phase 2: Core Interaction Polish

**Rationale:** Once the gesture foundation is reliable, the core interaction model gets its v1.1 upgrades. Haptics, target fan geometry, and the line chart are all table-stakes corrections to the interaction model. The target fan fix is a pure math change; haptics is a one-line callback addition. These are low-risk, high-value improvements.

**Delivers:** The interaction model feels complete — hold gestures have haptic confirmation, target fan geometry is correct at 30-degree intervals, daily activity is visualized as a line chart showing continuity and trend.

**Addresses:**
- Haptic on hold-start (`Haptics.impactAsync(Heavy)` in `handleHoldStart`) + haptic on swipe confirm (`selectionAsync`)
- Target fan at 30-degree fixed intervals (`useRadialMenu.ts` step math change)
- Line chart for daily activity (`PillarBarChart` → `DailyActivityChart`, `BarChart` → `LineChart`)

**Avoids:** Haptics in `onUpdate` (code review gate: no haptic calls in update callbacks); worklet-direct haptic call (use `runOnJS`); line chart axis range mismatch (verify `maxValue` prop matches new API).

**Research flag:** Standard patterns — haptics and chart swap are well-documented.

---

### Phase 3: Authentication & Privacy

**Rationale:** Biometric auth depends on Phase 1 (privacy store connection). It requires a development build for iOS Face ID testing, which has lead time. Grouping it as its own phase isolates the build toolchain dependency from visual polish work.

**Delivers:** Privacy mode gated behind Face ID / Touch ID with PIN fallback; `NSFaceIDUsageDescription` in app config; `useBiometricAuth` hook wrapping `expo-local-authentication`.

**Addresses:**
- Biometric auth for privacy mode (`useBiometricAuth.ts` hook, `app.json` plugin config, Settings screen intercept)
- PIN fallback preserved via existing `AuthModal`

**Avoids:** Persisting `isUnlocked` in authStore (audit `partialize`); biometric prompt on every app foreground (trigger only on explicit content access); no-enrollment lockout (always check `hasHardwareAsync` + `isEnrolledAsync` first).

**Research flag:** Needs development build — cannot fully verify on Expo Go. Plan EAS development build before starting this phase. Patterns otherwise well-documented.

---

### Phase 4: Visual Polish

**Rationale:** Aesthetic enhancements come last — they are differentiators, not fixes. The liquid joystick effect and background hue shift both depend on architecture decisions settled in earlier phases (SharedValue lifting from Phase 2, confirmed Skia rendering patterns). Android fps must be validated for the Skia glow before the design is locked.

**Delivers:** Liquid water-drop joystick glow, background hue shift on directional drag, quadrant lines + hold color wash, `createIndicatorStyle` refactor (prerequisite for any new animated styles).

**Addresses:**
- Liquid joystick (`JoystickGlow.tsx` Skia canvas with `BlurMask`, `withSpring` glow radius)
- Background hue shift (`interpolateColor` HSV on lifted SharedValues in `HomeScreen`)
- Quadrant lines + hold fill (Skia line overlay + reuse `flashOverlay` pattern at lower opacity)
- `createIndicatorStyle` refactor (inline all four `useAnimatedStyle` calls at component top level)

**Avoids:** Animated blur radius on Android (use `BlurMask` + animate opacity, not blur radius); Reanimated/Skia `interpolateColor` confusion (Skia canvas uses `interpolateColors` from Skia); Skia `Group` animated transform regression (animate at leaf node level, test on Android).

**Research flag:** Android performance validation required before finalizing liquid shadow design. Benchmark on a mid-range Android device — do not accept iOS-only fps benchmarks.

---

### Phase Ordering Rationale

- Phase 1 before all others: three features are currently non-functional; shipping aesthetics on a broken foundation confuses QA and user feedback
- Phase 2 before Phase 3: haptics and gesture fixes are lower risk and validate the gesture pipeline before the biometric dev build cycle
- Phase 3 isolated: Face ID requires a development build that takes EAS queue time; isolating it prevents blocking visual work
- Phase 4 last: visual polish depends on lifted SharedValues (Phase 2) and stable Joystick architecture; Skia glow design decision should be informed by Android fps results, not rushed

### Research Flags

Phases needing deeper research or special conditions during planning:
- **Phase 3 (Auth):** Requires EAS development build before testing Face ID; plan 1-2 days for build provisioning. Standard patterns otherwise.
- **Phase 4 (Visual Polish):** Android performance benchmarking is required before finalizing Skia shadow approach. Consider Platform.OS guard for effect fidelity if animated blur drops below 55fps on Android mid-range.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Bug Fixes):** Root causes fully identified in ARCHITECTURE.md with fix pseudocode; no unknown territory.
- **Phase 2 (Interaction Polish):** All APIs verified in official docs; gifted-charts LineChart + haptics are drop-in changes.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All existing deps verified via official docs; two new packages verified against Expo SDK 55 patterns |
| Features | HIGH | P1/P2/P3 prioritization grounded in existing codebase analysis + official UX guidelines |
| Architecture | HIGH | Root causes identified via direct code inspection; fix patterns verified against official Skia/Reanimated/RNGH docs |
| Pitfalls | HIGH (existing), MEDIUM (new integrations) | Existing patterns code-verified; Skia blur performance and nitro-haptics integration specifics are community-sourced |

**Overall confidence:** HIGH

### Gaps to Address

- **Liquid shadow Android fps:** The research identifies `BlurMask` as the safer choice vs `ImageFilter.MakeBlur`, but exact fps on the project's hardware target (mid-range Android) is unknown until benchmarked. If animated BlurMask still drops below 55fps, the fallback is a static shadow layer with animated opacity — test this decision in Phase 4 before committing to the design.
- **`expo-keep-awake` vs animation loop root cause:** The "screen never dims" bug may be caused by the existing `requestAnimationFrame` physics loop preventing the OS idle timer, not requiring `expo-keep-awake` at all. Investigate root cause in Phase 1 before installing the package.
- **Body-fill fix approach:** ARCHITECTURE.md and PITFALLS.md suggest slightly different primary fixes (pre-allocation via sentinel values vs. `useState` for ball count to trigger initial re-render). Both are valid; pre-allocation is cleaner for performance. Verify which resolves the issue in Phase 1 — they are not mutually exclusive.
- **Haptic latency acceptability:** `runOnJS` adds 8–16ms latency for hold-start haptics. Research flags `react-native-nitro-haptics` as a worklet-safe alternative if latency is perceptible. Validate with user testing after Phase 2 ships; only swap if users notice the delay.

---

## Sources

### Primary (HIGH confidence)
- Expo LocalAuthentication docs — `authenticateAsync`, `hasHardwareAsync`, `isEnrolledAsync`, PIN fallback behavior
- Expo Haptics docs — `ImpactFeedbackStyle` enums, `selectionAsync`, `performAndroidHapticsAsync`
- Expo KeepAwake docs — `useKeepAwake`, `activateKeepAwakeAsync`, `deactivateKeepAwake` with tag
- Reanimated `interpolateColor` docs — HSV color space, `useDerivedValue` bridge
- React Native Skia `Box`/`BoxShadow`/`BlurMask` docs — inner shadow, spread, blur properties
- gifted-charts LineChart props docs — `areaChart`, `curved`, `dataSet` prop (v1.3.19+)
- Codebase inspection: `Joystick.tsx`, `useSwipeLog.ts`, `BodyFillCanvas.tsx`, `useBodyFillPhysics.ts`, `PillarBarChart.tsx`, `authStore.ts`

### Secondary (MEDIUM confidence)
- react-native-nitro-haptics GitHub — worklet-safe haptic API; alternative if `expo-haptics` latency is unacceptable
- Skia animated Group transform regression (Issue #3327) — animate at leaf node level on Android
- Skia shadow performance discussion (#773) — 60fps to 15fps on animated blur; motivates BlurMask preference
- Android Haptics UX Design Guidelines — hold = medium, confirm = light, goal complete = notification
- Biometric Authentication UX Design Guide — gate on content access, not app open; always maintain fallback

### Tertiary (LOW confidence)
- Implementing Liquid Glass UI in React Native (blog) — technique unverified against official docs; use official Skia BoxShadow approach instead

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
