import { useState, useEffect, useRef, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Turnstile } from '@marsidev/react-turnstile';
import { stripHtml } from 'string-strip-html';

type Message = {
    role: 'user' | 'model';
    text: string;
    id: string;
};

// SVG Icons
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
);

export function LegalBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [limits, setLimits] = useState<{ remaining: number; limit: number } | null>(null);
    const [isRequestingLimit, setIsRequestingLimit] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Prefix for localStorage
    const STORAGE_KEY = 'chestnayapodpiska_chat_history';
    const EXPIRY_HOURS = 24;

    // Load history on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const { timestamp, data } = JSON.parse(stored);
                // Check if expired
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

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        // Save to localStorage
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: messages
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
                        setLimits({ remaining: d.remaining, limit: d.limit || 10 });
                    }
                })
                .catch(console.error);
        }
    }, [isOpen]);

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

    // Strip <think> and <|channel>thought tags from text (support various reasoning models)
    const cleanText = (text: string) => {
        // Models like Gemma 4 deeply nest these shadow tags. We use a robust HTML stripper
        // to wipe all tags out to strictly expose just the inner text, ignoring weird artifacts.
        let cleaned = text.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '');
        cleaned = cleaned.replace(/<\|channel>thought[\s\S]*?(<channel\|>|$)/gi, '');
        // Strip out any remaining rogue tags completely
        cleaned = stripHtml(cleaned).result;
        return cleaned.trim();
    };

    // Remove markdown links like [Text](URL) returning just Text inside Grounding contexts
    // But react-markdown handles standard links nicely.

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        // Turnstile check
        if (!captchaToken) {
            setErrorMsg('Пожалуйста, подождите проверку капчи.');
            return;
        }

        const userMsg: Message = { role: 'user', text: input.trim(), id: Date.now().toString() };
        const newHistory = [...messages, userMsg];

        setMessages(newHistory);
        setInput('');
        setIsLoading(true);
        setErrorMsg(null);

        // Create an empty bot message that we will stream into
        const botMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { role: 'model', text: '', id: botMsgId }]);

        try {
            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newHistory,
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

                    // keep the last incomplete chunk in the buffer
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(trimmedLine.slice(6));
                                const parts = data.candidates?.[0]?.content?.parts || [];
                                const newText = parts.map((p: { text?: string }) => p.text).join('');

                                if (newText) {
                                    fullText += newText;
                                    setMessages((prev) =>
                                        prev.map(m => m.id === botMsgId ? { ...m, text: fullText } : m)
                                    );
                                }
                            } catch (e) {
                                // If parsing fails, just ignore and let it log, the text might be corrupted
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
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50">
            {/* The Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[calc(100vw-2rem)] md:w-96 max-w-sm h-[500px] max-h-[70vh] flex flex-col bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(6,182,212,0.15)] animate-slide-up origin-bottom-right ring-1 ring-white/10">

                    {/* Header */}
                    <div className="flex bg-gradient-to-r from-accent-cyan/10 to-transparent border-b border-white/5 px-5 py-4 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-cyan/20 to-blue-500/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                <BotIcon />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-[15px] tracking-wide text-shadow-neon">Юрист-Ассистент</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                    <p className="text-[11px] text-emerald-400/90 font-medium">
                                        {limits ? `Доступно запросов: ${limits.remaining}/${limits.limit}` : 'Система онлайн'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleClearChat}
                                className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                                title="Очистить чат"
                            >
                                <TrashIcon />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors p-1"
                            >
                                <XIcon />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 mt-10 text-sm">
                                <div className="p-3 bg-white/5 rounded-2xl inline-block mt-3 border border-white/5">
                                    <BotIcon />
                                </div>
                                <p className="mt-3 text-white font-medium text-[15px]">Юридический ИИ-ассистент</p>
                                <p className="mt-1.5 opacity-70">Задайте мне вопрос о возврате за курсы или скрытые подписки.</p>
                                {limits && (
                                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                        <span className="text-[11px] font-medium tracking-wide uppercase">Осталось запросов: {limits.remaining}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {messages.map((msg) => {
                            const isUser = msg.role === 'user';
                            const cleanTextValue = cleanText(msg.text);

                            // While generating, it could be empty
                            if (!isUser && !cleanTextValue && isLoading) {
                                return (
                                    <div className="flex gap-2 isolate">
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                                            <BotIcon />
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/5 rounded-2xl rounded-tl-sm p-3.5 text-[13px] text-slate-200 shadow-md">
                                            <div className="flex gap-1 items-center h-4">
                                                <span className="w-1.5 h-1.5 bg-accent-cyan/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-accent-cyan/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-accent-cyan/60 rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // Don't render empty finished messages
                            if (!cleanTextValue) return null;

                            return (
                                <div key={msg.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    {!isUser && (
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mt-1 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                                            <BotIcon />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-[13px] sm:text-sm shadow-md ${isUser
                                            ? 'bg-gradient-to-br from-accent-cyan to-cyan-400 text-slate-900 rounded-tr-sm shadow-cyan-500/20'
                                            : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/5 text-slate-200 rounded-tl-sm shadow-black/20 prose prose-invert prose-sm prose-p:leading-relaxed prose-a:text-accent-cyan'
                                        }`}>
                                        {isUser ? (
                                            <span className="whitespace-pre-wrap">{cleanTextValue}</span>
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {cleanTextValue}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="bg-rose-500/10 border-t border-rose-500/20 px-4 py-3 flex flex-col gap-2">
                            <span className="text-xs text-rose-400 text-center">{errorMsg}</span>
                            {(errorMsg.includes('лимит') || errorMsg.includes('много')) && (
                                <button
                                    onClick={handleRequestMoreLimits}
                                    disabled={isRequestingLimit}
                                    className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-xs py-1.5 px-3 rounded-lg w-full font-medium"
                                >
                                    {isRequestingLimit ? "Отправка..." : "Запросить больше запросов"}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3 border-t border-white/5 bg-slate-950/60 backdrop-blur-md">
                        <form onSubmit={handleSubmit} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                placeholder={isLoading ? "Ассистент печатает..." : "Опишите вашу ситуацию..."}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-accent-cyan/50 focus:bg-white/10 transition-all disabled:opacity-50 shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim() || !captchaToken}
                                className="bg-gradient-to-br from-accent-cyan to-cyan-400 text-slate-900 w-[50px] flex items-center justify-center rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:hover:shadow-none transition-all duration-300"
                            >
                                <SendIcon />
                            </button>
                        </form>

                        {/* Hidden Turnstile for Bot Protection */}
                        <div className="hidden">
                            <Turnstile
                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} // Test fallback
                                onSuccess={(token) => setCaptchaToken(token)}
                                onError={() => setErrorMsg('Не удалось загрузить капчу')}
                                options={{ action: 'chat', theme: 'dark' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button (Hidden when open) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all duration-300 bg-accent-cyan text-slate-900 w-14 h-14 rounded-full hover:scale-110 hover:shadow-cyan-500/40"
                >
                    <BotIcon />
                </button>
            )}
        </div>
    );
}
