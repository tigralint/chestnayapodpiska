import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../icons';

interface SimulatorHeaderProps {
    currentLevelIdx: number;
    totalLevels: number;
    score: number;
    progress: number;
}

export function SimulatorHeader({ currentLevelIdx, totalLevels, score, progress }: SimulatorHeaderProps) {
    const navigate = useNavigate();

    return (
        <section className="mb-8 relative z-20 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 -ml-2 text-white bg-white/10 rounded-full mr-4 hover:bg-white/20 active:scale-95 transition-all focus:ring-2 focus:ring-white/30 outline-none"
                        aria-label="Назад к дашборду"
                    >
                        <ChevronLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            Тренажер самообороны
                        </h1>
                    </div>
                </div>
                <div className="text-sm font-bold text-accent-pink bg-accent-pink/10 px-4 py-1.5 rounded-full border border-accent-pink/20 uppercase tracking-widest hidden sm:block">
                    Уровень {currentLevelIdx + 1} / {totalLevels}
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20">
                    <span className="text-emerald-300" aria-hidden="true">✓</span> {score}/{totalLevels}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div
                    className="h-full bg-gradient-to-r from-accent-purple to-accent-pink transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="sm:hidden mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-accent-pink uppercase tracking-widest">
                    Уровень {currentLevelIdx + 1} / {totalLevels}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                    ✓ {score}/{totalLevels}
                </span>
            </div>
        </section>
    );
}
