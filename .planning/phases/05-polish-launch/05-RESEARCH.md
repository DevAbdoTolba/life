# Phase 05: Polish, Export & Launch Prep - Research

**Researched:** 2026-03-23
**Domain:** Expo SDK 55 — notifications, file I/O, document picking, onboarding carousel, settings UI, app icon/splash
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Export/Import Flow**
- D-01: Export triggered from Settings screen "Data" section — produces a single JSON file containing all tables (logs, targets, target_history, periods, settings)
- D-02: Export uses the OS share sheet (via expo-sharing) so user can save to Files, send via message, email, etc.
- D-03: Import reads a JSON file, validates schema structure, shows a summary of what will be imported (log count, target count, date range), and requires user confirmation before proceeding
- D-04: Import is full replace (not merge) — user is warned that existing data will be overwritten. Simplest approach for v1; merge complexity deferred

**Onboarding Experience**
- D-05: Swipeable card carousel, 3-4 screens: (1) Welcome + 3 pillars concept, (2) Gesture tutorial with interactive practice swipe on a demo joystick, (3) Privacy/codename feature overview, (4) optional — analytics preview
- D-06: Interactive gesture demo on screen 2 — user practices a swipe on a dummy joystick to build muscle memory before the real app
- D-07: Skip button visible on all onboarding screens — respects user autonomy
- D-08: Onboarding shown on first launch only, gated by `settingsStore.onboardingComplete` (field already exists)
- D-09: After onboarding completion or skip, navigate to home tab and never show again

**Notification Strategy**
- D-10: Use expo-notifications for both local daily reminders and period review notifications
- D-11: Daily reminder: gentle, neutral prompt (e.g., "Time for your daily check-in") — not gamified
- D-12: Reminder time configurable in settings, default 21:00 (already in settingsStore.reminderTime)
- D-13: Period review: weekly summary notification on a configurable day, content mentions pillar activity counts for the past week
- D-14: Notification permission requested when user first enables reminders in settings — graceful fallback message if denied
- D-15: Notifications are purely local — no server component needed

**Settings Screen Layout**
- D-16: Grouped sections with section headers: Reminders, Privacy, Data, About
- D-17: Reminders section: toggle enable/disable, time picker, weekly review day picker
- D-18: Privacy section: toggle privacy mode, change PIN (uses existing authStore/settingsStore)
- D-19: Data section: Export button, Import button, data stats (total logs, date range)
- D-20: About section: app version, credits
- D-21: ScreenContainer with scrollable=true, consistent with analytics screen pattern
- D-22: Section header + Card-based row items pattern — dark surface cards matching existing Card component

