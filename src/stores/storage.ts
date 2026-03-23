import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Single MMKV instance for the app
export const mmkvStorage = new MMKV({
  id: 'hayat-storage',
});

/**
 * Zustand-compatible storage adapter for MMKV.
 * Used with zustand's persist middleware.
 */
export const zustandMMKVStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    mmkvStorage.set(name, value);
  },
  removeItem: (name: string): void => {
    mmkvStorage.delete(name);
  },
};
