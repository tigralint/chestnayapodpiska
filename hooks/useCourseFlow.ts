// hooks/useCourseFlow.ts
import { useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CourseData } from '../types';
import { generateCourseClaim } from '../services/geminiService';
import { downloadWordDoc } from '../utils/downloadWord';
import { useClaimForm } from './useClaimForm';

export function useCourseFlow() {
    const { service } = useParams<{ service?: string }>();
    const prefilledService = service ? decodeURIComponent(service) : '';

    const {
        data, setData,
        isGenerating, result, copied,
        fieldErrors, apiError,
        handleGenerate, clearFieldError, handleCopy
    } = useClaimForm<CourseData, [number]>(
        {
            courseName: prefilledService,
            totalCost: 100000,
            percentCompleted: 10,
            tone: 'soft',
            hasPlatformAccess: true,
            hasConsultations: false,
            hasCertificate: false
        },
        (data: CourseData, refund: number) => generateCourseClaim(data, refund),
        (d) => {
            const errors: Record<string, string> = {};
            if (!d.courseName.trim()) errors.courseName = 'Укажите название школы или курса';
            if (!d.totalCost || isNaN(d.totalCost) || d.totalCost <= 0) errors.totalCost = 'Укажите корректную стоимость курса (> 0)';
            return errors;
        }
    );

    const calculatedRefund = useMemo(
        () => Math.max(0, data.totalCost - (data.totalCost * (data.percentCompleted / 100))),
        [data.totalCost, data.percentCompleted]
    );

    const turnstileRef = useRef<any>(null);

    const handleSubmit = () => {
        handleGenerate(() => turnstileRef.current?.reset(), calculatedRefund);
    };

    const handleDownloadWord = useCallback(() => {
        const safeName = data.courseName.replace(/[^a-zа-я0-9]/gi, '_');
        downloadWordDoc(
            `Уведомление_о_расторжении_${safeName}`,
            "Руководству образовательной платформы",
            data.courseName,
            "_________________________ (Email / Паспорт: _________________)",
            "ПРЕТЕНЗИЯ",
            "об одностороннем расторжении договора и возврате денежных средств",
            result
        );
    }, [data.courseName, result]);

    return {
        data, setData,
        isGenerating, result, copied,
        fieldErrors, apiError,
        clearFieldError, handleCopy,
        handleSubmit, handleDownloadWord,
        calculatedRefund, turnstileRef,
        prefilledService
    };
}
