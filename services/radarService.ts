import { RadarReport, RadarAlertResponse } from '../types';

/** Runtime type guard for RadarAlertResponse[] */
function isRadarAlertArray(data: unknown): data is RadarAlertResponse[] {
    return Array.isArray(data) && data.every(
        (item) => typeof item === 'object' && item !== null && 'id' in item && 'severity' in item
    );
}

/** Runtime type guard for submit response */
function isSubmitResponse(data: unknown): data is { success: boolean; id?: string } {
    return typeof data === 'object' && data !== null && 'success' in data;
}

export const RadarService = {
    async getAlerts(category?: string, limit: number = 20): Promise<RadarAlertResponse[]> {
        const url = new URL('/api/radar', window.location.origin);
        if (category && category !== 'all') url.searchParams.append('category', category);
        url.searchParams.append('limit', limit.toString());

        const res = await fetch(url.toString(), {
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Не удалось загрузить данные');
        const data: unknown = await res.json().catch(() => { throw new Error('Сервер вернул некорректный ответ'); });
        if (!isRadarAlertArray(data)) throw new Error('Некорректный формат данных');
        return data;
    },

    async submitAlert(data: RadarReport): Promise<{ success: boolean; id?: string }> {
        const res = await fetch('/api/radar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Server error');
        }
        const result: unknown = await res.json().catch(() => { throw new Error('Сервер вернул некорректный ответ'); });
        if (!isSubmitResponse(result)) throw new Error('Некорректный формат ответа');
        return result;
    }
};
