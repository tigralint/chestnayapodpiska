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
        <div className="mb-8 animate-slide-up opacity-0 md:mb-12" style={{ animationDelay: '50ms' }}>
            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="-ml-2 mb-4 flex items-center rounded-full bg-white/10 p-2 text-sm text-white transition-colors active:scale-95 md:mb-6 md:ml-0 md:rounded-none md:bg-transparent md:p-0 md:font-semibold md:text-slate-400 md:hover:text-white md:active:scale-100"
                aria-label="Вернуться на главную"
            >
                <ChevronLeft className="h-5 w-5 md:mr-1" />
                <span className="hidden md:inline">Вернуться</span>
            </button>

            {/* Single h1 with responsive styling */}
            <h1 className="flex items-center gap-4 text-2xl font-bold tracking-tight text-white md:mb-3 md:text-4xl md:font-extrabold">
                <span className="hidden md:inline">{icon}</span>
                {title}
            </h1>

            {subtitle ? <p className="hidden text-lg text-slate-400 md:block">{subtitle}</p> : null}

            {badge ? (
                <div className="mt-2 md:mt-3">
                    <span
                        className={`text-[10px] font-bold uppercase tracking-widest md:text-xs ${badge.color} ${badge.bgColor} rounded-full border px-2.5 py-1 md:px-3 md:py-1.5 ${badge.borderColor}`}
                    >
                        {badge.text}
                    </span>
                </div>
            ) : null}
        </div>
    );
}
