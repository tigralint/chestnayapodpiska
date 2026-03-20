import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import RadarView from './RadarView';

vi.mock('../context/AppContext', () => ({
    useAppContext: () => ({ scrolled: false, toasts: [], addToast: vi.fn(), removeToast: vi.fn() }),
}));

vi.mock('@marsidev/react-turnstile', () => ({
    Turnstile: vi.fn(() => null),
}));

vi.mock('../hooks/useRadar', () => ({
    useRadar: () => ({
        alerts: [
            { id: '1', location: 'Test City', time: '1m ago', text: 'Test alert content', severity: 'high', category: 'phishing', serviceName: 'TestService' }
        ],
        loading: false,
        error: null,
        categoryFilter: 'all',
        setCategoryFilter: vi.fn(),
        submitReport: vi.fn()
    })
}));

describe('RadarView integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render header elements', () => {
        render(<HelmetProvider><MemoryRouter><RadarView /></MemoryRouter></HelmetProvider>);
        expect(screen.getAllByText('Народный радар').length).toBeGreaterThan(0);
        expect(screen.getByText('Live Feed')).toBeTruthy();
    });

    it('should display mocked alerts', () => {
        render(<HelmetProvider><MemoryRouter><RadarView /></MemoryRouter></HelmetProvider>);
        expect(screen.getByText('Test City')).toBeTruthy();
        expect(screen.getByText('Test alert content')).toBeTruthy();
        expect(screen.getByText('TestService')).toBeTruthy();
    });

    it('should open form modal on button click', () => {
        render(<HelmetProvider><MemoryRouter><RadarView /></MemoryRouter></HelmetProvider>);
        const reportBtn = screen.getByText(/Сообщить о проблеме/i);
        fireEvent.click(reportBtn);
        
        expect(screen.getByText('Новый сигнал')).toBeTruthy();
        expect(screen.getByPlaceholderText(/Название сервиса/i)).toBeTruthy();
    });
});
