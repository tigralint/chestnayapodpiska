import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRadar } from './useRadar';
import { RadarService } from '../services/radarService';

vi.mock('../services/radarService', () => ({
    RadarService: {
        getAlerts: vi.fn(),
        submitAlert: vi.fn(),
    }
}));

describe('Hook: useRadar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch alerts on mount', async () => {
        const mockData = [{ id: '1', serviceName: 'Test' }];
        (RadarService.getAlerts as any).mockResolvedValue(mockData);

        const { result } = renderHook(() => useRadar());
        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.alerts).toEqual(mockData);
        });

        expect(RadarService.getAlerts).toHaveBeenCalledWith('all');
    });

    it('should refetch on category filter change', async () => {
        const mockData = [{ id: '2', serviceName: 'Test 2' }];
        (RadarService.getAlerts as any).mockResolvedValue(mockData);

        const { result } = renderHook(() => useRadar());
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setCategoryFilter('phishing');
        });

        await waitFor(() => {
            expect(RadarService.getAlerts).toHaveBeenCalledWith('phishing');
        });
    });
});
