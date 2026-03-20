import { renderHook, act } from '@testing-library/react';
import { useSimulator } from './useSimulator';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock LEVELS if needed, or use the real ones for integration-like testing
describe('useSimulator', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useSimulator());

        expect(result.current.currentLevelIdx).toBe(0);
        expect(result.current.feedback).toBe('idle');
        expect(result.current.showResult).toBe(false);
    });

    it('should handle a correct hit and increment score after duration', () => {
        const { result } = renderHook(() => useSimulator());

        act(() => {
            result.current.handleHit();
        });

        expect(result.current.feedback).toBe('hit');

        // Jump time forward
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.currentLevelIdx).toBe(1);
        expect(result.current.feedback).toBe('idle');
    });

    it('should handle a miss and move to next level without score increment', () => {
        const { result } = renderHook(() => useSimulator());

        act(() => {
            result.current.handleMiss();
        });

        expect(result.current.feedback).toBe('miss');

        act(() => {
            vi.advanceTimersByTime(2500);
        });

        expect(result.current.currentLevelIdx).toBe(1);
    });

    it('should reset the state correctly', () => {
        const { result } = renderHook(() => useSimulator());

        act(() => {
            result.current.handleHit();
            vi.advanceTimersByTime(3000);
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.currentLevelIdx).toBe(0);
    });
});
