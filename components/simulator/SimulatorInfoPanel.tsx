import { Target, CheckCircle } from '../icons';
import type { Level } from './levels';
import type { FeedbackState } from '../../hooks/useSimulator';

interface SimulatorInfoPanelProps {
    currentLevel: Level;
    currentStepIdx: number;
    feedback: FeedbackState;
}

export function SimulatorInfoPanel({ currentLevel, currentStepIdx, feedback }: SimulatorInfoPanelProps) {
    return (
        <section
            className="order-2 animate-slide-up space-y-6 opacity-0 lg:sticky lg:top-32 lg:order-1"
            style={{ animationDelay: '150ms' }}
        >
            <div className="real-glass-panel relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-accent-cyan to-accent-blue opacity-50"></div>

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent-cyan shadow-inner">
                    <Target className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2
                    key={`title-${currentLevel.id}-${currentStepIdx}`}
                    className="mb-3 animate-fade-in text-3xl font-extrabold tracking-tight text-white"
                >
                    {Array.isArray(currentLevel.title) ? currentLevel.title[currentStepIdx] : currentLevel.title}
                </h2>
                <p
                    key={`desc-${currentLevel.id}-${currentStepIdx}`}
                    className="mb-6 animate-fade-in text-lg font-medium leading-relaxed text-slate-300"
                >
                    {Array.isArray(currentLevel.description)
                        ? currentLevel.description[currentStepIdx]
                        : currentLevel.description}
                </p>

                <div
                    className={`overflow-hidden rounded-[1.5rem] transition-all duration-500 ${feedback !== 'idle' ? 'max-h-64 border opacity-100' : 'max-h-0 border-transparent opacity-0'} ${feedback === 'hit' ? 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`}
                    role="alert"
                    aria-live="polite"
                >
                    <div className="p-6">
                        <div className="mb-3 flex items-center gap-3">
                            {feedback === 'hit' ? (
                                <CheckCircle className="h-7 w-7 animate-pop-in text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                            ) : (
                                <Target className="h-7 w-7 animate-pop-in text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                            )}
                            <h3
                                className={`text-lg font-bold ${feedback === 'hit' ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                                {feedback === 'hit' ? 'Точно в цель!' : 'Осторожно, это ловушка!'}
                            </h3>
                        </div>
                        <p className="animate-fade-in text-[15px] leading-relaxed text-slate-200">
                            {currentLevel.learningText}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
