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
        <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            {!isUser && (
                <div className="w-8 h-8 shrink-0 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mt-1 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                    <BotIcon />
                </div>
            )}
            <div className={`max-w-[85%] rounded-2xl p-3.5 text-[13px] sm:text-sm shadow-md ${
                isUser
                    ? 'bg-gradient-to-br from-accent-cyan to-cyan-400 text-slate-900 rounded-tr-sm shadow-cyan-500/20'
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/5 text-slate-200 rounded-tl-sm shadow-black/20 prose prose-invert prose-sm prose-p:leading-relaxed prose-a:text-accent-cyan'
            }`}>
                {isUser && message.imagePreview && (
                    <img src={message.imagePreview} alt="Прикреплённое изображение" className="rounded-lg mb-2 max-h-32 w-auto" />
                )}
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
}
