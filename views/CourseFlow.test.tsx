import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import CourseFlow from './CourseFlow';

vi.mock('../services/geminiService', () => ({
    generateCourseClaim: vi.fn().mockResolvedValue('Мок текст расторжения'),
}));

vi.mock('../utils/clipboard', () => ({
    copyToClipboard: vi.fn().mockResolvedValue(true),
}));

vi.mock('@marsidev/react-turnstile', () => ({
    Turnstile: vi.fn(() => null),
}));

vi.mock('../context/AppContext', () => ({
    useAppContext: () => ({ scrolled: false, toasts: [], addToast: vi.fn(), removeToast: vi.fn() }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock, useParams: () => ({}) };
});

function renderFlow() {
    return render(
        <HelmetProvider>
            <MemoryRouter>
                <CourseFlow />
            </MemoryRouter>
        </HelmetProvider>
    );
}

describe('CourseFlow integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
    });

    it('should render course name field', () => {
        renderFlow();
        expect(screen.getByPlaceholderText('Например: Skillbox, GeekBrains')).toBeTruthy();
    });

    it('should render refund section', () => {
        renderFlow();
        expect(screen.getByText('Законная сумма к возврату')).toBeTruthy();
    });

    it('should render tone toggle', () => {
        renderFlow();
        expect(screen.getByText('Заявление на возврат')).toBeTruthy();
        expect(screen.getByText('Досудебная претензия')).toBeTruthy();
    });

    it('should render submit button (disabled without captcha)', () => {
        renderFlow();
        const btn = screen.getByText('Сгенерировать претензию');
        expect(btn).toBeTruthy();
        expect(btn.closest('button')?.disabled).toBe(true);
    });

    it('should allow typing course name', () => {
        renderFlow();
        const input = screen.getByPlaceholderText('Например: Skillbox, GeekBrains') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Skillbox Pro' } });
        expect(input.value).toBe('Skillbox Pro');
    });

    it('should render page header (desktop + mobile)', () => {
        renderFlow();
        const headers = screen.getAllByText('Отказ от онлайн-курса');
        expect(headers.length).toBe(2);
    });

    it('should render the label for course name field', () => {
        renderFlow();
        expect(screen.getByText('Название школы или курса')).toBeTruthy();
    });
});
