import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BotIcon, type Message } from './ChatHeader';

interface ChatMessageProps {
    message: Message;
    isLoading: boolean;
    cleanText: (text: string) => string;
}

export function ChatMessage({ message, isLoading, cleanText }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const cleanTextValue = cleanText(message.text);

    // While generating, show bouncing dots
    if (!isUser && !cleanTextValue && isLoading) {
        return (
            <div className="isolate flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                    <BotIcon />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-white/5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-3.5 text-[13px] text-slate-200 shadow-md">
                    <div className="flex h-4 items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-cyan/60 [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-cyan/60 [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-cyan/60"></span>
                    </div>
                </div>
            </div>
        );
    }

    // Don't render empty finished messages
    if (!cleanTextValue) return null;

    return (
        <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            {!isUser && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                    <BotIcon />
                </div>
            )}
            <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-[13px] shadow-md sm:text-sm ${
                    isUser
                        ? 'rounded-tr-sm bg-gradient-to-br from-accent-cyan to-cyan-400 text-slate-900 shadow-cyan-500/20'
                        : 'prose prose-invert prose-sm prose-p:leading-relaxed prose-a:text-accent-cyan rounded-tl-sm border border-white/5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 text-slate-200 shadow-black/20'
                }`}
            >
                {isUser && message.imagePreview && (
                    <img
                        src={message.imagePreview}
                        alt="Прикреплённое изображение"
                        className="mb-2 max-h-32 w-auto rounded-lg"
                    />
                )}
                {isUser ? (
                    <span className="whitespace-pre-wrap">{cleanTextValue}</span>
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanTextValue}</ReactMarkdown>
                )}
            </div>
        </div>
    );
}
