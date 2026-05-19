import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClaimHistory } from './useClaimHistory';
import { ClaimHistoryItem } from '../types';

const STORAGE_KEY = 'chestnaya_podpiska_claims_history';

const makeClaim = (overrides: Partial<Omit<ClaimHistoryItem, 'id' | 'createdAt' | 'status'>> = {}): Omit<ClaimHistoryItem, 'id' | 'createdAt' | 'status'> => ({
    type: 'subscription',
    serviceName: 'Яндекс Плюс',
    amount: 399,
    date: '2026-01-15',
    resultText: 'Текст претензии...',
    tone: 'soft',
    ...overrides
});

describe('useClaimHistory', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('should initialize with empty history when localStorage is empty', () => {
        const { result } = renderHook(() => useClaimHistory());
        expect(result.current.history).toEqual([]);
    });

    it('should load existing history from localStorage on mount', () => {
        const existing: ClaimHistoryItem[] = [{
            id: 'test-id-1',
            type: 'subscription',
            serviceName: 'Netflix',
            amount: 1200,
            date: '2026-01-10',
            resultText: 'Existing claim text',
            tone: 'hard',
            status: 'pending',
            createdAt: '2026-01-10T10:00:00.000Z'
        }];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

        const { result } = renderHook(() => useClaimHistory());
        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0]!.serviceName).toBe('Netflix');
    });

    it('should handle corrupt localStorage data gracefully', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem(STORAGE_KEY, '{invalid json!!!');

        const { result } = renderHook(() => useClaimHistory());
        expect(result.current.history).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should add a claim and persist it to localStorage', () => {
        const { result } = renderHook(() => useClaimHistory());

        act(() => {
            result.current.addClaim(makeClaim());
        });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0]!.serviceName).toBe('Яндекс Плюс');
        expect(result.current.history[0]!.status).toBe('pending');
        expect(result.current.history[0]!.id).toBeTruthy();
        expect(result.current.history[0]!.createdAt).toBeTruthy();

        // Check localStorage was updated
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        expect(stored).toHaveLength(1);
    });

    it('should prepend new claims (newest first)', () => {
        const { result } = renderHook(() => useClaimHistory());

        act(() => {
            result.current.addClaim(makeClaim({ serviceName: 'First' }));
        });
        act(() => {
            result.current.addClaim(makeClaim({ serviceName: 'Second' }));
        });

        expect(result.current.history).toHaveLength(2);
        expect(result.current.history[0]!.serviceName).toBe('Second');
        expect(result.current.history[1]!.serviceName).toBe('First');
    });

    it('should skip saving claims that start with [ОТКАЗ]', () => {
        const { result } = renderHook(() => useClaimHistory());

        act(() => {
            result.current.addClaim(makeClaim({ resultText: '[ОТКАЗ] Недостаточно данных.' }));
        });

        expect(result.current.history).toHaveLength(0);
    });

    it('should skip saving claims with whitespace before [ОТКАЗ]', () => {
        const { result } = renderHook(() => useClaimHistory());

        act(() => {
            result.current.addClaim(makeClaim({ resultText: '  [ОТКАЗ] Причина не указана.' }));
        });

        expect(result.current.history).toHaveLength(0);
    });

    it('should update claim status and persist', () => {
        const { result } = renderHook(() => useClaimHistory());

        act(() => {
            result.current.addClaim(makeClaim());
        });

        const id = result.current.history[0]!.id;

        act(() => {
            result.current.updateClaimStatus(id, 'refunded');
        });

        expect(result.current.history[0]!.status).toBe('refunded');

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        expect(stored[0].status).toBe('refunded');
    });

    it('should delete a claim and persist', () => {
        const { result } = renderHook(() => useClaimHistory());

        act(() => {
            result.current.addClaim(makeClaim({ serviceName: 'ToKeep' }));
        });
        act(() => {
            result.current.addClaim(makeClaim({ serviceName: 'ToDelete' }));
        });

        const deleteId = result.current.history.find(c => c.serviceName === 'ToDelete')!.id;

        act(() => {
            result.current.deleteClaim(deleteId);
        });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0]!.serviceName).toBe('ToKeep');
    });

    it('should clear all history and remove from localStorage', () => {
        const { result } = renderHook(() => useClaimHistory());

        act(() => {
            result.current.addClaim(makeClaim({ serviceName: 'A' }));
        });
        act(() => {
            result.current.addClaim(makeClaim({ serviceName: 'B' }));
        });

        expect(result.current.history).toHaveLength(2);

        act(() => {
            result.current.clearHistory();
        });

        expect(result.current.history).toHaveLength(0);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should add course-type claims correctly', () => {
        const { result } = renderHook(() => useClaimHistory());

        act(() => {
            result.current.addClaim(makeClaim({
                type: 'course',
                serviceName: 'Skillbox',
                amount: 85000,
                tone: 'hard'
            }));
        });

        expect(result.current.history[0]!.type).toBe('course');
        expect(result.current.history[0]!.amount).toBe(85000);
        expect(result.current.history[0]!.tone).toBe('hard');
    });
});
