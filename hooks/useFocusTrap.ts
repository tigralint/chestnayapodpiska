import { useEffect, useRef, RefObject } from 'react';

/**
 * Traps focus inside a container element when active.
 * Cycles Tab/Shift+Tab through focusable children.
 * Calls onEscape when Escape is pressed.
 */
export function useFocusTrap(
    containerRef: RefObject<HTMLElement | null>,
    isActive: boolean,
    onEscape?: () => void
) {
    const previouslyFocused = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        // Save current focus to restore later
        previouslyFocused.current = document.activeElement as HTMLElement;

        const container = containerRef.current;
        const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));

        // Focus first element
        const focusable = getFocusable();
        if (focusable.length > 0) {
            focusable[0]!.focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onEscape?.();
                return;
            }

            if (e.key !== 'Tab') return;

            const focusable = getFocusable();
            if (focusable.length === 0) return;

            const first = focusable[0]!;
            const last = focusable[focusable.length - 1]!;

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // Restore focus
            previouslyFocused.current?.focus();
        };
    }, [isActive, containerRef, onEscape]);
}
