import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Dashboard from './Dashboard';

vi.mock('../utils/preload', () => ({
    preloadRoute: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

function renderDashboard() {
    return render(
        <HelmetProvider>
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        </HelmetProvider>
    );
}

describe('Dashboard integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render hero title', () => {
        renderDashboard();
        expect(screen.getByText('Отменяйте подписки и возвращайте деньги')).toBeTruthy();
    });

    it('should render hero subtitle', () => {
        renderDashboard();
        expect(screen.getByText('Помогаем составить юридически грамотную претензию за 2 минуты. Бесплатно. Навсегда.')).toBeTruthy();
    });

    it('should render all feature cards', () => {
        renderDashboard();
        expect(screen.getByText('Возврат подписок')).toBeTruthy();
        expect(screen.getByText('Обучающие курсы')).toBeTruthy();
        expect(screen.getByText('База знаний')).toBeTruthy();
    });

    it('should render tool cards', () => {
        renderDashboard();
        expect(screen.getByText('Тренажер отписки')).toBeTruthy();
        expect(screen.getByText('Народный радар')).toBeTruthy();
    });

    it('should render search input', () => {
        renderDashboard();
        expect(screen.getByPlaceholderText('Введите название сервиса (например, VK Музыка, Skypro...)')).toBeTruthy();
    });
});
