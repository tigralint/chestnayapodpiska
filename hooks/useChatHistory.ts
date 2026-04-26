import { useState, useEffect, useCallback } from 'react';

export type Message = {
    role: 'user' | 'model';
    text: string;
    id: string;
    imagePreview?: string;
};

const STORAGE_KEY = 'chestnayapodpiska_chat_history';
const EXPIRY_HOURS = 24;

/**
 * Manages chat message history with localStorage persistence.
 * Messages are saved without image data to prevent PII leakage and quota overflow.
 */
export function useChatHistory() {
    const [messages, setMessages] = useState<Message[]>([]);

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
        } catch (e: unknown) {
            if (import.meta.env.DEV) console.error('Failed to parse chat history', e);
        }
    }, []);

    // Persist to localStorage whenever messages change (strip images for PII safety)
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: messages.map(m => ({ ...m, imagePreview: undefined }))
            }));
        }
    }, [messages]);

    const clearHistory = useCallback(() => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const addMessage = useCallback((msg: Message) => {
        setMessages(prev => [...prev, msg]);
    }, []);

    const updateMessage = useCallback((id: string, text: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, text } : m));
    }, []);

    const removeMessage = useCallback((id: string) => {
        setMessages(prev => prev.filter(m => m.id !== id));
    }, []);

    return {
        messages,
        setMessages,
        addMessage,
        updateMessage,
        removeMessage,
        clearHistory,
    };
}
