import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
    it('escapes ampersand', () => {
        expect(escapeHtml('AT&T')).toBe('AT&amp;T');
    });

    it('escapes angle brackets', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('escapes double quotes', () => {
        expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
    });

    it('handles empty string', () => {
        expect(escapeHtml('')).toBe('');
    });

    it('does not double-escape already-escaped content', () => {
        // First escape
        const once = escapeHtml('<b>');
        expect(once).toBe('&lt;b&gt;');
        // Second escape — ampersands from first pass get escaped
        const twice = escapeHtml(once);
        expect(twice).toBe('&amp;lt;b&amp;gt;');
    });

    it('handles mixed content with Cyrillic', () => {
        expect(escapeHtml('Сервис: <Яндекс> & "Плюс"')).toBe('Сервис: &lt;Яндекс&gt; &amp; &quot;Плюс&quot;');
    });

    it('preserves safe characters', () => {
        const safe = 'Hello World 123 !@#$%^*()_+-=';
        expect(escapeHtml(safe)).toBe(safe);
    });
});
