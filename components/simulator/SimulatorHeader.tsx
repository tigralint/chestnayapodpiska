import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../icons';

interface SimulatorHeaderProps {
    currentLevelIdx: number;
    totalLevels: number;
    progress: number;
}

export function SimulatorHeader({ currentLevelIdx, totalLevels, progress }: SimulatorHeaderProps) {
    const navigate = useNavigate();

    return (
        <section className="relative z-20 mb-8 animate-slide-up opacity-0" style={{ animationDelay: '50ms' }}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="-ml-2 mr-4 rounded-full bg-white/10 p-2 text-white outline-none transition-all hover:bg-white/20 focus:ring-2 focus:ring-white/30 active:scale-95"
                        aria-label="Назад к дашборду"
                    >
                        <ChevronLeft />
                    </button>
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                            Тренажер самообороны
                        </h1>
                    </div>
                </div>
                <div className="hidden rounded-full border border-accent-pink/20 bg-accent-pink/10 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-accent-pink sm:block">
                    Уровень {currentLevelIdx + 1} / {totalLevels}
                </div>
            </div>

            {/* Progress Bar */}
            <div
                className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-white/5 shadow-inner"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="h-full bg-gradient-to-r from-accent-purple to-accent-pink shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-2 flex items-center justify-end sm:hidden">
                <span className="text-xs font-bold uppercase tracking-widest text-accent-pink">
                    Уровень {currentLevelIdx + 1} / {totalLevels}
                </span>
            </div>
        </section>
    );
}
