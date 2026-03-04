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
        <>
            {/* Mobile */}
            <div className="md:hidden flex items-center mb-8 mt-2 opacity-0 animate-fade-in" style={{ animationDelay: '50ms' }}>
                <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white bg-white/10 rounded-full mr-4 active:scale-95 transition-transform" aria-label="Вернуться на главную">
                    <ChevronLeft />
                </button>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                {badge && (
                    <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${badge.color} ${badge.bgColor} px-2.5 py-1 rounded-full border ${badge.borderColor}`}>{badge.text}</span>
                )}
            </div>

            {/* Desktop */}
            <div className="hidden md:block mb-12 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
                <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white font-semibold text-sm flex items-center transition-colors mb-6 active:scale-95" aria-label="Вернуться на главную">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Вернуться
                </button>
                <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight flex items-center gap-4">
                    {icon}
                    {title}
                </h1>
                {subtitle && <p className="text-slate-400 text-lg">{subtitle}</p>}
                {badge && (
                    <div className="mt-3">
                        <span className={`text-xs font-bold uppercase tracking-widest ${badge.color} ${badge.bgColor} px-3 py-1.5 rounded-full border ${badge.borderColor}`}>{badge.text}</span>
                    </div>
                )}
            </div>
        </>
    );
}
