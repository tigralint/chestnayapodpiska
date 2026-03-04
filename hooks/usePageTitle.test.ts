import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageTitle } from './usePageTitle';

describe('usePageTitle', () => {
    const originalTitle = document.title;
    const BASE_TITLE = 'ЧестнаяПодписка';

    beforeEach(() => {
        document.title = originalTitle;
    });

    afterEach(() => {
        document.title = originalTitle;
    });

    it('should set title for root route', () => {
        renderHook(() => usePageTitle('/'));
        expect(document.title).toBe(`Главная — ${BASE_TITLE}`);
    });

    it('should set title for specific route', () => {
        renderHook(() => usePageTitle('/claim'));
        expect(document.title).toBe(`Возврат за подписку — ${BASE_TITLE}`);
    });

    it('should match prefix route (e.g. /claim/serviceName)', () => {
        renderHook(() => usePageTitle('/claim/Yandex%20Plus'));
        expect(document.title).toBe(`Возврат за подписку — ${BASE_TITLE}`);
    });

    it('should fallback to base title for unknown route', () => {
        renderHook(() => usePageTitle('/some-unknown-path'));
        expect(document.title).toBe(BASE_TITLE);
    });

    it('should update title if pathname changes', () => {
        const { rerender } = renderHook(({ path }) => usePageTitle(path), {
            initialProps: { path: '/simulator' }
        });

        expect(document.title).toBe(`Тренажер самообороны — ${BASE_TITLE}`);

        rerender({ path: '/course' });

        expect(document.title).toBe(`Отказ от курса — ${BASE_TITLE}`);
    });
});
