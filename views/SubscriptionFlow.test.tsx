import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import SubscriptionFlow from './SubscriptionFlow';

// Mock geminiService
vi.mock('../services/geminiService', () => ({
    generateSubscriptionClaim: vi.fn().mockResolvedValue('Мок текст претензии'),
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
                <SubscriptionFlow />
            </MemoryRouter>
        </HelmetProvider>
    );
}

describe('SubscriptionFlow integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
    });

    it('should render service name input with correct placeholder', () => {
        renderFlow();
        expect(screen.getByPlaceholderText('Например: Яндекс Плюс, ivi, VK')).toBeTruthy();
    });

    it('should render amount input', () => {
        renderFlow();
        expect(screen.getByPlaceholderText('299')).toBeTruthy();
    });

    it('should render reason dropdown', () => {
        renderFlow();
        const elements = screen.getAllByText('Забыл отменить подписку после пробного периода');
        expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render tone toggle buttons', () => {
        renderFlow();
        expect(screen.getByText('Заявление на возврат')).toBeTruthy();
        expect(screen.getByText('Досудебная претензия')).toBeTruthy();
    });

    it('should render submit button (disabled without captcha)', () => {
        renderFlow();
        const btn = screen.getByText('Сгенерировать претензию');
        expect(btn).toBeTruthy();
        // Button is disabled because turnstileToken is not set
        expect(btn.closest('button')?.disabled).toBe(true);
    });

    it('should allow typing in service name', () => {
        renderFlow();
        const input = screen.getByPlaceholderText('Например: Яндекс Плюс, ivi, VK') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Netflix' } });
        expect(input.value).toBe('Netflix');
    });

    it('should allow typing in amount field', () => {
        renderFlow();
        const input = screen.getByPlaceholderText('299') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '999' } });
        expect(input.value).toBe('999');
    });

    it('should render page header (desktop + mobile)', () => {
        renderFlow();
        const headers = screen.getAllByText('Возврат средств');
        expect(headers.length).toBe(2);
    });
});
