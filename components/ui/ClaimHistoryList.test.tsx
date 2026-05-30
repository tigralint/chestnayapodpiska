import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClaimHistoryList } from './ClaimHistoryList';
import { ClaimHistoryItem } from '../../types';

// Mock toast context
const mockAddToast = vi.fn();
vi.mock('../../context/AppContext', () => ({
    useToastContext: () => ({ addToast: mockAddToast }),
}));

// Mock clipboard
vi.mock('../../utils/clipboard', () => ({
    copyToClipboard: vi.fn().mockResolvedValue(true),
}));

// Mock downloadWord
vi.mock('../../utils/downloadWord', () => ({
    downloadWordDoc: vi.fn(),
}));

const makeItem = (overrides: Partial<ClaimHistoryItem> = {}): ClaimHistoryItem => ({
    id: 'test-id-1',
    type: 'subscription',
    serviceName: 'Яндекс Плюс',
    amount: 399,
    date: '2026-01-15',
    resultText: 'Претензия о возврате средств...',
    tone: 'soft',
    status: 'pending',
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides
});

describe('ClaimHistoryList', () => {
    const mockUpdateStatus = vi.fn();
    const mockDelete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the section heading and claim count', () => {
        const history = [makeItem()];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        expect(screen.getByText('Мои претензии')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders claim card with correct service name and amount', () => {
        const history = [makeItem({ serviceName: 'Netflix', amount: 1200 })];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        expect(screen.getByText('Netflix')).toBeInTheDocument();
        expect(screen.getByText('1 200 ₽')).toBeInTheDocument();
    });

    it('renders tone label correctly for soft and hard', () => {
        const history = [
            makeItem({ id: 'soft-1', tone: 'soft' }),
            makeItem({ id: 'hard-1', tone: 'hard' }),
        ];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        expect(screen.getByText('Вежливый')).toBeInTheDocument();
        expect(screen.getByText('Требовательный')).toBeInTheDocument();
    });

    it('calls onDelete when trash button is clicked', () => {
        const history = [makeItem()];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        const deleteBtn = screen.getByLabelText('Удалить претензию');
        fireEvent.click(deleteBtn);

        expect(mockDelete).toHaveBeenCalledWith('test-id-1');
        expect(mockAddToast).toHaveBeenCalledWith(
            expect.stringContaining('Яндекс Плюс'),
            'info'
        );
    });

    it('calls onUpdateStatus when status select changes', () => {
        const history = [makeItem()];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        const trigger = screen.getByText('⏳ В процессе');
        fireEvent.click(trigger);

        const option = screen.getByText('🎉 Деньги вернули');
        fireEvent.click(option);

        expect(mockUpdateStatus).toHaveBeenCalledWith('test-id-1', 'refunded');
    });

    it('copies text on copy button click', async () => {
        const history = [makeItem()];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        const copyBtn = screen.getByText('Копировать');
        fireEvent.click(copyBtn);

        // Wait for async clipboard
        await vi.waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('Текст претензии скопирован в буфер обмена', 'success');
        });
    });

    it('downloads Word on download button click', async () => {
        const history = [makeItem()];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        const downloadBtn = screen.getByText('Скачать Word');
        fireEvent.click(downloadBtn);

        await vi.waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('Документ Word успешно скачан', 'success');
        });
    });

    it('filters by type when clicking filter buttons', () => {
        const history = [
            makeItem({ id: '1', type: 'subscription', serviceName: 'Netflix' }),
            makeItem({ id: '2', type: 'course', serviceName: 'Skillbox' }),
        ];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        // Initially both visible
        expect(screen.getByText('Netflix')).toBeInTheDocument();
        expect(screen.getByText('Skillbox')).toBeInTheDocument();

        // Click "Подписки" filter
        fireEvent.click(screen.getByText('Подписки'));
        expect(screen.getByText('Netflix')).toBeInTheDocument();
        expect(screen.queryByText('Skillbox')).not.toBeInTheDocument();

        // Click "Курсы" filter
        fireEvent.click(screen.getByText('Курсы'));
        expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
        expect(screen.getByText('Skillbox')).toBeInTheDocument();

        // Click "Все типы" to reset
        fireEvent.click(screen.getByText('Все типы'));
        expect(screen.getByText('Netflix')).toBeInTheDocument();
        expect(screen.getByText('Skillbox')).toBeInTheDocument();
    });

    it('filters by status when clicking status filter buttons', () => {
        const history = [
            makeItem({ id: '1', status: 'pending', serviceName: 'Pending Service' }),
            makeItem({ id: '2', status: 'refunded', serviceName: 'Refunded Service' }),
            makeItem({ id: '3', status: 'refused', serviceName: 'Refused Service' }),
        ];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        // Click "В процессе"
        fireEvent.click(screen.getByText('В процессе'));
        expect(screen.getByText('Pending Service')).toBeInTheDocument();
        expect(screen.queryByText('Refunded Service')).not.toBeInTheDocument();

        // Click "Возвращено"
        fireEvent.click(screen.getByText('Возвращено'));
        expect(screen.getByText('Refunded Service')).toBeInTheDocument();
        expect(screen.queryByText('Pending Service')).not.toBeInTheDocument();

        // Click "Отказано"
        fireEvent.click(screen.getByText('Отказано'));
        expect(screen.getByText('Refused Service')).toBeInTheDocument();
        expect(screen.queryByText('Refunded Service')).not.toBeInTheDocument();
    });

    it('shows empty state message when filters match nothing', () => {
        const history = [makeItem({ status: 'pending' })];
        render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        fireEvent.click(screen.getByText('Возвращено'));
        expect(screen.getByText('Нет претензий с выбранными фильтрами')).toBeInTheDocument();
    });

    it('renders course icon for course type claims', () => {
        const history = [makeItem({ type: 'course' })];
        const { container } = render(<ClaimHistoryList history={history} onUpdateStatus={mockUpdateStatus} onDelete={mockDelete} />);

        // Course claims should render GraduationCap icon (SVG)
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(0);
    });
});
