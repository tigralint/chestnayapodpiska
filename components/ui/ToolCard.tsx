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

export type ToolAccent = keyof typeof TOOL_ACCENT_STYLES;

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
            className={`group relative real-glass-panel rounded-[2rem] p-4 flex items-center gap-6 border border-white/5 ${s.hoverBorder} ${s.hoverShadow} transition-all cursor-pointer opacity-0 animate-slide-up text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-cyan/50`}
            onClick={() => navigate(path)}
            onMouseEnter={() => preloadRoute(path)}
            style={{ animationDelay: delay }}
        >
            <div className={`w-16 h-16 rounded-2xl ${s.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>
            <div>
                <h4 className="text-xl font-bold text-white mb-1">{title}</h4>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 ml-auto mr-4 group-hover:text-white transition-colors" />
        </button>
    );
}
