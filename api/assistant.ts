export const config = {
    runtime: 'edge',
};

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { GUIDES_DB } from '../data/guides.js';
import type { Guide } from '../types';
import { getClientIpEdge } from '../utils/getClientIp.js';
import type { TurnstileVerifyResponse } from '../utils/turnstile.js';

/** Runtime validation for incoming chat requests */
export const assistantSchema = z.object({
    messages: z.array(z.object({
        role: z.string(),
        text: z.string(),
        image: z.string().optional(),
    })).min(1, 'Нужно хотя бы одно сообщение').max(50, 'Слишком много сообщений'),
    turnstileToken: z.string().min(1, 'Токен капчи обязателен'),
});

/** Gemini API type definitions – eliminates `any` across the file */
interface GeminiPart {
    text?: string;
    inlineData?: { mimeType: string; data: string };
    thought?: boolean;
}

interface GeminiContent {
    role: string;
    parts: GeminiPart[];
}

interface GeminiRequestPayload {
    contents: GeminiContent[];
    generationConfig: { temperature: number };
    systemInstruction?: { parts: { text: string }[] };
    tools?: { googleSearch: Record<string, never> }[];
}

const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Ratelimit({
        redis: Redis.fromEnv({ enableAutoPipelining: true }),
        limiter: Ratelimit.slidingWindow(15, "1 d"),
    })
    : null;

