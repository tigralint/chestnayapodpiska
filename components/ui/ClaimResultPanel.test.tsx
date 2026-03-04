import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClaimResultPanel } from './ClaimResultPanel';

describe('ClaimResultPanel Component', () => {
    it('should render loading state when isGenerating is true', () => {
        render(<ClaimResultPanel
            isGenerating={true}
            onCopy={() => { }}
            result=""
            copied={false}
            onDownload={() => { }}
            theme="cyan"
            loadingTitle="ИИ формирует документ..."
            loadingSubtitle="Это займет около 10-15 секунд"
        />);
        expect(screen.getByText('ИИ формирует документ...')).toBeDefined();
        expect(screen.getByText('Это займет около 10-15 секунд')).toBeDefined();
    });

    it('should render the generated text when generatedText is provided', () => {
        const fakeText = 'Моя сгенерированная претензия для теста';
        render(<ClaimResultPanel
            isGenerating={false}
            onCopy={() => { }}
            result={fakeText}
            copied={false}
            onDownload={() => { }}
            theme="cyan"
            loadingTitle="Загрузка"
            loadingSubtitle="Подождите"
        />);
        expect(screen.getByText('Моя сгенерированная претензия для теста')).toBeDefined();

        // Ensure "Copy" button exists
        const copyButton = screen.getByRole('button', { name: /Копировать/i });
        expect(copyButton).toBeDefined();
    });
});
