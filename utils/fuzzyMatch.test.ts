import { describe, it, expect } from 'vitest';
import { fuzzyMatch } from './fuzzyMatch';

describe('fuzzyMatch', () => {
    it('returns false for empty query', () => {
        expect(fuzzyMatch('', 'some text')).toBe(false);
    });

    it('returns false for whitespace-only query', () => {
        expect(fuzzyMatch('   ', 'some text')).toBe(false);
    });

    it('matches exact substring (case-insensitive)', () => {
        expect(fuzzyMatch('яндекс', 'Яндекс Плюс')).toBe(true);
        expect(fuzzyMatch('ПЛЮС', 'яндекс плюс')).toBe(true);
    });

    it('matches subsequence', () => {
        // "янпс" is a subsequence of "яндекс плюс"
        expect(fuzzyMatch('янпс', 'яндекс плюс')).toBe(true);
    });

    it('matches with 1 typo for short words', () => {
        // "яндекз" has 1 edit distance from "яндекс"
        expect(fuzzyMatch('яндекз', 'яндекс плюс')).toBe(true);
    });

    it('matches with up to 2 typos for longer queries', () => {
        // "скилбкос" vs "скилбокс" — 2 edits, query.length > 4
        expect(fuzzyMatch('скилбкос', 'скилбокс')).toBe(true);
    });

    it('rejects completely unrelated text', () => {
        expect(fuzzyMatch('котики', 'яндекс плюс')).toBe(false);
    });

    it('handles cyrillic characters correctly', () => {
        expect(fuzzyMatch('гикб', 'ГикБрейнс')).toBe(true);
    });

    it('handles hyphenated words', () => {
        expect(fuzzyMatch('онлайн', 'онлайн-курс')).toBe(true);
    });
});
