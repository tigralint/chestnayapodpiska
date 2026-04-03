import { useState, useEffect, useRef, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Turnstile } from '@marsidev/react-turnstile';

type Message = {
    role: 'user' | 'model';
    text: string;
    id: string;
};

// SVG Icons
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
);

export function LegalBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
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

    // Strip <think> tags from text
    const cleanText = (text: string) => {
        return text.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
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
                                const newText = parts.map((p: any) => p.text).join('');
                                
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

        } catch (error) {
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
                <div className="mb-4 w-[calc(100vw-2rem)] md:w-96 max-w-sm h-[500px] max-h-[70vh] flex flex-col real-glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10 animate-slide-up origin-bottom-right">
                    
                    {/* Header */}
                    <div className="flex bg-white/5 border-b border-white/10 p-4 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan">
                                <BotIcon />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Юрист-Ассистент</h3>
                                <p className="text-xs text-slate-400">Gemma 4 AI</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                        >
                            <XIcon />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 mt-10 text-sm">
                                <BotIcon />
                                <p className="mt-3">Привет! Я юридический ИИ-ассистент.</p>
                                <p className="mt-1">Задайте мне вопрос о возврате за курсы или подписки.</p>
                                <p className="mt-4 text-xs text-amber-300/80">Доступно: 10 запросов / сутки</p>
                            </div>
                        )}
                        
                        {messages.map((msg) => {
                            const isUser = msg.role === 'user';
                            const cleanTextValue = cleanText(msg.text);
                            
                            // While generating, it could be empty
                            if (!isUser && !cleanTextValue && isLoading) {
                                return (
                                    <div key={msg.id} className="flex gap-2">
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
                                            <BotIcon />
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-3 text-sm text-slate-200">
                                            <span className="animate-pulse">Думает...</span>
                                        </div>
                                    </div>
                                );
                            }

                            // Don't render empty finished messages
                            if (!cleanTextValue) return null;

                            return (
                                <div key={msg.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    {!isUser && (
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mt-1">
                                            <BotIcon />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                                        isUser 
                                            ? 'bg-accent-cyan text-slate-900 rounded-tr-none' 
                                            : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none prose prose-invert prose-sm prose-p:leading-relaxed prose-a:text-accent-cyan'
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
                        <div className="bg-rose-500/10 border-t border-rose-500/20 px-4 py-2 text-xs text-rose-400 text-center">
                            {errorMsg}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3 border-t border-white/10 bg-black/20">
                        <form onSubmit={handleSubmit} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                placeholder={isLoading ? "Ассистент печатает..." : "Спросить юриста..."}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-accent-cyan transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim() || !captchaToken}
                                className="bg-accent-cyan text-slate-900 w-10 flex items-center justify-center rounded-xl hover:bg-cyan-400 disabled:opacity-50 transition-colors"
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

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all duration-300 ${
                    isOpen 
                        ? 'bg-white/10 text-white w-12 h-12 rounded-full border border-white/20' 
                        : 'bg-accent-cyan text-slate-900 w-14 h-14 rounded-full hover:scale-110 hover:shadow-cyan-500/40'
                }`}
            >
                {isOpen ? <XIcon /> : <BotIcon />}
            </button>
        </div>
    );
}
