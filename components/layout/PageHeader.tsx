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

type PageHeaderThemeKey = keyof typeof PAGE_HEADER_THEMES;

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
            <div className="hidden animate-slide-up opacity-0 md:block" style={{ animationDelay: '50ms' }}>
                <button
                    onClick={() => navigate('/')}
                    className={`mb-6 flex items-center text-sm font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 active:scale-95 ${t.focusRing} -ml-2 rounded-lg px-2 py-1`}
                >
                    <ChevronLeft className="mr-1 h-5 w-5" /> Вернуться
                </button>
                <h1 className="mb-4 text-3xl font-extrabold text-white lg:text-4xl">{title}</h1>
                <p className="text-base leading-relaxed text-slate-400">{subtitle}</p>
            </div>

            <div
                className="mb-6 flex animate-fade-in items-center opacity-0 md:hidden"
                style={{ animationDelay: '50ms' }}
            >
                <button
                    onClick={() => navigate('/')}
                    className={`-ml-2 mr-4 rounded-full bg-white/10 p-2 text-white transition-transform focus-visible:outline-none focus-visible:ring-2 active:scale-95 ${t.focusRing}`}
                >
                    <ChevronLeft />
                </button>
                <h1 className="text-xl font-bold text-white">{title}</h1>
            </div>
        </>
    );
}
