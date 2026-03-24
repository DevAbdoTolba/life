# Phase 13: Advanced Visual Polish - Research

**Researched:** 2026-03-24
**Domain:** React Native Skia glow effects, Reanimated color interpolation, Ionicons icon replacement
**Confidence:** HIGH

## Summary

Phase 13 implements three independent visual features: a Skia-rendered liquid glow ring on the joystick that intensifies with drag (VIS-03), an animated background hue shift toward the active pillar color during drag (VIS-05), and a full emoji-to-Ionicons replacement across the UI (VIS-06).

The project already has all required libraries installed: `@shopify/react-native-skia@2.4.18`, `@expo/vector-icons@15.0.2` (Ionicons confirmed present), and `react-native-reanimated@4.2.1`. The Skia library's `Recorder` system natively reads Reanimated `SharedValue` objects as props — no bridge wrapper needed. The existing `dragIntensity` SharedValue (0→1) is the sole driver for both glow intensity and background hue shift.

The most significant architectural decision is how to overlay a Skia `Canvas` on top of the existing RN `Animated.View` outerRing. The canonical pattern is to use `position: 'absolute'` with `pointerEvents="none"` on the Skia Canvas so it draws above the gesture handler without consuming touch events. The canvas must be sized to encompass the full glow extent (outerRing diameter + 2× max blur sigma), centered over the ring.

**Primary recommendation:** Use Skia `BlurMask` (style "outer") on a `Circle` drawn in the same ring dimensions — this produces a clean exterior halo with zero inside contamination. `BlurMask.sigma` accepts a Reanimated `SharedValue` directly, giving worklet-thread-driven intensity without JS-thread round-trips. Fall back to enhanced `glowAnimatedStyle` (existing shadow-based approach) if Skia Canvas causes gesture latency on test devices.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Primary approach: Skia-rendered soft blur/glow ring around the joystick that intensifies and distorts as drag distance increases. The ring stretches toward the drag direction for a water-drop separation feel.
**D-02:** Performance fallback: If Skia glow impacts performance on lower-end devices, fall back to enhanced CSS-style shadows combined with animated border glow (thicker, brighter border + larger colored shadow as drag increases). Performance is always the priority.
**D-03:** Existing `glowAnimatedStyle` (shadow-based) is the starting point. Skia rendering overlays or replaces it.
**D-04:** Entire screen background shifts ~10-15% toward the active pillar color at max drag. Barely noticeable at idle, atmospheric at full extension.
**D-05:** Uses the pillar's positive color for the tint regardless of direction (Afterlife = golden tint, Self = green tint, Others = blue tint).
**D-06:** Smooth spring transition on release — background eases back to neutral `#0A0A0F`.
**D-07:** Driven by existing `dragIntensity` SharedValue (0→1).
**D-08:** Pillar icons (replace emoji on joystick knob center):
  - Afterlife: `moon-outline` (crescent moon)
  - Self: `heart-outline`
  - Others: `people-outline`
**D-09:** Direction icons (replace direction emoji in swipeDirections, SummaryStatsRow, TargetFormModal, TargetList):
  - Up: `chevron-up-outline`
  - Down: `chevron-down-outline`
  - Left: `chevron-back-outline`
  - Right: `chevron-forward-outline`
**D-10:** Direction chevrons on the joystick replace the current always-visible indicator dots. They are positioned at the quadrant edges/corners and only visible during directional hold — not visible at rest.
**D-11:** Pillar icons sit centered on the knob, replacing the emoji `<Animated.Text style={styles.emoji}>`.
**D-12:** Use `@expo/vector-icons` Ionicons (already installed) — no custom SVGs needed.
**D-13:** All emoji must be removed from the UI. Check: `pillars.ts` emoji field, `swipeDirections` emoji field, `SummaryStatsRow.tsx`, `TargetFormModal.tsx`, `TargetList.tsx`, `Joystick.tsx`.

