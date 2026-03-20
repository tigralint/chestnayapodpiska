import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import GuidesView from './GuidesView';

vi.mock('../context/AppContext', () => ({
    useAppContext: () => ({ scrolled: false, toasts: [], addToast: vi.fn(), removeToast: vi.fn() }),
}));

// Mock Turnstile so it doesn't crash in tests
vi.mock('@marsidev/react-turnstile', () => ({
    Turnstile: vi.fn(() => null),
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

    it('should filter guides by search query', () => {
        renderGuides();
        const searchInput = screen.getByPlaceholderText(/Название сервиса/i);
        fireEvent.change(searchInput, { target: { value: 'сбер' } });
        expect(screen.getByText('СберПрайм')).toBeTruthy();
        expect(screen.queryByText('Яндекс Плюс')).toBeFalsy();
    });

    it('should filter guides by category tabs', () => {
        renderGuides();
        const coursesTab = screen.getByText(/Онлайн-курсы/i);
        fireEvent.click(coursesTab);
        
        // After clicking "Courses", "Skillbox" should be there, but "СберПрайм" should not
        expect(screen.getByText(/Skillbox/i)).toBeTruthy();
        expect(screen.queryByText('СберПрайм')).toBeFalsy();
    });
});
