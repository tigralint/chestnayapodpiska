import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hasSeenOnboarding: false,

            setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
        }),
        {
            name: 'chestnaya-podpiska-storage', // key in localStorage
            partialize: (state) => ({
                hasSeenOnboarding: state.hasSeenOnboarding
            }), // only persist specific fields
        }
    )
);