### Claude's Discretion

- Exact Skia blur/glow shader configuration and intensity curve
- Whether to use `@shopify/react-native-skia` BlurMask, Shadow, or custom shader for the liquid effect
- Performance testing approach for Skia vs fallback decision
- Icon sizing on knob center and in analytics/form contexts
- Exact interpolateColor values for background hue shift

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-03 | Liquid analog design — Skia border-shadow water-drop separation effect intensifies on drag | Skia BlurMask "outer" style on Circle driven by dragIntensity SharedValue; stretch via ellipse or displacement map for water-drop feel |
| VIS-05 | App background hue shifts toward pillar color when dragging in a direction | `interpolateColor` from Reanimated on `SafeAreaView` backgroundColor via `useAnimatedStyle`; driven by dragIntensity SharedValue lifted from Joystick to index.tsx |
| VIS-06 | Remove AI-generated emoji clutter, replace with simple pillar icons | Ionicons from @expo/vector-icons (confirmed installed); all 7 icon names verified in glyph map; 6 render locations identified |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@shopify/react-native-skia` | 2.4.18 (installed) | Skia Canvas glow ring | Already in project; handles SharedValue props natively via Recorder system |
| `react-native-reanimated` | 4.2.1 (installed) | SharedValue-driven animation | Already driving dragIntensity, interpolateColor, useAnimatedStyle |
| `@expo/vector-icons` (Ionicons) | 15.0.2 (installed) | Pillar and direction icons | Already used in tab bar (_layout.tsx); all required glyph names confirmed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-native-safe-area-context` (SafeAreaView) | 5.6.2 (installed) | Animated background container | Wrap with Animated.View for backgroundColor interpolation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Skia BlurMask "outer" | DropShadow image filter | DropShadow adds offset capability but BlurMask is simpler and sufficient for centered ring glow |
| Skia BlurMask "outer" | React Native shadow (glowAnimatedStyle) | RN shadow is capped in expressiveness; cannot produce the outer-only clean look; but it is the D-02 fallback |
| Ionicons from @expo/vector-icons | Custom SVG | Custom SVG would require react-native-svg; Ionicons already installed and sufficient |

**No installation needed** — all libraries are already in `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
src/components/joystick/
├── Joystick.tsx          # Main edits: Skia overlay, icon on knob, chevron indicators
├── JoystickGlowCanvas.tsx  # New: isolated Skia Canvas component for glow ring
├── constants.ts          # Add GLOW_CANVAS_SIZE constant
└── types.ts              # Add dragIntensity?: SharedValue<number> prop (for VIS-05 lift)

src/constants/
├── pillars.ts            # Remove emoji field, add iconName field; remove emoji from swipeDirections, add iconName
└── colors.ts             # No changes needed

src/components/analytics/
└── SummaryStatsRow.tsx   # Replace pillar.emoji with <Ionicons> pillar icon

src/components/goals/
├── TargetFormModal.tsx   # Replace {p.emoji} with <Ionicons> pillar icon in pillar chips
└── TargetList.tsx        # Replace ${pillar.emoji} in section.title with icon via renderSectionHeader

app/(tabs)/
└── index.tsx             # Add animated backgroundColor driven by dragIntensity SharedValues from all 3 joysticks
```

### Pattern 1: Skia Overlay for Glow Ring (VIS-03)

**What:** A `Canvas` positioned absolutely over the outerRing, containing a `Circle` with `BlurMask` (style "outer"). The `BlurMask.blur` prop accepts a Reanimated `SharedValue<number>` directly — Skia's Recorder system reads `.value` on every frame, producing UI-thread animation with no JS round-trip.

**When to use:** When glowAnimatedStyle (shadow-based) does not achieve the liquid look. The Skia path is primary; the RN shadow path is the D-02 fallback.

