import { Handler } from '@netlify/functions';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!OPENROUTER_API_KEY) {
        console.error('OPENROUTER_API_KEY is missing');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Сервер не настроен должным образом (API ключ отсутствует).' })
        };
    }

    try {
        const { type, data, calculatedRefund } = JSON.parse(event.body || '{}');

        if (!data || !data.turnstileToken) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Капча не пройдена. Пожалуйста, обновите страницу.' }) };
        }

        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY || '');
        formData.append('response', data.turnstileToken);

        const turnstileCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const turnstileRes = await turnstileCheck.json();
        if (!turnstileRes.success) {
            console.error('Turnstile verification failed:', turnstileRes);
            return { statusCode: 403, body: JSON.stringify({ error: 'Подозрение на бота (ошибка капчи).' }) };
        }

        let prompt = '';

        if (type === 'subscription') {
            const tonePart = data.tone === 'hard'
                ? 'Тон: Ультимативный. Упомяни Роспотребнадзор и суд со всеми штрафами.'
                : 'Тон: Вежливый и лояльный. Напиши, что я ценю сервис и хочу остаться вашим клиентом в будущем, но прошу вернуть это конкретное списание. Без угроз судом.';

            prompt = `
Действуй как юрист, помогающий лояльному клиенту. Составь текст заявления о возврате средств.
ДАННЫЕ:
- Сервис: ${data.serviceName}
- Сумма: ${data.amount} руб.
- Дата списания: ${data.date}
- Причина: ${data.reason}

ИНСТРУКЦИЯ (СТРОГО):
1. Ссылка на ст. 32 ЗоЗПП и ст. 782 ГК РФ (право на возврат при отсутствии ФПР).
2. Аргумент: услугой в оплаченный период я не пользовался(-ась).
3. Требование: возврат ${data.amount} руб. в течение 10 дней (ст. 31 ЗоЗПП).
4. ${tonePart}
5. Грамматика: используй только формы «пользовался(-ась)», «подписался(-ась)», «отменил(-а)».
6. ФОРМАТ: ТОЛЬКО основной текст. 
   - ЗАПРЕЩЕНО писать получателя, отправителя и заголовки.
   - Начинай СРАЗУ с сути.
7. ТЕХНИЧЕСКИ: Чистый текст без Markdown.
`;
        } else if (type === 'course') {
            let fprDetails = "";
            if (data.hasPlatformAccess) fprDetails += "- Доступ к платформе не является отдельно оказанной услугой, а лишь техническим средством передачи материалов.\n";
            if (data.hasConsultations) fprDetails += "- Требую предоставить акты оказанных услуг и расчет ФПР именно за часы, потраченные лично на меня.\n";
            if (data.hasCertificate) fprDetails += "- Выданный сертификат не несет самостоятельной материальной ценности.\n";

            const tonePart = data.tone === 'hard'
                ? 'Тон: Жесткий. Требование возврата штрафа 50%, неустойки. Жалоба в Роспотребнадзор.'
                : 'Тон: Конструктивный и дружелюбный. Напиши, что я ценю обучение, но вынужден(а) расторгнуть этот договор. Просьба о мирном решении без угроз.';

            prompt = `
Действуй как юрист. Составь текст обращения о расторжении договора.
ДАННЫЕ:
- Школа: ${data.courseName}
- Общая цена: ${data.totalCost} руб.
- Пройдено: ${data.percentCompleted}%
- Сумма возврата: ${calculatedRefund} руб.
- Аргументы против ФПР: ${fprDetails}

ИНСТРУКЦИЯ:
1. Ссылка на ст. 32 ЗоЗПП и ст. 782 ГК РФ.
2. Требование: возврат ${calculatedRefund} руб. (ст. 31 ЗоЗПП).
3. ${tonePart}
4. Грамматика: «приобрел(а)», «изучил(а)», «решил(а)».
5. ФОРМАТ: ТОЛЬКО тело текста. 
   - ЗАПРЕЩЕНО писать любые реквизиты и заголовки.
6. ТЕХНИЧЕСКИ: Чистый текст без Markdown.
`;
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Неверный тип запроса' }) };
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + OPENROUTER_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen3-vl-30b-a3b-thinking",
                "messages": [
                    { "role": "user", "content": prompt }
                ],
                "temperature": 0.1,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', errorText);
            return { statusCode: response.status, body: JSON.stringify({ error: 'Ошибка внешнего API (OpenRouter)' }) };
        }

        const json = await response.json();
        const text = json.choices?.[0]?.message?.content || '';

        if (text.includes('ОШИБКА_ГЕНЕРАЦИИ:')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: text.replace('ОШИБКА_ГЕНЕРАЦИИ:', '').trim() })
            };
        }

        if (!text.trim()) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Нейросеть вернула пустой ответ.' })
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        };

    } catch (error: any) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Внутренняя ошибка сервера.',
                details: error.message || String(error),
                stack: error.stack
            })
        };
    }
};
