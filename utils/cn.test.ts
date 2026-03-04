import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn — class name merger', () => {
    it('should merge simple class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes via clsx', () => {
        expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
    });

    it('should merge conflicting Tailwind classes (tailwind-merge)', () => {
        // tailwind-merge should resolve conflicts: last one wins
        expect(cn('p-4', 'p-8')).toBe('p-8');
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle undefined and null values', () => {
        expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('should handle empty string', () => {
        expect(cn('')).toBe('');
    });

    it('should handle object syntax from clsx', () => {
        expect(cn({ 'font-bold': true, 'italic': false })).toBe('font-bold');
    });
});
