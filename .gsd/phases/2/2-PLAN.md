---
phase: 2
plan: 2
wave: 2
depends_on: ["1"]
files_modified:
  - src/components/joystick/Joystick.tsx
  - src/components/joystick/useSwipeLog.ts
  - src/components/joystick/constants.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Quick swipe creates a log entry in SQLite via logStore.addLog()"
    - "Haptic feedback fires on every successful swipe"
    - "Confirmation animation plays (color flash + scale pulse) on log creation"
    - "Accidental swipes (< threshold) are ignored"
    - "Rapid swipes are debounced to prevent double-logging"
  artifacts:
    - "src/components/joystick/useSwipeLog.ts hooks into logStore"
    - "Joystick.tsx imports and uses haptics + confirmation animation"
---

# Plan 2.2: Swipe-to-Log Integration

<objective>
Wire the Joystick's swipe gesture to actually create log entries in the database. Add haptic feedback, confirmation animation, and edge case handling.

Purpose: This makes the joystick functional — swipes create real data. After this plan, users can log actions via the joystick (without target selection — that's Plan 2.3).

Output: Swiping a joystick creates a log entry, fires haptics, plays a confirmation animation, and handles edge cases.
</objective>

<context>
Load for context:
- .gsd/DECISIONS.md — ADR-013 (haptic + animation only, no toast), ADR-017 (release without target = basic log)
- src/components/joystick/Joystick.tsx — The base component from Plan 2.1
- src/components/joystick/constants.ts — DEBOUNCE_MS, SWIPE_THRESHOLD
- src/stores/logStore.ts — addLog(pillarId, direction, targetId?, note?)
- src/constants/pillars.ts — getLogColor(), swipeDirections
</context>

<tasks>

<task type="auto">
  <name>Create useSwipeLog hook for database integration</name>
  <files>src/components/joystick/useSwipeLog.ts</files>
  <action>
    Create a custom hook `useSwipeLog()` that:

    1. Imports `useLogStore` from stores
    2. Takes `pillarId: PillarId` as argument
    3. Manages debouncing state via `useRef` (lastSwipeTime)
    4. Returns `handleSwipe(result: SwipeResult)`:
       - Check debounce: if `Date.now() - lastSwipeTime < DEBOUNCE_MS`, ignore and return
       - Update lastSwipeTime
       - Call `logStore.addLog(pillarId, direction, null, null)` — no targetId for quick swipe
       - Trigger haptic feedback: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` from expo-haptics
       - Return the direction for confirmation animation

    The hook separates gesture logic (Plan 2.1) from data logic (this plan), keeping the Joystick component clean.

    AVOID: Don't call addLog inside a worklet — it's a JS-thread async function. The hook's handleSwipe is called via `runOnJS` from the gesture's `onEnd`, which is already on the JS thread at that point.
    AVOID: Don't import expo-haptics at top level on web — use dynamic import or Platform check.
  </action>
  <verify>Hook compiles without TypeScript errors. Can be imported and called in a test scenario.</verify>
  <done>useSwipeLog hook exists, debounces rapid swipes, calls logStore.addLog on swipe, triggers haptic feedback.</done>
</task>

<task type="auto">
  <name>Add confirmation animation and integrate hook into Joystick</name>
  <files>src/components/joystick/Joystick.tsx</files>
  <action>
    Update Joystick.tsx to integrate the useSwipeLog hook and add confirmation animation:

    1. **Import and use the hook:**
       ```
       const { handleSwipe } = useSwipeLog(pillarId);
       ```
       Wire the Pan gesture's `onEnd` to call `handleSwipe(result)` via `runOnJS`.

    2. **Confirmation animation (ADR-013: no toast, animation only):**
       - On successful swipe, play a 2-part animation sequence:
         a. **Color flash**: The outer ring briefly flashes the direction color (positive or negative) at full opacity for 150ms
         b. **Scale pulse**: The entire joystick scales up to 1.05x for 100ms then back to 1.0x with a spring
       - Use `useSharedValue` for `flashOpacity` and `confirmScale`
       - Trigger via `withSequence(withTiming(1, {duration: 150}), withTiming(0, {duration: 200}))` for flash
       - Trigger via `withSequence(withSpring(1.05), withSpring(1.0))` for scale

    3. **State management:**
       - Add a `isProcessing` shared value to prevent gestures during confirmation animation
       - Set `isProcessing = 1` when swipe fires, reset to `0` after animation completes
       - In Pan.onStart, check `isProcessing` — if 1, cancel gesture

    4. **Visual feedback for completed swipe:**
       - The direction indicator that was active briefly grows (10px) and fades back
       - Use `useAnimatedStyle` on each indicator

    AVOID: Don't show any text overlay, toast, or modal — just animation + haptic (ADR-013).
    AVOID: Don't block the entire gesture system — only block the specific joystick that just fired.
  </action>
  <verify>
    Swipe a joystick on device/simulator:
    1. Console.log from logStore shows the log was created
    2. Haptic fires on device
    3. Visual confirmation animation plays (flash + scale)
    4. Rapid double-swipe only creates 1 log (debounce working)
  </verify>
  <done>
    Swiping a joystick creates a log entry in SQLite, fires haptic feedback, plays a color flash + scale pulse confirmation animation, and debounces rapid swipes with 300ms cooldown.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Quick swipe creates log entry in SQLite (check logStore.todayLogs)
- [ ] Haptic feedback fires on swipe (test on device)
- [ ] Confirmation animation plays visually (flash + scale)
- [ ] Rapid swipes within 300ms are debounced (only 1 log created)
- [ ] Sub-threshold drags still don't create logs
- [ ] Log entry has correct pillarId, direction, null targetId
</verification>

<success_criteria>
- [ ] useSwipeLog hook wires gesture → store → SQLite correctly
- [ ] Haptic feedback fires on every valid swipe
- [ ] Confirmation animation is smooth and non-blocking
- [ ] Debounce prevents double-logging
- [ ] User can log an action in < 2 seconds (SPEC success criterion)
</success_criteria>
