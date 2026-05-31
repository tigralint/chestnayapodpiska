import { useState, useEffect, useCallback } from 'react';
import { ClaimHistoryItem } from '../types';

const STORAGE_KEY = 'chestnaya_podpiska_claims_history';

const saveToLocalStorage = (items: ClaimHistoryItem[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.error('Failed to save claim history to localStorage:', e);
    }
};

export function useClaimHistory() {
    const [history, setHistory] = useState<ClaimHistoryItem[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load claim history from localStorage:', e);
        }
    }, []);

    const addClaim = useCallback((claim: Omit<ClaimHistoryItem, 'id' | 'createdAt' | 'status'>) => {
        // Skip saving if the generated text is an AI refusal explanation
        if (claim.resultText.trim().startsWith('[ОТКАЗ]')) {
            return;
        }

        const newItem: ClaimHistoryItem = {
            ...claim,
            id:
                typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : Math.random().toString(36).substring(2, 9),
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        setHistory((prev) => {
            // Deduplicate: remove any claim for the same service with identical parameters if needed,
            // but normally we just prepend the new claim.
            const updated = [newItem, ...prev];
            saveToLocalStorage(updated);
            return updated;
        });
    }, []);

    const updateClaimStatus = useCallback((id: string, status: ClaimHistoryItem['status']) => {
        setHistory((prev) => {
            const updated = prev.map((item) => (item.id === id ? { ...item, status } : item));
            saveToLocalStorage(updated);
            return updated;
        });
    }, []);

    const deleteClaim = useCallback((id: string) => {
        setHistory((prev) => {
            const updated = prev.filter((item) => item.id !== id);
            saveToLocalStorage(updated);
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear claim history:', e);
        }
    }, []);

    return {
        history,
        addClaim,
        updateClaimStatus,
        deleteClaim,
        clearHistory,
    };
}
