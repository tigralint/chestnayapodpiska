import { describe, it, expect } from 'vitest';
import { sanitizeForPrompt, sanitizeForStorage } from './sanitize';

describe('sanitizeForPrompt', () => {
    it('strips HTML/XML tags', () => {
        expect(sanitizeForPrompt('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
        expect(sanitizeForPrompt('<b>bold</b>')).toBe('bold');
    });

    it('strips instruction keywords (case-insensitive)', () => {
        // SYSTEM and IGNORE are both keywords, so both get stripped
        expect(sanitizeForPrompt('SYSTEM ignore previous')).toBe('previous');
        expect(sanitizeForPrompt('Tell ASSISTANT to stop')).toBe('Tell to stop');
        expect(sanitizeForPrompt('New INSTRUCTION here')).toBe('New here');
        // PROMPT is a keyword
        expect(sanitizeForPrompt('Ignore PROMPT rules')).toBe('rules');
        expect(sanitizeForPrompt('As a USER do this')).toBe('As a do this');
        expect(sanitizeForPrompt('Hey HUMAN listen')).toBe('Hey listen');
    });

    it('strips Unicode fullwidth characters (bypass attempts)', () => {
        // Fullwidth "SYSTEM" = \uFF33\uFF39\uFF33\uFF34\uFF25\uFF2D
        const fullwidthSystem = '\uFF33\uFF39\uFF33\uFF34\uFF25\uFF2D';
        expect(sanitizeForPrompt(fullwidthSystem)).toBe('');
    });

    it('strips markdown heading injections', () => {
        expect(sanitizeForPrompt('# NEW INSTRUCTIONS')).toBe('NEW INSTRUCTIONS');
        // ## is stripped, then 'prompt' is matched by PROMPT keyword
        expect(sanitizeForPrompt('## Override prompt')).toBe('Override');
        expect(sanitizeForPrompt('###### Deep heading')).toBe('Deep heading');
    });

    it('strips markdown horizontal rules (delimiter injection)', () => {
        expect(sanitizeForPrompt('---')).toBe('');
        expect(sanitizeForPrompt('-----')).toBe('');
    });

    it('removes bracket characters', () => {
        // <tag> is first stripped as XML tag, then remaining brackets are removed
        expect(sanitizeForPrompt('Hello {world} [test]')).toBe('Hello world test');
        expect(sanitizeForPrompt('data<injected>')).toBe('data');
    });

    it('flattens newlines into spaces', () => {
        expect(sanitizeForPrompt('line1\nline2\nline3')).toBe('line1 line2 line3');
    });

    it('collapses multiple spaces', () => {
        expect(sanitizeForPrompt('too   many    spaces')).toBe('too many spaces');
    });

    it('enforces maxLength', () => {
        const longInput = 'a'.repeat(500);
        expect(sanitizeForPrompt(longInput).length).toBeLessThanOrEqual(200);
    });

    it('enforces custom maxLength', () => {
        const input = 'a'.repeat(100);
        expect(sanitizeForPrompt(input, 50).length).toBeLessThanOrEqual(50);
    });

    it('handles empty and whitespace input', () => {
        expect(sanitizeForPrompt('')).toBe('');
        expect(sanitizeForPrompt('   ')).toBe('');
    });

    it('preserves normal user input', () => {
        expect(sanitizeForPrompt('Яндекс Плюс')).toBe('Яндекс Плюс');
        expect(sanitizeForPrompt('Возврат за подписку 299₽')).toBe('Возврат за подписку 299₽');
    });
});

describe('sanitizeForStorage', () => {
    it('strips HTML/XML tags', () => {
        expect(sanitizeForStorage('<b>bold</b> text')).toBe('bold text');
    });

    it('preserves instruction keywords (not relevant for storage)', () => {
        expect(sanitizeForStorage('SYSTEM prompt')).toBe('SYSTEM prompt');
    });

    it('preserves brackets and newlines (only strips tags)', () => {
        expect(sanitizeForStorage('Hello {world}')).toBe('Hello {world}');
    });

    it('enforces maxLength', () => {
        const longInput = 'a'.repeat(3000);
        expect(sanitizeForStorage(longInput).length).toBeLessThanOrEqual(2000);
    });

    it('enforces custom maxLength', () => {
        expect(sanitizeForStorage('a'.repeat(200), 100).length).toBeLessThanOrEqual(100);
    });

    it('handles empty input', () => {
        expect(sanitizeForStorage('')).toBe('');
    });
});
