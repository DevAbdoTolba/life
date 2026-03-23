---
phase: 3
plan: 2
wave: 1
depends_on: ["1"]
files_modified:
  - app/(tabs)/goals.tsx
  - src/components/goals/TargetCard.tsx
  - src/components/goals/TargetList.tsx
autonomous: true
---

# Plan 3.2: Goals Screen & Target List

## Objective
Build the main Goals screen to list targets grouped by Pillar, utilizing the `useTargetStore` from Phase 1.

## Context
- .gsd/SPEC.md
- app/(tabs)/goals.tsx
- src/stores/targetStore.ts
- src/stores/authStore.ts

## Tasks

<task type="auto">
  <name>Create TargetCard component</name>
  <files>
    src/components/goals/TargetCard.tsx
  </files>
  <action>
    Build `TargetCard` that receives a `Target` and tracks `isUnlocked` from `useAuthStore`.
    - If `target.isMasked` and `!isUnlocked`, show ONLY `target.codename` and a distinct "Masked" styling (a subtle lock icon or blur aesthetic).
    - If `isUnlocked` or `!target.isMasked`, show `target.realName`.
    - Show target status (active, paused, completed) as a small badge.
    - Implement a clean design with `colors` and `typography` fitting the Afterlife/Self/Others color scheme.
  </action>
  <verify>npx tsc --noEmit src/components/goals/TargetCard.tsx</verify>
  <done>TargetCard renders conditionally based on auth state and masked status.</done>
</task>

<task type="auto">
  <name>Assemble Grouped List in Goals Screen</name>
  <files>
    app/(tabs)/goals.tsx
    src/components/goals/TargetList.tsx
  </files>
  <action>
    **Create `TargetList.tsx`**:
    - Take an array of targets and render `TargetCard` items dynamically inside a structural Flexbox layout.
    - Group them logically by Pillar ID.
    
    **Update `app/(tabs)/goals.tsx`**:
    - Combine the component list and a header with a "Lock/Unlock privacy" toggle trigger (invoking `AuthModal`).
    - Add a Floating Action Button (FAB) at the bottom for "New Target" additions.
    - Ensure `loadTargets` is fired upon hook mount to populate lists correctly.
  </action>
  <verify>npx tsc --noEmit app/(tabs)/goals.tsx</verify>
  <done>Goals screen shows lists grouped by pillar and propagates AuthStore state variables cleanly down the component tree.</done>
</task>

## Success Criteria
- [ ] Target listing spans correctly across Afterlife, Self, and Others clusters.
- [ ] UI masks target real names appropriately preventing sensitive leaks.
- [ ] Screen layout adheres strictly to the Dark-mode only requirement of v1 without using ad-hoc sizing.