**App Icon & Splash Screen**
- D-23: App icon: abstract geometric symbol representing balance/three pillars — minimalist
- D-24: Splash screen: centered icon with "Hayat" app name text, dark background matching colors.background (#0A0A0F)
- D-25: Use expo-splash-screen (already imported in _layout.tsx) for splash management

**Performance Optimization**
- D-26: Profile and optimize gesture fps (target: consistent 60fps on mid-range devices)
- D-27: Optimize Skia rendering in body-fill visualization — check for unnecessary re-renders
- D-28: SQLite query optimization — ensure indexes are hit for common analytics queries

### Claude's Discretion
- Onboarding illustration style and color palette for each screen
- Exact notification copy/wording
- Settings row component design (height, padding, icon usage)
- Export file naming convention (e.g., hayat-backup-2026-03-23.json)
- Performance profiling methodology and specific optimizations
- Import progress indicator design
- Carousel animation/transition style for onboarding

### Deferred Ideas (OUT OF SCOPE)
- Data migration strategy from SQLite to WatermelonDB for v1.1 cloud sync
- Islamic calendar integration for Ramadan periods
- "Neutral" swipe (tap without direction) as a 5th action type
- Home screen widget support
- Light mode option
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-02 | Export all data as JSON backup file | expo-file-system (File API, Paths.cache), expo-sharing (shareAsync), db.getAllAsync for all 5 tables |
| DATA-03 | Import and restore from backup file with validation | expo-document-picker (getDocumentAsync, copyToCacheDirectory: true), expo-file-system (legacy readAsStringAsync or File.text()), JSON schema validation, db.runAsync for replace |
| NOTIFY-01 | Configurable daily review notification prompting user to log | expo-notifications scheduleNotificationAsync with DAILY trigger, requestPermissionsAsync, Android notification channel required |
| NOTIFY-02 | Period review reminders | expo-notifications scheduleNotificationAsync with WEEKLY trigger, weekday param (1=Sun...7=Sat), settingsStore needs weeklyReviewDay field |
| POLISH-01 | Onboarding flow explaining 3 pillars + gesture tutorial | FlatList with pagingEnabled for carousel, Reanimated 4 for gesture demo, settingsStore.completeOnboarding(), Expo Router navigation |
| POLISH-02 | Settings screen (reminder frequency, codename password, data management) | Replace settings.tsx placeholder, ScreenContainer scrollable=true, Card-based rows, authStore for PIN, DateTimePicker or custom time input for reminder time |
| POLISH-03 | App icon and splash screen | 1024x1024 PNG for icon.png (no transparency), 1024x1024 PNG with transparent bg for splash-icon.png, Android adaptive icon layers already scaffolded in app.json |
</phase_requirements>

---

## Summary

Phase 05 completes the app for v1 launch by adding the final functional layer — export/import, notifications, onboarding, and a real settings screen — on top of the fully working phases 1-4. All required Expo libraries (`expo-notifications`, `expo-sharing`, `expo-file-system`) are already installed at their SDK 55 versions. Only `expo-document-picker` needs to be added.

The `expo-file-system` package at v55 ships both a new `File`/`Paths` API and a legacy `expo-file-system/legacy` import with `writeAsStringAsync`/`readAsStringAsync`. Either works; the new `File` class is preferred for clean code. The `expo-sharing` `shareAsync(url)` call simply takes a local `file://` URI and opens the OS share sheet — no configuration beyond the already-present plugin entry.

Notifications require an Android notification channel to be created before scheduling, and the `expo-notifications` plugin entry must be added to `app.json` for correct Android manifest permissions. The `settingsStore` already has `reminderEnabled`, `reminderTime`, and `onboardingComplete` but is missing `weeklyReviewDay` — one new field needed for NOTIFY-02.

**Primary recommendation:** Wire all features through the existing store/database patterns. No new state management libraries needed. The onboarding carousel is best built with a plain `FlatList` (pagingEnabled, horizontal) — no extra library needed given Reanimated is already present.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-notifications | 55.0.13 | Local push notifications scheduling | Official Expo, local-only (no server needed), SDK 55 compatible |
| expo-file-system | 55.0.11 | Write JSON file to device storage | Official Expo, provides both new File API and legacy writeAsStringAsync |
| expo-sharing | 55.0.14 | Open OS share sheet for export | Official Expo, one-call shareAsync(uri) invokes native share UI |
| expo-splash-screen | 55.0.12 | Manage splash screen visibility | Already in use in _layout.tsx |

### Needs Installation
| Library | Version | Purpose | Install Command |
|---------|---------|---------|-----------------|
| expo-document-picker | ~55.0.x | Pick JSON file from device storage for import | `npx expo install expo-document-picker` |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-reanimated | 4.2.1 | Carousel animation, gesture demo | Onboarding screen transitions, interactive joystick demo |
| react-native-gesture-handler | ~2.30.0 | Gesture demo joystick | Onboarding screen 2 interactive practice swipe |
| expo-router | ~55.0.7 | Navigation to onboarding route | New `app/onboarding.tsx` route, redirect to tabs after completion |
| expo-constants | ~55.0.9 | App version in About section | `Constants.expoConfig.version` |
| expo-haptics | ~55.0.9 | Tactile feedback during gesture demo | Optional enhancement for onboarding joystick |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain FlatList carousel | react-native-snap-carousel | FlatList + pagingEnabled is sufficient for 3-4 static screens, no extra dep needed |
| expo-document-picker | File.pickFileAsync() | New File API has `pickFileAsync` but it's undocumented/experimental; document-picker is the stable approach |
| expo-file-system/legacy | expo-file-system new File API | New API is cleaner; legacy still works but emits deprecation warnings in SDK 55 |

**Installation (new dependency only):**
```bash
npx expo install expo-document-picker
```

---

## Architecture Patterns

### Recommended Project Structure (additions)
```
app/
├── onboarding.tsx           # New: full-screen onboarding flow
app/(tabs)/
├── settings.tsx             # Replace placeholder with full settings screen
src/
├── services/
│   ├── notifications.ts     # New: schedule/cancel notification helpers
│   ├── exportService.ts     # New: dump all tables to JSON, return File URI
│   └── importService.ts     # New: parse/validate JSON, write to SQLite
├── components/
│   └── onboarding/
│       ├── OnboardingCarousel.tsx   # FlatList wrapper with pagination dots
│       ├── WelcomeSlide.tsx         # Slide 1: pillars concept
│       ├── GestureSlide.tsx         # Slide 2: interactive joystick demo
│       ├── PrivacySlide.tsx         # Slide 3: codename feature
│       └── AnalyticsSlide.tsx       # Slide 4 (optional): analytics preview
│   └── settings/
│       ├── SettingsSection.tsx      # Section header + child rows wrapper
│       └── SettingsRow.tsx          # Individual row: label, value, action
```

### Pattern 1: Export Service (SQLite → JSON → Share Sheet)
**What:** Query all 5 tables, serialize to JSON, write to cache, open share sheet
**When to use:** Export button tap in settings

```typescript
// Source: expo-file-system v55 File API + expo-sharing shareAsync
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database';

export async function exportData(): Promise<void> {
  const db = getDatabase();
  const [logs, targets, targetHistory, periods, settings] = await Promise.all([
    db.getAllAsync('SELECT * FROM logs'),
    db.getAllAsync('SELECT * FROM targets'),
    db.getAllAsync('SELECT * FROM target_history'),
    db.getAllAsync('SELECT * FROM periods'),
    db.getAllAsync('SELECT * FROM settings'),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { logs, targets, target_history: targetHistory, periods, settings },
  };

  const filename = `hayat-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, filename);
  file.write(JSON.stringify(backup, null, 2));

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Hayat Backup',
    UTI: 'public.json',
  });
}
```

### Pattern 2: Import Service (Pick File → Validate → Replace)
**What:** Open document picker, read JSON, validate schema, confirm with user, truncate tables and reinsert
**When to use:** Import button tap in settings

```typescript
// Source: expo-document-picker getDocumentAsync + expo-file-system legacy
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export async function pickAndValidateBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,  // Required: makes URI readable by FileSystem
  });

  if (result.canceled) return null;

  const uri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(uri);
  const parsed = JSON.parse(content);

  // Schema validation
  if (!parsed.version || !parsed.data?.logs || !parsed.data?.targets) {
    throw new Error('Invalid backup format');
  }

  return {
    logCount: parsed.data.logs.length,
    targetCount: parsed.data.targets.length,
    dateRange: {
      from: parsed.data.logs[0]?.created_at,
      to: parsed.data.logs[parsed.data.logs.length - 1]?.created_at,
    },
    parsed,
  };
}

