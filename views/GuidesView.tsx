import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, CheckCircle, FileText, ExternalLink } from '../components/icons';
import { GUIDES_DB } from '../data/guides';
import { SEO } from '../components/ui/SEO';

export default function GuidesView() {
  const navigate = useNavigate();
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState<'form' | 'success'>('form');

  const handleSubmitPattern = (e: React.FormEvent) => {
    e.preventDefault();
    setModalState('success');
    setTimeout(() => {
      setShowModal(false);
      setTimeout(() => setModalState('form'), 500); // Reset after closing
    }, 2500);
  };

  const selectedGuide = GUIDES_DB.find(g => g.id === selectedGuideId);

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12 relative min-h-screen">
      <SEO
        title="База знаний: инструкции по возврату средств | ЧестнаяПодписка"
        description="Пошаговые инструкции и лайфхаки по возврату денег от популярных сервисов (Яндекс Плюс, ivi, Skillbox, GeekBrains и др.). Умный поиск по базе."
      />
      <div className="max-w-6xl mx-auto w-full">

        <div className="md:hidden flex items-center mb-8 mt-2 opacity-0 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white bg-white/10 rounded-full mr-4 active:scale-95 transition-transform" aria-label="Вернуться на главную">
            <ChevronLeft />
          </button>
          <h1 className="text-2xl font-bold text-white">База знаний</h1>
        </div>

        <div className="hidden md:block mb-12 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white font-semibold text-sm flex items-center transition-colors mb-6 active:scale-95">
            <ChevronLeft className="w-5 h-5 mr-1" /> Вернуться
          </button>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Навигатор по отпискам</h1>
          <p className="text-slate-400 text-lg">Компании прячут кнопки отмены. Мы нашли все короткие пути сквозь дарк-паттерны.</p>
        </div>

        {/* --- GRID OF CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8 w-full">

          {/* Add Pattern Button (First Item) */}
          <div
            className="real-glass-panel rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 hover:border-accent-cyan/30 active:scale-[0.98] transition-all duration-300 border border-dashed border-white/20 group opacity-0 animate-slide-up h-[140px]"
            style={{ animationDelay: '100ms' }}
            onClick={() => setShowModal(true)}
          >
            <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mb-3 group-hover:scale-110 transition-transform duration-300 border border-accent-cyan/20">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Новая уловка?</h3>
            <p className="text-xs text-slate-400">Сообщить о дарк-паттерне</p>
          </div>

          {/* Guide Cards */}
          {GUIDES_DB.map((guide, idx) => (
            <button
              key={guide.id}
              onClick={() => setSelectedGuideId(guide.id)}
              className="text-left real-glass-panel rounded-2xl p-5 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 active:scale-[0.98] h-[140px] flex flex-col justify-between group opacity-0 animate-slide-up"
              style={{ animationDelay: `${150 + idx * 30}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${guide.iconColor} shadow-[0_0_10px_currentColor] transition-transform duration-300 group-hover:scale-125`}></div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg group-hover:text-accent-cyan transition-colors leading-tight">{guide.service}</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wider">{guide.steps.length} шагов отписки</p>
              </div>
            </button>
          ))}
        </div>

        {/* --- CENTERED MODAL FOR GUIDE DETAILS --- */}
        {selectedGuide && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-app-bg/30 backdrop-blur-xl animate-fade-in transition-opacity"
              onClick={() => setSelectedGuideId(null)}
            ></div>

            {/* Modal Panel */}
            <div className="relative w-full max-w-2xl bg-[#0a0f1c] border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-pop-in flex flex-col max-h-[90vh] overflow-hidden">

              {/* Abstract Watermark */}
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-accent-cyan/5 rounded-full blur-[80px] pointer-events-none"></div>

              {/* Header */}
              <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#0a0f1c]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${selectedGuide.iconColor} bg-opacity-20 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]`}>
                    <span className="drop-shadow-md text-white">{selectedGuide.service.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{selectedGuide.service}</h2>
                    <p className="text-sm text-slate-400">Инструкция по отмене</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGuideId(null)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* Content (Scrollable) */}
              <div
                className="flex-1 overflow-y-auto p-6 md:p-8 relative z-20 custom-scrollbar overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Пошаговый алгоритм</h3>
                  <div className="relative border-l border-white/10 ml-4 space-y-8">
                    {selectedGuide.steps.map((step, stepIdx) => {
                      const isDarkPattern = step.includes('ДАРК-ПАТТЕРН') || step.includes('ВНИМАНИЕ');

                      return (
                        <div key={stepIdx} className="ml-8 relative">
                          {/* Timeline Dot */}
                          <div className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-[48.5px] top-0 ring-4 ring-[#0a0f1c] text-[12px] font-bold shadow-lg transition-transform hover:scale-110 ${isDarkPattern ? 'bg-orange-500 text-white shadow-orange-500/50' : 'bg-white/10 border border-white/20 text-slate-300'}`}>
                            {stepIdx + 1}
                          </div>

                          {/* Step Content */}
                          <div className={`p-5 rounded-2xl border transition-colors ${isDarkPattern ? 'bg-orange-500/5 border-orange-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                            {isDarkPattern && (
                              <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                Уловка
                              </div>
                            )}
                            <p className={`text-[15px] leading-relaxed ${isDarkPattern ? 'text-orange-100 font-medium' : 'text-slate-300'}`}>
                              {step}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Banner */}
                {selectedGuide.contactEmail && (
                  <div className="mb-2 bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                    <span className="text-slate-400 text-sm mb-2">Официальный контакт поддержки:</span>
                    <a href={`mailto:${selectedGuide.contactEmail}`} className="font-mono text-lg font-bold text-accent-cyan hover:text-white transition-colors tracking-wide flex items-center gap-2">
                      {selectedGuide.contactEmail}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Footer Action */}
              <div className="p-6 md:p-8 border-t border-white/5 bg-[#0a0f1c] shrink-0">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-400">Нет кнопки отмены или поддержка игнорирует?</p>
                </div>
                <button
                  onClick={() => navigate(selectedGuide.type === 'course' ? `/course/${encodeURIComponent(selectedGuide.service)}` : `/claim/${encodeURIComponent(selectedGuide.service)}`)}
                  className="w-full py-4 bg-button-glow text-app-bg font-bold rounded-2xl shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] active:scale-[0.98] transition-all duration-300 flex justify-center items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Сгенерировать досудебную претензию
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Global Modal Overlay (For New Pattern Form) */}
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-app-bg/30 backdrop-blur-xl" onClick={() => setShowModal(false)}></div>

            <div className="w-full max-w-md real-glass-panel rounded-[2.5rem] p-8 relative z-10 border border-white/20 shadow-2xl animate-pop-in">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Закрыть модальное окно"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              {modalState === 'form' ? (
                <form onSubmit={handleSubmitPattern}>
                  <div className="w-12 h-12 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mb-6 border border-accent-cyan/20">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Сообщить об уловке</h2>
                  <p className="text-slate-400 text-sm mb-2">Помогите нам пополнить базу. Мы проверим сервис и добавим инструкцию.</p>
                  <p className="text-amber-400/80 text-xs mb-6">⚠ Модуль сбора данных в разработке — информация пока не сохраняется на сервере.</p>

                  <div className="space-y-4 mb-8">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Название сервиса"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <textarea
                        required
                        placeholder="Как они прячут кнопку? Опишите кратко..."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50 outline-none transition-all resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-button-glow text-app-bg font-bold rounded-2xl active:scale-95 transition-transform"
                  >
                    Отправить информацию
                  </button>
                </form>
              ) : (
                <div className="text-center py-8 animate-pop-in">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Принято!</h2>
                  <p className="text-slate-400 text-sm">Спасибо за ваш вклад. Юристы проекта скоро разберут этот сервис.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}