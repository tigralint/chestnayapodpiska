import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { type TurnstileInstance } from '@marsidev/react-turnstile';
import { useChatHistory, type Message } from './useChatHistory';
import { useChatStreaming } from './useChatStreaming';
import { useChatLimits } from './useChatLimits';
import { useChatImage } from './useChatImage';
import { useToastContext } from '../context/AppContext';

// Re-export for backward compatibility
export type { Message };

/**
 * Core logic for the LegalBot chat interface.
 *
 * Composed from four focused sub-hooks:
 * - useChatHistory  — localStorage persistence, message CRUD
 * - useChatStreaming — SSE streaming, AbortController, text cleaning
 * - useChatLimits   — rate-limit polling and reset requests
 * - useChatImage    — image file/paste handling with canvas resize
 */
export function useLegalBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const turnstileRef = useRef<TurnstileInstance>(null);

    // --- Composed sub-hooks ---
    const { messages, setMessages: _setMessages, addMessage, updateMessage, removeMessage, clearHistory } = useChatHistory();
    const { streamResponse, cleanText, abort: _abort, abortRef } = useChatStreaming();
    const { limits, isRequestingLimit, refreshLimits, handleRequestMoreLimits: requestMoreLimitsRaw } = useChatLimits(isOpen);
    const { pendingImage, setPendingImage, handleImageFile, handlePaste, fileInputRef } = useChatImage();
    const { addToast } = useToastContext();

    // Cleanup: abort any in-flight request on unmount
    useEffect(() => {
        const ref = abortRef;
        return () => { ref.current?.abort(); };
    }, [abortRef]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleClearChat = useCallback(() => {
        clearHistory();
        setErrorMsg(null);
        addToast('Чат очищен', 'info');
    }, [clearHistory, addToast]);

    const handleRequestMoreLimits = useCallback(async () => {
        const result = await requestMoreLimitsRaw();
        if (result === 'success') {
            addToast('🚀 Заявка отправлена модератору! Подождите пару минут и попробуйте снова.', 'success');
        } else {
            addToast('Ошибка при отправке заявки.', 'error');
        }
    }, [requestMoreLimitsRaw, addToast]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if ((!input.trim() && !pendingImage) || isLoading) return;

        if (!captchaToken) {
            setErrorMsg('Пожалуйста, подождите проверку капчи.');
            return;
        }

        const userMsg: Message = {
            role: 'user',
            text: input.trim(),
            id: Date.now().toString(),
            ...(pendingImage ? { imagePreview: pendingImage } : {})
        };
        const newHistory = [...messages, userMsg];

        addMessage(userMsg);
        setInput('');
        setPendingImage(null);
        setIsLoading(true);
        setErrorMsg(null);

        const botMsgId = crypto.randomUUID();
        addMessage({ role: 'model', text: '', id: botMsgId });

        try {
            await streamResponse(
                newHistory,
                captchaToken,
                (fullText) => updateMessage(botMsgId, fullText),
            );
        } catch (e: unknown) {
            // Don't show error for intentionally aborted requests
            if (e instanceof DOMException && e.name === 'AbortError') {
                // Silently ignore — user sent a new message or component unmounted
            } else {
                const errMessage = e instanceof Error ? e.message : 'Произошла ошибка связи с ИИ.';
                setErrorMsg(errMessage);
            }
            removeMessage(botMsgId);
        } finally {
            setCaptchaToken(null);
            turnstileRef.current?.reset();
            setIsLoading(false);
            refreshLimits();
        }
    };

    return {
        isOpen, setIsOpen,
        messages, input, setInput,
        isLoading, errorMsg,
        captchaToken, setCaptchaToken,
        limits, isRequestingLimit,
        pendingImage, setPendingImage,
        handleSubmit, handleClearChat,
        handleRequestMoreLimits,
        handleImageFile, handlePaste,
        cleanText,
        messagesEndRef, fileInputRef, turnstileRef,
    };
}
