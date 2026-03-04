import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, CheckCircle, Award } from '../components/icons';
import { useSimulator } from '../hooks/useSimulator';

export default function SimulatorView() {
  const navigate = useNavigate();
  const {
    currentLevel,
    currentLevelIdx,
    currentStepIdx,
    feedback,
    score,
    showResult,
    progress,
    handleHit,
    handleMiss,
    reset,
    totalLevels
  } = useSimulator();

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="real-glass-panel rounded-[3rem] p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden shadow-2xl border border-accent-pink/30 animate-pop-in">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-pink/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto bg-accent-pink/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(236,72,153,0.5)] outline-none" tabIndex={0} aria-label="Награда за прохождение">
              <Award className="w-12 h-12 text-accent-pink" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Тренажер пройден!</h2>
            <p className="text-accent-pink font-bold text-xl mb-6">Счет: {score} из {totalLevels}</p>

            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              {score === 10 ? "Идеально! Вы настоящий цифровой ниндзя, корпорациям вас не обмануть." :
                score >= 7 ? "Отличный результат! У вас хороший иммунитет к дарк-паттернам." :
                  "Вам стоит быть внимательнее. Дизайнеры корпораций используют множество уловок."}
            </p>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8 text-left shadow-inner">
              <p className="text-sm text-slate-400 leading-relaxed italic">
                <span className="text-accent-cyan font-bold block mb-1 not-italic">Важно знать:</span> Манипулятивные техники (дарк-паттерны) ограничивают ваше право на свободный выбор. Помните, что доступность отмены и прозрачность условий — признаки добросовестного сервиса. В спорных ситуациях закон о защите прав потребителей помогает восстановить справедливость.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 shadow-sm active:scale-95 focus:ring-2 focus:ring-white/20 outline-none"
                aria-label="Пройти тренажер еще раз"
              >
                Пройти еще раз
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-gradient-to-r from-accent-pink to-accent-purple text-white rounded-2xl font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all active:scale-95 hover:scale-[1.02] focus:ring-2 focus:ring-accent-pink/50 outline-none"
                aria-label="Вернуться на главную страницу"
              >
                Вернуться домой
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12">
      <div className="max-w-5xl mx-auto w-full">

        {/* Header & Progress */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start relative z-10">

          {/* Info Panel */}
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

          {/* Interactive Mockup Panel */}
          <section className="relative flex justify-center perspective-[1000px] order-1 lg:order-2 opacity-0 animate-slide-up" style={{ animationDelay: '250ms' }} aria-label="Интерактивный экран">
            <div className={`relative w-full max-w-[320px] sm:max-w-sm transition-all duration-300 ease-in-out transform-gpu ${feedback === 'miss' ? 'animate-shake' : ''}`}>

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

        </div>
      </div>
    </div>
  );
}
