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
1. Создатель сервиса — независимый разработчик Тигран Мкртчян. Проект реализуется в рамках Всероссийского студенческого проекта «Твой Ход».
2. Если пользователь хочет сказать спасибо, задать вопрос автору, предложить функционал или пожаловаться на ошибку, всегда направляй его в официальный паблик ВКонтакте: vk.com/fairsubs (просто пиши ссылку текстом, без лишних реверансов).
3. На сайте есть 2 основных раздела: калькулятор для "Подписок" и калькулятор для "Курсов". Если пользователь просит тебя написать документ прямо в чате, направь его к нужной форме на сайте.
4. Если пользователь спрашивает про Закон о защите прав потребителей (ЗоЗПП) или просит ссылку на него, обязательно дай эту ссылку: https://www.consultant.ru/document/cons_doc_LAW_305/
5. Отвечай кратко, чётко и вежливо. Используй списки и форматирование Markdown. СРАЗУ выдавай финальный ответ.
6. На ЛЮБЫЕ вопросы, не связанные с возвратами, подписками, ЗоЗПП, юридическими советами по теме сервиса или самим сервисом — вежливо ОТКАЗЫВАЙ. Не поддерживай разговоры о политике, готовке еды, программировании и прочем оффтопе.
7. НИКОГДА не пиши свои рассуждения вслух (например: "Пользователь спрашивает...", "Сначала я должен..."). Выдавай СТРОГО готовый ответ для конечного пользователя.`;

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const messages: { role: string; text: string }[] = body.messages;
        const turnstileToken = body.turnstileToken;

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
        const formattedMessages = messages.map((msg: { role: string; text: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // --- Model Cascade ---
        // Gemma 4 31B is the primary model (via Gemini API, uses same API key)
        // Gemma 3 27B remains as ultimate fallback
        const MODELS = [
            'gemma-4-31b-it',
            'gemma-3-27b-it'
        ];

        let aiResponse: globalThis.Response | null = null;
        let finalModelId = '';
        let lastErrorText = '';
        const skipReasons: string[] = []; // Track why models failed

        for (const modelId of MODELS) {
            console.log(`[Assistant] Attempting generation with ${modelId}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

            // Make a deep copy of formattedMessages so prompt injection on Gemma doesn't pollute next loop
            const localContents = formattedMessages.map(m => ({
                role: m.role,
                parts: [{ text: m.parts[0]?.text || '' }]
            }));

            const aiRequestPayload: any = {
                contents: localContents,
                generationConfig: {
                    temperature: 0.2, // Need reliable legal answers
                },
                // Gemma 4 supports systemInstruction natively through the Gemini API.
                // Gemma 3 also works with systemInstruction through the same API.
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            };

            // Only Gemini models support tools (googleSearch). Gemma does not.
            if (!modelId.includes('gemma')) {
                aiRequestPayload.tools = [{ googleSearch: {} }];
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(aiRequestPayload)
            });

            if (res.ok) {
                aiResponse = res;
                finalModelId = modelId;
                break; // Connection established & stream opened successfully
            } else {
                const errText = await res.text().catch(() => 'Unknown error text');
                
                // Keep the raw error message safe for the header
                let cleanErr = 'Unknown';
                try {
                    const parsed = JSON.parse(errText);
                    cleanErr = parsed.error?.status || parsed.error?.code || 'Error';
                } catch {
                    cleanErr = `HTTP_${res.status}`;
                }
                
                skipReasons.push(`${modelId}:${cleanErr}`);
                lastErrorText += `[${modelId} error ${res.status}]: ${errText} | `;
                
                // 429 is rate limit / quota exhausted. 5xx is internal Google errors.
                if (res.status === 429 || res.status >= 500) {
                    console.warn(`[Assistant] ${modelId} failed (${res.status}), trying next.`);
                    continue;
                } else {
                    // For other errors like 400 Bad Request, log it but keep trying just in case.
                    console.error(`[Assistant] ${modelId} error: ${errText}`);
                    continue;
                }
            }
        }

        if (!aiResponse || !aiResponse.ok) {
            return new Response(JSON.stringify({ error: `Детали ошибки API: ${lastErrorText}` }), { status: 503 });
        }

        console.log(`[Assistant] Successfully streaming response using ${finalModelId}`);

        // Return SSE stream directly to the client
        return new Response(aiResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-AI-Model': finalModelId,
                'X-AI-Skip-Reasons': skipReasons.join(', ')
            }
        });

    } catch (err) {
        console.error("API Assistant Error:", err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
