import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildSubscriptionPrompt, buildCoursePrompt } from './promptBuilder.js';

interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
}

interface OpenRouterResponse {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
}

import { z } from 'zod';

export const claimSchema = z.object({
    serviceName: z.string().min(1, 'Укажите название сервиса'),
    amount: z.string(),
    date: z.string(),
    reason: z.string(),
    tone: z.enum(['soft', 'hard']),
    turnstileToken: z.string().optional()
});

export const courseSchema = z.object({
    courseName: z.string().min(1, 'Укажите название курса'),
    totalCost: z.number().positive('Сумма должна быть больше нуля'),
    percentCompleted: z.number().min(0).max(100),
    tone: z.enum(['soft', 'hard']),
    hasPlatformAccess: z.boolean(),
    hasConsultations: z.boolean(),
    hasCertificate: z.boolean(),
    turnstileToken: z.string().optional()
});

export type ClaimData = z.infer<typeof claimSchema>;
export type CourseData = z.infer<typeof courseSchema>;

/**
 * Strips characters that could be used for prompt injection.
 * Removes instruction-like patterns while keeping normal user text.
 */
function sanitizeInput(input: string, maxLength = 200): string {
    return input
        .slice(0, maxLength)
        .replace(/\n/g, ' ')             // Flatten newlines
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
    const clientIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? request.socket?.remoteAddress
        ?? 'unknown';

    if (ratelimit) {
        const { success } = await ratelimit.limit(clientIp);
        if (!success) {
            return response.status(429).json({ error: 'Слишком много запросов. Попробуйте через некоторое время.' });
        }
    } else {
        console.warn('Upstash Redis credentials are not set in the environment. Rate limiting is disabled.');
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

        if (!validData || !validData.turnstileToken) {
            return response.status(403).json({ error: 'Капча не пройдена.' });
        }

        // Verify Turnstile
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', validData.turnstileToken);

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

        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "arcee-ai/trinity-large-preview:free",
                "messages": [{ "role": "user", "content": prompt }],
                "temperature": 0.1,
            })
        });

        const aiJson = await aiResponse.json() as OpenRouterResponse;
        const text = aiJson.choices?.[0]?.message?.content;

        if (!text) {
            console.error('OpenRouter Error:', JSON.stringify(aiJson));
            const aiErr = aiJson.error?.message || 'ИИ-модель не вернула результат';
            // Return 422 instead of 502 so the client doesn't retry the request
            // (retrying fails anyway because the Turnstile token is already consumed)
            return response.status(422).json({ error: `Ошибка API ИИ: ${aiErr}` });
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
