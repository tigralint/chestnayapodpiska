import { useState, useEffect, useRef, FormEvent } from 'react';
import { type TurnstileInstance } from '@marsidev/react-turnstile';
import { stripHtml } from 'string-strip-html';

export type Message = {
    role: 'user' | 'model';
    text: string;
    id: string;
    imagePreview?: string;
};

const STORAGE_KEY = 'chestnayapodpiska_chat_history';
const EXPIRY_HOURS = 24;

/**
 * Core logic for the LegalBot chat interface.
 * Extracted from the monolithic LegalBot.tsx component for separation of concerns.
 */
export function useLegalBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [limits, setLimits] = useState<{ remaining: number; limit: number } | null>(null);
    const [isRequestingLimit, setIsRequestingLimit] = useState(false);
    const [pendingImage, setPendingImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const turnstileRef = useRef<TurnstileInstance>(null);

    // Load history on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const { timestamp, data } = JSON.parse(stored);
                if (Date.now() - timestamp < EXPIRY_HOURS * 60 * 60 * 1000) {
                    setMessages(data);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (e) {
            console.error('Failed to parse chat history', e);
        }
    }, []);

    // Scroll to bottom + save to localStorage when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        // Save to localStorage (strip image data to prevent PII leakage and localStorage overflow)
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: messages.map(m => ({ ...m, imagePreview: undefined }))
            }));
        }
    }, [messages, isOpen]);

    // Load limits dynamically
    useEffect(() => {
        if (isOpen && !limits) {
            fetch('/api/chatStatus')
                .then(r => r.json())
                .then(d => {
                    if (d && typeof d.remaining === 'number') {
                        setLimits({ remaining: d.remaining, limit: d.limit || 15 });
                    }
                })
                .catch(console.error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    /** Strip <think> and <|channel>thought tags from model output */
    const cleanText = (text: string) => {
        let cleaned = text.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '');
        cleaned = cleaned.replace(/<\|channel>thought[\s\S]*?(<channel\|>|$)/gi, '');
        cleaned = stripHtml(cleaned).result;
        return cleaned.trim();
    };

    const handleClearChat = () => {
        if (confirm("Удалить историю чата?")) {
            setMessages([]);
            localStorage.removeItem(STORAGE_KEY);
            setErrorMsg(null);
        }
    };

    const handleRequestMoreLimits = async () => {
        setIsRequestingLimit(true);
        try {
            const res = await fetch('/api/requestLimit', { method: 'POST' });
            if (res.ok) {
                alert('🚀 Заявка отправлена модератору! Подождите пару минут и попробуйте задать вопрос снова.');
            } else {
                alert('Ошибка при отправке заявки.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsRequestingLimit(false);
        }
    };

    const handleImageFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const MAX = 1024;
                let w = img.width, h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setPendingImage(dataUrl);
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item) continue;
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) handleImageFile(file);
                e.preventDefault();
                return;
            }
        }
    };

    const refreshLimits = () => {
        fetch('/api/chatStatus')
            .then(r => r.json())
            .then(d => {
                if (d && typeof d.remaining === 'number') {
                    setLimits({ remaining: d.remaining, limit: d.limit || 15 });
                }
            })
            .catch(console.error);
    };

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

        setMessages(newHistory);
        setInput('');
        setPendingImage(null);
        setIsLoading(true);
        setErrorMsg(null);

        const botMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { role: 'model', text: '', id: botMsgId }]);

        try {
            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newHistory.map(m => ({
                        role: m.role,
                        text: m.role === 'model' ? cleanText(m.text) : m.text,
                        ...(m.imagePreview ? { image: m.imagePreview.split(',')[1] } : {})
                    })),
                    turnstileToken: captchaToken
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                setErrorMsg(errData.error || 'Ошибка сети. Попробуйте позже.');
                setMessages((prev) => prev.filter(m => m.id !== botMsgId));
                setIsLoading(false);
                return;
            }

            if (!response.body) {
                throw new Error('No readable stream');
            }

            const usedModel = response.headers.get('X-AI-Model');
            if (usedModel) {
                // eslint-disable-next-line no-console
                console.log('%c[LegalBot AI] Activated Model: ' + usedModel, 'color: #0ea5e9; font-weight: bold; background: #0f172a; padding: 4px 8px; border-radius: 4px;');
            }

            const skippedModels = response.headers.get('X-AI-Skip-Reasons');
            if (skippedModels) {
                console.warn('[LegalBot AI] Models skipped before success:', skippedModels);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let fullText = '';
            let buffer = '';

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(trimmedLine.slice(6));
                                const parts = data.candidates?.[0]?.content?.parts || [];
                                const answerParts = parts.filter((p: { text?: string; thought?: boolean }) => !p.thought);
                                const newText = answerParts.map((p: { text?: string }) => p.text).join('');

                                if (newText) {
                                    fullText += newText;
                                    setMessages((prev) =>
                                        prev.map(m => m.id === botMsgId ? { ...m, text: fullText } : m)
                                    );
                                }
                            } catch (e) {
                                console.warn('JSON Parse inner error', e, trimmedLine);
                            }
                        }
                    }
                }
            }

        } catch {
            setErrorMsg('Произошла ошибка связи с ИИ.');
            setMessages((prev) => prev.filter(m => m.id !== botMsgId));
        } finally {
            setCaptchaToken('');
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
