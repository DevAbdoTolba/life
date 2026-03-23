import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from './storage';

interface AuthState {
  isUnlocked: boolean;
  pin: string | null;
  
  // Actions
  unlock: (pin: string) => boolean;
  lock: () => void;
  setPin: (newPin: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isUnlocked: false, // Initially locked on app start
      pin: null,         // No pin by default

      unlock: (pinAttempt) => {
        const { pin } = get();
        if (!pin) {
          // If no PIN is configured, you can always unlock
          set({ isUnlocked: true });
          return true;
        }

        if (pin === pinAttempt) {
          set({ isUnlocked: true });
          return true;
        }
        
        return false;
      },

      lock: () => {
        set({ isUnlocked: false });
      },

      setPin: (newPin) => {
        set({ pin: newPin, isUnlocked: true });
      },
    }),
    {
      name: 'hayat-auth-storage', // key in storage
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({ pin: state.pin }), // only persist the PIN, not isUnlocked state
    }
  )
);