export async function restoreFromBackup(parsed: BackupFile): Promise<void> {
  const db = getDatabase();
  // Full replace: truncate then reinsert
  await db.execAsync('DELETE FROM logs; DELETE FROM targets; DELETE FROM target_history; DELETE FROM periods;');
  // Batch insert each table...
}
```

### Pattern 3: Notification Scheduling
**What:** Schedule daily and weekly local notifications, cancel/reschedule when settings change
**When to use:** When user enables reminders or changes time/day

```typescript
// Source: expo-notifications v55 scheduleNotificationAsync
import * as Notifications from 'expo-notifications';

// Must call at app startup (in _layout.tsx or notifications.ts)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Android: Create channel before first schedule
await Notifications.setNotificationChannelAsync('hayat-reminders', {
  name: 'Daily Reminders',
  importance: Notifications.AndroidImportance.DEFAULT,
});

// Schedule daily reminder at user's configured time
export async function scheduleDailyReminder(hourMin: string): Promise<void> {
  const [hour, minute] = hourMin.split(':').map(Number);
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hayat',
      body: 'Time for your daily check-in',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'hayat-reminders',
    },
  });
}

// Schedule weekly review
export async function scheduleWeeklyReview(weekday: number, hour: number, minute: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hayat',
      body: 'Weekly review ready — see how your pillars balanced this week',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,  // 1=Sunday, 2=Monday ... 7=Saturday
      hour,
      minute,
      channelId: 'hayat-reminders',
    },
  });
}

