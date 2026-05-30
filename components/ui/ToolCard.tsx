import { useNavigate } from 'react-router-dom';
import { ArrowRight } from '../icons';
import { preloadRoute } from '../../utils/preload';

const TOOL_ACCENT_STYLES = {
    pink: {
        hoverBorder: 'hover:border-accent-pink/30',
        hoverShadow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]',
        iconBg: 'bg-accent-pink/10',
        iconColor: 'text-accent-pink',
    },
    purple: {
        hoverBorder: 'hover:border-accent-purple/30',
        hoverShadow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]',
        iconBg: 'bg-accent-purple/10',
        iconColor: 'text-accent-purple',
    },
} as const;

type ToolAccent = keyof typeof TOOL_ACCENT_STYLES;

interface ToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    accent: ToolAccent;
    delay: string;
}

export function ToolCard({ title, description, icon, path, accent, delay }: ToolCardProps) {
    const navigate = useNavigate();
    const s = TOOL_ACCENT_STYLES[accent];

    return (
        <button
            type="button"
            className={`real-glass-panel group relative flex items-center gap-6 rounded-[2rem] border border-white/5 p-4 ${s.hoverBorder} ${s.hoverShadow} w-full animate-slide-up cursor-pointer text-left opacity-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-cyan/50`}
            onClick={() => navigate(path)}
            onMouseEnter={() => preloadRoute(path)}
            style={{ animationDelay: delay }}
        >
            <div
                className={`h-16 w-16 rounded-2xl ${s.iconBg} flex flex-shrink-0 items-center justify-center transition-transform duration-500 group-hover:scale-110`}
            >
                {icon}
            </div>
            <div>
                <h4 className="mb-1 text-xl font-bold text-white">{title}</h4>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
            <ArrowRight className="ml-auto mr-4 h-5 w-5 text-slate-600 transition-colors group-hover:text-white" />
        </button>
    );
}
