import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCourseFlow } from './useCourseFlow';
import * as geminiService from '../services/geminiService';
import * as downloadWord from '../utils/downloadWord';
import * as router from 'react-router-dom';

// Setup Mocks
vi.mock('react-router-dom', () => ({
    useParams: vi.fn(),
}));

vi.mock('../services/geminiService', () => ({
    generateCourseClaim: vi.fn(),
}));

vi.mock('../utils/downloadWord', () => ({
    downloadWordDoc: vi.fn(),
}));

vi.mock('../utils/clipboard', () => ({
    copyToClipboard: vi.fn().mockResolvedValue(true),
}));

describe('useCourseFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default course values', () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});

        const { result } = renderHook(() => useCourseFlow());

        expect(result.current.data.courseName).toBe('');
        expect(result.current.data.totalCost).toBe(100000);
        expect(result.current.data.percentCompleted).toBe(10);
        expect(result.current.data.tone).toBe('soft');
        expect(result.current.data.hasPlatformAccess).toBe(true);
        expect(result.current.calculatedRefund).toBe(90000); // 100000 - (100000 * 0.1)
    });

    it('should correctly recalculate calculatedRefund when inputs change', () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});

        const { result } = renderHook(() => useCourseFlow());

        act(() => {
            result.current.setData({
                ...result.current.data,
                totalCost: 50000,
                percentCompleted: 50
            });
        });

        // Ensure useMemo re-calculates it
        expect(result.current.calculatedRefund).toBe(25000); // 50000 - 25000
    });

    it('should not allow refund to be negative', () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});

        const { result } = renderHook(() => useCourseFlow());

        act(() => {
            result.current.setData({
                ...result.current.data,
                totalCost: 10000,
                percentCompleted: 150 // Bad data
            });
        });

        expect(result.current.calculatedRefund).toBe(0); // Math.max(0, ...) limits it to 0
    });

    it('should validate inputs before generation', async () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});
        const generateMock = vi.spyOn(geminiService, 'generateCourseClaim');

        const { result } = renderHook(() => useCourseFlow());

        // Blank course name
        act(() => {
            result.current.setData({
                ...result.current.data,
                totalCost: 0
            });
        });

        await act(async () => {
            result.current.handleSubmit();
        });

        expect(result.current.fieldErrors.courseName).toBe('Укажите название школы или курса');
        expect(result.current.fieldErrors.totalCost).toBe('Укажите корректную стоимость курса (> 0)');
        expect(generateMock).not.toHaveBeenCalled();
    });

    it('should call generateCourseClaim on valid submit', async () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});
        const generateMock = vi.spyOn(geminiService, 'generateCourseClaim').mockResolvedValue('Course Result Text');

        const { result } = renderHook(() => useCourseFlow());

        act(() => {
            result.current.setData({
                ...result.current.data,
                courseName: 'Test School',
                totalCost: 100000,
                percentCompleted: 0
            });
        });

        await act(async () => {
            result.current.handleSubmit();
        });

        expect(generateMock).toHaveBeenCalledTimes(1);
        expect(generateMock).toHaveBeenCalledWith(
            expect.objectContaining({ courseName: 'Test School' }),
            100000, // calculatedRefund
            expect.any(AbortSignal)
        );
        expect(result.current.result).toBe('Course Result Text');
    });

    it('should map to downloadWordDoc for courses correctly', async () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});
        const downloadMock = vi.spyOn(downloadWord, 'downloadWordDoc');

        const { result } = renderHook(() => useCourseFlow());

        act(() => {
            result.current.setData({ ...result.current.data, courseName: 'Skillbox/Geekbrains' });
        });

        await act(async () => {
            await result.current.handleDownloadWord();
        });

        expect(downloadMock).toHaveBeenCalledTimes(1);
        expect(downloadMock).toHaveBeenCalledWith(
            'Уведомление_о_расторжении_Skillbox_Geekbrains',
            "Руководству образовательной платформы",
            'Skillbox/Geekbrains',
            "_________________________ (Email / Паспорт: _________________)",
            "ПРЕТЕНЗИЯ",
            "об одностороннем расторжении договора и возврате денежных средств",
            ""
        );
    });
});