**The Skia Recorder's `AnimatedProp<T>` type is `T | { value: T }`** — a SharedValue satisfies `{ value: T }`. This means you pass the SharedValue object directly as a prop value and Skia reads `.value` each frame.

**Sizing:** `GLOW_CANVAS_SIZE = JOYSTICK_SIZE + MAX_BLUR_SIGMA * 2`. At `dragIntensity = 1`, if max blur sigma is 20, canvas must be `JOYSTICK_SIZE + 40` (currently 100px ring → 140px canvas). Position with `marginLeft: -MAX_BLUR_SIGMA, marginTop: -MAX_BLUR_SIGMA` relative to the ring.

**Example:**
```typescript
// src/components/joystick/JoystickGlowCanvas.tsx
// Source: @shopify/react-native-skia src/renderer/components/maskFilters/Blur.tsx
//         (verified: BlurMask accepts AnimatedProp<number> for blur)
import { Canvas, Circle, BlurMask } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { JOYSTICK_SIZE } from './constants';

const MAX_BLUR_SIGMA = 20; // Claude's discretion
const CANVAS_SIZE = JOYSTICK_SIZE + MAX_BLUR_SIGMA * 2;
const CENTER = CANVAS_SIZE / 2;
const RING_RADIUS = JOYSTICK_SIZE / 2;

interface Props {
  dragIntensity: SharedValue<number>;
  pillarColor: string;
}

export function JoystickGlowCanvas({ dragIntensity, pillarColor }: Props) {
  // Derived blur sigma: 0 at idle, MAX_BLUR_SIGMA at full drag
  const blurSigma = useDerivedValue(() => dragIntensity.value * MAX_BLUR_SIGMA);

  return (
    <Canvas
      style={{
        position: 'absolute',
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        marginLeft: -MAX_BLUR_SIGMA,
        marginTop: -MAX_BLUR_SIGMA,
        pointerEvents: 'none',
      }}
    >
      <Circle cx={CENTER} cy={CENTER} r={RING_RADIUS} color={pillarColor}>
        {/* BlurStyle.Outer = 2: nothing inside, fuzzy outside */}
        <BlurMask blur={blurSigma} style="outer" respectCTM={false} />
      </Circle>
    </Canvas>
  );
}
```

**Water-drop directional stretch:** Per D-01, the ring should stretch toward the drag direction. Approach: use `useDerivedValue` to compute an offset `(dx, dy)` from `translateX`/`translateY` SharedValues and draw an ellipse (`rx`/`ry` differ) or shift the circle center slightly toward drag. This is Claude's discretion territory — start with pure radial glow and add stretch if time permits.

### Pattern 2: Background Hue Shift (VIS-05)

**What:** In `index.tsx`, the `SafeAreaView` (currently a non-animated `View`) must become `Animated.View` from Reanimated, with `backgroundColor` driven by an `interpolateColor` call inside `useAnimatedStyle`.

**Problem:** `dragIntensity` and pillar identity are currently inside each `Joystick` component. To drive the screen background, these SharedValues must be lifted to `index.tsx` and passed into Joystick as props. This is a prop-thread change to `JoystickProps`.

**Lift strategy:** Add `dragIntensity?: SharedValue<number>` as an optional prop to `JoystickProps`. Each joystick in `index.tsx` gets its own `useSharedValue(0)`. Each Joystick writes to the passed-in SharedValue (or its internal one if not provided). `index.tsx` combines all three using `useDerivedValue` to pick the max (whichever joystick is dragged furthest).

**Per D-05:** tint color is always the pillar's positive color. We also need to know which pillar is currently active. Use a separate `activePillarId` SharedValue (0=none, 1/2/3=pillar).

