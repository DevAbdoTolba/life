# Requirements: Hayat (Life Balance Tracker)

**Defined:** 2026-03-23
**Core Value:** Effortless behavioral self-awareness through gesture-driven logging and creative visualization

## v1 Requirements

### Logging
- [x] **LOG-01**: 3 joystick analogs visible on main screen in triangle layout (one per pillar)
- [x] **LOG-02**: Swipe in 4 directions (up/down/left/right) to log positive/negative, direct/indirect actions in under 2 seconds
- [x] **LOG-03**: Swipe + hold to reveal radial target menu and select specific targets in under 4 seconds
- [ ] **LOG-04**: Optional text notes can be added to any log entry

### Data
- [x] **DATA-01**: All data persists locally in SQLite across app restarts
- [x] **DATA-02**: Export all data as JSON backup file
- [x] **DATA-03**: Import and restore from backup file with validation
- [x] **DATA-04**: App runs fully offline with zero network requirements

### Goals
- [x] **GOAL-01**: Goals can be created, edited, completed, paused, failed, and archived
- [x] **GOAL-02**: Full goal history/changelog tracking
- [x] **GOAL-03**: Targets are strictly per-pillar (cannot span multiple pillars)

### Privacy
- [x] **PRIV-01**: Goals can be masked with auto-assigned funny codenames from a pool of ~30
- [x] **PRIV-02**: Real goal names hidden behind password-protected reveal

### Visualization
- [x] **VIZ-01**: Bullet journal style charts (bar, pie, trend lines) for any time period
- [x] **VIZ-02**: Physics-based human body silhouette fills with colored balls representing actions
- [x] **VIZ-03**: Custom time period selector (today, week, month, Ramadan, custom range)
- [x] **VIZ-04**: Period comparison view (this week vs last week)
- [x] **VIZ-05**: Target-specific analytics (trending for individual targets)

### Notifications
- [x] **NOTIFY-01**: Configurable daily review notification prompting user to log
- [x] **NOTIFY-02**: Period review reminders

### Polish
- [ ] **POLISH-01**: Onboarding flow explaining 3 pillars + gesture tutorial
- [ ] **POLISH-02**: Settings screen (reminder frequency, codename password, data management)
- [ ] **POLISH-03**: App icon and splash screen

## v2 Requirements

### Cloud Sync (v1.1)
- **SYNC-01**: Node.js + Express + MongoDB Atlas backend
- **SYNC-02**: WatermelonDB migration for sync protocol
- **SYNC-03**: Offline-first with sync when online
- **SYNC-04**: Multi-device support

### Social (v1.2)
- **SOCIAL-01**: Optional user accounts
- **SOCIAL-02**: Share progress with accountability partners

### Localization (v1.3)
- **L10N-01**: Arabic (RTL) UI support
- **L10N-02**: Additional languages

## Out of Scope

| Feature | Reason |
|---------|--------|
| Gamification (badges, streaks) | Not aligned with mindful self-awareness core value |
| AI-powered insights | Deferred to v1.4 |
| Web version | Mobile-first product |
| Light mode | Dark-only for v1 (ADR-008) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOG-01 | Phase 1, 2 | Complete |
| LOG-02 | Phase 2 | Complete |
| LOG-03 | Phase 2 | Complete |
| LOG-04 | Phase 2 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 5 | Complete |
| DATA-03 | Phase 5 | Complete |
| DATA-04 | Phase 1 | Complete |
| GOAL-01 | Phase 3 | Complete |
| GOAL-02 | Phase 3 | Complete |
| GOAL-03 | Phase 3 | Complete |
| PRIV-01 | Phase 3 | Complete |
| PRIV-02 | Phase 3 | Complete |
| VIZ-01 | Phase 4 | Complete |
| VIZ-02 | Phase 4 | Complete |
| VIZ-03 | Phase 4 | Complete |
| VIZ-04 | Phase 4 | Complete |
| VIZ-05 | Phase 4 | Complete |
| NOTIFY-01 | Phase 5 | Complete |
| NOTIFY-02 | Phase 5 | Complete |
| POLISH-01 | Phase 5 | Pending |
| POLISH-02 | Phase 5 | Pending |
| POLISH-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after Phase 3 completion*
