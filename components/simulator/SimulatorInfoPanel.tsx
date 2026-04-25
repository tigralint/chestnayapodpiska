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
        <section className="space-y-6 lg:sticky lg:top-32 order-2 lg:order-1 opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="real-glass-panel p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-cyan to-accent-blue opacity-50"></div>

                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent-cyan mb-6 border border-white/10 shadow-inner">
                    <Target className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 key={`title-${currentLevel.id}-${currentStepIdx}`} className="text-3xl font-extrabold text-white mb-3 tracking-tight animate-fade-in">
                    {Array.isArray(currentLevel.title) ? currentLevel.title[currentStepIdx] : currentLevel.title}
                </h2>
                <p key={`desc-${currentLevel.id}-${currentStepIdx}`} className="text-lg text-slate-300 leading-relaxed mb-6 font-medium animate-fade-in">
                    {Array.isArray(currentLevel.description) ? currentLevel.description[currentStepIdx] : currentLevel.description}
                </p>

                <div className={`transition-all duration-500 overflow-hidden rounded-[1.5rem] ${feedback !== 'idle' ? 'max-h-64 opacity-100 border' : 'max-h-0 opacity-0 border-transparent'} ${feedback === 'hit' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`} role="alert" aria-live="polite">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            {feedback === 'hit' ? (
                                <CheckCircle className="w-7 h-7 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pop-in" />
                            ) : (
                                <Target className="w-7 h-7 text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] animate-pop-in" />
                            )}
                            <h3 className={`font-bold text-lg ${feedback === 'hit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {feedback === 'hit' ? 'Точно в цель!' : 'Осторожно, это ловушка!'}
                            </h3>
                        </div>
                        <p className="text-[15px] text-slate-200 leading-relaxed animate-fade-in">{currentLevel.learningText}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
