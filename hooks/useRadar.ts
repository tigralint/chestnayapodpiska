import { useState, useCallback, useEffect } from 'react';
import { RadarAlertResponse, RadarReport } from '../types';
import { RadarService } from '../services/radarService';

export function useRadar() {
    const [alerts, setAlerts] = useState<RadarAlertResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const fetchAlerts = useCallback(async (cat: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await RadarService.getAlerts(cat);
            setAlerts(data);
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts(categoryFilter);
    }, [categoryFilter, fetchAlerts]);

    const submitReport = async (report: RadarReport) => {
        const res = await RadarService.submitAlert(report);
        if (res.success) {
            // Refetch to include the newly submitted alert at the top
            await fetchAlerts(categoryFilter);
        }
        return res;
    };

    return {
        alerts,
        loading,
        error,
        categoryFilter,
        setCategoryFilter,
        fetchAlerts,
        submitReport,
        setAlerts // expose explicitly for fallback testing
    };
}
