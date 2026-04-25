import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../icons';

interface ViewHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    badge?: { text: string; color: string; bgColor: string; borderColor: string };
}

export function ViewHeader({ title, subtitle, icon, badge }: ViewHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="mb-8 md:mb-12 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="md:text-slate-400 md:hover:text-white md:font-semibold text-sm flex items-center transition-colors mb-4 md:mb-6 p-2 md:p-0 -ml-2 md:ml-0 text-white bg-white/10 md:bg-transparent rounded-full md:rounded-none active:scale-95 md:active:scale-100"
                aria-label="Вернуться на главную"
            >
                <ChevronLeft className="w-5 h-5 md:mr-1" />
                <span className="hidden md:inline">Вернуться</span>
            </button>

            {/* Single h1 with responsive styling */}
            <h1 className="text-2xl md:text-4xl font-bold md:font-extrabold text-white md:mb-3 tracking-tight flex items-center gap-4">
                <span className="hidden md:inline">{icon}</span>
                {title}
            </h1>

            {subtitle && <p className="hidden md:block text-slate-400 text-lg">{subtitle}</p>}

            {badge && (
                <div className="mt-2 md:mt-3">
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${badge.color} ${badge.bgColor} px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border ${badge.borderColor}`}>{badge.text}</span>
                </div>
            )}
        </div>
    );
}
