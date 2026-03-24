# Requirements: Hayat (Life Balance Tracker)

**Defined:** 2026-03-24
**Core Value:** Effortless behavioral self-awareness through gesture-driven logging and creative visualization

## v1.1 Requirements

Requirements for v1.1 Refinement & Polish. Each maps to roadmap phases.

### Bug Fixes

- [ ] **BUG-01**: App allows screen to dim when not actively interacting (no permanent wake lock)
- [ ] **BUG-02**: Body-fill visualization renders and animates balls falling with physics
- [ ] **BUG-03**: Center hold vibrates only (toggles note mode) — does not show targets
- [ ] **BUG-04**: Directional hold shows targets fanned at 30° intervals from swipe direction

### UX Corrections

- [ ] **UX-01**: Notes only prompted when center-hold note mode is active, not on every swipe
- [ ] **UX-02**: Daily activity displays as line chart instead of bar chart (bar chart had ugly overflow)
- [ ] **UX-03**: Analog joysticks positioned in thumb-reach zone; activity list pushed below viewport with only latest entry peeking

### Visual Polish

- [ ] **VIS-01**: Joystick base has 4 section separator lines dividing the quadrants
- [ ] **VIS-02**: Held section changes background color (section fill + app background)
- [ ] **VIS-03**: Liquid analog design — Skia border-shadow water-drop separation effect intensifies on drag
- [ ] **VIS-04**: Haptic vibration fires on every hold-start event
- [ ] **VIS-05**: App background hue shifts toward pillar color when dragging in a direction
- [ ] **VIS-06**: Remove AI-generated emoji clutter, replace with simple pillar icons

## v1.2 Requirements

Deferred to next milestone. Tracked but not in current roadmap.

### Privacy & Authentication

- **AUTH-01**: Privacy mode lock/unlock requires authentication (currently bypassed)
- **AUTH-02**: Privacy mode uses biometric auth (fingerprint/Face ID) with phone PIN fallback

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cloud sync / MongoDB backend | Deferred indefinitely — not in current plans |
| Social/sharing features | Deferred indefinitely — not in current plans |
| AI-powered insights | Deferred indefinitely — not in current plans |
| Islamic calendar integration | Deferred to future milestone |
| Home screen widget | Deferred to future milestone |
| Neutral swipe (tap without direction) | Deferred to future milestone |
| Data migration to WatermelonDB | Unnecessary without cloud sync |
| User accounts / server auth | Local-only app |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | — | Pending |
| BUG-02 | — | Pending |
| BUG-03 | — | Pending |
| BUG-04 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |
| VIS-01 | — | Pending |
| VIS-02 | — | Pending |
| VIS-03 | — | Pending |
| VIS-04 | — | Pending |
| VIS-05 | — | Pending |
| VIS-06 | — | Pending |

**Coverage:**
- v1.1 requirements: 13 total
- Mapped to phases: 0
- Unmapped: 13

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after initial definition*
