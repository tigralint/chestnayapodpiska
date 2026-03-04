import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GeneratingState } from './GeneratingState';

describe('GeneratingState', () => {
    it('renders with provided titles', () => {
        render(
            <GeneratingState
                theme="cyan"
                loadingTitle="Test Title"
                loadingSubtitle="Test Subtitle"
            />
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    });

    it('applies theme correctly', () => {
        const { container } = render(
            <GeneratingState
                theme="cyan"
                loadingTitle="Test"
                loadingSubtitle="Load"
            />
        );

        // Cyan theme uses accent-cyan styles
        const textElement = container.querySelector('.text-accent-cyan') as HTMLElement;
        expect(textElement).toBeInTheDocument();

        const borderElement = container.querySelector('.border-accent-cyan\\/20') as HTMLElement;
        expect(borderElement).toBeInTheDocument();
    });
});
