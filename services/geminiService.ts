import { ClaimPayload, GenerateClaimResponse, ClaimData, CourseData } from '../types';
import { ApiError } from '../utils/errors';
import { fetchWithRetry } from '../utils/fetchWithRetry';
import removeMarkdown from 'remove-markdown';

/** Removes accidental Markdown formatting from AI output safely */
const cleanMarkdown = (text: string): string => {
  return removeMarkdown(text).trim();
};

/** Strict Runtime Type Guard for the API response */
function isGenerateClaimResponse(data: unknown): data is GenerateClaimResponse {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }
  // Check strict fields if necessary, here we at least expect object literal 
  // (not an array, not null)
  return true;
}

/**
 * Core function to call /api/generateClaim.
 * Uses Strict Discriminated Unions and safe fetchWithRetry.
 */
async function generateClaim(payload: ClaimPayload): Promise<string> {
  const response = await fetchWithRetry('/api/generateClaim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    // Prevent raw HTML (like 502 Bad Gateway Nginx pages) from leaking to UI
    throw new ApiError(response.status, 'Сервер вернул некорректный ответ (не JSON).');
  }

  let result: GenerateClaimResponse;
  try {
    const rawResult = await response.json();
    if (!isGenerateClaimResponse(rawResult)) {
      throw new Error('Invalid JSON shape');
    }
    result = rawResult;
  } catch (parseError) {
    if (parseError instanceof DOMException && parseError.name === 'AbortError') {
      throw parseError; // do not mask abort errors
    }
    throw new ApiError(500, 'Ошибка парсинга ответа от сервера.');
  }

  if (!response.ok) {
    // 400 errors shouldn't be retried and are handled here
    throw new ApiError(response.status, result.error || 'Произошла ошибка при генерации.');
  }

  if (!result.text) {
    throw new ApiError(500, 'Модель не вернула текст. Попробуйте повторить.');
  }

  return cleanMarkdown(result.text);
}

/** Thin wrapper for subscription claims */
export const generateSubscriptionClaim = (data: ClaimData): Promise<string> =>
  generateClaim({ type: 'subscription', data });

/** Thin wrapper for course claims */
export const generateCourseClaim = (data: CourseData, calculatedRefund: number): Promise<string> =>
  generateClaim({ type: 'course', data, calculatedRefund });