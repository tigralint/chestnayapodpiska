import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApiErrorBanner } from './ApiErrorBanner';

describe('ApiErrorBanner', () => {
    it('renders the error message', () => {
        render(<ApiErrorBanner error="Сервер недоступен" />);
        expect(screen.getByText('Сервер недоступен')).toBeInTheDocument();
    });

    it('renders the error heading', () => {
        render(<ApiErrorBanner error="Test error" />);
        expect(screen.getByText('Ошибка')).toBeInTheDocument();
    });

    it('renders the support link', () => {
        render(<ApiErrorBanner error="Test error" />);
        const link = screen.getByText('Напишите нам');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://vk.com/fairsubs');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('applies error styling classes', () => {
        const { container } = render(<ApiErrorBanner error="Test" />);
        const banner = container.firstChild as HTMLElement;
        expect(banner.className).toContain('border-red-500');
    });
});