// Request permissions (call when user first enables reminders)
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
```

### Pattern 4: Onboarding Carousel (FlatList, no library)
**What:** Horizontal paging FlatList with pagination dots, skip button, interactive slide 2
**When to use:** First launch, gated by settingsStore.onboardingComplete

```typescript
// Source: React Native FlatList pagingEnabled pattern
import { FlatList, useWindowDimensions } from 'react-native';
import { useRef, useState } from 'react';

export function OnboardingCarousel({ onComplete }: { onComplete: () => void }) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides = [WelcomeSlide, GestureSlide, PrivacySlide];

  const handleScroll = (event: any) => {
    const idx = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  return (
    <>
      {/* Skip button — always visible */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item: Slide }) => (
          <View style={{ width }}>
            <Slide />
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />
      {/* Pagination dots */}
    </>
  );
}
```

### Pattern 5: Onboarding Gate in _layout.tsx
**What:** Check onboardingComplete before rendering tabs, redirect to onboarding screen
**When to use:** App startup

```typescript
// In app/_layout.tsx after appReady check
const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

// In the Stack definition, add onboarding route
// Then in useEffect after appReady:
if (!onboardingComplete) {
  router.replace('/onboarding');
}
```

### Pattern 6: Settings Screen Structure
**What:** ScreenContainer (scrollable) with section groups using Card component rows
**When to use:** Full settings.tsx replacement

```typescript
// Section header component (Claude's discretion for styling)
function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm,
      fontFamily: typography.fontFamily.medium, textTransform: 'uppercase',
      letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.sm }}>
      {title}
    </Text>
  );
}

// Settings row inside a Card
function SettingsRow({ label, value, onPress, rightElement }) { ... }

// Settings screen layout
<ScreenContainer scrollable={true}>
  <SectionHeader title="Reminders" />
  <Card>
    <SettingsRow label="Daily Check-in" rightElement={<Switch />} />
    <SettingsRow label="Time" value={reminderTime} onPress={openTimePicker} />
    <SettingsRow label="Weekly Review" value={reviewDay} onPress={openDayPicker} />
  </Card>
  <SectionHeader title="Privacy" />
  ...
</ScreenContainer>
```

### Anti-Patterns to Avoid
- **Android notification without channel:** Notifications scheduled before `setNotificationChannelAsync` are silently dropped on Android 8+. Always create the channel first.
- **content:// URI with readAsStringAsync:** On Android, DocumentPicker may return `content://` URIs. Without `copyToCacheDirectory: true`, `readAsStringAsync` will fail. Always set `copyToCacheDirectory: true`.
- **Routing to onboarding before router is ready:** In Expo Router, `router.replace()` during initial render can cause errors. Call inside a `useEffect` that fires after `appReady`, or use the `<Redirect />` component.
- **Re-scheduling notifications on every render:** Schedule once and cancel/reschedule only when settings change. Wrap notification setup in a `useEffect` with deps on `[reminderEnabled, reminderTime]`.
- **Import without user confirmation:** D-03/D-04 require summary display + explicit confirm before destructive replace. Never auto-restore.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File picking from device | Custom native module | expo-document-picker | Handles content:// URIs, file copy to cache, cross-platform |
| Share sheet | Custom platform-specific code | expo-sharing shareAsync() | Invokes UIActivityViewController (iOS) / Intent.ACTION_SEND (Android) |
| Write file to temp storage | Manual FileDescriptor | expo-file-system File API | Handles path construction, temp file lifecycle |
| Notification scheduling | Background timers / setInterval | expo-notifications | OS-native scheduling, survives app kill/restart |
| Notification permissions | Custom permission request | expo-notifications requestPermissionsAsync | iOS cannot re-request after denial — use the expo API that handles this gracefully |
| Carousel pagination | Custom scroll tracking | FlatList pagingEnabled + onScroll | RN scroll snapping handles 60fps without extra code |

