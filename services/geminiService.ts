import { ClaimData, CourseData } from '../types';

// Вспомогательная функция для очистки текста от случайного Markdown
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*/g, '') // Удаляем двойные звездочки (жирный шрифт)
    .replace(/__/g, '')   // Удаляем двойные подчеркивания
    .replace(/^#+\s/gm, '') // Удаляем решетки заголовков (# Заголовок -> Заголовок)
    .replace(/^\*\s/gm, '- ') // Заменяем звездочки-маркеры списков на обычные тире
    .trim();
};

export const generateSubscriptionClaim = async (data: ClaimData): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/generateClaim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'subscription', data })
    });

    const contentType = response.headers.get('content-type');
    let result: any = {};

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'Сервер прервал соединение (проверьте таймаут).');
    }

    if (!response.ok) {
      const errorMessage = result.details
        ? `${result.error} (${result.details})`
        : (result.error || 'Произошла ошибка при генерации.');
      throw new Error(errorMessage);
    }

    return cleanMarkdown(result.text);
  } catch (error: any) {
    console.error('Error generating claim:', error);
    if (error.message && !error.message.includes('fetch')) throw error;
    throw new Error('Ошибка связи с сервером. Убедитесь, что у вас стабильное подключение, и попробуйте повторно.');
  }
};

export const generateCourseClaim = async (data: CourseData, calculatedRefund: number): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/generateClaim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'course', data, calculatedRefund })
    });

    const contentType = response.headers.get('content-type');
    let result: any = {};

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'Сервер прервал соединение (проверьте таймаут).');
    }

    if (!response.ok) {
      const errorMessage = result.details
        ? `${result.error} (${result.details})`
        : (result.error || 'Произошла ошибка при генерации.');
      throw new Error(errorMessage);
    }

    return cleanMarkdown(result.text);
  } catch (error: any) {
    console.error('Error generating course claim:', error);
    if (error.message && !error.message.includes('fetch')) throw error;
    throw new Error('Произошла ошибка при обращении к серверу. Пожалуйста, попробуйте повторить запрос через несколько секунд.');
  }
};