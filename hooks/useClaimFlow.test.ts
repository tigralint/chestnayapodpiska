import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClaimFlow, REASONS } from './useClaimFlow';
import * as geminiService from '../services/geminiService';
import * as downloadWord from '../utils/downloadWord';
import * as router from 'react-router-dom';

// Setup Mocks
vi.mock('react-router-dom', () => ({
    useParams: vi.fn(),
}));

vi.mock('../services/geminiService', () => ({
    generateSubscriptionClaim: vi.fn(),
}));

vi.mock('../utils/downloadWord', () => ({
    downloadWordDoc: vi.fn(),
}));

// We also mock clipboard to avoid true clipboard interactions
vi.mock('../utils/clipboard', () => ({
    copyToClipboard: vi.fn().mockResolvedValue(true),
}));

describe('useClaimFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values and no prefilled service', () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});

        const { result } = renderHook(() => useClaimFlow());

        expect(result.current.prefilledService).toBe('');
        expect(result.current.data.serviceName).toBe('');
        expect(result.current.data.amount).toBe('');
        expect(result.current.data.reason).toBe(REASONS[0]);
        expect(result.current.data.tone).toBe('soft');
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.isReasonOpen).toBe(false);
    });

    it('should decode and use prefilled service from URL params', () => {
        vi.spyOn(router, 'useParams').mockReturnValue({ service: encodeURIComponent('Яндекс Плюс') });

        const { result } = renderHook(() => useClaimFlow());

        expect(result.current.prefilledService).toBe('Яндекс Плюс');
        expect(result.current.data.serviceName).toBe('Яндекс Плюс');
    });

    it('should validate correctly and prevent generation if invalid', async () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});
        const generateMock = vi.spyOn(geminiService, 'generateSubscriptionClaim');

        const { result } = renderHook(() => useClaimFlow());

        // Attempt submit without filling data
        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(result.current.fieldErrors.serviceName).toBe('Укажите название сервиса');
        expect(result.current.fieldErrors.amount).toBe('Укажите сумму списания');
        expect(generateMock).not.toHaveBeenCalled();
    });

    it('should show error if amount is negative or zero', async () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});
        const { result } = renderHook(() => useClaimFlow());

        await act(async () => {
            result.current.setData({ ...result.current.data, serviceName: 'Test', amount: '-100' });
        });

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(result.current.fieldErrors.amount).toBe('Сумма должна быть больше 0');
    });

    it('should call generateSubscriptionClaim on valid data and store result', async () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});
        const generateMock = vi.spyOn(geminiService, 'generateSubscriptionClaim').mockResolvedValue('Mocked Claim Text');

        const { result } = renderHook(() => useClaimFlow());

        await act(async () => {
            result.current.setData({
                ...result.current.data,
                serviceName: 'Netflix',
                amount: '999',
            });
        });

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(generateMock).toHaveBeenCalledTimes(1);
        expect(generateMock).toHaveBeenCalledWith(result.current.data);

        expect(result.current.result).toBe('Mocked Claim Text');
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.fieldErrors).toEqual({});
    });

    it('should call downloadWordDoc mapping the data correctly', () => {
        vi.spyOn(router, 'useParams').mockReturnValue({});
        const downloadMock = vi.spyOn(downloadWord, 'downloadWordDoc');

        const { result } = renderHook(() => useClaimFlow());

        act(() => {
            result.current.setData({ ...result.current.data, serviceName: 'Test Service.!' });
            // We need result state to simulate the downloaded text, but since we mock, we can just call the handler directly.
            // Normally this is set by handleGenerate.
        });

        act(() => {
            result.current.handleDownloadWord();
        });

        expect(downloadMock).toHaveBeenCalledTimes(1);
        expect(downloadMock).toHaveBeenCalledWith(
            'Претензия_Test_Service__',
            "В службу поддержки / Руководству",
            'Test Service.!',
            "_________________________ (Email / Телефон: _________________)",
            "ДОСУДЕБНАЯ ПРЕТЕНЗИЯ",
            "",
            "" // Result text empty initially
        );
    });
});