**Example:**
```typescript
// app/(tabs)/index.tsx additions
// Source: react-native-reanimated 4.2.1 interpolateColor (already used in Joystick.tsx flashAnimatedStyle)
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  interpolateColor,
  withSpring,
} from 'react-native-reanimated';

// One intensity + pillar identity per joystick
const afterlifeDrag = useSharedValue(0);
const selfDrag = useSharedValue(0);
const othersDrag = useSharedValue(0);
const activePillarColor = useSharedValue(colors.background); // string SharedValue

// Combined intensity (max of all three)
const totalDragIntensity = useDerivedValue(() =>
  Math.max(afterlifeDrag.value, selfDrag.value, othersDrag.value)
);

const backgroundStyle = useAnimatedStyle(() => ({
  backgroundColor: interpolateColor(
    totalDragIntensity.value,
    [0, 1],
    [colors.background, activePillarColor.value]
  ),
}));

// SafeAreaView must become Animated.View:
// <Animated.View style={[styles.container, backgroundStyle]}>
```

**SafeAreaView vs Animated.View:** `react-native-safe-area-context` does not export an `Animated.createAnimatedComponent(SafeAreaView)` directly. The pattern is to keep `SafeAreaView` for insets and wrap inner content in `Animated.View`, OR replace `SafeAreaView` with `Animated.View` + `useSafeAreaInsets()` for explicit padding. The simpler approach: wrap `SafeAreaView`'s child in `Animated.View` with `flex: 1` and apply `backgroundColor` there — since the background fills the full flex area, this is visually equivalent.

**Per D-06:** Spring back on release is already implemented for `dragIntensity` in Joystick:
```typescript
// Existing in Joystick.tsx onEnd handler:
dragIntensity.value = withTiming(0, { duration: 200 });
// No change needed here — just ensure lifted SharedValue resets too.
```

### Pattern 3: Emoji Replacement with Ionicons (VIS-06)

**What:** A purely static (non-animated) substitution. `Ionicons` from `@expo/vector-icons` is used the same way it is in `_layout.tsx`.

**Pillar type change:** Remove `emoji: string` from `Pillar` interface; add `iconName: string`. Same for `DirectionInfo` in `swipeDirections`. This is a TypeScript breaking change that cascades to all render sites — the TypeScript compiler will flag every usage.

**All confirmed render locations:**

| File | Current pattern | Replace with |
|------|----------------|--------------|
| `src/constants/pillars.ts` | `emoji: '🕌'` / `emoji: '⬆️'` | `iconName: 'moon-outline'` / `iconName: 'chevron-up-outline'` |
| `src/components/joystick/Joystick.tsx` L365 | `<Animated.Text style={styles.emoji}>{pillar.emoji}</Animated.Text>` | `<Ionicons name={pillar.iconName} size={20} color={colors.textSecondary} />` |
| `src/components/joystick/Joystick.tsx` indicators | `<View style={styles.indicatorDot}>` colored dots | `<Ionicons name={directionIconName} ...>` chevrons, opacity=0 at rest, 1 during hold |
| `src/components/analytics/SummaryStatsRow.tsx` L75 | `{stats.topPillar.emoji}` | `<Ionicons name={stats.topPillar.iconName} size={24} color={...} />` |
| `src/components/goals/TargetFormModal.tsx` L90 | `{p.emoji} {p.name}` | `<Ionicons name={p.iconName} ...> {p.name}` |
| `src/components/goals/TargetList.tsx` L18 | `` `${pillar.emoji} ${pillar.name}` `` | Cannot use `<Ionicons>` in a string template; refactor `title` to exclude emoji, render icon separately in `renderSectionHeader` |

**Direction indicator chevrons on joystick (D-10):** Replace the four `indicatorDot` `View`s with `Ionicons` chevrons. Change opacity behavior: 0 at rest (instead of 0.25), 1 when active (same as today). The `Animated.View` wrapper stays; the `View + indicatorDot` inside is replaced with `<Ionicons>`.

**Example icon mapping helper:**
```typescript
// src/constants/pillars.ts additions
export const directionIconMap: Record<SwipeDirection, string> = {
  up: 'chevron-up-outline',
  down: 'chevron-down-outline',
  left: 'chevron-back-outline',
  right: 'chevron-forward-outline',
};
```