const SYSTEM_PROMPT = `Ты – юридический ассистент сервиса «Честная Подписка» (chestnayapodpiska.vercel.app).
Твоя задача – консультировать пользователей сугубо по вопросам возврата средств за платные подписки и онлайн-курсы на территории РФ (применяя ГК РФ и Закон о защите прав потребителей).

О СОЗДАТЕЛЕ И ПРОЕКТЕ:
1. Создатель сервиса – Тигран Мкртчян, студент юридического факультета МГУ им. М.В. Ломоносова. Проект реализуется в рамках Всероссийского студенческого проекта «Твой Ход».
2. Если пользователь хочет сказать спасибо, задать вопрос автору, предложить функционал или пожаловаться на ошибку – направляй в официальный паблик ВКонтакте: vk.com/fairsubs
3. На сайте есть 2 основных раздела: калькулятор для «Подписок» и калькулятор для «Курсов». Если пользователь просит написать документ, направь его к нужной форме на сайте.
4. Ссылка на Закон о защите прав потребителей: https://www.consultant.ru/document/cons_doc_LAW_305/

ПОДДЕРЖИВАЕМЫЕ СЕРВИСЫ (по категориям):
• Экосистемы/подписки: Яндекс Плюс, СберПрайм, Ozon Premium, Т-Банк Pro, МТС Premium/KION, VK Музыка/Combo, Подписка «Пакет» (X5), VK Play Cloud, Whoosh/Urent, Boosty, Газпром Бонус, Яндекс 360, Telegram Premium, Apple Music/Apple One, Spotify, 2ГИС Premium, Авито Подписки.
• Онлайн-кинотеатры: Okko, Иви, Premier (ТНТ), Start, Amediateka, Wink, Литрес.
• Онлайн-курсы (EdTech): Skillbox, GeekBrains, SkillFactory, Фоксфорд, Умскул, Яндекс Практикум, Нетология, Skyeng/Skysmart, Синергия, Stepik, Contented.

ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ (FAQ):
Q: Могу ли я вернуть деньги за подписку, если забыл отменить?
A: Да, если вы не пользовались сервисом. Согласно ст. 32 ЗоЗПП и новым правилам 2025-2026, поставщики обязаны уведомлять за 24 часа до списания. Если уведомления не было – пишите претензию.

Q: Школа удерживает 30% за «административные расходы» – это законно?
A: Нет. По ст. 32 ЗоЗПП и ст. 782 ГК РФ удерживать можно ТОЛЬКО документально подтверждённые фактически понесённые расходы (ФПР) именно на ваше обучение. Маркетинг, зарплата менеджеров и разработка платформы ФПР не являются.

Q: Как отправить досудебную претензию?
A: Лучше всего – заказным письмом с описью вложения на юридический адрес компании. Также можно продублировать на email. У компании есть 10 дней на ответ (ст. 31 ЗоЗПП).

Q: Что делать, если компания игнорирует мою претензию?
A: Подать жалобу в Роспотребнадзор и обратиться в суд. Суд добавит штраф 50% от суммы (п. 6 ст. 13 ЗоЗПП) + моральный вред + расходы на юриста.

Q: Если пользователь прислал скриншот – проанализируй изображение и помоги определить сервис, дату списания и сумму.

ПРАВИЛА ПОВЕДЕНИЯ:
1. Отвечай кратко, чётко и вежливо. Используй Markdown. СРАЗУ выдавай финальный ответ.
2. На ЛЮБЫЕ вопросы, не связанные с возвратами, подписками, ЗоЗПП, юридическими советами или самим сервисом – вежливо ОТКАЗЫВАЙ.
3. НИКОГДА не пиши свои рассуждения вслух. Выдавай СТРОГО готовый ответ для конечного пользователя.
4. Если пользователь отправил изображение (скриншот чека, подписки, переписки с поддержкой), проанализируй его и дай конкретный совет по возврату.`;

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        // 1. Parse and validate request body
        const body = await req.json();
        const parsed = assistantSchema.safeParse(body);
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: 'Некорректный запрос.' }), { status: 400 });
        }
        const { messages, turnstileToken } = parsed.data;

        const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!TURNSTILE_SECRET_KEY || !GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: 'Ошибка конфигурации сервера.' }), { status: 500 });
        }

        // 2. Rate Limiting (15 per IP per day) — before Turnstile to save external fetch
        // Prefer Vercel's trusted header (cannot be spoofed by client)
        const ip = getClientIpEdge(req);

        if (ratelimit) {
            const { success } = await ratelimit.limit(`chat_${ip}`);
            if (!success) {
                return new Response(JSON.stringify({ error: 'Лимит обращений исчерпан (15 запросов в сутки). Попробуйте завтра.' }), { status: 429 });
            }
        } else {
            console.error(JSON.stringify({ event: 'assistant_ratelimit_missing', critical: true }));
            if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
                return new Response(JSON.stringify({ error: 'Сервис временно недоступен.' }), { status: 500 });
            }
        }

        // 3. Verify Turnstile (with timeout to prevent hanging)
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', turnstileToken);

        const turnstileCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(8_000),
        });

        const turnstileRes = await turnstileCheck.json() as TurnstileVerifyResponse;
        if (!turnstileRes.success) {
            return new Response(JSON.stringify({ error: 'Ошибка капчи.' }), { status: 403 });
        }

        // 4. Format messages for Gemini API (supports text + inline images for Gemma 4 vision)
        const formattedMessages: GeminiContent[] = messages.map((msg) => {
            const parts: GeminiPart[] = [{ text: msg.text }];
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

        // 5. Keyword RAG – find relevant guides based on user messages
        // Search ALL user messages (not just last) to maintain context across follow-ups
        const allUserText = messages
            .filter(m => m.role === 'user')
            .map(m => m.text)
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
            // eslint-disable-next-line no-console
            console.log(JSON.stringify({ event: 'rag_injection', guideCount: relevantGuides.length, guides: relevantGuides.map((g: Guide) => g.service) }));
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
            // eslint-disable-next-line no-console
            console.log(JSON.stringify({ event: 'assistant_attempt', model: modelId }));
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse`;

            // Make a deep copy of formattedMessages
            const localContents: GeminiContent[] = formattedMessages.map(m => ({
                role: m.role,
                parts: m.parts.map((p: GeminiPart) => ({ ...p }))
            }));

            const aiRequestPayload: GeminiRequestPayload = {
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
                    'x-goog-api-key': GEMINI_API_KEY,
                },
                body: JSON.stringify(aiRequestPayload),
                signal: AbortSignal.timeout(60_000),
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
                
                const logFn = (res.status === 429 || res.status >= 500) ? console.warn : console.error;
                logFn(JSON.stringify({ event: 'assistant_model_skip', model: modelId, status: res.status }));
                continue;
            }
        }

        if (!aiResponse) {
            return new Response(JSON.stringify({ error: `Детали ошибки API: ${lastErrorText}` }), { status: 503 });
        }

        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ event: 'assistant_success', model: finalModelId, skipped: skipReasons }));

        // Return SSE stream directly to the client
        return new Response(aiResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
                'X-AI-Model': finalModelId,
                'X-AI-Skip-Reasons': skipReasons.join(', ')
            }
        });

    } catch (err: unknown) {
        console.error(JSON.stringify({
            event: 'assistant_error',
            error: err instanceof Error ? err.message : String(err),
            ...(process.env.VERCEL_ENV !== 'production' && { stack: err instanceof Error ? err.stack : undefined }),
            timestamp: new Date().toISOString(),
        }));
        return new Response(JSON.stringify({ error: 'Внутренняя ошибка сервера.' }), { status: 500 });
    }
}
