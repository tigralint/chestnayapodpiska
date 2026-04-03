import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildSubscriptionPrompt, buildCoursePrompt } from './promptBuilder.js';

interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
}

interface GeminiResponse {
    candidates?: {
        content?: { parts?: { text?: string }[] };
        finishReason?: string;
    }[];
    promptFeedback?: { blockReason?: string };
    error?: { message?: string; code?: number };
}

import { z } from 'zod';

export const claimSchema = z.object({
    serviceName: z.string().min(1, 'Укажите название сервиса').max(100, 'Название сервиса слишком длинное'),
    amount: z.string().max(50, 'Сумма слишком длинная'),
    date: z.string().max(50, 'Дата слишком длинная'),
    reason: z.string().max(1000, 'Причина слишком длинная'),
    tone: z.enum(['soft', 'hard']),
    turnstileToken: z.string().min(1, 'Токен капчи обязателен'),
});

export const courseSchema = z.object({
    courseName: z.string().min(1, 'Укажите название курса').max(100, 'Название курса слишком длинное'),
    totalCost: z.number().positive('Сумма должна быть больше нуля').max(1000000000, 'Слишком большая сумма'),
    percentCompleted: z.number().min(0).max(100),
    tone: z.enum(['soft', 'hard']),
    hasPlatformAccess: z.boolean(),
    hasConsultations: z.boolean(),
    hasCertificate: z.boolean(),
    turnstileToken: z.string().min(1, 'Токен капчи обязателен'),
});

export type ClaimData = z.infer<typeof claimSchema>;
export type CourseData = z.infer<typeof courseSchema>;

/**
 * Strips characters that could be used for prompt injection.
 * Removes XML/HTML tags, instruction-like patterns, and bracket characters.
 */
function sanitizeInput(input: string, maxLength = 200): string {
    return input
        .slice(0, maxLength)
        .replace(/\n/g, ' ')                                      // Flatten newlines
        .replace(/<\/?[a-z_][a-z0-9_]*>/gi, '')                    // Strip XML/HTML tags
        .replace(/\b(SYSTEM|ASSISTANT|INSTRUCTION|IGNORE|PROMPT)\b/gi, '')  // Strip instruction keywords
        .replace(/[{}[\]<>]/g, '')                                 // Remove brackets
        .replace(/\s{2,}/g, ' ')                                   // Collapse multiple spaces
        .trim();
}

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// --- Redis Rate Limiter (60 req/hour per IP) ---
// Instantiate only if credentials are present, falling back gracefully locally if not set
const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(60, "1 h"),
      }) 
    : null;

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Rate limiting
    // Prefer Vercel's trusted header (cannot be spoofed by client)
    const clientIp = (request.headers['x-vercel-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? request.socket?.remoteAddress
        ?? 'unknown';

    if (ratelimit) {
        const { success } = await ratelimit.limit(clientIp);
        if (!success) {
            return response.status(429).json({ error: 'Слишком много запросов. Попробуйте через некоторое время.' });
        }
    } else {
        console.error('CRITICAL: Upstash Redis credentials are not set. Rate limiting is missing.');
        if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
            return response.status(500).json({ error: 'Сервис временно недоступен из-за ошибки конфигурации.' });
        } else {
            console.warn('Allowing request only because environment is not production.');
        }
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

    if (!GEMINI_API_KEY) {
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

        // Runtime validation of request body
        let validData: ClaimData | CourseData;
        if (type === 'subscription') {
            const parsed = claimSchema.safeParse(data);
            if (!parsed.success) {
                return response.status(400).json({ error: 'Некорректные данные подписки. Проверьте заполнение всех полей.' });
            }
            validData = parsed.data;
        } else {
            const parsed = courseSchema.safeParse(data);
            if (!parsed.success) {
                return response.status(400).json({ error: 'Некорректные данные курса. Проверьте заполнение всех полей.' });
            }
            validData = parsed.data;
            if (typeof calculatedRefund !== 'number' || calculatedRefund < 0) {
                return response.status(400).json({ error: 'Некорректная сумма возврата.' });
            }
        }

        // turnstileToken is now validated as required by Zod schema (.min(1))
        // No need for a separate nullish check here

        // Verify Turnstile (with timeout to prevent hanging)
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', validData.turnstileToken);

        const turnstileCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(8_000),
        });

        const turnstileRes = await turnstileCheck.json() as TurnstileVerifyResponse;
        if (!turnstileRes.success) {
            return response.status(403).json({ error: 'Ошибка капчи.' });
        }

        // Sanitize all user-provided strings before embedding in prompt
        let prompt = '';
        if (type === 'subscription') {
            const subData = validData as ClaimData;
            const serviceName = sanitizeInput(subData.serviceName);
            const amount = sanitizeInput(String(subData.amount), 20);
            const date = sanitizeInput(String(subData.date), 20);
            const reason = sanitizeInput(subData.reason);
            prompt = buildSubscriptionPrompt(serviceName, amount, date, reason, subData.tone);
        } else {
            const courseD = validData as CourseData;
            const courseName = sanitizeInput(courseD.courseName);
            const totalCost = sanitizeInput(String(courseD.totalCost), 20);
            const percentCompleted = sanitizeInput(String(courseD.percentCompleted), 5);
            const refund = sanitizeInput(String(calculatedRefund), 20);
            prompt = buildCoursePrompt(courseName, totalCost, percentCompleted, refund, courseD.tone);
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${GEMINI_API_KEY}`;
        const aiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                ],
            }),
            signal: AbortSignal.timeout(60_000),
        });

        const aiJson = await aiResponse.json() as GeminiResponse;

        // Check for API-level errors (invalid key, quota exceeded, etc.)
        if (aiJson.error) {
            console.error('Gemini API Error:', JSON.stringify(aiJson.error));
            return response.status(422).json({ error: 'Не удалось сгенерировать текст. Попробуйте позже.' });
        }

        // Check for safety blocks at prompt level
        if (aiJson.promptFeedback?.blockReason) {
            console.error('Gemini Safety Block (prompt):', aiJson.promptFeedback.blockReason);
            return response.status(422).json({ error: 'Не удалось сгенерировать текст. Попробуйте позже.' });
        }

        // Check for safety blocks at candidate level
        const candidate = aiJson.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            console.error('Gemini Safety Block (candidate):', JSON.stringify(candidate));
            return response.status(422).json({ error: 'Не удалось сгенерировать текст. Попробуйте позже.' });
        }

        const text = candidate?.content?.parts?.[0]?.text;

        if (!text) {
            // Log details server-side only — never expose Gemini internals to client
            console.error('Gemini Empty Response:', JSON.stringify(aiJson));
            // Return 422 instead of 502 so the client doesn't retry the request
            // (retrying fails anyway because the Turnstile token is already consumed)
            return response.status(422).json({ error: 'Не удалось сгенерировать текст. Попробуйте позже.' });
        }

        return response.status(200).json({ text });

    } catch (error: unknown) {
        console.error(JSON.stringify({
            event: 'generateClaim_error',
            type: request.body?.type,
            ip: clientIp,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        }));
        return response.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте позже.' });
    }
}
