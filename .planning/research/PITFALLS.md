# Pitfalls Research

**Domain:** React Native + Expo — adding haptics, biometric auth, Skia liquid/shadow effects, Matter.js physics animation fix, chart migration, and screen wake lock to an existing RNGH v2 + Reanimated v3 + Skia gesture-driven app
**Researched:** 2026-03-24
**Confidence:** HIGH (code-verified for existing patterns; MEDIUM for new integration specifics)

---

## Critical Pitfalls

### Pitfall 1: Calling expo-haptics from a Gesture Worklet via runOnJS Introduces Latency

**What goes wrong:**
`expo-haptics` methods are async JS-thread functions. Triggering them from inside a `Gesture.LongPress().onStart()` worklet requires `runOnJS(Haptics.impactAsync)()`. The bridge hop from UI thread to JS thread adds 8–16 ms round-trip latency. On a busy JS thread (SQLite write, store update), this can stretch to 50+ ms, making haptics feel disconnected from the physical gesture event.

**Why it happens:**
`expo-haptics` has no worklet support. The LongPress `onStart` callback runs on the UI thread by design. Developers default to `runOnJS` because it is the documented bridge pattern, not realising there is a worklet-native alternative.

**How to avoid:**
Replace `expo-haptics` calls in gesture handlers with `react-native-nitro-haptics` (Nitro Modules, worklet-safe) or `react-native-turbo-haptics`. Both can be called directly on the UI thread from within a worklet:

```ts
// Inside Gesture.LongPress().onStart() — no runOnJS needed
'worklet';
HapticsBoxed.impact('medium');
```

If the project stays on `expo-haptics`, wrap the call in `runOnJS` and accept ~1 frame of lag. Do not call `runOnJS(Haptics.impactAsync)` inside `onUpdate` — only `onStart` / `onEnd` to avoid repeated bridge traffic.

**Warning signs:**
- Haptic fires visibly after the radial menu appears, not simultaneously.
- Flipper JS thread timeline shows a spike coinciding with the haptic bridge call during hold activation.
- User reports "the buzz is late" on slower Android devices.

**Phase to address:**
Phase implementing haptic feedback (first touch of any hold event). Verify with a side-by-side test: `expo-haptics` vs. nitro-haptics timing on hold-start.

---

### Pitfall 2: expo-haptics Called Every onUpdate Frame Causes Audio/Vibration Spam and 60fps Drop

**What goes wrong:**
If haptic feedback is triggered on `Pan.onUpdate` (rather than `onStart` of LongPress), the haptic engine fires at up to 60 calls per second. iOS Core Haptics will queue and drop calls, causing audible repetitive buzz. Android will queue the Vibrator which eventually introduces its own thread stall. Frame rate drops from 60 to ~40 fps.

**Why it happens:**
Developers think "every direction change should buzz." The `onUpdate` fires every rendered frame during drag — far more often than intended.

**How to avoid:**
Haptics belong only on discrete events: `LongPress.onStart` (hold activated), `Pan.onEnd` (swipe confirmed). Never on `onUpdate`. Use a debounce SharedValue flag if a direction-change buzz is truly needed.

**Warning signs:**
- Device produces continuous vibration during a pan drag.
- `onUpdate` callback has a `haptic*` call.
- FPS drops specifically during held-pan gestures.

**Phase to address:**
Any phase adding haptics. Add lint rule or code comment: "NO haptics in onUpdate."

---

### Pitfall 3: Biometric Auth Locks the App Out on First Install (No Enrolled Biometric)

**What goes wrong:**
Calling `LocalAuthentication.authenticateAsync()` on a device with no enrolled biometrics (or in Expo Go) fails silently or throws an unhandled error. If the codebase falls through to a "show nothing" state on failure, users with no fingerprints enrolled cannot access privacy mode at all — effectively losing data visibility.

**Why it happens:**
Tutorials show the happy path only. Developers skip `isEnrolledAsync()` and `hasHardwareAsync()` pre-checks. The existing `authStore` has a PIN fallback that biometric migration can accidentally bypass.

