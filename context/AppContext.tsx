import React, { createContext, useContext, ReactNode } from 'react';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface AppContextType {
    scrolled: boolean;
}

const AppContext = createContext<AppContextType>({ scrolled: false });

export function useAppContext() {
    return useContext(AppContext);
}

export function AppProvider({ children }: { children: ReactNode }) {
    const { scrolled } = useScrollDirection();

    return (
        <AppContext.Provider value={{ scrolled }}>
            {children}
        </AppContext.Provider>
    );
}
