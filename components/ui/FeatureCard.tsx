import { useNavigate } from 'react-router-dom';
import { ArrowRight } from '../icons';
import { preloadRoute } from '../../utils/preload';

const ACCENT_STYLES = {
    blue: {
        hover: 'hover:shadow-[0_8px_30px_rgba(79,172,254,0.15)]',
        gradient: 'from-accent-blue/10',
        iconBg: 'group-hover:bg-accent-blue/20',
        iconColor: 'text-accent-blue',
    },
    purple: {
        hover: 'hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)]',
        gradient: 'from-accent-purple/10',
        iconBg: 'group-hover:bg-accent-purple/20',
        iconColor: 'text-accent-purple',
    },
    cyan: {
        hover: 'hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)]',
        gradient: 'from-accent-cyan/10',
        iconBg: 'group-hover:bg-accent-cyan/20',
        iconColor: 'text-accent-cyan',
    },
} as const;

type FeatureAccent = keyof typeof ACCENT_STYLES;

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    accent: FeatureAccent;
    delay: string;
}

export function FeatureCard({ title, description, icon, path, accent, delay }: FeatureCardProps) {
    const navigate = useNavigate();
    const s = ACCENT_STYLES[accent];

    return (
        <button
            onClick={() => navigate(path)}
            onMouseEnter={() => preloadRoute(path)}
            className={`real-glass group relative rounded-[2.5rem] p-8 text-left hover:-translate-y-2 ${s.hover} animate-slide-up overflow-hidden opacity-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg active:scale-[0.98]`}
            style={{ animationDelay: delay }}
        >
            <div
                className={`absolute inset-0 bg-gradient-to-br ${s.gradient} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
            ></div>
            <div className="relative z-10">
                <div className="mb-8 flex items-center justify-between">
                    <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${s.iconBg} transition-colors duration-500`}
                    >
                        {icon}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-colors duration-300 group-hover:bg-white group-hover:text-app-bg">
                        <ArrowRight className="h-5 w-5" />
                    </div>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-white">{title}</h3>
                <p className="leading-relaxed text-slate-400">{description}</p>
            </div>
        </button>
    );
}
