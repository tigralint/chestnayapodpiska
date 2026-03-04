import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
    let writeTextMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: { writeText: writeTextMock },
        });
    });

    it('should call navigator.clipboard.writeText with provided text', async () => {
        await copyToClipboard('Hello, World!');
        expect(writeTextMock).toHaveBeenCalledWith('Hello, World!');
    });

    it('should handle empty string', async () => {
        await copyToClipboard('');
        expect(writeTextMock).toHaveBeenCalledWith('');
    });

    it('should handle special characters (Cyrillic, emojis)', async () => {
        await copyToClipboard('Привет мир! 🚀');
        expect(writeTextMock).toHaveBeenCalledWith('Привет мир! 🚀');
    });
});
