# Phase 13: Advanced Visual Polish - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the joystick feel alive with a Skia-rendered liquid glow that intensifies on drag, shift the entire app background hue toward the active pillar color while dragging, and replace all emoji with clean Ionicons throughout the UI. Requirements: VIS-03, VIS-05, VIS-06.

</domain>

<decisions>
## Implementation Decisions

### Liquid Glow Effect (VIS-03)
- **D-01:** Primary approach: Skia-rendered soft blur/glow ring around the joystick that intensifies and distorts as drag distance increases. The ring stretches toward the drag direction for a water-drop separation feel.
- **D-02:** Performance fallback: If Skia glow impacts performance on lower-end devices, fall back to enhanced CSS-style shadows combined with animated border glow (thicker, brighter border + larger colored shadow as drag increases). Performance is always the priority.
- **D-03:** Existing `glowAnimatedStyle` (shadow-based) is the starting point. Skia rendering overlays or replaces it.

### Background Hue Shift (VIS-05)
- **D-04:** Entire screen background shifts ~10-15% toward the active pillar color at max drag. Barely noticeable at idle, atmospheric at full extension.
- **D-05:** Uses the pillar's positive color for the tint regardless of direction (Afterlife = golden tint, Self = green tint, Others = blue tint).
- **D-06:** Smooth spring transition on release — background eases back to neutral `#0A0A0F`.
- **D-07:** Driven by existing `dragIntensity` SharedValue (0→1).

### Emoji Replacement with Ionicons (VIS-06)
- **D-08:** Pillar icons (replace emoji on joystick knob center):
  - Afterlife: `moon-outline` (crescent moon)
  - Self: `heart-outline`
  - Others: `people-outline`
- **D-09:** Direction icons (replace direction emoji in swipeDirections, SummaryStatsRow, TargetFormModal, TargetList):
  - Up: `chevron-up-outline`
  - Down: `chevron-down-outline`
  - Left: `chevron-back-outline`
  - Right: `chevron-forward-outline`
- **D-10:** Direction chevrons on the joystick replace the current colored indicator dots. They are positioned at the quadrant edges/corners and only appear during directional hold — not visible at rest.
- **D-11:** Pillar icons sit centered on the knob, replacing the emoji `<Animated.Text style={styles.emoji}>`.
- **D-12:** Use `@expo/vector-icons` Ionicons (already installed) — no custom SVGs needed.
- **D-13:** All emoji must be removed from the UI. Check: `pillars.ts` emoji field, `swipeDirections` emoji field, `SummaryStatsRow.tsx`, `TargetFormModal.tsx`, `TargetList.tsx`, `Joystick.tsx`.

### Claude's Discretion
- Exact Skia blur/glow shader configuration and intensity curve
- Whether to use `@shopify/react-native-skia` BlurMask, Shadow, or custom shader for the liquid effect
- Performance testing approach for Skia vs fallback decision
- Icon sizing on knob center and in analytics/form contexts
- Exact interpolateColor values for background hue shift

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Joystick & Glow
- `src/components/joystick/Joystick.tsx` — `glowAnimatedStyle` (shadow-based glow), `dragIntensity` SharedValue, `directionValence` SharedValue, indicator dot rendering, emoji rendering on knob (line 365)
- `src/components/joystick/constants.ts` — JOYSTICK_SIZE, KNOB_SIZE, INDICATOR_SIZE
- `src/constants/colors.ts` — Background color (#0A0A0F), all pillar colors

### Emoji Locations (to replace)
- `src/constants/pillars.ts` — `emoji` field on each pillar, `swipeDirections` record with emoji per direction
- `src/components/analytics/SummaryStatsRow.tsx` — Uses emoji
- `src/components/goals/TargetFormModal.tsx` — Uses emoji
- `src/components/goals/TargetList.tsx` — Uses emoji
- `src/components/joystick/Joystick.tsx` — Renders `pillar.emoji` on knob (line 365)

### Skia
- `src/components/physics/BodyFillCanvas.tsx` — Existing Skia Canvas usage pattern in the project
- `@shopify/react-native-skia` — Already in project dependencies (used for body-fill)

### Background
- `app/(tabs)/index.tsx` — Home screen container with `colors.background` style
- `app/(tabs)/_layout.tsx` — Tab bar styling

### Phase Dependencies
- `.planning/phases/11-hold-interaction-visuals/11-CONTEXT.md` — Phase 11 must complete first (SharedValue lifting for quadrant fill must be in place for hue shift to build on)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dragIntensity` SharedValue (0→1 based on drag distance) — drives both glow and hue shift
- `directionValence` SharedValue — identifies positive/negative for color selection
- `interpolateColor()` — already used in flashAnimatedStyle for color blending
- `@shopify/react-native-skia` — already installed and used in body-fill
- `Ionicons` from `@expo/vector-icons` — already used in tab bar icons (_layout.tsx)

### Established Patterns
- Skia Canvas with clip paths (body-fill) — pattern for Skia overlay rendering
- `useAnimatedStyle` with `interpolateColor` for dynamic color changes
- `useSharedValue` + `withSpring` for smooth transitions

### Integration Points
- Glow: Skia Canvas wrapping or overlaying the joystick outerRing
- Hue shift: animated backgroundColor on the SafeAreaView container in index.tsx
- Icons: update `pillars.ts` to use icon name strings instead of emoji, update all rendering locations
- Direction indicators: replace Animated.View dots with Ionicons chevrons, only visible during hold

</code_context>

<specifics>
## Specific Ideas

- User wants direction chevrons positioned at quadrant corners/edges, only visible during directional hold — not at rest. This changes the current always-visible indicator dots.
- Performance is king — Skia glow must not degrade gesture responsiveness. Test and fall back if needed.
- Pillar icons centered on knob replace emoji — clean, minimal aesthetic matching the dark mode design.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-advanced-visual-polish*
*Context gathered: 2026-03-24*