### Anti-Patterns to Avoid

- **Wrapping Skia Canvas in GestureDetector:** The Skia Canvas must have `pointerEvents="none"` — gesture handling must stay on the existing `GestureDetector` around the `Animated.View` outerRing. If the canvas intercepts touches, joystick stops working.
- **Growing Skia element tree dynamically:** Established pattern from `BodyFillCanvas.tsx` (pre-allocated slots). For the glow ring, a single `Circle + BlurMask` is fixed — no dynamic growth issue here.
- **String-concatenating icon names into section titles (TargetList):** `SectionList.renderSectionHeader` receives a data object; the `title` is currently a string including emoji. Don't try to embed an Ionicons component in the string — store icon separately and render it in the JSX.
- **Animating SafeAreaView backgroundColor directly:** SafeAreaView is not an Animated component. Use `Animated.View` inside or via `useSafeAreaInsets()` manually.
- **Passing SharedValue to regular `style` prop:** SharedValue must go through `useAnimatedStyle()` to reach RN. Skia components accept SharedValues directly as props; RN Animated.View does not — it needs `useAnimatedStyle`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exterior glow effect | Custom SVG ring with gradient fill | `BlurMask` with style "outer" | BlurMask is GPU-accelerated and sigma is directly animatable via SharedValue |
| Color interpolation between background and pillar color | Manual hex → RGB → lerp → hex conversion | `interpolateColor()` from Reanimated | Already used in flashAnimatedStyle; handles hex strings natively |
| Direction icon mapping | Switch/case in render function | `directionIconMap` record in pillars.ts | Centralizes icon mapping alongside pillar data |
| Performance detection of Skia vs shadow fallback | Complex FPS measurement | Manual test on target device + conditional render | D-02 decision is made at development time, not runtime |

**Key insight:** The Skia BlurMask sigma pipe to SharedValue is the critical pattern. Without it, intensity animation would require `setState` on each frame — which defeats the purpose of Skia for performance.

## Common Pitfalls

### Pitfall 1: Skia Canvas Touch Interception
**What goes wrong:** The Canvas `View` sits above the GestureDetector and absorbs pan events. Joystick becomes unresponsive.
**Why it happens:** React Native's hit testing assigns touches to the topmost view that has a touch handler.
**How to avoid:** Add `pointerEvents="none"` to the Canvas's containing View. React Native passes `pointerEvents` through to the native layer.
**Warning signs:** Joystick knob doesn't move when you try to drag; no gesture callbacks fire.

### Pitfall 2: BlurMask Clips to Canvas Bounds
**What goes wrong:** The glow is visually cut off at the edge of the Canvas.
**Why it happens:** Skia clips all drawing to canvas bounds. If canvas is sized to match the ring, the exterior blur is clipped before it extends outward.
**How to avoid:** Size the canvas to `JOYSTICK_SIZE + MAX_BLUR_SIGMA * 2` and offset it negatively by `MAX_BLUR_SIGMA` in each direction so the ring is centered in the canvas with room for blur to spread.
**Warning signs:** Glow looks like a hard ring edge instead of a soft halo.

### Pitfall 3: SharedValue Not Updating Skia Props
**What goes wrong:** Glow intensity stays at zero despite dragging.
**Why it happens:** Skia in version 2.4.18 reads SharedValues via its `ReanimatedRecorder` — the SharedValue must be a `useDerivedValue` or `useSharedValue` from Reanimated (the one imported from `react-native-reanimated`), not a plain object with `.value`.
**How to avoid:** Always use `useDerivedValue(() => ...)` to create the sigma SharedValue from `dragIntensity`. Do not compute the value and assign as a plain number.
**Warning signs:** Glow renders at fixed intensity and never changes.

