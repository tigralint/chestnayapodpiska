import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import * as appContext from '../../context/AppContext';
import * as appStore from '../../store/appStore';

// Mock contexts and stores before rendering
vi.mock('../../context/AppContext', () => ({
    useAppContext: vi.fn(),
}));

vi.mock('../../store/appStore', () => ({
    useAppStore: vi.fn(),
}));

describe('AppHeader', () => {
    it('renders navigation links', () => {
        // Setup mocks
        vi.spyOn(appContext, 'useAppContext').mockReturnValue({ scrolled: false } as any);
        vi.spyOn(appStore, 'useAppStore').mockReturnValue(0); // Score = 0

        render(
            <BrowserRouter>
                <AppHeader />
            </BrowserRouter>
        );

        // Assert multiple nav items are present
        expect(screen.getByText('Претензии')).toBeInTheDocument();
        expect(screen.getByText('Курсы')).toBeInTheDocument();
        expect(screen.getByText('Тренажер')).toBeInTheDocument();
        expect(screen.getByText('Радар')).toBeInTheDocument();
        expect(screen.getByText('База знаний')).toBeInTheDocument();
        expect(screen.getByText('FAQ')).toBeInTheDocument();
    });

    it('hides score badge when score is 0', () => {
        vi.spyOn(appContext, 'useAppContext').mockReturnValue({ scrolled: false } as any);
        vi.spyOn(appStore, 'useAppStore').mockReturnValue(0);

        const { queryByText } = render(
            <BrowserRouter>
                <AppHeader />
            </BrowserRouter>
        );

        // Should not render "XP"
        expect(queryByText(/XP/)).not.toBeInTheDocument();
    });

    it('shows score badge when score is > 0', () => {
        vi.spyOn(appContext, 'useAppContext').mockReturnValue({ scrolled: false } as any);
        // By default useAppStore might take a selector, but we mocked the whole hook to return a number for simplicity.
        // Let's pass 1500 directly
        vi.spyOn(appStore, 'useAppStore').mockImplementation(() => 1500);

        render(
            <BrowserRouter>
                <AppHeader />
            </BrowserRouter>
        );

        expect(screen.getByText('1500 XP')).toBeInTheDocument();
    });

    it('translates header out of view when scrolled is true', () => {
        vi.spyOn(appContext, 'useAppContext').mockReturnValue({ scrolled: true } as any);
        vi.spyOn(appStore, 'useAppStore').mockReturnValue(0);

        const { container } = render(
            <BrowserRouter>
                <AppHeader />
            </BrowserRouter>
        );

        // Check if translate class is applied to the root element.
        // It's the first child div.
        const headerDiv = container.firstChild as HTMLElement;
        expect(headerDiv.className).toContain('translate-y-[-120%]');
    });
});
