import * as Notifications from 'expo-notifications';
import {
  initNotificationChannel,
  requestNotificationPermission,
  syncNotificationSchedule,
} from './notifications';

// Mock expo-notifications with inline jest.fn() calls
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'DAILY', WEEKLY: 'WEEKLY' },
}));

// Helper to access mocked functions
const mockSetChannel = Notifications.setNotificationChannelAsync as jest.Mock;
const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default resolved values after clearAllMocks
    mockSetChannel.mockResolvedValue(undefined);
    mockSchedule.mockResolvedValue('mock-id');
    mockCancel.mockResolvedValue(undefined);
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
  });

  describe('initNotificationChannel', () => {
    it('calls setNotificationChannelAsync with channel ID hayat-reminders and DEFAULT importance', async () => {
      await initNotificationChannel();
      expect(mockSetChannel).toHaveBeenCalledWith('hayat-reminders', expect.objectContaining({
        importance: 3, // AndroidImportance.DEFAULT
      }));
    });

    it('is safe to call multiple times (idempotent)', async () => {
      await initNotificationChannel();
      await initNotificationChannel();
      expect(mockSetChannel).toHaveBeenCalledTimes(2);
      // Both calls succeed — no error thrown
    });
  });

  describe('syncNotificationSchedule', () => {
    it('calls cancelAllScheduledNotificationsAsync when disabled', async () => {
      await syncNotificationSchedule(false, '21:00', 1);
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('does NOT call scheduleNotificationAsync when disabled', async () => {
      await syncNotificationSchedule(false, '21:00', 1);
      expect(mockSchedule).not.toHaveBeenCalled();
    });

    it('calls cancelAllScheduledNotificationsAsync first when enabled', async () => {
      const callOrder: string[] = [];
      mockCancel.mockImplementationOnce(() => {
        callOrder.push('cancel');
        return Promise.resolve();
      });
      mockSchedule.mockImplementation(() => {
        callOrder.push('schedule');
        return Promise.resolve('mock-id');
      });
      await syncNotificationSchedule(true, '21:00', 1);
      expect(callOrder[0]).toBe('cancel');
    });

    it('calls scheduleNotificationAsync twice when enabled (daily + weekly)', async () => {
      await syncNotificationSchedule(true, '21:00', 1);
      expect(mockSchedule).toHaveBeenCalledTimes(2);
    });

    it('schedules daily trigger with correct type, hour, minute, and channelId', async () => {
      await syncNotificationSchedule(true, '21:00', 1);
      expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({
        trigger: expect.objectContaining({
          type: 'DAILY',
          hour: 21,
          minute: 0,
          channelId: 'hayat-reminders',
        }),
      }));
    });

    it('schedules weekly trigger with correct type, weekday, hour, minute, and channelId', async () => {
      await syncNotificationSchedule(true, '21:00', 1);
      expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({
        trigger: expect.objectContaining({
          type: 'WEEKLY',
          weekday: 1,
          hour: 10,
          minute: 0,
          channelId: 'hayat-reminders',
        }),
      }));
    });

    it('parses hour=8, minute=30 for daily and weekday=3 for weekly from 08:30 / weekday 3', async () => {
      await syncNotificationSchedule(true, '08:30', 3);
      expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({
        trigger: expect.objectContaining({
          type: 'DAILY',
          hour: 8,
          minute: 30,
        }),
      }));
      expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({
        trigger: expect.objectContaining({
          type: 'WEEKLY',
          weekday: 3,
        }),
      }));
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns true when status is granted', async () => {
      mockRequestPermissions.mockResolvedValueOnce({ status: 'granted' });
      const result = await requestNotificationPermission();
      expect(result).toBe(true);
    });

    it('returns false when status is denied', async () => {
      mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' });
      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });
  });
});
