import { useState, useCallback, useRef, useEffect } from 'react';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

const TOAST_DURATION = 4000;

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = useRef(0);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    // Cleanup all pending timers on unmount to prevent memory leaks
    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach(timer => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = `toast-${++counterRef.current}`;
        setToasts(prev => [...prev, { id, message, type }]);

        const timer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timersRef.current.delete(id);
        }, TOAST_DURATION);
        
        timersRef.current.set(id, timer);
    }, []);

    const removeToast = useCallback((id: string) => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}
