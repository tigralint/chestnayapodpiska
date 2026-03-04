import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../icons';

const PAGE_HEADER_THEMES = {
    cyan: {
        focusRing: 'focus-visible:ring-accent-cyan/50',
    },
    purple: {
        focusRing: 'focus-visible:ring-accent-purple/50',
    },
} as const;

export type PageHeaderThemeKey = keyof typeof PAGE_HEADER_THEMES;

interface PageHeaderProps {
    title: string;
    subtitle: string;
    theme: PageHeaderThemeKey;
}

export function PageHeader({ title, subtitle, theme }: PageHeaderProps) {
    const navigate = useNavigate();
    const t = PAGE_HEADER_THEMES[theme];
    return (
        <>
            <div className="hidden md:block opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
                <button onClick={() => navigate('/')} className={`text-slate-400 hover:text-white font-semibold text-sm flex items-center transition-colors mb-6 active:scale-95 focus-visible:outline-none focus-visible:ring-2 ${t.focusRing} rounded-lg px-2 py-1 -ml-2`}>
                    <ChevronLeft className="w-5 h-5 mr-1" /> Вернуться
                </button>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">{title}</h1>
                <p className="text-slate-400 text-base leading-relaxed">
                    {subtitle}
                </p>
            </div>

            <div className="md:hidden flex items-center mb-6 opacity-0 animate-fade-in" style={{ animationDelay: '50ms' }}>
                <button onClick={() => navigate('/')} className={`p-2 -ml-2 text-white bg-white/10 rounded-full mr-4 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 ${t.focusRing}`}>
                    <ChevronLeft />
                </button>
                <h1 className="text-xl font-bold text-white">{title}</h1>
            </div>
        </>
    );
}

