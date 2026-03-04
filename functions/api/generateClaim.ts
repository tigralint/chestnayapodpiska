export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
    const TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY;

    if (!OPENROUTER_API_KEY) {
        return new Response(JSON.stringify({ error: 'Сервер не настроен (API ключ отсутствует).' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { type, data, calculatedRefund } = await request.json();

        if (!data || !data.turnstileToken) {
            return new Response(JSON.stringify({ error: 'Капча не пройдена.' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
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
            return new Response(JSON.stringify({ error: 'Ошибка капчи.' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let prompt = '';
        if (type === 'subscription') {
            const tonePart = data.tone === 'hard'
                ? 'Тон: Ультимативный. Упомяни Роспотребнадзор и суд.'
                : 'Тон: Вежливый и лояльный. Напиши, что я ценю сервис, но прошу возврат.';

            prompt = `Составь текст заявления о возврате средств.
ДАННЫЕ:
- Сервис: ${data.serviceName}
- Сумма: ${data.amount} руб.
- Дата: ${data.date}
- Причина: ${data.reason}
ИНСТРУКЦИЯ: ст. 32 ЗоЗПП, ст. 782 ГК РФ. Срок 10 дней. ${tonePart}
ФОРМАТ: ТОЛЬКО основной текст, без шапок и заголовков. Чистый текст.`;
        } else if (type === 'course') {
            const tonePart = data.tone === 'hard' ? 'Тон: Жесткий.' : 'Тон: Конструктивный.';
            prompt = `Составь текст расторжения договора с онлайн-школой.
ДАННЫЕ: Школа ${data.courseName}, цена ${data.totalCost}, пройдено ${data.percentCompleted}%, возврат ${calculatedRefund}.
ИНСТРУКЦИЯ: ст. 32 ЗоЗПП. ${tonePart}
ФОРМАТ: ТОЛЬКО основной текст. Чистый текст.`;
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

        return new Response(JSON.stringify({ text }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: 'Ошибка сервера', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
