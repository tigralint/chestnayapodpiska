import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSubscriptionClaim, generateCourseClaim } from './geminiService';
import type { ClaimData, CourseData } from '../types';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockClaimData: ClaimData = {
    serviceName: 'Тестовый сервис',
    amount: '990',
    date: '2024-01-15',
    reason: 'Не пользуюсь',
    tone: 'soft',
    turnstileToken: 'test-token',
};

const mockCourseData: CourseData = {
    courseName: 'Тестовый курс',
    totalCost: 50000,
    percentCompleted: 30,
    tone: 'hard',
    hasPlatformAccess: true,
    hasConsultations: false,
    hasCertificate: false,
    turnstileToken: 'test-token',
};

function jsonResponse(body: object, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
    } as Response;
}

beforeEach(() => {
    mockFetch.mockReset();
    vi.restoreAllMocks();
});

describe('generateSubscriptionClaim', () => {
    it('returns cleaned text on success', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ text: '**Текст** претензии' }));
        const result = await generateSubscriptionClaim(mockClaimData);
        expect(result).toBe('Текст претензии');
        expect(mockFetch).toHaveBeenCalledWith('/api/generateClaim', expect.objectContaining({
            method: 'POST',
        }));
    });

    it('throws fast on HTTP 403 error with server message', async () => {
        // 403 should NOT trigger retry, it should fail fast
        mockFetch.mockResolvedValue(jsonResponse({ error: 'Капча не пройдена.' }, 403));
        await expect(generateSubscriptionClaim(mockClaimData)).rejects.toThrow('Капча не пройдена.');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws on empty text response', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ text: '' }));
        await expect(generateSubscriptionClaim(mockClaimData)).rejects.toThrow('Модель не вернула текст');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws network error message on fetch failure', async () => {
        // Will be retried 3 times, ending in this fallback error message
        mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(generateSubscriptionClaim(mockClaimData)).rejects.toThrow('Удаленный сервер перегружен (ошибка 429/500).');
    });

    it('throws on non-JSON response', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/html' }),
            text: () => Promise.resolve('502 Bad Gateway'),
        } as Response);
        await expect(generateSubscriptionClaim(mockClaimData)).rejects.toThrow('Сервер вернул некорректный ответ (не JSON).');
    });
});

describe('generateCourseClaim', () => {
    it('returns cleaned text on success', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ text: '## Заголовок\nТекст расторжения' }));
        const result = await generateCourseClaim(mockCourseData, 35000);
        expect(result).toBe('Заголовок\nТекст расторжения');
    });

    it('sends calculatedRefund in request body', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ text: 'OK' }));
        await generateCourseClaim(mockCourseData, 35000);
        const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string);
        expect(body.calculatedRefund).toBe(35000);
        expect(body.type).toBe('course');
    });

    it('retries on server error 500 and throws fallback message', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ error: 'Внутренняя ошибка' }, 500));
        await expect(generateCourseClaim(mockCourseData, 35000)).rejects.toThrow('Удаленный сервер перегружен (ошибка 429/500).');
        expect(mockFetch).toHaveBeenCalledTimes(3); // Expect 3 retries
    });
});
