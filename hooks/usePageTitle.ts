import { useEffect } from 'react';

const BASE_TITLE = 'ЧестнаяПодписка';

const ROUTE_TITLES: Record<string, string> = {
    '/': 'Главная',
    '/claim': 'Возврат за подписку',
    '/course': 'Отказ от курса',
    '/guides': 'База знаний',
    '/simulator': 'Тренажер самообороны',
    '/radar': 'Народный радар',
    '/faq': 'Частые вопросы',
};

/**
 * Sets document.title based on the current route.
 * Falls back to base title for unknown routes.
 */
export function usePageTitle(pathname: string) {
    useEffect(() => {
        // Match exact or prefix (e.g. /claim/service)
        const matchedKey = Object.keys(ROUTE_TITLES).find(
            key => key === '/' ? pathname === '/' : pathname.startsWith(key)
        );

        const pageTitle = matchedKey ? ROUTE_TITLES[matchedKey] : null;
        document.title = pageTitle ? `${pageTitle} — ${BASE_TITLE}` : BASE_TITLE;
    }, [pathname]);
}
