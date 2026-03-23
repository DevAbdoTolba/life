---
phase: 2
plan: 4
wave: 3
depends_on: ["1", "2", "3"]
files_modified:
  - app/(tabs)/index.tsx
  - src/components/joystick/Joystick.tsx
autonomous: false
user_setup: []

must_haves:
  truths:
    - "3 joysticks visible on home screen in triangle layout"
    - "Afterlife joystick at top center, Self bottom-left, Others bottom-right"
    - "All 3 joysticks fully interactive (swipe + hold + target selection)"
    - "Home screen has no scrolling (ADR-020)"
    - "Visual design feels premium — glows, animations, dark theme"
  artifacts:
    - "app/(tabs)/index.tsx renders 3 Joystick components"
    - "Triangle layout responsive to screen size"
---

# Plan 2.4: Home Screen Assembly & Polish

<objective>
Replace the placeholder home screen with the real triangle layout of 3 fully interactive joystick components. Polish all visual details for a premium feel.

Purpose: This is the final assembly — all the pieces from Plans 2.1-2.3 come together on the actual home screen. The user will see and interact with the complete joystick system for the first time.

Output: The app's home screen with 3 working joysticks in triangle formation.
</objective>

<context>
Load for context:
- .gsd/DECISIONS.md — ADR-010 (triangle layout), ADR-020 (no log feed), ADR-021 (100px size)
- app/(tabs)/index.tsx — Current placeholder home screen
- src/components/joystick/index.ts — Joystick component + types
- src/constants/pillars.ts — pillars array (Afterlife, Self, Others)
- src/constants/theme.ts — typography, spacing, shadows, animation
- src/constants/colors.ts — background, surface colors
- src/stores/logStore.ts — getTodayLogs for today's count
</context>

<tasks>

<task type="auto">
  <name>Build the triangle layout home screen</name>
  <files>app/(tabs)/index.tsx</files>
  <action>
    Replace the entire placeholder home screen with the real joystick layout:

    **Header (minimal):**
    - "Hayat" title (hero font size, Inter Bold)
    - Today's date below (medium, muted color)
    - Today's log count: "X actions today" — read from `useLogStore.todayLogs.length`
    - Call `useLogStore.getTodayLogs()` in a `useEffect` on mount

    **Triangle Layout (core of the screen):**
    - Use `flex: 1` to center the triangle vertically
    - **Afterlife** (pillar[0]) at top center — use `alignItems: 'center'`
    - **Self** (pillar[1]) at bottom-left and **Others** (pillar[2]) at bottom-right — use `flexDirection: 'row', justifyContent: 'space-between'`
    - Gap between top and bottom row: `spacing.xxxl` (48px)
    - Bottom row width: ~80% of screen to create the triangle shape

    **Each joystick renders:**
    ```jsx
    <Joystick
      pillarId={pillar.id}
      onSwipe={handleSwipe}
    />
    ```
    The Joystick component internally handles everything (gesture, animation, haptics, radial menu, logging) via the useSwipeLog hook.

    **Today's action count update:**
    - After any swipe, re-fetch today's logs so the count updates
    - The handleSwipe callback should call `getTodayLogs()` after addLog completes
    - Or better: since addLog already updates todayLogs in zustand state, just read `todayLogs.length` reactively

    **No scrolling (ADR-020):**
    - Use `SafeAreaView` with `flex: 1` — no ScrollView
    - Everything fits on one screen

    **Visual polish:**
    - Subtle background gradient or pattern (dark surface → slightly lighter at center where joysticks are)
    - Each joystick's glow illuminates slightly based on pillar color

    AVOID: Don't add a ScrollView — the home screen is fixed content (ADR-020).
    AVOID: Don't duplicate logging logic in the home screen — the Joystick component handles everything internally. The home screen is purely layout.
    AVOID: Don't hardcode pillar data — map over the `pillars` array from constants.
  </action>
  <verify>
    App starts and shows 3 joysticks in triangle formation. Each joystick responds to swipe gestures and creates log entries.
    Today's log count updates after each swipe.
  </verify>
  <done>
    Home screen renders 3 Joystick components in triangle layout (Afterlife top, Self bottom-left, Others bottom-right). No scrolling. Today's action count displayed and updates reactively. Visual polish with glows and consistent dark theme.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Visual and interaction QA on device</name>
  <action>
    User verifies on device/simulator:
    1. Triangle layout looks correct (Afterlife top, Self bottom-left, Others bottom-right)
    2. Joystick knobs follow thumb drag smoothly (60fps feel)
    3. Quick swipe creates a log (check today's count increments)
    4. Swipe + hold shows radial target menu
    5. Haptic feedback fires on swipe
    6. Confirmation animation (flash + scale) plays after swipe
    7. Spring snap-back feels physical and satisfying
    8. Overall visual feel is premium, not prototype-y
  </action>
  <done>User confirms the joystick system feels good on device. Any visual issues noted for fix.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] 3 joysticks visible in triangle layout (SPEC: "3 joystick analogs on main screen")
- [ ] Afterlife at top, Self bottom-left, Others bottom-right (ADR-010)
- [ ] Quick swipe logs action in < 2 seconds (SPEC success criterion)
- [ ] Hold reveals target menu, drag-to-select in < 4 seconds (SPEC success criterion)
- [ ] Haptic feedback fires on every interaction
- [ ] No scrolling on home screen (ADR-020)
- [ ] Today's log count updates after each swipe
- [ ] Visual design feels premium (dark theme, glows, smooth animations)
</verification>

<success_criteria>
- [ ] Home screen matches the spec's "3 joystick analogs on main screen" requirement
- [ ] All gesture flows work end-to-end (quick swipe + targeted swipe)
- [ ] User confirms visual and interaction quality on device
- [ ] Phase 2 roadmap items all addressed
</success_criteria>