### Pitfall 4: `pillar.emoji` TypeScript Errors After Field Removal
**What goes wrong:** Removing `emoji` from `Pillar` interface causes TypeScript to flag all usages as errors, including places you haven't found yet.
**Why it happens:** The TypeScript compiler catches all usages at build time.
**How to avoid:** Remove `emoji` from the interface first, then let TypeScript errors guide you to all remaining usages. Don't search-and-replace manually — let the type system be the checklist.
**Warning signs:** `tsc` reports errors in unexpected files after the pillars.ts change.

### Pitfall 5: TargetList Section Title String Cannot Contain JSX
**What goes wrong:** `${pillar.emoji} ${pillar.name}` is replaced with something like `${pillar.iconName} ${pillar.name}` which just renders the string "moon-outline With Others".
**Why it happens:** The `sections` array's `title` field is a string passed to `renderSectionHeader`. You cannot embed a React component in a string.
**How to avoid:** Store only `pillar.name` in the `title` field (or add a separate `pillarId` field to the section), then render the icon in `renderSectionHeader` JSX alongside the text.
**Warning signs:** Section headers show icon name strings instead of icon glyphs.

### Pitfall 6: Background Color Not Animating Across All 3 Pillars
**What goes wrong:** Background only shifts for one pillar (whichever's dragIntensity was last written).
**Why it happens:** Three joysticks each write to their own internal `dragIntensity` SharedValue. The home screen has no reference to them.
**How to avoid:** Lift dragIntensity SharedValues from Joystick internals to index.tsx, pass them as props. Track which pillar is dragging via a separate `activePillarId` SharedValue. Use `useDerivedValue` to combine all three into the `backgroundColor` interpolation.
**Warning signs:** Dragging joystick 2 or 3 has no effect on background; only joystick 1 works.

## Code Examples

Verified patterns from official sources:

### BlurMask "outer" on Circle
```typescript
// Source: verified from @shopify/react-native-skia@2.4.18 src
// BlurStyle enum: Normal=0, Solid=1, Outer=2, Inner=3
// BlurMask prop: style="outer" | "normal" | "solid" | "inner"
import { Canvas, Circle, BlurMask } from '@shopify/react-native-skia';

<Canvas style={{ width: 140, height: 140, position: 'absolute' }}>
  <Circle cx={70} cy={70} r={50} color="#F5A623">
    <BlurMask blur={blurSigmaSharedValue} style="outer" respectCTM={false} />
  </Circle>
</Canvas>
```

### Ionicons Usage (matching existing pattern)
```typescript
// Source: verified from app/(tabs)/_layout.tsx — confirmed usage pattern
import { Ionicons } from '@expo/vector-icons';

// On knob (Afterlife pillar):
<Ionicons name="moon-outline" size={20} color={colors.textSecondary} />

// As direction indicator (up):
<Ionicons name="chevron-up-outline" size={INDICATOR_SIZE * 2} color={pillar.positiveColor} />
```

### interpolateColor for background (Reanimated 4.2.1)
```typescript
// Source: already used in Joystick.tsx flashAnimatedStyle (verified)
import { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

const backgroundStyle = useAnimatedStyle(() => ({
  backgroundColor: interpolateColor(
    totalDragIntensity.value,  // 0 → 1
    [0, 1],
    [
      '#0A0A0F',               // colors.background (neutral)
      pillarTintColor,         // e.g. '#F5A623' + alpha blending via interpolateColor
    ]
  ),
}));
```

**Note on ~10-15% tint:** `interpolateColor` at value=1 will produce the full pillar color. To achieve "barely noticeable" at max drag, use a desaturated / low-opacity version of the pillar color as the target. Recommended: mix the pillar color toward background with ~85% background weight. Concretely, for Afterlife (`#F5A623`), the hue-shifted target at "full drag" should be something like `'#1A1208'` (very dark amber) rather than the full amber. Claude's discretion for exact values.

### Pillar iconName field
```typescript
// src/constants/pillars.ts
export interface Pillar {
  id: PillarId;
  key: PillarKey;
  name: string;
  arabic: string;
  iconName: string;   // replaces: emoji: string
  positiveColor: string;
  negativeColor: string;
  description: string;
}

// Updated pillar entries:
{ id: 1, key: 'afterlife', iconName: 'moon-outline', ... }
{ id: 2, key: 'self',      iconName: 'heart-outline', ... }
{ id: 3, key: 'others',    iconName: 'people-outline', ... }
```

```typescript
// swipeDirections DirectionInfo — replace emoji with iconName
export interface DirectionInfo {
  label: string;
  valence: Valence;
  type: ActionType;
  iconName: string;   // replaces: emoji: string
}
```

### JoystickProps extension for SharedValue lift
```typescript
// src/components/joystick/types.ts
import type { SharedValue } from 'react-native-reanimated';

export interface JoystickProps {
  pillarId: PillarId;
  onSwipe: (result: SwipeResult) => void;
  onHoldStart?: (direction: SwipeDirection) => void;
  onHoldEnd?: () => void;
  disabled?: boolean;
  // VIS-05: optional lifted SharedValues for background hue shift
  dragIntensityRef?: SharedValue<number>;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useComputedValue` (Skia-internal animation values) | Pass Reanimated `SharedValue` directly to Skia props | Skia ~0.1.195 + | SharedValues from Reanimated work directly as Skia prop values — no adapter needed |
| RN shadow (`shadowOpacity`, `shadowRadius`) | Skia `BlurMask` | This phase | Skia produces GPU-quality glow; RN shadow is the D-02 fallback |
| `Animated.Text` with emoji string | `Ionicons` component | This phase | Vector icons are crisp at all display densities; emoji rendering varies by OS |

**Deprecated/outdated:**
- `pillar.emoji` field: Being removed entirely. Any future code should use `pillar.iconName`.
- Direction indicator colored dots (`indicatorDot` style): Replaced by Ionicons chevrons.

## Open Questions

1. **Water-drop directional stretch of the glow (D-01)**
   - What we know: `BlurMask` produces a symmetric radial glow. Directional stretch requires either: (a) drawing an ellipse instead of a circle with `rx`/`ry` varying by angle, or (b) a `DisplacementMapImageFilter` with turbulence noise.
   - What's unclear: The Skia `Circle` component only takes a radius scalar, not separate rx/ry. An oval would need the `Oval` component. The displacement map approach requires a shader, which is more complex.
   - Recommendation: Start with symmetric glow (always round) and treat directional stretch as a stretch-goal within the task. The CONTEXT.md lists this under Claude's discretion. If Phase 11 adds the directional hold SharedValue, it could drive rx vs ry via `useDerivedValue`.

2. **SafeAreaView vs Animated.View for background**
   - What we know: `SafeAreaView` from `react-native-safe-area-context` is not an Animated component. The current `index.tsx` uses `SafeAreaView` directly as the root.
   - What's unclear: Whether wrapping the FlatList content in `Animated.View` is visually correct (the background gap at the top/bottom safe areas would remain `colors.background`).
   - Recommendation: Use `Animated.View` with `StyleSheet.absoluteFillObject` as a background layer beneath the `SafeAreaView`, rather than replacing SafeAreaView. This avoids inset edge cases entirely.

3. **Combining three joystick intensities for background**
   - What we know: Each joystick has its own `dragIntensity` SharedValue. They are not simultaneous in practice (user has one thumb at a time).
   - What's unclear: Whether to sum, max, or use separate tint per joystick.
   - Recommendation: `Math.max(afterlifeDrag.value, selfDrag.value, othersDrag.value)` — per D-07, the background should reflect the actively-dragged pillar. Track which is active and apply that pillar's color.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@shopify/react-native-skia` | VIS-03 glow | Yes | 2.4.18 | D-02: enhanced shadow fallback |
| `@expo/vector-icons` (Ionicons) | VIS-06 icons | Yes | 15.0.2 | — |
| `react-native-reanimated` | VIS-03, VIS-05 | Yes | 4.2.1 | — |
| Node.js | Build toolchain | Yes | v20.20.1 | — |
| Expo CLI | Dev server | Yes | 55.0.18 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- Skia glow (D-02): If Skia Canvas degrades gesture frame rate, fall back to enhanced `glowAnimatedStyle` using larger `shadowRadius` and `shadowOpacity` + brighter `borderColor` interpolated via `useAnimatedStyle`. No library change needed — pure RN shadow path.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo preset |
| Config file | `jest.config.js` (multi-project: unit + native) |
| Quick run command | `npx jest --config jest.unit.config.js` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-03 | Skia glow canvas renders without crashing | manual-only | — | — |
| VIS-03 | dragIntensity SharedValue controls glow sigma | manual-only | — | — |
| VIS-05 | Background color changes during drag, resets on release | manual-only | — | — |
| VIS-06 | `pillar.iconName` field present on all pillars | unit | `npx jest --config jest.unit.config.js --testPathPattern pillars` | No — Wave 0 gap |
| VIS-06 | All emoji strings removed from pillars.ts and swipeDirections | unit | `npx jest --config jest.unit.config.js --testPathPattern pillars` | No — Wave 0 gap |
| VIS-06 | Ionicons renders in TargetList/TargetFormModal without crash | manual-only | — | — |

**Why mostly manual:** VIS-03 and VIS-05 are animation/canvas behaviors that require a running device. The jest-expo environment mocks Reanimated and Skia; animated output is not verifiable in unit tests. VIS-06 data changes are unit-testable.

### Sampling Rate
- **Per task commit:** `npx jest --config jest.unit.config.js` (pure unit tests, ~5s)
- **Per wave merge:** `npx jest` (full suite including native component stubs)
- **Phase gate:** Full suite green + manual device verification before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/constants/pillars.test.ts` — covers VIS-06: verify `iconName` field present on all pillars, no `emoji` field, all iconNames are non-empty strings
- [ ] No framework install needed — jest already configured

## Sources

### Primary (HIGH confidence)
- `@shopify/react-native-skia@2.4.18` source (local node_modules) — `BlurMask`, `Box`, `BoxShadow`, `Shadow` (DropShadow), `BlurImageFilter`, `BlurStyle` enum, `AnimatedProp` type, `ReanimatedRecorder` (SharedValue integration)
- `@expo/vector-icons@15.0.2` Ionicons glyph map (local) — confirmed: `moon-outline`, `heart-outline`, `people-outline`, `chevron-up-outline`, `chevron-down-outline`, `chevron-back-outline`, `chevron-forward-outline`
- `src/components/joystick/Joystick.tsx` — existing `glowAnimatedStyle`, `dragIntensity`, `interpolateColor`, indicator pattern
- `src/constants/pillars.ts` — current `emoji` field locations and types
- `src/components/analytics/SummaryStatsRow.tsx`, `TargetFormModal.tsx`, `TargetList.tsx` — emoji render locations confirmed
- `app/(tabs)/index.tsx` — SafeAreaView container, backgroundColor style location
- `app/(tabs)/_layout.tsx` — confirmed Ionicons usage pattern

### Secondary (MEDIUM confidence)
- `src/components/physics/BodyFillCanvas.tsx` — established Skia Canvas pattern in project (Canvas + Group + clip, no useAnimatedProps needed)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries installed and source-verified locally
- Architecture: HIGH — based on reading actual source code of existing Joystick.tsx, BodyFillCanvas.tsx, and Skia internals
- Pitfalls: HIGH — derived from reading Skia source (Recorder, AnimatedProp, BlurStyle) and existing code patterns

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable libraries; Skia and Reanimated versions are locked in package.json)