**How to avoid:**
Always guard with:
```ts
const hardware = await LocalAuthentication.hasHardwareAsync();
const enrolled = await LocalAuthentication.isEnrolledAsync();
if (!hardware || !enrolled) {
  // Fall back to PIN flow (existing AuthModal)
}
```
Keep the PIN path alive. Biometrics should be an upgrade, not a replacement that orphans PIN-only users or no-enrollment devices.

**Warning signs:**
- `authenticateAsync` called without preceding `isEnrolledAsync`.
- AuthModal PIN path removed before biometric fallback is confirmed working on a real device.
- App crashes or shows blank screen when biometric prompt is dismissed.

**Phase to address:**
Biometric auth phase. Test on both a device with biometrics enrolled and a simulator with none enrolled before merging.

---

### Pitfall 4: Face ID NSFaceIDUsageDescription Missing Causes Silent Permission Denial on iOS

**What goes wrong:**
On iOS, calling `LocalAuthentication.authenticateAsync()` without `NSFaceIDUsageDescription` in `app.json` does not crash — it silently falls back to device passcode, bypassing Face ID entirely. The feature appears to "work" but is not using biometrics.

**Why it happens:**
This is an Apple OS requirement. The permission description is not surfaced as a compile error; it is an Info.plist key that the OS checks at runtime. Expo's plugin handles it automatically only if the plugin is explicitly configured.

**How to avoid:**
Add to `app.json`:
```json
{
  "plugins": [
    ["expo-local-authentication", {
      "faceIDPermission": "Allow Hayat to use Face ID to unlock privacy mode."
    }]
  ]
}
```
Rebuild the dev client after adding this. Expo Go cannot test Face ID regardless — a development build is mandatory.

**Warning signs:**
- Testing in Expo Go and biometric "works" (it is using passcode, not Face ID).
- No `expo-local-authentication` plugin entry in `app.json`.
- iOS device shows passcode keyboard instead of Face ID animation.

**Phase to address:**
Biometric auth phase. Run `eas build --profile development` and test on a physical iPhone with Face ID before closing the phase.

---

### Pitfall 5: Matter.js Animation Loop Running on JS Thread Competes with Gesture Worklets

**What goes wrong:**
The existing `useBodyFillPhysics` runs `requestAnimationFrame` with `Matter.Engine.update` on the JS thread. When the user is actively using a joystick (Pan gesture running on UI thread), the JS thread is simultaneously advancing physics at 60 fps, writing up to 50 SharedValues per frame, and potentially processing `runOnJS` callbacks from gesture completion. On mid-tier Android devices this causes frame drops to 45–50 fps during the analytics screen body-fill animation if any navigation is happening.

**Why it happens:**
Matter.js is a pure JS library — it cannot run on the UI thread. The physics loop is JS-bound by design. Writing 50 SharedValues per frame (ball positions) is individually cheap but cumulative.

**How to avoid:**
The body-fill animation runs on the analytics screen, not the home screen with joysticks — they do not compete directly. Ensure the physics loop is fully cancelled (`cancelAnimationFrame`) and the engine is cleared (`Matter.Engine.clear`) when the analytics screen unmounts. The existing cleanup in `useBodyFillPhysics` already does this, but the `isSettled` flag should stop the RAF once all balls are at rest to avoid running an idle loop indefinitely.

Verify `isSettled` actually triggers: the current `VELOCITY_THRESHOLD = 0.5` may never be reached on very small radius balls — consider raising to `1.0`.

**Warning signs:**
- Physics loop RAF never stops (CPU profiler shows continuous `tick` calls after balls land).
- `isSettled.value` remains `false` for the lifetime of the component.
- Memory leak report: Matter.js world not cleared on screen unmount.

**Phase to address:**
Body-fill animation fix phase. Profile on Android before shipping.

---

