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

export type FeatureAccent = keyof typeof ACCENT_STYLES;

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
            className={`group relative text-left real-glass rounded-[2.5rem] p-8 hover:-translate-y-2 ${s.hover} active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden opacity-0 animate-slide-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg`}
            style={{ animationDelay: delay }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${s.iconBg} transition-colors duration-500`}>
                        {icon}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-app-bg transition-colors duration-300">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{description}</p>
            </div>
        </button>
    );
}
