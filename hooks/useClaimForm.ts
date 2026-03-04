import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

export function useClaimForm<T>(
    initialData: T,
    generateFn: (data: T, ...args: any[]) => Promise<string>,
    validateFn: (data: T) => Record<string, string>
) {
    const [data, setData] = useState<T>(initialData);
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState('');

    const handleGenerate = async (onAfterGenerate?: () => void, ...args: any[]) => {
        setApiError('');
        const errors = validateFn(data);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsGenerating(true);
        setResult('');

        if (window.innerWidth < 1024) {
            setTimeout(() => {
                document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }

        try {
            const text = await generateFn(data, ...args);
            setResult(text);
        } catch (e: any) {
            setApiError(e.message || 'Произошла ошибка при генерации документа. Пожалуйста, попробуйте еще раз.');

            if (window.innerWidth < 1024) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setIsGenerating(false);

            // Сбрасываем токен в состоянии, так как он одноразовый
            if ((data as any).turnstileToken) {
                setData(prev => ({ ...prev, turnstileToken: undefined }));
            }

            // Даем возможность вызвать сброс виджета Turnstile
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

    const handleCopy = async () => {
        const success = await copyToClipboard(result);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
