import { describe, it, expect } from 'vitest';
import { formatNumberSpace } from './format';

describe('formatNumberSpace', () => {
    it('formats large numbers with spaces', () => {
        expect(formatNumberSpace(1234567)).toBe('1 234 567');
    });

    it('does not add spaces for numbers < 1000', () => {
        expect(formatNumberSpace(999)).toBe('999');
    });

    it('formats 1000 correctly', () => {
        expect(formatNumberSpace(1000)).toBe('1 000');
    });

    it('handles string input', () => {
        expect(formatNumberSpace('45000')).toBe('45 000');
    });

    it('returns empty string for 0', () => {
        expect(formatNumberSpace(0)).toBe('');
    });

    it('returns empty string for empty string', () => {
        expect(formatNumberSpace('')).toBe('');
    });

    it('handles negative numbers', () => {
        expect(formatNumberSpace(-5000)).toBe('-5 000');
    });
});
