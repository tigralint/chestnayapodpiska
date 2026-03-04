import { useState, useCallback, useRef } from 'react';
import { copyToClipboard } from '../utils/clipboard';

/**
 * Generic form hook for claim generation.
 * generateFn receives (data, signal, ...extraArgs) so callers don't need to manage AbortController.
 */
export function useClaimForm<T extends { turnstileToken?: string }, A extends unknown[] = []>(
    initialData: T,
    generateFn: (data: T, signal: AbortSignal, ...args: A) => Promise<string>,
    validateFn: (data: T) => Record<string, string>
) {
    const [data, setData] = useState<T>(initialData);
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const handleGenerate = async (onAfterGenerate?: () => void, ...args: A) => {
        setApiError('');
        const errors = validateFn(data);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        // Abort any previous in-flight request
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const { signal } = abortRef.current;

        setIsGenerating(true);
        setResult('');

        if (window.innerWidth < 1024) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        try {
            const text = await generateFn(data, signal, ...args);
            setResult(text);
        } catch (e: unknown) {
            // Silently ignore aborted requests
            if (e instanceof DOMException && e.name === 'AbortError') return;
            if ((e as { name?: string })?.name === 'AbortError') return;

            const message = e instanceof Error ? e.message : 'Произошла ошибка при генерации документа. Пожалуйста, попробуйте еще раз.';
            setApiError(message);

            if (window.innerWidth < 1024) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setIsGenerating(false);

            if (data.turnstileToken) {
                setData(prev => ({ ...prev, turnstileToken: undefined }));
            }

            if (onAfterGenerate) {
                onAfterGenerate();
            }
        }
    };

    const clearFieldError = (field: keyof T | string) => {
        if (fieldErrors[field as string]) {
            setFieldErrors(prev => ({ ...prev, [field as string]: '' }));
        }
    };

    const handleCopy = useCallback(async () => {
        const success = await copyToClipboard(result);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [result]);

    return {
        data,
        setData,
        isGenerating,
        result,
        copied,
        fieldErrors,
        apiError,
        handleGenerate,
        clearFieldError,
        handleCopy
    };
}
