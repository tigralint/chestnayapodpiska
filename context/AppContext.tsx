import { createContext, useContext, ReactNode } from 'react';
import { useScrolled } from '../hooks/useScrolled';

interface AppContextType {
    scrolled: boolean;
}

const AppContext = createContext<AppContextType>({ scrolled: false });

export function useAppContext() {
    return useContext(AppContext);
}

export function AppProvider({ children }: { children: ReactNode }) {
    const { scrolled } = useScrolled();

    return (
        <AppContext.Provider value={{ scrolled }}>
            {children}
        </AppContext.Provider>
    );
}
