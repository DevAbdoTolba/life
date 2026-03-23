import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from './storage';

interface SettingsState {
  // Privacy
  privacyPassword: string | null;
  isPrivacyMode: boolean; // when true, codenames are shown instead of real names

  // Reminders
  reminderEnabled: boolean;
  reminderTime: string; // HH:mm format

  // Onboarding
  onboardingComplete: boolean;

  // App state
  isDbReady: boolean;

  // Review
  weeklyReviewDay: number; // 1=Sunday, 2=Monday ... 7=Saturday

  // Actions
  setPrivacyPassword: (password: string | null) => void;
  togglePrivacyMode: () => void;
  setReminderTime: (time: string) => void;
  toggleReminder: () => void;
  completeOnboarding: () => void;
  setDbReady: (ready: boolean) => void;
  setWeeklyReviewDay: (day: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      privacyPassword: null,
      isPrivacyMode: false,
      reminderEnabled: true,
      reminderTime: '21:00',
      onboardingComplete: false,
      isDbReady: false,
      weeklyReviewDay: 1,

      // Actions
      setPrivacyPassword: (password) => set({ privacyPassword: password }),

      togglePrivacyMode: () =>
        set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),

      setReminderTime: (time) => set({ reminderTime: time }),

      toggleReminder: () =>
        set((state) => ({ reminderEnabled: !state.reminderEnabled })),

      completeOnboarding: () => set({ onboardingComplete: true }),

      setDbReady: (ready) => set({ isDbReady: ready }),

      setWeeklyReviewDay: (day) => set({ weeklyReviewDay: day }),
    }),
    {
      name: 'hayat-settings',
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Don't persist isDbReady — it's runtime-only
      partialize: (state) => {
        const { isDbReady, ...rest } = state;
        return rest;
      },
    }
  )
);
