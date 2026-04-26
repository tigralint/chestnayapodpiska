import type { VercelResponse } from '@vercel/node';

/**
 * Standardized API error response helpers.
 * All user-facing messages are in Russian; implementation details are never leaked.
 */
export const respond = {
    badRequest: (res: VercelResponse, msg: string) =>
        res.status(400).json({ error: msg }),

    unauthorized: (res: VercelResponse) =>
        res.status(403).json({ error: 'Доступ запрещён.' }),

    captchaFailed: (res: VercelResponse) =>
        res.status(403).json({ error: 'Ошибка капчи.' }),

    rateLimit: (res: VercelResponse) =>
        res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже.' }),

    misconfigured: (res: VercelResponse) =>
        res.status(500).json({ error: 'Сервис временно недоступен.' }),

    internal: (res: VercelResponse) =>
        res.status(500).json({ error: 'Внутренняя ошибка сервера.' }),

    methodNotAllowed: (res: VercelResponse) =>
        res.status(405).json({ error: 'Метод не поддерживается.' }),
} as const;
