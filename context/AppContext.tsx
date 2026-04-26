import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useScrolled } from '../hooks/useScrolled';
import { useToast, Toast } from '../hooks/useToast';

// --- Scroll Context (updates on scroll — only AppHeader/MobileTabBar consume) ---
interface ScrollContextType {
    scrolled: boolean;
}

const ScrollContext = createContext<ScrollContextType>({ scrolled: false });

export function useScrollContext() {
    return useContext(ScrollContext);
}

// --- Toast Context (updates on toast add/remove — isolated re-renders) ---
interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
    toasts: [],
    addToast: () => { },
    removeToast: () => { },
});

export function useToastContext() {
    return useContext(ToastContext);
}

// --- Legacy combined hook (backward compatibility) ---
export function useAppContext() {
    const { scrolled } = useScrollContext();
    const { toasts, addToast, removeToast } = useToastContext();
    return { scrolled, toasts, addToast, removeToast };
}

// --- Provider ---
export function AppProvider({ children }: { children: ReactNode }) {
    const { scrolled } = useScrolled();
    const { toasts, addToast, removeToast } = useToast();

    const scrollValue = useMemo(() => ({ scrolled }), [scrolled]);
    const toastValue = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

    return (
        <ScrollContext.Provider value={scrollValue}>
            <ToastContext.Provider value={toastValue}>
                {children}
            </ToastContext.Provider>
        </ScrollContext.Provider>
    );
}
