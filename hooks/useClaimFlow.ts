import { useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { ClaimData } from '../types';
import { generateSubscriptionClaim } from '../services/geminiService';
import { useClaimForm } from './useClaimForm';

export const REASONS = [
    'Забыл отменить подписку после пробного периода',
    'Не планировал продлевать, случайно нажал',
    'Сервисом не пользовался, услуга не нужна',
    'Списание произошло без предупреждения'
];

/** Sentinel value for "custom reason" dropdown option */
export const CUSTOM_REASON_VALUE = 'custom';
export const CUSTOM_REASON_LABEL = 'Другое (своя причина)';

/** Marker the AI prepends to signal an invalid reason */
export const REFUSAL_MARKER = '[ОТКАЗ]';

export function useClaimFlow() {
    const { service } = useParams<{ service?: string }>();
    const prefilledService = service ? decodeURIComponent(service) : '';

    const {
        data, setData,
        isGenerating, result, copied,
        fieldErrors, apiError,
        handleGenerate, clearFieldError, handleCopy
    } = useClaimForm<ClaimData>(
        {
            serviceName: prefilledService,
            amount: '',
            date: new Date().toISOString().split('T')[0] ?? '',
            reason: REASONS[0] ?? '',
            tone: 'soft'
        },
        (claimData, signal) => generateSubscriptionClaim(claimData, signal),
        (d) => {
            const errors: Record<string, string> = {};
            if (!d.serviceName.trim()) errors.serviceName = 'Укажите название сервиса';
            if (!d.amount) errors.amount = 'Укажите сумму списания';
            else if (Number(d.amount) <= 0) errors.amount = 'Сумма должна быть больше 0';
            // Validate custom reason when "Другое" is selected
            if (d.reason === CUSTOM_REASON_VALUE && (!d.customReason || !d.customReason.trim())) {
                errors.customReason = 'Опишите причину возврата';
            }
            return errors;
        }
    );

    const [isReasonOpen, setIsReasonOpen] = useState(false);
    const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

    /** True when the AI returned a [ОТКАЗ] refusal instead of a claim */
    const isRefusal = result.startsWith(REFUSAL_MARKER);

    /** Text to display – strip the [ОТКАЗ] marker */
    const displayResult = isRefusal ? result.slice(REFUSAL_MARKER.length).trim() : result;

    /** Whether the custom reason textarea should be shown */
    const isCustomReason = data.reason === CUSTOM_REASON_VALUE;

    const handleSubmit = () => {
        handleGenerate(() => turnstileRef.current?.reset());
    };

    const handleDownloadWord = useCallback(async () => {
        const { downloadWordDoc } = await import('../utils/downloadWord');
        const safeName = data.serviceName.replace(/[^a-zа-я0-9]/gi, '_');
        downloadWordDoc(
            `Претензия_${safeName}`,
            "В службу поддержки / Руководству",
            data.serviceName,
            "_________________________ (Email / Телефон: _________________)",
            "ДОСУДЕБНАЯ ПРЕТЕНЗИЯ",
            "",
            result
        );
    }, [data.serviceName, result]);

    return {
        data, setData,
        isGenerating, result: displayResult, copied,
        fieldErrors, apiError,
        clearFieldError, handleCopy,
        handleSubmit, handleDownloadWord,
        isReasonOpen, setIsReasonOpen,
        turnstileRef, prefilledService,
        isCustomReason, isRefusal
    };
}
