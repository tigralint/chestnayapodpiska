import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    hasSeenOnboarding: boolean;
    score: number;
    incrementScore: (amount: number) => void;
    setHasSeenOnboarding: (value: boolean) => void;
    resetProgress: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hasSeenOnboarding: false,
            score: 0,

            incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
            setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
            resetProgress: () => set({ score: 0, hasSeenOnboarding: false }),
        }),
        {
            name: 'chestnaya-podpiska-storage', // key in localStorage
            partialize: (state) => ({
                hasSeenOnboarding: state.hasSeenOnboarding,
                score: state.score
            }), // only persist specific fields
        }
    )
);
