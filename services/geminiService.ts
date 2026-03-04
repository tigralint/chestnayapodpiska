import { ClaimData, CourseData } from '../types';

/** Response shape from /api/generateClaim */
interface GenerateClaimResponse {
  text?: string;
  error?: string;
  details?: string;
}

/** Removes accidental Markdown formatting from AI output */
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/^#+\s/gm, '')
    .replace(/^\*\s/gm, '- ')
    .trim();
};

/**
 * Core function to call /api/generateClaim.
 * Both subscription and course flows share this logic.
 */
async function generateClaim(
  type: 'subscription' | 'course',
  data: ClaimData | CourseData,
  calculatedRefund?: number,
): Promise<string> {
  try {
    const response = await fetch('/api/generateClaim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, calculatedRefund }),
    });

    const contentType = response.headers.get('content-type');
    let result: GenerateClaimResponse = {};

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'Сервер прервал соединение (проверьте таймаут).');
    }

    if (!response.ok) {
      throw new Error(result.error || 'Произошла ошибка при генерации.');
    }

    if (!result.text) {
      throw new Error('Модель не вернула текст. Попробуйте повторить.');
    }

    return cleanMarkdown(result.text);
  } catch (error: unknown) {
    console.error(`Error generating ${type} claim:`, error);
    if (error instanceof Error && !error.message.includes('fetch')) throw error;
    throw new Error('Ошибка связи с сервером. Убедитесь, что у вас стабильное подключение, и попробуйте повторно.');
  }
}

/** Thin wrapper for subscription claims */
export const generateSubscriptionClaim = (data: ClaimData): Promise<string> =>
  generateClaim('subscription', data);

/** Thin wrapper for course claims */
export const generateCourseClaim = (data: CourseData, calculatedRefund: number): Promise<string> =>
  generateClaim('course', data, calculatedRefund);