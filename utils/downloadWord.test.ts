import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock docx library — constructors need to be actual classes
class MockParagraph { constructor(public opts: unknown) {} }
class MockTextRun { constructor(public opts: unknown) {} }
class MockDocument { constructor(public opts: unknown) {} }

const mockToBlob = vi.fn().mockResolvedValue(new Blob(['test']));

vi.mock('docx', () => ({
    Document: MockDocument,
    Packer: { toBlob: mockToBlob },
    Paragraph: MockParagraph,
    TextRun: MockTextRun,
    AlignmentType: { RIGHT: 'RIGHT', CENTER: 'CENTER', BOTH: 'BOTH' },
    HeadingLevel: { HEADING_1: 'HEADING_1' },
}));

describe('downloadWordDoc', () => {
    const mockClick = vi.fn();
    let mockLink: { href: string; download: string; click: typeof mockClick };

    beforeEach(async () => {
        vi.clearAllMocks();
        mockToBlob.mockResolvedValue(new Blob(['test']));

        mockLink = { href: '', download: '', click: mockClick };

        vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLElement);
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLElement);

        // Polyfill URL methods for jsdom
        globalThis.URL.createObjectURL = vi.fn(() => 'blob:test-url');
        globalThis.URL.revokeObjectURL = vi.fn();
    });

    it('creates and triggers download of a .docx file', async () => {
        const { downloadWordDoc } = await import('./downloadWord');

        await downloadWordDoc(
            'test-claim',
            'Директору ООО "Тест"',
            'Иванову И.И.',
            'Петров П.П.',
            'ДОСУДЕБНАЯ ПРЕТЕНЗИЯ',
            'о возврате денежных средств',
            'Я требую вернуть деньги.\nСогласно ст. 32 ЗоЗПП.'
        );

        expect(globalThis.URL.createObjectURL).toHaveBeenCalledOnce();
        expect(mockClick).toHaveBeenCalledOnce();
        expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('sets correct filename with .docx extension', async () => {
        const { downloadWordDoc } = await import('./downloadWord');

        await downloadWordDoc('my-file', 'Title', 'Name', 'Sender', 'Heading', 'Sub', 'Content');

        expect(mockLink.download).toBe('my-file.docx');
    });

    it('throws a user-friendly error when Packer.toBlob fails', async () => {
        mockToBlob.mockRejectedValueOnce(new Error('Packer failed'));

        const { downloadWordDoc } = await import('./downloadWord');

        await expect(
            downloadWordDoc('fail', 'T', 'N', 'S', 'H', 'Sub', 'Content')
        ).rejects.toThrow('Произошла ошибка при создании файла');
    });

    it('handles content without subHeading', async () => {
        const { downloadWordDoc } = await import('./downloadWord');

        await downloadWordDoc('test', 'T', 'N', 'S', 'H', '', 'Line1\n\n\nLine2');

        expect(mockClick).toHaveBeenCalled();
    });
});
