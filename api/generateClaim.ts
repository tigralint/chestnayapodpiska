import type { VercelRequest, VercelResponse } from '@vercel/node';

interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
}

interface OpenRouterResponse {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
}

/**
 * Strips characters that could be used for prompt injection.
 * Removes instruction-like patterns while keeping normal user text.
 */
function sanitizeInput(input: string, maxLength = 200): string {
    return input
        .slice(0, maxLength)
        .replace(/[<>{}[\]]/g, '')       // Remove brackets that could break prompts
        .replace(/\n/g, ' ')             // Flatten newlines
        .trim();
}

// --- In-memory Rate Limiter (60 req/hour per IP) ---
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 10 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
}, 10 * 60 * 1000);

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return false;
    }

    entry.count++;
    return entry.count > RATE_LIMIT;
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Rate limiting: 60 requests per hour per IP
    const clientIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? request.socket?.remoteAddress
        ?? 'unknown';
    if (isRateLimited(clientIp)) {
        return response.status(429).json({ error: 'Слишком много запросов. Попробуйте через некоторое время.' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

    if (!OPENROUTER_API_KEY) {
        return response.status(500).json({ error: 'Сервер не настроен (API ключ отсутствует).' });
    }

    if (!TURNSTILE_SECRET_KEY) {
        return response.status(500).json({ error: 'Сервер не настроен (ключ капчи отсутствует).' });
    }

    try {
        const { type, data, calculatedRefund } = request.body;

        // Validate request type
        if (type !== 'subscription' && type !== 'course') {
            return response.status(400).json({ error: 'Неизвестный тип документа.' });
        }

        if (!data || !data.turnstileToken) {
            return response.status(403).json({ error: 'Капча не пройдена.' });
        }

        // Verify Turnstile
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', data.turnstileToken);

        const turnstileCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const turnstileRes = await turnstileCheck.json() as TurnstileVerifyResponse;
        if (!turnstileRes.success) {
            return response.status(403).json({ error: 'Ошибка капчи.' });
        }

        // Sanitize all user-provided strings before embedding in prompt
        let prompt = '';
        if (type === 'subscription') {
            const serviceName = sanitizeInput(data.serviceName);
            const amount = sanitizeInput(String(data.amount), 20);
            const date = sanitizeInput(String(data.date), 20);
            const reason = sanitizeInput(data.reason);
            const tonePart = data.tone === 'hard'
                ? 'Тон: Ультимативный. Упомяни Роспотребнадзор и суд.'
                : 'Тон: Вежливый и лояльный. Напиши, что я ценю сервис, но прошу возврат.';

            prompt = `Составь развернутый текст заявления о возврате средств.
ДАННЫЕ:
- СЕРВИС: ${serviceName}
- СУММА: ${amount} руб.
- ДАТА: ${date}
- ПРИЧИНА: ${reason}

ИНСТРУКЦИЯ (СТРОГО):
1. Обязательно назови сервис "${serviceName}" по имени в тексте.
2. Ссылка на ст. 32 ЗоЗПП и ст. 782 ГК РФ.
3. Срок возврата — 10 дней (ст. 31 ЗоЗПП).
4. ${tonePart}
5. Используй формы: «пользовался(-ась)», «подписался(-ась)», «отменил(а)».
6. Текст должен содержать 4-5 отдельных абзацев (БЕЗ заголовков «Вступление», «Факты» и т.д. — просто сплошные абзацы текста):
   - Кто я, когда и на что подписался.
   - Что произошло, почему хочу вернуть деньги, подробности ситуации.
   - Ссылки на конкретные статьи закона и их суть.
   - Чётко сформулировать, чего именно требую (возврат суммы, сроки).
   - Предупреждение о последствиях или вежливое завершение.
7. Каждый абзац — не менее 2-3 предложений. Общий объём — минимум 200 слов.
8. НЕ ВЫДУМЫВАЙ данные (ИНН, расчётные счета, БИК, номера договоров). Вместо них ставь плейсхолдеры: [ВАШИ РЕКВИЗИТЫ], [ФИО], [№ ДОГОВОРА].

ФОРМАТ: ТОЛЬКО основной текст заявления. Без шапок, заголовков и подписей. Чистый текст. Абзацы разделяй пустой строкой.`;
        } else {
            const courseName = sanitizeInput(data.courseName);
            const totalCost = sanitizeInput(String(data.totalCost), 20);
            const percentCompleted = sanitizeInput(String(data.percentCompleted), 5);
            const refund = sanitizeInput(String(calculatedRefund), 20);
            const tonePart = data.tone === 'hard' ? 'Тон: Жесткий.' : 'Тон: Конструктивный.';

            prompt = `Составь развернутый текст расторжения договора с онлайн-школой.
ДАННЫЕ:
- ШКОЛА: ${courseName}
- ОБЩАЯ ЦЕНА: ${totalCost} руб.
- ПРОЙДЕНО: ${percentCompleted}%
- СУММА К ВОЗВРАТУ: ${refund} руб.

ИНСТРУКЦИЯ (СТРОГО):
1. Обязательно назови школу "${courseName}" по имени в тексте.
2. Ссылка на ст. 32 ЗоЗПП.
3. Требуй возврата суммы ${refund} руб.
4. ${tonePart}
5. Используй формы: «приобрел(а)», «изучил(а)», «решил(а)».
6. Текст должен содержать 4-5 отдельных абзацев (БЕЗ заголовков «Вступление», «Факты» и т.д. — просто сплошные абзацы текста):
   - Когда и какой договор был заключён, стоимость обучения.
   - Сколько пройдено, почему решил(а) расторгнуть, конкретные претензии к качеству или формату.
   - Ссылки на ст. 32 ЗоЗПП, расчёт суммы к возврату.
   - Точная сумма возврата ${refund} руб., срок 10 дней.
   - Предупреждение о последствиях или вежливое завершение.
7. Каждый абзац — не менее 2-3 предложений. Общий объём — минимум 200 слов.
8. НЕ ВЫДУМЫВАЙ данные (ИНН, расчётные счета, БИК, номера договоров). Вместо них ставь плейсхолдеры: [ВАШИ РЕКВИЗИТЫ], [ФИО], [№ ДОГОВОРА].

ФОРМАТ: ТОЛЬКО тело текста. Без приветствий, шапок и заголовков. Чистый текст. Абзацы разделяй пустой строкой.`;
        }

        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen3-vl-30b-a3b-thinking",
                "messages": [{ "role": "user", "content": prompt }],
                "temperature": 0.1,
            })
        });

        const aiJson = await aiResponse.json() as OpenRouterResponse;
        const text = aiJson.choices?.[0]?.message?.content;

        if (!text) {
            return response.status(502).json({ error: 'ИИ-модель не вернула результат. Попробуйте повторить запрос.' });
        }

        return response.status(200).json({ text });

    } catch (error: unknown) {
        console.error('generateClaim error:', error);
        return response.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте позже.' });
    }
}
