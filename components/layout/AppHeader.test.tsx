import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import * as appContext from '../../context/AppContext';

// Mock contexts and stores before rendering
vi.mock('../../context/AppContext', () => ({
    useAppContext: vi.fn(),
}));

describe('AppHeader', () => {
    it('renders navigation links', () => {
        // Setup mocks
        vi.spyOn(appContext, 'useAppContext').mockReturnValue({ scrolled: false } as any);

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



    it('translates header out of view when scrolled is true', () => {
        vi.spyOn(appContext, 'useAppContext').mockReturnValue({ scrolled: true } as any);

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
