import { useState, useEffect, useCallback } from 'react';

/**
 * Manages chat rate-limit status and "request more limits" flow.
 */
export function useChatLimits(isOpen: boolean) {
    const [limits, setLimits] = useState<{ remaining: number; limit: number } | null>(null);
    const [isRequestingLimit, setIsRequestingLimit] = useState(false);

    const refreshLimits = useCallback(() => {
        fetch('/api/chatStatus')
            .then(r => r.json())
            .then(d => {
                if (d && typeof d.remaining === 'number') {
                    setLimits({ remaining: d.remaining, limit: d.limit || 15 });
                }
            })
            .catch(() => { /* silently ignore fetch errors */ });
    }, []);

    // Load limits when the chat panel opens
    useEffect(() => {
        if (isOpen) {
            refreshLimits();
        }
    }, [isOpen, refreshLimits]);

    const handleRequestMoreLimits = useCallback(async (): Promise<'success' | 'error'> => {
        setIsRequestingLimit(true);
        try {
            const res = await fetch('/api/requestLimit', { method: 'POST' });
            return res.ok ? 'success' : 'error';
        } catch (e: unknown) {
            if (import.meta.env.DEV) console.error(e);
            return 'error';
        } finally {
            setIsRequestingLimit(false);
        }
    }, []);

    return { limits, isRequestingLimit, refreshLimits, handleRequestMoreLimits };
}
