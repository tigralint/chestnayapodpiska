import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import GuidesView from './GuidesView';

vi.mock('../context/AppContext', () => ({
    useAppContext: () => ({ scrolled: false, toasts: [], addToast: vi.fn(), removeToast: vi.fn() }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

function renderGuides(initialRoute = '/guides') {
    return render(
        <HelmetProvider>
            <MemoryRouter initialEntries={[initialRoute]}>
                <Routes>
                    <Route path="/guides" element={<GuidesView />} />
                    <Route path="/guides/:id" element={<GuidesView />} />
                </Routes>
            </MemoryRouter>
        </HelmetProvider>
    );
}

describe('GuidesView integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
    });

    it('should render the page header', () => {
        renderGuides();
        expect(screen.getByText('База знаний')).toBeTruthy();
    });

    it('should render extended header on desktop', () => {
        renderGuides();
        expect(screen.getByText('Навигатор по отпискам')).toBeTruthy();
    });

    it('should render guide cards from GUIDES_DB', () => {
        renderGuides();
        expect(screen.getByText('Яндекс Плюс')).toBeTruthy();
        expect(screen.getByText('СберПрайм')).toBeTruthy();
        expect(screen.getByText('Ozon Premium')).toBeTruthy();
    });

    it('should render the suggestion card', () => {
        renderGuides();
        expect(screen.getByText('Новая уловка?')).toBeTruthy();
        expect(screen.getByText('Сообщить о дарк-паттерне')).toBeTruthy();
    });

    it('should render all guide cards as buttons', () => {
        renderGuides();
        const buttons = screen.getAllByRole('button');
        // Should have guide cards + navigation buttons
        expect(buttons.length).toBeGreaterThan(10);
    });
});
