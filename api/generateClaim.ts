import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildSubscriptionPrompt, buildCoursePrompt, buildCustomReasonPrompt } from './promptBuilder.js';
import type { TurnstileVerifyResponse } from '../utils/turnstile';
import { TURNSTILE_TIMEOUT_MS } from '../utils/turnstile';
import { getClientIp } from '../utils/getClientIp';
import { sanitizeForPrompt } from '../utils/sanitize';

interface GeminiResponse {
    candidates?: {
        content?: { parts?: { text?: string; thought?: boolean }[] };
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
    customReason: z.string().max(500, 'Причина слишком длинная').optional(),
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

// --- Gemini API Helper ---
// Calls a Gemini-compatible model and returns extracted text, or an error/quota signal.
interface GeminiCallResult {
    text?: string;
    error?: string;
    quotaExhausted?: boolean;
}

interface GeminiSafetySetting {
    category: string;
    threshold: string;
}

async function callGeminiModel(
    modelId: string,
    prompt: string,
    apiKey: string,
): Promise<GeminiCallResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

    /**
     * Safety filters disabled intentionally:
     * Legal claim generation involves language about disputes, demands, and threats of legal action
     * which Gemini's default safety filters incorrectly flag as harassment/harmful content.
     * Defense-in-depth is provided by: sanitizeForPrompt() + prompt structure (<user_input> tags).
     */
    const safetySettings: GeminiSafetySetting[] = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    const aiResponse = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 },
            safetySettings,
        }),
        signal: AbortSignal.timeout(60_000),
    });

    const aiJson = await aiResponse.json() as GeminiResponse;

    // Detect quota exhaustion (429 RESOURCE_EXHAUSTED) → signal to try fallback model
    if (aiJson.error) {
        if (aiJson.error.code === 429) {
            return { quotaExhausted: true };
        }
        return { error: `[${modelId}] API Error: ${JSON.stringify(aiJson.error)}` };
    }

    // Safety blocks
    if (aiJson.promptFeedback?.blockReason) {
        return { error: `[${modelId}] Safety block (prompt): ${aiJson.promptFeedback.blockReason}` };
    }

    const candidate = aiJson.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
        return { error: `[${modelId}] Safety block (candidate): ${JSON.stringify(candidate)}` };
    }

    // Extract answer text, filtering out thinking parts (thought=true)
    // Both Gemini 3 and Gemma 4 models may return thinking parts
    const parts = candidate?.content?.parts ?? [];
    const answerParts = parts.filter(p => !p.thought && p.text);
    let text = answerParts.map(p => p.text).join('') || undefined;

    // Gemma 4 (31B) may emit empty or non-empty <|channel>thought ... <channel|> tags
    // even with thinking disabled. Strip them as a safety fallback.
    if (text) {
        text = text.replace(/<\|channel>thought[\s\S]*?<channel\|>\n?/gi, '').trim() || undefined;
    }

    if (!text) {
        return { error: `[${modelId}] Empty response: ${JSON.stringify(aiJson)}` };
    }

    return { text };
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Rate limiting
    // Prefer Vercel's trusted header (cannot be spoofed by client)
    const clientIp = getClientIp(request);

    if (ratelimit) {
        const { success } = await ratelimit.limit(clientIp);
        if (!success) {
            return response.status(429).json({ error: 'Слишком много запросов. Попробуйте через некоторое время.' });
        }
    } else {
        console.error(JSON.stringify({ event: 'claim_ratelimit_missing', critical: true }));
        if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
            return response.status(500).json({ error: 'Сервис временно недоступен из-за ошибки конфигурации.' });
        } else {
            console.warn(JSON.stringify({ event: 'claim_ratelimit_bypassed', env: 'non-production' }));
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
            signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
        });

        const turnstileRes = await turnstileCheck.json() as TurnstileVerifyResponse;
        if (!turnstileRes.success) {
            return response.status(403).json({ error: 'Ошибка капчи.' });
        }

        // Sanitize all user-provided strings before embedding in prompt
        let prompt = '';
        if (type === 'subscription') {
            const subData = validData as ClaimData;
            const serviceName = sanitizeForPrompt(subData.serviceName);
            const amount = sanitizeForPrompt(String(subData.amount), 20);
            const date = sanitizeForPrompt(String(subData.date), 20);

            // Custom reason uses a separate prompt with AI validation
            if (subData.reason === 'custom' && subData.customReason) {
                const customReason = sanitizeForPrompt(subData.customReason, 500);
                prompt = buildCustomReasonPrompt(serviceName, amount, date, customReason, subData.tone);
            } else {
                const reason = sanitizeForPrompt(subData.reason);
                prompt = buildSubscriptionPrompt(serviceName, amount, date, reason, subData.tone);
            }
        } else {
            const courseD = validData as CourseData;
            const courseName = sanitizeForPrompt(courseD.courseName);
            const totalCost = sanitizeForPrompt(String(courseD.totalCost), 20);
            const percentCompleted = sanitizeForPrompt(String(courseD.percentCompleted), 5);
            const refund = sanitizeForPrompt(String(calculatedRefund), 20);
            prompt = buildCoursePrompt(courseName, totalCost, percentCompleted, refund, courseD.tone);
        }

        // --- Model Cascade: Primary → Fallback ---
        const MODELS = [
            'gemini-3.1-flash-lite-preview',
            'gemini-3-flash-preview',
            'gemini-2.5-flash',
            'gemma-4-31b-it' // Gemma 4 used as ultimate fallback (supports systemInstruction via Gemini API)
        ];

        let finalResultText = null;
        let finalModelId = '';
        const skipReasons: string[] = [];

        for (const modelId of MODELS) {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify({ event: 'claim_attempt', model: modelId }));
            const result = await callGeminiModel(modelId, prompt, GEMINI_API_KEY);

            if (result.text) {
                finalResultText = result.text;
                finalModelId = modelId;
                break; // Found a working model, exit loop
            }
            if (result.quotaExhausted) {
                console.warn(JSON.stringify({ event: 'claim_quota_exhausted', model: modelId }));
                skipReasons.push(`${modelId}:429_QUOTA`);
                continue;
            }
            if (result.error) {
                console.error(JSON.stringify({ event: 'claim_model_error', model: modelId, error: result.error }));
                skipReasons.push(`${modelId}:ERROR`);
                continue; // Try next model even on general errors to maximize availability
            }
        }

        if (!finalResultText) {
            return response.status(422).json({ error: 'Все нейросети временно перегружены. Пожалуйста, повторите попытку позже.' });
        }

        // Attach X-AI-Model header to the response
        response.setHeader('X-AI-Model', finalModelId);
        if (skipReasons.length > 0) {
            response.setHeader('X-AI-Skip-Reasons', skipReasons.join(', '));
        }
        return response.status(200).json({ text: finalResultText, _modelId: finalModelId, _skipReasons: skipReasons });

    } catch (error: unknown) {
        console.error(JSON.stringify({
            event: 'generateClaim_error',
            type: request.body?.type,
            ip: clientIp,
            error: error instanceof Error ? error.message : String(error),
            ...(process.env.VERCEL_ENV !== 'production' && { stack: error instanceof Error ? error.stack : undefined }),
            timestamp: new Date().toISOString(),
        }));
        return response.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте позже.' });
    }
}
