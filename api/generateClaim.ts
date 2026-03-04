import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

    if (!OPENROUTER_API_KEY) {
        return response.status(500).json({ error: 'Сервер не настроен (API ключ отсутствует).' });
    }

    try {
        const { type, data, calculatedRefund } = request.body;

        if (!data || !data.turnstileToken) {
            return response.status(403).json({ error: 'Капча не пройдена.' });
        }

        // Verify Turnstile
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY || '');
        formData.append('response', data.turnstileToken);

        const turnstileCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const turnstileRes: any = await turnstileCheck.json();
        if (!turnstileRes.success) {
            return response.status(403).json({ error: 'Ошибка капчи.' });
        }

        let prompt = '';
        if (type === 'subscription') {
            const tonePart = data.tone === 'hard'
                ? 'Тон: Ультимативный. Упомяни Роспотребнадзор и суд.'
                : 'Тон: Вежливый и лояльный. Напиши, что я ценю сервис, но прошу возврат.';

            prompt = `Составь текст заявления о возврате средств.
ДАННЫЕ:
- СЕРВИС: ${data.serviceName}
- СУММА: ${data.amount} руб.
- ДАТА: ${data.date}
- ПРИЧИНА: ${data.reason}

ИНСТРУКЦИЯ (СТРОГО):
1. Обязательно назови сервис "${data.serviceName}" по имени в тексте.
2. Ссылка на ст. 32 ЗоЗПП и ст. 782 ГК РФ.
3. Срок возврата — 10 дней (ст. 31 ЗоЗПП).
4. ${tonePart}
5. Используй формы: «пользовался(-ась)», «подписался(-ась)», «отменил(а)».

ФОРМАТ: ТОЛЬКО основной текст заявления. Без шапок, заголовков и подписей. Чистый текст.`;
        } else if (type === 'course') {
            const tonePart = data.tone === 'hard' ? 'Тон: Жесткий.' : 'Тон: Конструктивный.';

            prompt = `Составь текст расторжения договора с онлайн-школой.
ДАННЫЕ:
- ШКОЛА: ${data.courseName}
- ОБЩАЯ ЦЕНА: ${data.totalCost} руб.
- ПРОЙДЕНО: ${data.percentCompleted}%
- СУММА К ВОЗВРАТУ: ${calculatedRefund} руб.

ИНСТРУКЦИЯ (СТРОГО):
1. Обязательно назови школу "${data.courseName}" по имени в тексте.
2. Ссылка на ст. 32 ЗоЗПП.
3. Требуй возврата суммы ${calculatedRefund} руб.
4. ${tonePart}
5. Используй формы: «приобрел(а)», «изучил(а)», «решил(а)».

ФОРМАТ: ТОЛЬКО тело текста. Без приветствий, шапок и заголовков. Чистый текст.`;
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

        const aiJson: any = await aiResponse.json();
        const text = aiJson.choices?.[0]?.message?.content || '';

        return response.status(200).json({ text });

    } catch (error: any) {
        return response.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
}
