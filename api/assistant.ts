export const config = {
    runtime: 'edge',
};

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { GUIDES_DB } from '../data/guides';
import type { Guide } from '../types';

const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(15, "1 d"),
    })
    : null;

const SYSTEM_PROMPT = `Ты — юридический ассистент сервиса «Честная Подписка» (chestnayapodpiska.ru).
Твоя задача — консультировать пользователей сугубо по вопросам возврата средств за платные подписки и онлайн-курсы на территории РФ (применяя ГК РФ и Закон о защите прав потребителей).

О СОЗДАТЕЛЕ И ПРОЕКТЕ:
1. Создатель сервиса — Тигран Мкртчян, студент юридического факультета МГУ им. М.В. Ломоносова. Проект реализуется в рамках Всероссийского студенческого проекта «Твой Ход».
2. Если пользователь хочет сказать спасибо, задать вопрос автору, предложить функционал или пожаловаться на ошибку — направляй в официальный паблик ВКонтакте: vk.com/fairsubs
3. На сайте есть 2 основных раздела: калькулятор для «Подписок» и калькулятор для «Курсов». Если пользователь просит написать документ, направь его к нужной форме на сайте.
4. Ссылка на Закон о защите прав потребителей: https://www.consultant.ru/document/cons_doc_LAW_305/

ПОДДЕРЖИВАЕМЫЕ СЕРВИСЫ (по категориям):
• Экосистемы/подписки: Яндекс Плюс, СберПрайм, Ozon Premium, Т-Банк Pro, МТС Premium/KION, VK Музыка/Combo, Подписка «Пакет» (X5), VK Play Cloud, Whoosh/Urent, Boosty, Газпром Бонус, Яндекс 360, Telegram Premium, Apple Music/Apple One, Spotify, 2ГИС Premium, Авито Подписки.
• Онлайн-кинотеатры: Okko, Иви, Premier (ТНТ), Start, Amediateka, Wink, Литрес.
• Онлайн-курсы (EdTech): Skillbox, GeekBrains, SkillFactory, Фоксфорд, Умскул, Яндекс Практикум, Нетология, Skyeng/Skysmart, Синергия, Stepik, Contented.

ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ (FAQ):
Q: Могу ли я вернуть деньги за подписку, если забыл отменить?
A: Да, если вы не пользовались сервисом. Согласно ст. 32 ЗоЗПП и новым правилам 2025-2026, поставщики обязаны уведомлять за 24 часа до списания. Если уведомления не было — пишите претензию.

Q: Школа удерживает 30% за «административные расходы» — это законно?
A: Нет. По ст. 32 ЗоЗПП и ст. 782 ГК РФ удерживать можно ТОЛЬКО документально подтверждённые фактически понесённые расходы (ФПР) именно на ваше обучение. Маркетинг, зарплата менеджеров и разработка платформы ФПР не являются.

Q: Как отправить досудебную претензию?
A: Лучше всего — заказным письмом с описью вложения на юридический адрес компании. Также можно продублировать на email. У компании есть 10 дней на ответ (ст. 31 ЗоЗПП).

Q: Что делать, если компания игнорирует мою претензию?
A: Подать жалобу в Роспотребнадзор и обратиться в суд. Суд добавит штраф 50% от суммы (п. 6 ст. 13 ЗоЗПП) + моральный вред + расходы на юриста.

Q: Если пользователь прислал скриншот — проанализируй изображение и помоги определить сервис, дату списания и сумму.

ПРАВИЛА ПОВЕДЕНИЯ:
1. Отвечай кратко, чётко и вежливо. Используй Markdown. СРАЗУ выдавай финальный ответ.
2. На ЛЮБЫЕ вопросы, не связанные с возвратами, подписками, ЗоЗПП, юридическими советами или самим сервисом — вежливо ОТКАЗЫВАЙ.
3. НИКОГДА не пиши свои рассуждения вслух. Выдавай СТРОГО готовый ответ для конечного пользователя.
4. Если пользователь отправил изображение (скриншот чека, подписки, переписки с поддержкой), проанализируй его и дай конкретный совет по возврату.`;

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const messages: { role: string; text: string; image?: string }[] = body.messages;
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

        // 2. Rate Limiting (15 per IP per day)
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (ratelimit) {
            const { success } = await ratelimit.limit(`chat_${ip}`);
            if (!success) {
                return new Response(JSON.stringify({ error: 'Лимит обращений исчерпан (15 запросов в сутки). Попробуйте завтра.' }), { status: 429 });
            }
        }

        // 3. Format messages for Gemini API (supports text + inline images for Gemma 4 vision)
        const formattedMessages = messages.map((msg: { role: string; text: string; image?: string }) => {
            const parts: any[] = [{ text: msg.text }];
            // If the message includes a base64 image, add it as inlineData for Gemma 4 vision
            if (msg.image) {
                parts.unshift({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: msg.image
                    }
                });
            }
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts
            };
        });

        // 4. Keyword RAG — find relevant guides based on user messages
        // Search ALL user messages (not just last) to maintain context across follow-ups
        const allUserText = messages
            .filter((m: { role: string }) => m.role === 'user')
            .map((m: { text: string }) => m.text)
            .join(' ')
            .toLowerCase();

        const relevantGuides = GUIDES_DB.filter((guide: Guide) =>
            guide.aliases.some(alias => allUserText.includes(alias.toLowerCase()))
        ).slice(0, 3); // Max 3 guides to avoid context bloat

        // Build dynamic system prompt with RAG context
        let dynamicPrompt = SYSTEM_PROMPT;
        if (relevantGuides.length > 0) {
            const guidesContext = relevantGuides.map((g: Guide) => {
                const typeLabel = g.type === 'subscription' ? 'Подписка' : 'Онлайн-курс';
                const stepsText = g.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
                const email = g.contactEmail ? `\nEmail поддержки: ${g.contactEmail}` : '';
                return `### ${g.service} (${typeLabel})\n${stepsText}${email}\nОбновлено: ${g.lastUpdated || 'н/д'}`;
            }).join('\n\n');

            dynamicPrompt += `\n\n===== РЕЛЕВАНТНЫЕ ПОШАГОВЫЕ ИНСТРУКЦИИ (из базы знаний) =====\nИспользуй эти данные для точного ответа. Цитируй конкретные шаги и дарк-паттерны:\n\n${guidesContext}`;
            console.log(`[RAG] Injected ${relevantGuides.length} guide(s): ${relevantGuides.map((g: Guide) => g.service).join(', ')}`);
        }

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

            // Make a deep copy of formattedMessages
            const localContents = formattedMessages.map(m => ({
                role: m.role,
                parts: m.parts.map((p: any) => ({ ...p }))
            }));

            const aiRequestPayload: any = {
                contents: localContents,
                generationConfig: {
                    temperature: 0.2, // Need reliable legal answers
                },
                // Gemma 4 supports systemInstruction natively through the Gemini API.
                // Gemma 3 also works with systemInstruction through the same API.
                // Uses dynamicPrompt which includes RAG-injected guide data when relevant.
                systemInstruction: { parts: [{ text: dynamicPrompt }] },
            };

            // Gemma 4 supports googleSearch via Gemini API (confirmed in AI Studio).
            // Only Gemma 3 (legacy) does not support tools.
            if (!modelId.includes('gemma-3')) {
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