### Pitfall 6: BodyFillCanvas Renders ballStates.current Snapshot at React Render Time — Physics Changes Are Invisible

**What goes wrong:**
`BodyFillCanvas` reads `ballStates.current` (a `useRef`) at render time. React renders happen before the physics loop starts because `useEffect` fires after render. If `ballStates.current` is empty at first render and never triggers a re-render afterward, the canvas renders zero balls and shows nothing — the balls are falling in the physics engine but Skia never redraws because React does not know anything changed.

This is likely the root cause of "balls not falling" reported in the known issues.

**Why it happens:**
`useRef` mutations do not trigger re-renders. `ballStates.current` is populated inside `useEffect` (after render). The `Canvas` receives the ref object, not a reactive value, so subsequent position updates to SharedValues animate the balls — but only if the `Circle` elements were rendered in the first place.

**How to avoid:**
Two options:
1. Lift ball creation into state (`useState<BallState[]>`) so that when the physics hook populates balls, a `setState` triggers a re-render that gives Skia the initial `Circle` elements. Position updates then flow through SharedValues without further re-renders.
2. Trigger a single forced re-render after balls are initialised using a `ballCount` SharedValue or state integer.

The SharedValue positions update at 60fps correctly — the problem is only the initial render (empty Canvas). Fix the mount lifecycle, not the animation loop.

**Warning signs:**
- Canvas renders with no circles initially.
- Adding `console.log(ballStates.current.length)` in the Canvas render shows `0`.
- After adding a `useState` for ball count, balls suddenly appear.

**Phase to address:**
Body-fill animation fix phase. This is the first thing to check.

---

### Pitfall 7: Skia interpolateColor vs Reanimated interpolateColor — Wrong Function Crashes or Gives Black

**What goes wrong:**
The existing `Joystick.tsx` uses `interpolateColor` from `react-native-reanimated` for the flash overlay (a regular Animated View). Adding background hue transitions on the Skia canvas using the same import will produce incorrect colors or a black screen because Skia stores colors in a different internal format (ARGB integer) than Reanimated (CSS string/hex).

**Why it happens:**
Both libraries export a function named `interpolateColor`. Developers import from the wrong source, or assume they are interchangeable.

**How to avoid:**
- For Animated View background colors (existing flash overlay): continue using `interpolateColor` from `react-native-reanimated`.
- For Skia canvas color properties (new hue-shift on body, joystick Skia layers): use `interpolateColors` from `@shopify/react-native-skia`.
- If driving a Skia shader uniform with a hue value, pass the raw HSL/hue number directly and compute color in the shader — avoid color interpolation functions at the bridge boundary entirely.

**Warning signs:**
- Skia canvas background or element appears pure black during animation.
- `interpolateColor` import is from `react-native-reanimated` but is passed to a Skia `color` prop.
- No TypeScript error (both functions accept the same argument types).

**Phase to address:**
Background hue shift phase and any Skia visual polish phase.

---

### Pitfall 8: Skia Shadow / Blur Filters Drop fps on Android — Especially with Animated Values

