# Feature Research

**Domain:** Gesture-driven mobile life balance tracker — v1.1 Refinement & Polish
**Researched:** 2026-03-24
**Confidence:** HIGH (expo-haptics, expo-local-authentication verified via official docs; Reanimated interpolateColor verified via official docs; Skia shadows verified via official docs)

---

## Scope

This document covers only the NEW capability areas for v1.1. Existing features (joystick logging, hold-to-target radial menu, goal lifecycle, analytics charts, physics visualization, export/import, notifications, onboarding) are already shipped in v1.0.

New capability areas:

1. Haptic feedback patterns (hold/release, swipe confirmation)
2. Biometric authentication (fingerprint/Face ID for privacy mode)
3. Liquid/water-drop UI effect on joystick circles
4. Joystick quadrant lines with active-state background color change
5. Background hue shift on directional drag
6. Target fan layout at 30-degree intervals
7. Line chart for daily activity (replacing bar chart)
8. Daily activity list repositioned to bottom half

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features where absence makes the app feel broken or unfinished given its existing interaction model.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Haptic on hold-start | Any hold gesture in a polished mobile app fires a haptic; absence feels like the gesture "didn't register" | LOW | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` on `onStart` of LongPress gesture. Already using RNGH v2; gesture callbacks run on native thread but haptic call crosses JS bridge — acceptable for one-shot events. |
| Haptic on hold-release / target select | Confirms the selection landed; without it, the radial target tap feels silent and uncertain | LOW | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on target selection. Keep lighter than hold-start to create a hierarchy: hold = medium, confirm = light. |
| Haptic on swipe complete | Standard for swipe-to-action UIs (iOS Mail, many gesture apps) | LOW | `Haptics.selectionAsync()` on swipe direction lock-in. Selection haptic is the correct semantic: "a selection change has been registered." |
| Biometric fallback text | iOS requires `NSFaceIDUsageDescription` in app.json or OS blocks FaceID entirely | LOW | Config-only change. Without it, iOS silently falls back to passcode with no explanation to the user, breaking privacy mode. |
| Fallback PIN/passcode for biometric fail | Apple/Google UX guidelines: every biometric flow must offer a non-biometric fallback | LOW | `expo-local-authentication` handles this automatically if `disableDeviceFallback` is false (the default). Do not override. |
| Line chart for daily activity | Bar charts aggregate; a line chart shows daily continuity and trend direction — expected for "activity over time" data | MEDIUM | `react-native-gifted-charts` already in stack. `LineChart` component available. Requires data shape change from aggregated bars to per-day points. |
| Joystick quadrant direction indicators | Once a hold reveals the radial menu, users need to see which direction maps to which target; without visual cues the 30-degree fan is opaque | MEDIUM | Render 4 axis lines on the joystick canvas (SVG or Skia) that appear on hold-start and fade on release. Existing Reanimated + RNGH composited gesture handles timing. |
| Screen keep-awake fix | Logging app with hold gestures that take 2-3 seconds must not dim the screen mid-interaction — this is a table-stakes bug fix | LOW | `expo-keep-awake` or `activateKeepAwakeAsync()` on the home screen; deactivate on navigate away. |

### Differentiators (Competitive Advantage)

Features that elevate the feel beyond "functional" — aligned with the app's core value of effortless behavioral self-awareness through gesture.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Background hue shift on directional drag | Makes the three pillars feel physically different; dragging toward Afterlife (up) shifts one hue, Self (down) shifts another — the background *is* the feedback | MEDIUM | `interpolateColor` with `'HSV'` color space in `useAnimatedStyle` driven by the pan gesture's `translationX`/`translationY` shared values. HSV chosen because it prevents ugly intermediate colors on hue rotation. Maps direction angle to hue range per pillar. Runs on UI thread via worklet — 0 JS thread involvement. |
| Liquid joystick circle design | Transforms the joystick from a flat circle into a tactile, fluid-feeling control; reinforces the "physical control" metaphor | MEDIUM | Achievable without new libraries. Two approaches: (a) Pure RN: layered `boxShadow` on a circular `View` with `borderRadius: 9999` — outer glow + inner highlight + inner dark shadow creates water-drop depth; (b) Skia: `Shadow` with `inner` property on a circular path for inner shadow, combined with a specular highlight circle. Approach (a) is simpler and performant. `react-native-inner-shadow` library (uses Skia) is available if pure-RN shadows are insufficient. |
| Target fan at 30-degree intervals | Reveals up to 4 targets in a geometric fan anchored to the hold direction; targets are equidistant and Fitts's-Law-optimal (every option same distance from thumb) | HIGH | Math: starting at the drag angle, place targets at angle ± 30°, ± 60° from center. For 4 targets: -45°, -15°, +15°, +45° relative to swipe direction. Animate in with `withSpring` from joystick center. Requires knowing the active swipe direction *before* releasing (derive from `translationX`/`Y` shared value in `onActive`). This replaces the existing radial menu — verify existing hold menu code before rewriting. |
| Active-state background color wash on hold | When hold is active and quadrant lines appear, a subtle hue wash on the background confirms "hold mode is live" — provides gestural depth without UI chrome | LOW | Combine with hue-shift: on `onStart` of LongPress, animate background opacity/color to a dim tinted wash using `withTiming`. On `onEnd`, reverse. Single animated value layered under joystick. |
| Biometric unlock for privacy codenames | Reveals codenames behind Face ID / fingerprint; feels premium and intentional; reinforces the "this is personal data" message | LOW | `expo-local-authentication`: call `authenticateAsync()` with `promptMessage: "Reveal your private targets"`. Check `hasHardwareAsync()` + `isEnrolledAsync()` first; fall back to existing PIN if biometrics unavailable. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Continuous haptic during hold (rumble) | Feels immersive, "the joystick is vibrating" | On Android, `Vibrator` continuous buzz kills battery and desensitizes; iOS doesn't support continuous haptic patterns via expo-haptics at all (only discrete events). Users find it annoying after 3 uses. | Single impact on hold-start + single lighter impact on target-lock is the correct UX pattern per Android haptic design guidelines. |
| Full `Haptics.notificationAsync(Success)` for every swipe | Satisfying "ding" feel | `notificationAsync` maps to a 3-pulse pattern on iOS — too prominent for a 10-swipes-per-session interaction. Will feel noisy within a week of use. | `selectionAsync()` for swipe lock-in (single crisp tick); `impactAsync(Light)` for target confirm. Reserve `notificationAsync(Success)` for goal completion milestones only. |
| Custom Android haptic AHAP patterns | Rich tactile storytelling | `react-native-haptic-feedback` or `mhpdev-com/react-native-haptics` add a native module dependency outside Expo managed workflow. Adds build complexity and Expo Go incompatibility. | `Haptics.performAndroidHapticsAsync()` (built into expo-haptics) covers `Gesture_Start`, `Long_Press`, `Gesture_End` natively on Android with zero extra dependencies. |
| Requiring biometrics on every app open | Feels secure | Users open the app 3-8 times/day to log. Mandatory biometric on every open creates friction that conflicts with the "<2 second logging" design principle (ADR-013). | Gate biometrics only on "Reveal Codenames" action. Auto-lock after inactivity (>15 min) if desired in future milestone. |
| Animated liquid blob with physics (Matter.js blob deformation) | Visually stunning | The existing Matter.js physics engine is scoped to the body-fill visualization. Adding blob deformation to the joystick circle requires a second physics world running on the same screen — competes for frame budget with the home screen's 60fps gesture requirement. | CSS-shadow water-drop illusion achieves 90% of the visual effect at ~0% performance cost. True liquid deformation is a v2+ consideration. |
| Replacing Skia body-fill animation with a liquid-fill effect | Cohesive liquid theme | Body-fill physics visualization is a shipped, tested feature (VIZ-02). Rewriting it introduces regression risk in v1.1. The fill balls *already* have a liquid-like bounce quality. | Fix the existing animation bug (balls not falling) before considering visual redesign. |

---

## Feature Dependencies

```
[Biometric Auth]
    └──requires──> expo-local-authentication (already in Expo SDK)
    └──requires──> NSFaceIDUsageDescription in app.json (config-only)
    └──requires──> existing settingsStore.isPrivacyMode (already exists, just disconnected)