**Key insight:** All six problems involve native OS capabilities that have well-documented edge cases (iOS app lifecycle, Android Doze mode, content URIs). Using the Expo-provided wrappers avoids a month of debugging each.

---

## Common Pitfalls

### Pitfall 1: Android Notification Channel Not Created
**What goes wrong:** Notifications are scheduled successfully (no error thrown) but never delivered on Android 8+.
**Why it happens:** Android requires at least one channel before any notification can be displayed. The OS silently discards channelless notifications.
**How to avoid:** Call `setNotificationChannelAsync('hayat-reminders', {...})` in the notifications service initialization, before any `scheduleNotificationAsync` call.
**Warning signs:** Notifications work on iOS but not Android.

### Pitfall 2: expo-notifications Plugin Missing from app.json
**What goes wrong:** Android 12+ exact alarm permission is not added to the manifest; scheduled notifications fire unreliably, especially after device restart.
**Why it happens:** The `expo-notifications` config plugin adds `RECEIVE_BOOT_COMPLETED` and other permissions to AndroidManifest.xml at build time. Without the plugin entry, this is absent.
**How to avoid:** Add `"expo-notifications"` to the `plugins` array in `app.json`. The app.json currently has `"expo-sharing"` and `"expo-sqlite"` but not `"expo-notifications"`.
**Warning signs:** Notifications work in development but miss after device reboot.

### Pitfall 3: iOS Permission Denial is Permanent
**What goes wrong:** If the user denies notification permission, calling `requestPermissionsAsync()` again returns `denied` without showing a prompt. The user must go to iOS Settings manually.
**Why it happens:** iOS one-time permission model.
**How to avoid:** Show an explanatory modal BEFORE requesting permissions (per D-14). If `status === 'denied'`, show a link/instructions to open Settings instead of retrying the prompt.
**Warning signs:** Permission prompt never appears on second attempt.

### Pitfall 4: DocumentPicker content:// URI on Android
**What goes wrong:** `FileSystem.readAsStringAsync(uri)` throws "file not found" when given a `content://` URI returned by the document picker on Android.
**Why it happens:** `readAsStringAsync` in legacy mode requires `file://` URIs. Android document picker returns `content://` authority URIs.
**How to avoid:** Always pass `copyToCacheDirectory: true` to `getDocumentAsync`. This copies the file to the app's cache directory and returns a `file://` URI that FileSystem can read.
**Warning signs:** Import works on iOS but crashes on Android.

### Pitfall 5: Onboarding Screen Redirect Race Condition
**What goes wrong:** App crashes or shows blank screen when `router.replace('/onboarding')` is called before Expo Router is mounted.
**Why it happens:** Expo Router's navigation stack is not available during the very first render cycle.
**How to avoid:** Trigger the redirect inside `useEffect(() => {...}, [appReady, onboardingComplete])` — after `appReady` is true. Alternatively, use `<Stack.Screen name="onboarding" redirect={onboardingComplete} />`.
**Warning signs:** Navigation error logged: "Attempted to navigate before mounting the Root Layout component."

