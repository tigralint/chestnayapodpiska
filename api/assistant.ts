export const config = {
    runtime: 'edge',
};

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "1 d"),
    })
    : null;

const SYSTEM_PROMPT = `Ты — юридический ассистент сервиса «Честная Подписка» (chestnayapodpiska.ru).
Твоя задача — консультировать пользователей сугубо по вопросам возврата средств за платные подписки и онлайн-курсы на территории РФ (применяя ГК РФ и Закон о защите прав потребителей).

ВАЖНЫЕ ИНСТРУКЦИИ О ПРОЕКТЕ:
1. Создатель сервиса — независимый разработчик Тигран Мкртчян. 
2. Если пользователь хочет сказать спасибо, задать вопрос автору, предложить функционал или пожаловаться на ошибку, всегда направляй его в официальный паблик ВКонтакте: vk.com/fairsubs (просто пиши ссылку текстом, без лишних реверансов).
3. На сайте есть 2 основных раздела: калькулятор для "Подписок" и калькулятор для "Курсов". Если пользователь просит тебя написать документ прямо в чате, направь его к нужной форме на сайте.
4. Отвечай кратко, чётко и вежливо. Используй списки и форматирование Markdown.
5. На ЛЮБЫЕ вопросы, не связанные с возвратами, подписками, ЗоЗПП, юридическими советами по теме сервиса или самим сервисом — вежливо ОТКАЗЫВАЙ. Не поддерживай разговоры о политике, готовке еды, программировании и прочем оффтопе.
6. Твои мысли скрыты от пользователя, так что думай внимательно перед ответом.`;

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { messages, turnstileToken } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response('Invalid request messages', { status: 400 });
        }

        if (!turnstileToken) {
            return new Response('Captcha required', { status: 403 });
        }

        const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!TURNSTILE_SECRET_KEY || !GEMINI_API_KEY) {
            return new Response('Server configuration error', { status: 500 });
        }

        // 1. Verify Turnstile
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', turnstileToken);

        const turnstileCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const turnstileRes = await turnstileCheck.json();
        if (!turnstileRes.success) {
            return new Response(JSON.stringify({ error: 'Ошибка капчи.' }), { status: 403 });
        }

        // 2. Rate Limiting (10 per IP per day)
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (ratelimit) {
            const { success } = await ratelimit.limit(`chat_${ip}`);
            if (!success) {
                return new Response(JSON.stringify({ error: 'Лимит обращений исчерпан (10 запросов в сутки). Попробуйте завтра.' }), { status: 429 });
            }
        }

        // 3. Format messages for Gemini API
        // gemma-4-31b-it might not support the system_instruction parameter.
        // We inject the system prompt into the very first message.
        const formattedMessages = messages.map((msg: any, index: number) => {
            let text = msg.text;
            if (index === 0 && msg.role === 'user') {
                text = `[ИНСТРУКЦИЯ ДЛЯ ИИ]:\n${SYSTEM_PROMPT}\n\n[ЗАПРОС ПОЛЬЗОВАТЕЛЯ]:\n${text}`;
            }
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text }]
            };
        });

        const modelId = 'gemma-4-31b-it';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

        const aiRequestPayload = {
            contents: formattedMessages,
            tools: [{
                googleSearch: {}
            }],
            generationConfig: {
                temperature: 0.2, // Low temp for legal advising
            }
        };

        const aiResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aiRequestPayload)
        });

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            return new Response(JSON.stringify({ error: 'AI Error: ' + errText }), { status: 500 });
        }

        // Return SSE stream directly to the client
        return new Response(aiResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