[Background Hue Shift]
    └──requires──> interpolateColor (Reanimated, already installed)
    └──requires──> pan gesture translationX/Y shared values (already exist on joystick)
    └──enhances──> [Joystick Quadrant Active-State Color Wash]

[Target Fan at 30-degree intervals]
    └──requires──> existing LongPress + Pan composed gesture (already implemented, ADR-016)
    └──requires──> knowing swipe direction BEFORE release (derive from active pan values)
    └──replaces──> existing radial menu (verify existing code to avoid rewrite)

[Joystick Quadrant Lines]
    └──requires──> hold-start event from LongPress gesture (already firing)
    └──enhances──> [Target Fan Layout] (lines show the geometric axes the fan uses)

[Haptic Patterns]
    └──requires──> expo-haptics (already in Expo SDK)
    └──enhances──> [Joystick Quadrant Lines] (haptic + visual simultaneously on hold-start)
    └──enhances──> [Target Fan] (haptic on target lock-in)

[Liquid Joystick Design]
    └──requires──> nothing new — CSS boxShadow on View or Skia Shadow (both available)
    └──conflicts──> Matter.js blob physics (do NOT add physics to home screen joystick circles)

[Line Chart]
    └──requires──> react-native-gifted-charts LineChart (already installed, different component)
    └──requires──> data shape: per-day array instead of aggregated bar buckets
    └──replaces──> bar chart on daily activity view (not the weekly/monthly charts)

