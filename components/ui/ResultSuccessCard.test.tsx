import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultSuccessCard } from './ResultSuccessCard';

describe('ResultSuccessCard', () => {
    it('renders result text in textarea', () => {
        render(
            <ResultSuccessCard
                result="Generated Document Text"
                theme="cyan"
                copied={false}
                onCopy={vi.fn()}
                onDownload={vi.fn()}
            />
        );

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('Generated Document Text');
        expect(textarea).toHaveAttribute('readonly');
    });

    it('calls onCopy when copy button is clicked', () => {
        const mockOnCopy = vi.fn();
        render(
            <ResultSuccessCard
                result="Generated Document Text"
                theme="cyan"
                copied={false}
                onCopy={mockOnCopy}
                onDownload={vi.fn()}
            />
        );

        const copyButton = screen.getByText('Копировать');
        fireEvent.click(copyButton);
        expect(mockOnCopy).toHaveBeenCalledTimes(1);
    });

    it('shows copied state when copied is true', () => {
        render(
            <ResultSuccessCard
                result="Generated Document Text"
                theme="purple"
                copied={true}
                onCopy={vi.fn()}
                onDownload={vi.fn()}
            />
        );

        expect(screen.getByText('Скопировано!')).toBeInTheDocument();
        expect(screen.queryByText('Копировать')).not.toBeInTheDocument();
    });

    it('calls onDownload when download button is clicked', () => {
        const mockOnDownload = vi.fn();
        render(
            <ResultSuccessCard
                result="Generated Document Text"
                theme="cyan"
                copied={false}
                onCopy={vi.fn()}
                onDownload={mockOnDownload}
            />
        );

        const downloadButton = screen.getByText('Скачать Word');
        fireEvent.click(downloadButton);
        expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });
});