**What goes wrong:**
Adding `ImageFilter.MakeBlur` or drop shadows to a Skia canvas that is also receiving animated SharedValue updates (like the liquid joystick effect) causes significant frame drops on mid-range Android devices. A documented regression in Skia (Issue #3327) shows animated `transform` props on a `Group` with blur children tanks both JS and UI thread fps. Blur is GPU-heavy; combined with per-frame redraws, it can drop to 25–30 fps on Android.

**Why it happens:**
Blur is computed per-frame on the GPU. When the shadow radius is a constant, the GPU can cache the result. When it is animated (driven by a SharedValue, e.g., glow intensity on drag), the blur must be recomputed every frame.

**How to avoid:**
- Use `BlurMask` (inner blur) rather than `ImageFilter.MakeBlur` (outer blur) — `BlurMask` is cheaper.
- For the liquid "water-drop" effect, implement it as a SkSL fragment shader with a static blur baked into the shader math rather than using Skia filter nodes that recompute per frame.
- Test on Android (not iOS simulator) before finalising the design.
- Decouple the glow radius animation: animate opacity of a pre-rendered blurred layer rather than animating the blur radius itself.

**Warning signs:**
- `ImageFilter.MakeBlur` or `dropShadow` inside a Canvas that has SharedValue props.
- FPS counter shows 30–40 fps on Android during joystick interaction.
- JS thread is idle but UI thread is at 100% (GPU-bound blur).

**Phase to address:**
Liquid joystick design phase. Benchmark on Android before aesthetic decisions are locked.

---

### Pitfall 9: useAnimatedStyle Inside a Loop (createIndicatorStyle Called in Render) Violates Rules of Hooks

**What goes wrong:**
The current `Joystick.tsx` calls `useAnimatedStyle` inside a helper function `createIndicatorStyle` which is invoked four times during render. This violates React's rules of hooks (hooks must not be called inside nested functions or loops) but Reanimated may not catch this statically — it will work in development but can behave non-deterministically in production (wrong indicator lights up on direction change) or crash on hot reload.

**Why it happens:**
The pattern looks reasonable ("reuse the style factory"). The error is silent.

**How to avoid:**
Inline all four `useAnimatedStyle` calls at the top level of the component. When adding new animated styles (e.g., quadrant line opacity, background hue), add them as explicit top-level calls, not via factory functions.

**Warning signs:**
- Direction indicator lights fire on the wrong direction intermittently.
- Reanimated logs "worklet was re-created" warnings.
- The `createIndicatorStyle` pattern exists in the file (it does, confirmed by code review).

**Phase to address:**
Any phase that touches Joystick.tsx animated styles. Fix the `createIndicatorStyle` anti-pattern before adding new `useAnimatedStyle` calls for quadrant lines or hue shifts.

---

### Pitfall 10: Screen Wake Lock Left Active After App Backgrounds — Battery Drain

**What goes wrong:**
`expo-keep-awake`'s `useKeepAwake()` hook activates wake lock when its component mounts and releases it on unmount. If the hook is placed in a component that persists for the app's entire lifetime (e.g., the root `App.tsx` or the home screen layout), the screen never dims even when the app is backgrounded or the user leaves the device idle. This causes significant battery drain that users notice within hours.

**Why it happens:**
The hook name implies "keep the screen awake while I'm using this component" but it does not pause on app background — it only releases on unmount. Most screens never unmount during normal use.

**How to avoid:**
Use the imperative API with AppState subscription:
```ts
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AppState } from 'react-native';

// Activate only when app is in foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') activateKeepAwakeAsync();
  else deactivateKeepAwake();
});
```
Alternatively, scope the wake lock to only the home screen (where joystick use happens) and release it when navigating to analytics or settings.

**Warning signs:**
- `useKeepAwake()` placed in a persistent root component.
- No `AppState` integration.
- QA finds screen never sleeps even when phone is set aside for 10+ minutes.

**Phase to address:**
Screen wake lock fix phase. Test explicitly: background the app and verify screen dims normally.

---

### Pitfall 11: Biometric Auth State Not Persisted Across App Restarts — Privacy Mode Re-locks Unexpectedly

**What goes wrong:**
The existing `authStore` persists only the PIN, not `isUnlocked`. This is correct — the app should require re-authentication on fresh start. However, when adding biometrics, developers sometimes add a "remember biometric unlock" flow that sets `isUnlocked: true` and mistakenly persists it. On next launch, codenames are visible without any prompt.

Conversely, if biometric auth is triggered on app foreground (AppState `active` event) and the biometric prompt is dismissed by the user, the auth store may oscillate between locked/unlocked on every foreground-background cycle.

**Why it happens:**
Auth lifecycle on mobile differs from web sessions. Developers map web session patterns incorrectly.

**How to avoid:**
- Never persist `isUnlocked` — the existing `partialize: (state) => ({ pin: state.pin })` is correct, keep it.
- Trigger biometric prompt once on first access to privacy-protected content (codenames view), not on every app foreground.
- Treat `user_cancel` from biometric as "stay locked, show PIN fallback" not as "error, crash."

**Warning signs:**
- `isUnlocked` added to `partialize` in `authStore`.
- Biometric prompt fires on every `AppState.change` to `active`.
- User reports codenames briefly visible before auth modal appears on app launch.

**Phase to address:**
Biometric auth phase. Audit `authStore` `partialize` before shipping.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `runOnJS(Haptics.impactAsync)` in gesture worklet | Ships fast with existing expo-haptics dep | 8–16 ms haptic lag on busy JS thread | Only if nitro-haptics install is blocked; document the lag |
| Keeping PIN auth alongside biometrics | Zero migration risk | Two auth code paths to maintain | Acceptable — PIN is the fallback, not legacy |
| `requestAnimationFrame` physics loop running after balls settle | Simpler code | Idle CPU burn, battery drain | Never — `isSettled` flag already exists, just verify it triggers |
| `interpolateColor` from Reanimated on a Skia prop | One less import | Black screen / wrong colors silently | Never |
| `useKeepAwake()` without AppState scoping | 2-line implementation | Screen never dims, user complaints | Never in production |
| `createIndicatorStyle` factory inside render | DRY indicator styles | Violates hooks rules, non-deterministic in production | Never — inline the calls |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| expo-local-authentication + iOS | Testing in Expo Go with FaceID | Build a dev client; Expo Go cannot test Face ID |
| expo-local-authentication + iOS | Missing faceIDPermission in app.json plugin config | Add plugin entry with `faceIDPermission` string before building |
| expo-local-authentication + Android | Assuming biometrics always available | Check `hasHardwareAsync()` + `isEnrolledAsync()` before calling `authenticateAsync()` |
| expo-haptics + RNGH worklets | Using `runOnJS` for low-latency hold events | Use `react-native-nitro-haptics` or `react-native-turbo-haptics` for worklet-native calls |
| Reanimated interpolateColor + Skia | Passing Reanimated color to Skia color prop | Use `interpolateColors` from `@shopify/react-native-skia` for Skia targets |
| Matter.js + Skia SharedValues | Physics bodies created but Skia has no Circle elements to animate | Trigger a React re-render after balls array is populated (useState for ball count) |
| expo-keep-awake + AppState | Hook placed in persistent root component | Use imperative API scoped to AppState `active` events |
| RNGH LongPress + Pan Simultaneous | LongPress fires `onStart` with stale `translateX/Y` values | Read `translateX.value` / `translateY.value` at `onStart` time (as the existing code correctly does) — do not add a JS state read here |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Animated blur radius on Skia canvas (liquid shadow effect) | 25–35 fps on Android mid-range devices during joystick drag | Bake blur into shader or use static blur layer with animated opacity | Immediately on devices without dedicated GPU (Android) |
| `runOnJS` haptics on every `onUpdate` frame | Continuous vibration, 40 fps during pan | Only call haptics on discrete gesture events (`onStart`/`onEnd`) | Immediately on first test |
| Physics RAF loop never stopping (isSettled never true) | Elevated CPU at rest, warm device, background battery drain | Verify VELOCITY_THRESHOLD value; raise to 1.0 if balls are micro-jittering | From first load of analytics screen |
| Writing 50 SharedValues per RAF tick | Acceptable in isolation; breaks under JS thread load | Reduce ball count or coalesce position writes | When heavy DB operations coincide with physics tick (unlikely in this flow) |
| `useAnimatedStyle` called in factory function inside render | Wrong indicator lit on direction change | Inline all `useAnimatedStyle` calls at component top level | Non-deterministically in production builds |
| Skia `Group` with animated `transform` prop + many children | fps tanks on Android (documented Skia bug #3327) | Animate individual elements or use matrix transform on leaf nodes | With any Skia version before this is patched |
| Biometric prompt on every AppState foreground | Auth dialog flashes on every unlock/switch | Trigger only on explicit user action or first content access | Immediately visible in QA |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Persisting `isUnlocked: true` in authStore | Codenames visible without auth after cold launch | Keep `partialize` limited to `{ pin }` only |
| Removing PIN fallback when adding biometrics | Users without enrolled biometrics locked out of privacy mode | Biometrics must fall back to PIN; never remove the PIN path |
| Storing PIN in plain text in MMKV/SQLite without encryption | PIN exposed if device storage is forensically examined | This is a local privacy feature (not financial data); acceptable for current scope, note as debt |
| Triggering biometric from inside a worklet / gesture handler | API not worklet-safe; undefined behavior | Only call `LocalAuthentication.authenticateAsync` from JS thread (Modal `onPress` handler) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Haptic fires 50–100ms after hold activates due to JS thread hop | Feels laggy, disconnected from gesture | Use worklet-native haptics library |
| Biometric prompt appears immediately on every app open | Intrusive — users open the app to log, not to auth | Show prompt only when user explicitly navigates to privacy-protected content |
| Screen wake lock always on (even on settings/analytics screens) | Battery drain, device gets warm | Scope wake lock to home screen only, release on navigate away |
| Body-fill balls never animate (shows empty silhouette) | Core visual feature is invisible | Fix mount lifecycle so Canvas receives ball elements before physics starts |
| Liquid joystick shadow causing visible frame drops on Android | Joystick feels sluggish, undermines gesture confidence | Reduce effect fidelity on Android (static shadow vs. animated) using Platform.OS guard |
| Line chart switching from bar chart breaks existing data range | Chart appears empty or clipped at wrong scale | Verify `yAxisRange` / `maxValue` props match line chart API (different from bar chart props) |

---

## "Looks Done But Isn't" Checklist

- [ ] **Haptic feedback:** Fires on hold-start — verify it fires on the UI thread within 1 frame of LongPress activation, not delayed by JS thread.
- [ ] **Biometric auth:** Works on real device with Face ID/Touch ID enrolled — simulator and Expo Go are insufficient test environments.
- [ ] **Biometric auth:** Falls back gracefully when no biometrics enrolled — test on Android emulator with no fingerprints.
- [ ] **Face ID permission:** `faceIDPermission` in app.json plugin config — verify in built app Info.plist, not just app.json.
- [ ] **Body-fill animation:** Balls visibly drop and settle — confirm Canvas has Circle elements at initial render (not just empty).
- [ ] **Physics loop cleanup:** `isSettled` triggers and RAF stops — add a log to confirm RAF is cancelled after settle.
- [ ] **Screen wake lock:** Screen dims when app is backgrounded — test by pressing home button and waiting 30 seconds.
- [ ] **Liquid joystick:** 60fps on Android mid-range device — do not accept iOS-only performance benchmarks.
- [ ] **Background hue shift:** Uses `interpolateColors` from Skia (not Reanimated) for any Skia canvas targets.
- [ ] **Line chart:** `maxValue` / axis range props correctly specified for new `LineChart` component API.
- [ ] **`useAnimatedStyle` factory:** `createIndicatorStyle` refactored to inline calls before new animated styles added.
- [ ] **Auth store:** `isUnlocked` still not in `partialize` after biometric migration.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| expo-haptics JS-thread lag in shipped build | LOW | Swap to react-native-nitro-haptics (drop-in API), rebuild dev client |
| Face ID silently failing (NSFaceIDUsageDescription missing) | LOW | Add plugin config to app.json, trigger EAS rebuild |
| Biometric lockout (no fallback) | MEDIUM | Re-add PIN fallback path in AuthModal, add isEnrolledAsync guard |
| Body-fill balls not rendering | MEDIUM | Add useState for ball count to trigger re-render after physics hook populates ballStates |
| Liquid shadow killing Android fps | MEDIUM | Replace animated blur with static shadow + animated opacity; Platform.OS guard for effect level |
| Physics RAF loop never stopping | LOW | Raise VELOCITY_THRESHOLD constant from 0.5 to 1.0 in useBodyFillPhysics |
| `useAnimatedStyle` factory causing wrong indicator | MEDIUM | Inline all four indicator styles; restore correct animated direction mapping |
| Wake lock battery drain in production | LOW | Replace `useKeepAwake` with imperative API + AppState subscription |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| expo-haptics worklet latency | Haptic feedback phase | Instrument hold-to-haptic latency; should be < 16ms |
| Haptics in onUpdate spam | Haptic feedback phase | Code review: no haptic calls inside onUpdate |
| Biometric no-enrollment crash | Biometric auth phase | Test on device/emulator with no biometrics enrolled |
| Face ID NSFaceIDUsageDescription missing | Biometric auth phase | Check built Info.plist; test Face ID on physical iPhone |
| Auth state persisted (isUnlocked) | Biometric auth phase | Audit authStore partialize, kill-and-relaunch test |
| Biometric prompt on every foreground | Biometric auth phase | AppState.change test: background and foreground 3x |
| Physics loop never stops | Body-fill fix phase | CPU profiler after balls settle — RAF should not be running |
| Body-fill Canvas renders empty | Body-fill fix phase | Log ballStates.current.length in Canvas render — must be > 0 |
| Skia / Reanimated interpolateColor conflict | Background hue shift phase | TypeScript import audit; Skia canvas colors use Skia import |
| Animated blur killing Android fps | Liquid joystick phase | FPS benchmark on mid-range Android (not iPhone) |
| Group animated transform Skia bug | Liquid joystick / quadrant phase | Animate at leaf node level; test post-build on Android |
| useAnimatedStyle factory hooks violation | Any joystick visual phase | Refactor before adding new indicator styles |
| Wake lock always on | Wake lock fix phase | AppState test: background app for 60s, screen should dim |
| Wake lock active on all screens | Wake lock fix phase | Navigate to analytics, verify wake lock released |

---

## Sources

- React Native Reanimated performance docs: https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/
- react-native-nitro-haptics (worklet-safe haptics): https://github.com/oblador/react-native-nitro-haptics
- react-native-turbo-haptics (worklet-compatible): https://github.com/christianbaroni/react-native-turbo-haptics
- Expo LocalAuthentication docs: https://docs.expo.dev/versions/latest/sdk/local-authentication/
- expo-local-authentication Face ID issue (not working in Expo Go): https://github.com/expo/expo/issues/21694
- expo-keep-awake docs and battery warning: https://docs.expo.dev/versions/latest/sdk/keep-awake/
- expo-keep-awake screen never sleeps issue: https://github.com/expo/expo/issues/20328
- Skia animated Group transform performance regression (Issue #3327): https://github.com/Shopify/react-native-skia/issues/3327
- Skia shadow performance discussion (60fps → 15fps): https://github.com/Shopify/react-native-skia/discussions/773
- Matter.js + Skia integration pattern (Expo blog): https://expo.dev/blog/build-2d-game-style-physics-with-matter-js-and-react-native-skia
- Skia janky sync with Reanimated SharedValues: https://github.com/Shopify/react-native-skia/discussions/1003
- RNGH LongPress / Pan cancel event issues: https://github.com/software-mansion/react-native-gesture-handler/issues/316
- Skia interpolateColors (not Reanimated interpolateColor): https://shopify.github.io/react-native-skia/docs/animations/animations/
- Reanimated runOnJS performance (batch updates, not in onUpdate): https://github.com/software-mansion/react-native-gesture-handler/discussions/2292
- Codebase review: src/components/joystick/Joystick.tsx, src/components/physics/useBodyFillPhysics.ts, src/stores/authStore.ts

---

*Pitfalls research for: Hayat v1.1 — haptics, biometrics, Skia liquid effects, physics animation fix, chart migration, wake lock*
*Researched: 2026-03-24*
