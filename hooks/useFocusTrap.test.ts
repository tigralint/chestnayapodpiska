import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useFocusTrap } from './useFocusTrap';

function createContainer(...elements: string[]) {
    const container = document.createElement('div');
    elements.forEach(tag => {
        const el = document.createElement(tag);
        container.appendChild(el);
    });
    document.body.appendChild(container);
    return container;
}

describe('useFocusTrap', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('focuses the first focusable element when activated', () => {
        const container = createContainer('button', 'button');
        const buttons = container.querySelectorAll('button');

        renderHook(() => {
            const ref = useRef<HTMLElement>(container);
            useFocusTrap(ref, true);
        });

        expect(document.activeElement).toBe(buttons[0]);
    });

    it('does not focus anything when inactive', () => {
        const container = createContainer('button', 'button');
        const initialFocus = document.activeElement;

        renderHook(() => {
            const ref = useRef<HTMLElement>(container);
            useFocusTrap(ref, false);
        });

        expect(document.activeElement).toBe(initialFocus);
    });

    it('calls onEscape when Escape key is pressed', () => {
        const container = createContainer('button');
        const onEscape = vi.fn();

        renderHook(() => {
            const ref = useRef<HTMLElement>(container);
            useFocusTrap(ref, true, onEscape);
        });

        const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        document.dispatchEvent(event);

        expect(onEscape).toHaveBeenCalledOnce();
    });

    it('wraps focus from last to first element on Tab', () => {
        const container = createContainer('button', 'input', 'button');
        const focusable = container.querySelectorAll<HTMLElement>('button, input');
        const lastElement = focusable[focusable.length - 1]!;

        renderHook(() => {
            const ref = useRef<HTMLElement>(container);
            useFocusTrap(ref, true);
        });

        // Focus last element
        lastElement.focus();
        expect(document.activeElement).toBe(lastElement);

        // Press Tab
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        document.dispatchEvent(event);

        expect(document.activeElement).toBe(focusable[0]);
    });

    it('wraps focus from first to last element on Shift+Tab', () => {
        const container = createContainer('button', 'input', 'button');
        const focusable = container.querySelectorAll<HTMLElement>('button, input');
        const firstElement = focusable[0]!;
        const lastElement = focusable[focusable.length - 1]!;

        renderHook(() => {
            const ref = useRef<HTMLElement>(container);
            useFocusTrap(ref, true);
        });

        // First element should already be focused
        expect(document.activeElement).toBe(firstElement);

        // Press Shift+Tab
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
        document.dispatchEvent(event);

        expect(document.activeElement).toBe(lastElement);
    });

    it('handles container with no focusable elements', () => {
        const container = createContainer('div', 'span');

        // Should not throw
        expect(() => {
            renderHook(() => {
                const ref = useRef<HTMLElement>(container);
                useFocusTrap(ref, true);
            });
        }).not.toThrow();
    });
});