[Screen Keep-Awake Fix]
    └──requires──> expo-keep-awake (Expo SDK, likely already available)
    └──no conflicts
```

### Dependency Notes

- **Target Fan requires swipe direction before release:** The existing composed Pan+LongPress gesture (ADR-016) already tracks `translationX`/`Y` as shared values. Derive `atan2(y, x)` in a `useDerivedValue` worklet to get the live angle — no gesture refactor needed, just a new derived value.
- **Biometric auth requires settingsStore fix first:** The Goals screen PIN toggle is already disconnected from `settingsStore.isPrivacyMode` (known tech debt). Biometric auth gates privacy reveal, so the store connection must be repaired before biometric integration makes sense.
- **Hue shift and quadrant color wash are the same animated value:** Drive both from a single `isHoldActive` shared value + the directional angle. Avoids two competing animation systems on the same background.
- **Line chart data shape change is isolated:** The daily activity chart is a separate component from the bar/donut/trend charts. Swapping `BarChart` → `LineChart` in gifted-charts requires changing props and the data array shape — no impact on other charts.

---

## MVP Definition for v1.1

### Must Ship (Bug Fixes + Core Polish)

These are either broken (regression from v1.0) or required for the app to feel complete:

- [ ] Screen keep-awake fix — logging with hold gestures that dim mid-interaction is a functional blocker
- [ ] Body-fill balls animation fix — VIZ-02 is a shipped feature that currently does not work
- [ ] Joystick hold behavior fix — center-hold = note toggle, direction-hold = target fan (core interaction model is broken)
- [ ] Privacy mode store connection fix — settingsStore.isPrivacyMode disconnect is known tech debt; gates biometric auth
- [ ] Haptic on hold-start + haptic on swipe confirm — table stakes for a gesture-first app; absence feels like hardware failure
- [ ] Target fan at 30-degree intervals — the hold-to-target mechanic is defined by this geometry; radial menu without it is incomplete
- [ ] Line chart for daily activity — the existing bar chart was identified as wrong for this data; users noticed

### Add in v1.1 After Core Fixes

- [ ] Biometric auth for privacy mode — requires settingsStore fix first; low implementation cost once store is connected
- [ ] Joystick quadrant lines with active-state color wash — visual confirmation of hold state; requires hold event (fixed above)
- [ ] Background hue shift on directional drag — differentiator; runs on UI thread, zero risk to gesture performance
- [ ] Liquid joystick circle design — CSS boxShadow approach; no dependencies, purely visual

### Future Consideration (v2+)

- [ ] True liquid blob physics on joystick — requires second physics world; frame budget risk at 60fps
- [ ] Rich AHAP haptic patterns (Android advanced) — `performAndroidHapticsAsync` covers v1.1 needs; AHAP files add native build complexity
- [ ] Biometric re-auth after inactivity timeout — useful for shared-device households; deferred to v2

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Screen keep-awake fix | HIGH | LOW | P1 |
| Body-fill animation fix | HIGH | MEDIUM | P1 |
| Joystick hold behavior fix | HIGH | HIGH | P1 |
| Privacy store fix | HIGH | LOW | P1 |
| Haptic on hold-start + swipe | HIGH | LOW | P1 |
| Target fan 30-degree layout | HIGH | HIGH | P1 |
| Line chart (daily activity) | MEDIUM | MEDIUM | P1 |
| Biometric auth (privacy mode) | HIGH | LOW | P2 |
| Quadrant lines + color wash | MEDIUM | MEDIUM | P2 |
| Background hue shift | MEDIUM | MEDIUM | P2 |
| Liquid joystick CSS design | MEDIUM | LOW | P2 |
| Note UX: center-hold toggle only | MEDIUM | LOW | P2 |
| Daily activity list at bottom | LOW | LOW | P2 |
| Remove emoji clutter | LOW | LOW | P2 |
| True liquid blob physics | LOW | HIGH | P3 |

**Priority key:**
- P1: Must ship in v1.1 (fixes broken behavior or is the core polish goal)
- P2: Ship in v1.1 after P1 items are stable
- P3: Defer to v2+

---

## Implementation Notes by Domain

### Haptic Feedback (expo-haptics)

**API (HIGH confidence — verified against official Expo docs):**
- `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` — hold-start
- `Haptics.selectionAsync()` — swipe direction lock-in
- `Haptics.impactAsync(ImpactFeedbackStyle.Light)` — target selection confirm
- `Haptics.notificationAsync(NotificationFeedbackType.Success)` — goal completion only
- `Haptics.performAndroidHapticsAsync(AndroidHapticsType.Gesture_Start)` — Android hold-start (richer than impactAsync on Android)

**Stack fit:** expo-haptics is already in the Expo SDK. No install needed. Calls are async but fire-and-forget — call without `await` to avoid blocking gesture callbacks.

**Thread note:** Haptic calls cross the JS bridge. For gestures running as Reanimated worklets, use `runOnJS(triggerHaptic)()` to dispatch the haptic call from the UI thread to JS. The ~1ms latency is imperceptible for haptic feedback.

### Biometric Authentication (expo-local-authentication)

**API (HIGH confidence — verified against official Expo docs):**

```
1. hasHardwareAsync() → if false, show PIN fallback immediately
2. isEnrolledAsync() → if false, show "no biometrics enrolled" message + PIN fallback
3. authenticateAsync({ promptMessage: "Reveal private targets", fallbackLabel: "Use PIN" })
4. Check result.success
```

**Required config (app.json):**
- iOS: `"infoPlist": { "NSFaceIDUsageDescription": "Used to protect your private target names." }`
- Android: config plugin handles `USE_BIOMETRIC` + `USE_FINGERPRINT` permissions automatically

**UX pattern:** Do not block app open. Gate only the "Reveal Codenames" action. The existing password-reveal pattern becomes biometric-reveal with PIN as fallback.

**Testing note:** FaceID does not work in Expo Go — requires a development build for iOS testing.

### Liquid Joystick Effect

**Approach (MEDIUM confidence — technique verified via Skia docs and community patterns):**

CSS boxShadow (preferred — no new dependencies):
```
boxShadow: [
  { offsetX: 0, offsetY: 4, blurRadius: 12, color: 'rgba(255,255,255,0.08)' },   // top specular
  { offsetX: 0, offsetY: -4, blurRadius: 12, color: 'rgba(0,0,0,0.4)' },         // bottom depth
  { offsetX: 0, offsetY: 0, blurRadius: 20, color: 'rgba(pillarColor, 0.3)' },    // outer glow
]
```
Applied to a `borderRadius: 9999` View. `boxShadow` is supported on both iOS and Android in RN 0.76+.

Skia alternative (if CSS shadows are insufficient): `<Shadow inner dx={0} dy={4} blur={8} color="rgba(0,0,0,0.5)" />` on a `<Circle>` path gives true inner shadow, which is the defining characteristic of the "water drop" look.

### Background Hue Shift (interpolateColor + HSV)

**API (HIGH confidence — verified against official Reanimated docs):**

```javascript
const backgroundColor = useDerivedValue(() =>
  interpolateColor(
    dragAngle.value,          // atan2 of translationY, translationX — 0 to 2π
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI],
    ['#0d0d1a', '#1a0d0d', '#0d1a0d', '#0d0d1a', '#0d0d1a'],  // dark hues per quadrant
    'HSV'
  )
);
```

`useCorrectedHSVInterpolation` defaults to `true` — shortest arc through the hue wheel prevents ugly transitions. Run entirely on UI thread.

### Target Fan Layout (30-degree geometry)

**Math (MEDIUM confidence — geometry is standard, React Native animation patterns verified):**

For N targets centered on swipe direction angle θ:
- With 4 targets: place at θ - 45°, θ - 15°, θ + 15°, θ + 45°
- With 2 targets: θ - 30°, θ + 30°
- With 1 target: exactly θ (no fan, just confirm)

Each target position: `x = cos(targetAngle) * fanRadius`, `y = sin(targetAngle) * fanRadius`

Animate from `(0, 0)` to target position with `withSpring({ damping: 15, stiffness: 200 })` on `holdActive` state change.

**Existing code dependency:** The current radial menu system already has hold-triggered target reveal logic. Before implementing the fan geometry, read the existing `HoldMenu` or equivalent component to understand the data flow — this is a refactor of positioning, not a full rewrite.

### Line Chart (react-native-gifted-charts)

**API (HIGH confidence — library already in stack, actively maintained as of April 2025):**

`LineChart` component from `react-native-gifted-charts`. Data format:
```javascript
[{ value: 3, label: 'Mon' }, { value: 7, label: 'Tue' }, ...]
```

The existing daily-activity query returns aggregated counts — confirm it returns per-day granularity before wiring the chart. If the query currently groups by week, add a `groupBy: 'day'` variant.

---

## Sources

- [Expo Haptics Documentation](https://docs.expo.dev/versions/latest/sdk/haptics/) — HIGH confidence
- [Expo LocalAuthentication Documentation](https://docs.expo.dev/versions/latest/sdk/local-authentication/) — HIGH confidence
- [Reanimated interpolateColor Documentation](https://docs.swmansion.com/react-native-reanimated/docs/utilities/interpolateColor/) — HIGH confidence
- [React Native Skia Shadows Documentation](https://shopify.github.io/react-native-skia/docs/image-filters/shadows/) — HIGH confidence
- [react-native-gifted-charts GitHub](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts) — HIGH confidence (maintained April 2025)
- [Android Haptics UX Design Guidelines](https://developer.android.com/develop/ui/views/haptics/haptics-principles) — HIGH confidence
- [Touch Means a New Chance for Radial Menus — Big Medium](https://bigmedium.com/ideas/radial-menus-for-touch-ui.html) — MEDIUM confidence
- [2025 Guide to Haptics: Enhancing Mobile UX — Medium](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774) — MEDIUM confidence (WebSearch, consistent with Android guidelines)
- [Biometric Authentication UX Design Guide — Orbix Studio](https://www.orbix.studio/blogs/biometric-authentication-app-design) — MEDIUM confidence (WebSearch, consistent with official docs)
- [react-native-inner-shadow GitHub](https://github.com/ShinMini/react-native-inner-shadow) — MEDIUM confidence (community library, Skia-based)
- [Implementing Liquid Glass UI in React Native — Cygnis](https://cygnis.co/blog/implementing-liquid-glass-ui-react-native/) — LOW confidence (blog post, technique unverified against official docs)

---

*Feature research for: Hayat (حياة) — Life Balance Tracker, v1.1 Refinement & Polish*
*Researched: 2026-03-24*