### Pitfall 6: settingsStore Missing weeklyReviewDay Field
**What goes wrong:** NOTIFY-02 (weekly review day picker) has no backing state. The current `settingsStore` has `reminderEnabled` and `reminderTime` but no `weeklyReviewDay`.
**Why it happens:** The field was not defined in the Phase 3 store setup.
**How to avoid:** Add `weeklyReviewDay: number` (1-7) with default `1` (Sunday) and `setWeeklyReviewDay` action to settingsStore before implementing the picker.
**Warning signs:** TypeScript error when reading `settingsStore.weeklyReviewDay`.

### Pitfall 7: Skia Body-Fill Re-renders on Every Frame
**What goes wrong:** The body-fill physics simulation re-renders the entire React tree (including analytics header, period selector) on each physics tick, causing dropped frames.
**Why it happens:** If physics state is stored in React state (`useState`) rather than Reanimated shared values, every tick triggers a full React reconciliation.
**How to avoid:** Verify that ball positions in `body-fill.tsx` are driven by Reanimated shared values or via `useDerivedValue`, not React state. If they are in React state, move them to Reanimated.
**Warning signs:** Profiler shows high render counts for non-physics components during simulation.

---

## Code Examples

### Export: Complete Flow
```typescript
// Source: expo-file-system v55 File API (verified from node_modules types)
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportAllData(db: SQLiteDatabase): Promise<void> {
  const [logs, targets, targetHistory, periods, settings] = await Promise.all([
    db.getAllAsync('SELECT * FROM logs ORDER BY created_at ASC'),
    db.getAllAsync('SELECT * FROM targets'),
    db.getAllAsync('SELECT * FROM target_history'),
    db.getAllAsync('SELECT * FROM periods'),
    db.getAllAsync('SELECT * FROM settings'),
  ]);

  const backup = {
    version: 1,
    appVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: { logs, targets, target_history: targetHistory, periods, settings },
  };

  const filename = `hayat-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, filename);
  file.write(JSON.stringify(backup, null, 2));

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) throw new Error('Sharing not available on this device');

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Hayat Backup',
    UTI: 'public.json',
  });
}
```

### Import: Pick + Validate
```typescript
// Source: expo-document-picker v55 + expo-file-system/legacy
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export interface BackupSummary {
  logCount: number;
  targetCount: number;
  oldestLog: string | null;
  newestLog: string | null;
  rawData: BackupFile;
}

export async function pickBackupFile(): Promise<BackupSummary | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,  // Critical for Android content:// URIs
  });

  if (result.canceled) return null;

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const parsed = JSON.parse(content) as BackupFile;

  if (parsed.version !== 1 || !parsed.data?.logs || !parsed.data?.targets) {
    throw new Error('Invalid or incompatible backup file');
  }

  const logs = parsed.data.logs;
  return {
    logCount: logs.length,
    targetCount: parsed.data.targets.length,
    oldestLog: logs.length > 0 ? logs[0].created_at : null,
    newestLog: logs.length > 0 ? logs[logs.length - 1].created_at : null,
    rawData: parsed,
  };
}
```

### Notifications: Service Initialization
```typescript
// Source: expo-notifications v55 (verified from node_modules types)
import * as Notifications from 'expo-notifications';

// Call once at app startup, outside any component
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function initNotificationChannel(): Promise<void> {
  // Android-only: must exist before any scheduling
  await Notifications.setNotificationChannelAsync('hayat-reminders', {
    name: 'Hayat Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
  });
}

export async function syncNotificationSchedule(
  enabled: boolean,
  reminderTime: string,      // "HH:mm"
  weeklyReviewDay: number    // 1-7
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;

  const [hour, minute] = reminderTime.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    content: { title: 'Hayat', body: 'Time for your daily check-in' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'hayat-reminders',
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hayat',
      body: 'How did your pillars balance this week?',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: weeklyReviewDay,
      hour: 10,
      minute: 0,
      channelId: 'hayat-reminders',
    },
  });
}
```

### App.json: Add expo-notifications Plugin
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-sqlite",
      "expo-sharing",
      [
        "expo-notifications",
        {
          "defaultChannel": "hayat-reminders"
        }
      ]
    ]
  }
}
```

