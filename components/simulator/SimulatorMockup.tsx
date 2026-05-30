import type { Level } from './levels';
import type { FeedbackState } from '../../hooks/useSimulator';

interface SimulatorMockupProps {
    currentLevel: Level;
    currentStepIdx: number;
    feedback: FeedbackState;
    handleHit: () => void;
    handleMiss: () => void;
}

export function SimulatorMockup({
    currentLevel,
    currentStepIdx,
    feedback,
    handleHit,
    handleMiss,
}: SimulatorMockupProps) {
    return (
        <section
            className="perspective-[1000px] relative order-1 flex animate-slide-up justify-center opacity-0 lg:order-2"
            style={{ animationDelay: '250ms' }}
            aria-label="Интерактивный экран"
        >
            <div
                className={`relative mx-auto w-full max-w-[320px] transform-gpu transition-all duration-300 ease-in-out sm:max-w-sm ${feedback === 'miss' ? 'animate-shake' : ''}`}
            >
                {/* Overlay glow effects based on feedback */}
                <div
                    className={`pointer-events-none absolute inset-[-40px] z-0 rounded-[4rem] blur-[60px] transition-opacity duration-700 ${feedback === 'hit' ? 'bg-emerald-500/30 opacity-100' : feedback === 'miss' ? 'bg-red-500/30 opacity-100' : 'opacity-0'}`}
                ></div>

                {/* Device Frame */}
                <div
                    className={`relative z-10 rounded-[3rem] border-[8px] p-3 shadow-2xl transition-all duration-500 ${feedback === 'hit' ? 'border-emerald-500/50 bg-emerald-900/10' : feedback === 'miss' ? 'border-red-500/50 bg-red-900/10' : 'border-slate-800 bg-[#0a0a0a]'}`}
                >
                    {/* iPhone-style Notch */}
                    <div className="absolute left-1/2 top-0 z-50 flex h-6 w-32 -translate-x-1/2 items-center justify-center rounded-b-2xl bg-slate-800">
                        <div className="h-1 w-10 rounded-full bg-white/10"></div>
                    </div>

                    <div
                        key={currentLevel.id}
                        className="pointer-events-auto relative flex aspect-[9/19] flex-col overflow-hidden rounded-[2rem] bg-black"
                    >
                        {currentLevel.renderMockUI(handleHit, handleMiss, currentStepIdx)}
                    </div>

                    {/* Home indicator */}
                    <div className="absolute bottom-1 left-1/2 z-50 h-1 w-24 -translate-x-1/2 rounded-full bg-white/20"></div>
                </div>

                {/* Click Shield while animating */}
                {feedback !== 'idle' ? (
                    <div className="absolute inset-0 z-50 cursor-not-allowed rounded-[3rem]"></div>
                ) : null}
            </div>
        </section>
    );
}
