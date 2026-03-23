import * as Notifications from 'expo-notifications';

// Configure foreground notification handler — call once at app startup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'hayat-reminders';

/**
 * Create the Android notification channel. Must be called before any scheduling.
 * No-op on iOS. Safe to call multiple times.
 */
export async function initNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Hayat Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
  });
}

/**
 * Request notification permission from the OS.
 * Per D-14: Called when user first enables reminders in settings.
 * Returns true if granted, false if denied or undetermined.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Cancel all existing notifications and reschedule based on current settings.
 * Per D-11: Daily = gentle neutral prompt at user's configured time.
 * Per D-13: Weekly = review prompt on configured day at 10:00.
 *
 * @param enabled - whether reminders are enabled
 * @param reminderTime - "HH:mm" string for daily reminder
 * @param weeklyReviewDay - 1=Sunday, 2=Monday ... 7=Saturday
 */
export async function syncNotificationSchedule(
  enabled: boolean,
  reminderTime: string,
  weeklyReviewDay: number
): Promise<void> {
  // Always cancel existing before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return;

  // Ensure channel exists before scheduling
  await initNotificationChannel();

  const [hour, minute] = reminderTime.split(':').map(Number);

  // Schedule daily reminder (NOTIFY-01)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hayat',
      body: 'Time for your daily check-in',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });

  // Schedule weekly review (NOTIFY-02)
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
      channelId: CHANNEL_ID,
    },
  });
}
