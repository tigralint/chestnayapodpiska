import type { Message } from '../../../hooks/useLegalBot';

// SVG Icons
const BotIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
    </svg>
);

const TrashIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

const XIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

interface ChatHeaderProps {
    limits: { remaining: number; limit: number } | null;
    onClear: () => void;
    onClose: () => void;
}

export function ChatHeader({ limits, onClear, onClose }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-accent-cyan/10 to-transparent px-5 py-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-cyan/20 bg-gradient-to-tr from-accent-cyan/20 to-blue-500/10 text-accent-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <BotIcon />
                </div>
                <div>
                    <h3 className="text-shadow-neon text-[15px] font-bold tracking-wide text-white">Юрист-Ассистент</h3>
                    <div className="mt-0.5 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                        <p className="text-[11px] font-medium text-emerald-400/90">
                            {limits ? `Доступно запросов: ${limits.remaining}/${limits.limit}` : 'Система онлайн'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={onClear}
                    className="p-1 text-slate-400 transition-colors hover:text-rose-400"
                    title="Очистить чат"
                >
                    <TrashIcon />
                </button>
                <button onClick={onClose} className="p-1 text-slate-400 transition-colors hover:text-white">
                    <XIcon />
                </button>
            </div>
        </div>
    );
}

// Re-export for other chat components
export { BotIcon };
// Re-export Message type for convenience
export type { Message };
