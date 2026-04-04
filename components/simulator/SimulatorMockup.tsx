import type { Level } from '../../data/simulator-levels';
import type { FeedbackState } from '../../hooks/useSimulator';

interface SimulatorMockupProps {
    currentLevel: Level;
    currentStepIdx: number;
    feedback: FeedbackState;
    handleHit: () => void;
    handleMiss: () => void;
}

export function SimulatorMockup({ currentLevel, currentStepIdx, feedback, handleHit, handleMiss }: SimulatorMockupProps) {
    return (
        <section className="relative flex justify-center perspective-[1000px] order-1 lg:order-2 opacity-0 animate-slide-up" style={{ animationDelay: '250ms' }} aria-label="Интерактивный экран">
            <div className={`relative w-full max-w-[320px] sm:max-w-sm transition-all duration-300 ease-in-out transform-gpu mx-auto ${feedback === 'miss' ? 'animate-shake' : ''}`}>

                {/* Overlay glow effects based on feedback */}
                <div className={`absolute inset-[-40px] rounded-[4rem] blur-[60px] transition-opacity duration-700 pointer-events-none z-0 ${feedback === 'hit' ? 'bg-emerald-500/30 opacity-100' : feedback === 'miss' ? 'bg-red-500/30 opacity-100' : 'opacity-0'}`}></div>

                {/* Device Frame */}
                <div className={`relative z-10 p-3 rounded-[3rem] transition-all duration-500 border-[8px] shadow-2xl ${feedback === 'hit' ? 'border-emerald-500/50 bg-emerald-900/10' : feedback === 'miss' ? 'border-red-500/50 bg-red-900/10' : 'border-slate-800 bg-[#0a0a0a]'}`}>

                    {/* iPhone-style Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-10 h-1 bg-white/10 rounded-full"></div>
                    </div>

                    <div key={currentLevel.id} className="pointer-events-auto overflow-hidden rounded-[2rem] bg-black aspect-[9/19] flex flex-col relative">
                        {currentLevel.renderMockUI(handleHit, handleMiss, currentStepIdx)}
                    </div>

                    {/* Home indicator */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full z-50"></div>
                </div>

                {/* Click Shield while animating */}
                {feedback !== 'idle' && <div className="absolute inset-0 z-50 cursor-not-allowed rounded-[3rem]"></div>}
            </div>
        </section>
    );
}