### settingsStore: Add weeklyReviewDay
```typescript
// Add to SettingsState interface
weeklyReviewDay: number;  // 1=Sunday, 2=Monday ... 7=Saturday
setWeeklyReviewDay: (day: number) => void;

// Add to initial state
weeklyReviewDay: 1,

// Add to actions
setWeeklyReviewDay: (day) => set({ weeklyReviewDay: day }),
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-file-system writeAsStringAsync | expo-file-system File API (new) | SDK 52+ | Legacy still works (import from 'expo-file-system/legacy'), new API is preferred |
| expo-notifications Trigger objects (typed inline) | SchedulableTriggerInputTypes enum | SDK 50+ | Must use `type: Notifications.SchedulableTriggerInputTypes.DAILY` not string literals |
| expo-splash-screen v1 API (hide/show) | preventAutoHideAsync → hideAsync | SDK 50+ | Already implemented correctly in _layout.tsx |
| expo-document-picker result.type check | result.canceled boolean | SDK 47+ | Use `result.canceled`, not `result.type === 'cancel'` |

**Deprecated/outdated:**
- `expo-file-system` top-level imports (`import * as FileSystem from 'expo-file-system'`): Emits deprecation warnings in SDK 55. Use `'expo-file-system/legacy'` for old API or `{ File, Paths }` from `'expo-file-system'` for new API.
- `expo-notifications` string trigger types (e.g., `trigger: { type: 'daily', ... }`): Must use `SchedulableTriggerInputTypes.DAILY` enum value.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| expo-notifications | NOTIFY-01, NOTIFY-02 | Yes | 55.0.13 | — |
| expo-file-system | DATA-02 | Yes | 55.0.11 | — |
| expo-sharing | DATA-02 | Yes | 55.0.14 | — |
| expo-document-picker | DATA-03 | No (not installed) | — | None — must install |
| expo-splash-screen | POLISH-03 | Yes | 55.0.12 | — |
| expo-constants | POLISH-02 (About version) | Yes | 55.0.9 | — |
| Node.js | Build tooling | Yes | v20.20.1 | — |

**Missing dependencies with no fallback:**
- `expo-document-picker`: Required for DATA-03 import flow. Install with `npx expo install expo-document-picker`.

**Config gaps (not "missing" but must be addressed):**
- `expo-notifications` plugin entry missing from `app.json` — required for Android alarm permissions at build time.
- `weeklyReviewDay` field missing from `settingsStore` — required for NOTIFY-02 weekly review day picker.

---

## Open Questions

1. **Time picker UI for settings (reminderTime)**
   - What we know: React Native has no built-in time picker for both iOS and Android that matches dark theme
   - What's unclear: Whether to use `@react-native-community/datetimepicker`, a custom scroll picker, or simple text input
   - Recommendation: Use a simple custom picker (e.g., two `ScrollView` columns for hour/minute) styled with the dark theme, or a `Modal` wrapping basic `Picker`. This avoids a new dependency while giving full style control. If complexity is a concern, `@react-native-community/datetimepicker` is the community standard.

2. **Interactive gesture demo (onboarding slide 2)**
   - What we know: The joystick component from Phase 2 uses react-native-gesture-handler PanGesture
   - What's unclear: Whether to embed a read-only copy of the joystick or build a simplified demo version
   - Recommendation: Create a `DemoJoystick` component that is a simplified, non-logging version of the existing joystick — same visual, gesture detection, and visual feedback, but instead of calling `addLog` it shows a "Nice!" confirmation. Reuse gesture handler and Reanimated patterns already established.

3. **App icon / splash screen production assets**
   - What we know: `assets/icon.png` and `assets/splash-icon.png` already exist (from initial Expo project setup). Android adaptive icon layers are already scaffolded in app.json.
   - What's unclear: Whether the current placeholder icons should be replaced with custom artwork in this phase, or if that's a pre-submit manual step
   - Recommendation: POLISH-03 requirement says "designed" — treat icon design as a task that produces PNG files at the correct dimensions. The planner should include a task to create/replace `assets/icon.png` (1024x1024, no transparency, no rounded corners), `assets/splash-icon.png` (1024x1024, transparent bg), and `assets/android-icon-foreground.png` (1024x1024, safe-zone content in center 66%).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config.*, no vitest.config.*, no test/ directory in project root |
| Config file | None — Wave 0 task needed |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-02 | exportAllData produces valid JSON with all 5 tables | unit | `jest src/services/exportService.test.ts` | Wave 0 |
| DATA-03 | pickAndValidateBackup rejects invalid schema | unit | `jest src/services/importService.test.ts` | Wave 0 |
| DATA-03 | restoreFromBackup replaces all table data | integration (SQLite in-memory) | `jest src/services/importService.test.ts` | Wave 0 |
| NOTIFY-01 | syncNotificationSchedule calls scheduleNotificationAsync with DAILY trigger | unit (mock expo-notifications) | `jest src/services/notifications.test.ts` | Wave 0 |
| NOTIFY-02 | syncNotificationSchedule calls scheduleNotificationAsync with WEEKLY trigger | unit (mock expo-notifications) | `jest src/services/notifications.test.ts` | Wave 0 |
| POLISH-01 | OnboardingCarousel renders slides, skip navigates away | manual-only | Manual: first-launch test on device | N/A |
| POLISH-02 | Settings screen renders all 4 sections | manual-only | Manual: visual inspection | N/A |
| POLISH-03 | App icon + splash visible at correct size | manual-only | Manual: production build inspection | N/A |

**Note:** Automated tests for React Native UI components and device APIs (notifications, file system) require significant test harness setup (mocks, native module stubs). Given the project has no existing test infrastructure, the highest ROI is unit testing the pure service logic (export serialization, import schema validation, notification scheduling functions) which have no native dependencies.

### Wave 0 Gaps
- [ ] `package.json test script` — add `"test": "jest"`
- [ ] `jest.config.js` — configure with `preset: 'react-native'` or `jest-expo`
- [ ] `src/services/exportService.test.ts` — covers DATA-02
- [ ] `src/services/importService.test.ts` — covers DATA-03
- [ ] `src/services/notifications.test.ts` — covers NOTIFY-01, NOTIFY-02

---

## Sources

### Primary (HIGH confidence)
- `node_modules/expo-notifications/build/` — scheduleNotificationAsync, SchedulableTriggerInputTypes, setNotificationHandler — directly inspected from installed v55.0.13
- `node_modules/expo-file-system/build/` — File, Paths, legacy writeAsStringAsync — directly inspected from installed v55.0.11
- `node_modules/expo-sharing/build/src/` — shareAsync, SharingOptions — directly inspected from installed v55.0.14
- [Expo Notifications Docs](https://docs.expo.dev/versions/v55.0.0/sdk/notifications/) — DAILY/WEEKLY trigger patterns, permission request, foreground handler
- [Expo Sharing Docs](https://docs.expo.dev/versions/latest/sdk/sharing/) — shareAsync API
- [Expo Splash Screen & App Icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) — PNG dimensions, app.json config

### Secondary (MEDIUM confidence)
- [Expo Document Picker Docs](https://docs.expo.dev/versions/latest/sdk/document-picker/) — getDocumentAsync, copyToCacheDirectory
- [Expo FileSystem Docs](https://docs.expo.dev/versions/v55.0.0/sdk/filesystem/) — File API, Paths.cache, legacy import path

### Tertiary (LOW confidence)
- WebSearch: FlatList paging carousel patterns — consistent across multiple sources, LOW only because no single canonical official React Native doc for onboarding pattern
- WebSearch: Android notification channel pitfalls — verified against official expo-notifications docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly inspected from node_modules at their installed versions
- Architecture: HIGH — patterns derived from official Expo SDK 55 type definitions and existing project code
- Pitfalls: HIGH — Android channel and content:// URI issues verified against official docs; iOS permission behavior verified against expo-notifications source

**Research date:** 2026-03-23
**Valid until:** 2026-06-23 (stable Expo SDK, ~90 days before SDK 56 potential breaking changes)
