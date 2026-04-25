import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useScrolled } from '../hooks/useScrolled';
import { useToast, Toast } from '../hooks/useToast';

interface AppContextType {
    scrolled: boolean;
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType>({
    scrolled: false,
    toasts: [],
    addToast: () => { },
    removeToast: () => { },
});

export function useAppContext() {
    return useContext(AppContext);
}

export function AppProvider({ children }: { children: ReactNode }) {
    const { scrolled } = useScrolled();
    const { toasts, addToast, removeToast } = useToast();

    const value = useMemo(() => ({ scrolled, toasts, addToast, removeToast }), [scrolled, toasts, addToast, removeToast]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}
