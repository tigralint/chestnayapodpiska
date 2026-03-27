import { RadarReport, RadarAlertResponse } from '../types';

export const RadarService = {
    async getAlerts(category?: string, limit: number = 20): Promise<RadarAlertResponse[]> {
        const url = new URL('/api/radar', window.location.origin);
        if (category && category !== 'all') url.searchParams.append('category', category);
        url.searchParams.append('limit', limit.toString());

        const res = await fetch(url.toString(), {
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Не удалось загрузить данные');
        return res.json().catch(() => {
            throw new Error('Сервер вернул некорректный ответ');
        });
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
        return res.json().catch(() => {
            throw new Error('Сервер вернул некорректный ответ');
        });
    }
};
