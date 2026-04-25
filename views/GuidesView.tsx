import React, { useState, useEffect, useRef, useCallback, useMemo, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, X, CheckCircle, FileText, ExternalLink, Search } from '../components/icons';
import { GUIDES_DB } from '../data/guides';
import { SEO } from '../components/ui/SEO';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export default function GuidesView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  // Sync state with URL parameter for deep linking
  useEffect(() => {
    if (id) {
      setSelectedGuideId(id);
    }
  }, [id]);

  // Scroll to top and lock body scroll when guide modal opens
  useEffect(() => {
    if (!selectedGuideId) {
      document.body.style.overflow = '';
      return;
    }
    window.scrollTo({ top: 0 });
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [selectedGuideId]);

  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filtering and Search State
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'subscription' | 'course'>('all');

  // Form State
  const [formInput, setFormInput] = useState({
    serviceName: '',
    description: '',
    contactInfo: '',
    turnstileToken: undefined as string | undefined
  });
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // Focus trap refs
  const guideModalRef = useRef<HTMLDivElement>(null);
  const formModalRef = useRef<HTMLDivElement>(null);

  const closeGuide = useCallback(() => {
    setSelectedGuideId(null);
    navigate('/guides', { replace: true });
  }, [navigate]);

  const closeForm = useCallback(() => setShowModal(false), []);

  useFocusTrap(guideModalRef, !!selectedGuideId, closeGuide);
  useFocusTrap(formModalRef, showModal, closeForm);

  const handleSubmitPattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.turnstileToken) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reportPattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInput)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server error');
      }
      
      setModalState('success');
      setFormInput({ serviceName: '', description: '', contactInfo: '', turnstileToken: undefined });
      turnstileRef.current?.reset();
      
      setTimeout(() => {
        setShowModal(false);
        setTimeout(() => setModalState('form'), 500); // Reset after closing
      }, 2500);

    } catch (error: unknown) {
       if (import.meta.env.DEV) console.error(error);
       const message = error instanceof Error ? error.message : 'Ошибка отправки';
       alert(message === 'Server error' ? "Не удалось отправить форму. Пожалуйста, попробуйте позже." : message);
    } finally {
       setIsSubmitting(false);
    }
  };

  const selectedGuide = GUIDES_DB.find(g => g.id === selectedGuideId);

  const filteredGuides = useMemo(() => {
    return GUIDES_DB.filter(g => {
        if (activeTab !== 'all' && g.type !== activeTab) return false;
        if (deferredQuery) {
            const query = deferredQuery.toLowerCase();
            return g.service.toLowerCase().includes(query) || g.aliases.some(a => a.toLowerCase().includes(query));
        }
        return true;
    });
  }, [deferredQuery, activeTab]);

  const guidesJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Инструкции по отписке от сервисов',
    numberOfItems: GUIDES_DB.length,
    itemListElement: GUIDES_DB.slice(0, 10).map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: g.service,
      url: `https://chestnayapodpiska.vercel.app/guides/${g.id}`,
    })),
  }), []);

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12 relative min-h-screen">
      <SEO
        title="База знаний: инструкции по возврату средств | ЧестнаяПодписка"
        description="Пошаговые инструкции и лайфхаки по возврату денег от популярных сервисов (Яндекс Плюс, ivi, Skillbox, GeekBrains и др.). Умный поиск по базе."
        jsonLd={guidesJsonLd}
      />
      <div className="max-w-6xl mx-auto w-full">

        <div className="mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <button
            onClick={() => navigate('/')}
            className="md:text-slate-400 md:hover:text-white md:font-semibold text-sm flex items-center transition-colors mb-4 md:mb-6 p-2 md:p-0 -ml-2 md:ml-0 text-white bg-white/10 md:bg-transparent rounded-full md:rounded-none active:scale-95 md:active:scale-100"
            aria-label="Вернуться на главную"
          >
            <ChevronLeft className="w-5 h-5 md:mr-1" />
            <span className="hidden md:inline">Вернуться</span>
          </button>
          <h1 className="text-2xl md:text-4xl font-bold md:font-extrabold text-white md:mb-3 tracking-tight">
            <span className="md:hidden">База знаний</span>
            <span className="hidden md:inline">Навигатор по отпискам</span>
          </h1>
          <p className="hidden md:block text-slate-400 text-lg">Компании прячут кнопки отмены. Мы нашли все короткие пути сквозь дарк-паттерны.</p>
        </div>

        {/* --- SEARCH AND FILTERS --- */}
        <div className="mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
           <div className="relative mb-5 max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                 type="text"
                 placeholder="Название сервиса (например, Яндекс или Skillbox)..."
                 value={searchQuery}
                 onChange={(e) => {
                   const val = e.target.value;
                   setSearchQuery(val);
                   startTransition(() => setDeferredQuery(val));
                 }}
                 className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50 transition-all font-medium text-base sm:text-lg"
              />
           </div>
           
           <div className="flex flex-wrap items-center gap-2">
              <button 
                  onClick={() => setActiveTab('all')} 
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'all' ? 'bg-accent-cyan text-gray-900 shadow-[0_0_15px_rgba(0,242,254,0.4)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
              >
                  Все ({GUIDES_DB.length})
              </button>
              <button 
                  onClick={() => setActiveTab('subscription')} 
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'subscription' ? 'bg-accent-cyan text-gray-900 shadow-[0_0_15px_rgba(0,242,254,0.4)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
              >
                  Подписки ({GUIDES_DB.filter(g => g.type === 'subscription').length})
              </button>
              <button 
                  onClick={() => setActiveTab('course')} 
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'course' ? 'bg-accent-cyan text-gray-900 shadow-[0_0_15px_rgba(0,242,254,0.4)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
              >
                  Онлайн-курсы ({GUIDES_DB.filter(g => g.type === 'course').length})
              </button>
           </div>
        </div>

        {/* --- GRID OF CARDS --- */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8 w-full transition-opacity duration-200 ${isPending ? 'opacity-60' : ''}`}>

          {/* Add Pattern Button (First Item) */}
          {(!searchQuery && activeTab === 'all') && (
            <div
              className="real-glass-panel rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 hover:border-accent-cyan/30 active:scale-[0.98] transition-all duration-300 border border-dashed border-white/20 group opacity-0 animate-slide-up h-[140px]"
              style={{ animationDelay: '150ms' }}
              onClick={() => setShowModal(true)}
            >
              <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mb-3 group-hover:scale-110 transition-transform duration-300 border border-accent-cyan/20">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">Новая уловка?</h3>
              <p className="text-xs text-slate-400">Сообщить о дарк-паттерне</p>
            </div>
          )}

          {/* Guide Cards */}
          {filteredGuides.map((guide, idx) => (
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
          
          {filteredGuides.length === 0 && (
             <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 py-12 text-center text-slate-400 animate-fade-in border border-dashed border-white/10 rounded-2xl">
                 Нет инструкций по вашему запросу. Вы можете <button onClick={() => setShowModal(true)} className="text-accent-cyan font-bold hover:underline tracking-wide">сообщить об уловке</button> для этого сервиса!
             </div>
          )}
        </div>

        {/* --- GUIDE DETAILS MODAL (full-screen on mobile, centered on desktop) --- */}
        {selectedGuide && createPortal(
          <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center md:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#05050A]/95 animate-fade-in transition-opacity"
              onClick={() => setSelectedGuideId(null)}
            ></div>

            {/* Modal Panel – full height on mobile, max-h on desktop */}
            <div ref={guideModalRef} className="relative w-full max-w-2xl bg-[#0a0f1c] border border-white/10 rounded-t-[2rem] md:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-pop-in flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden">

              {/* Header */}
              <div className="p-5 md:p-8 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#0a0f1c]/95 z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl font-black shrink-0 ${selectedGuide.iconColor} bg-opacity-20 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]`}>
                    <span className="drop-shadow-md text-white">{selectedGuide.service.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-white leading-tight">{selectedGuide.service}</h2>
                    <p className="text-xs md:text-sm text-slate-400">Инструкция по отмене</p>
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
                className="flex-1 overflow-y-auto p-5 md:p-8 relative z-20 custom-scrollbar overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">Пошаговый алгоритм</h3>

                  </div>
                  <div className="relative border-l border-white/10 ml-4 space-y-5 md:space-y-8">
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
          , document.body)}

        {/* Global Modal Overlay (For New Pattern Form) */}
        {showModal && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-[#05050A]/95" onClick={() => setShowModal(false)}></div>

            <div ref={formModalRef} className="w-full max-w-md real-glass-panel rounded-[2.5rem] p-8 relative z-10 border border-white/20 shadow-2xl animate-pop-in">
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
                  <p className="text-slate-400 text-sm mb-6">Помогите нам пополнить базу. Мы проверим сервис и добавим инструкцию.</p>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Название сервиса*"
                        value={formInput.serviceName}
                        onChange={e => setFormInput(p => ({ ...p, serviceName: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50 outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <textarea
                        required
                        placeholder="Как они прячут кнопку? Опишите кратко...*"
                        rows={3}
                        value={formInput.description}
                        onChange={e => setFormInput(p => ({ ...p, description: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50 outline-none transition-all resize-none placeholder-slate-500"
                      ></textarea>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Ваши контакты (tg/email), опционально"
                        value={formInput.contactInfo}
                        onChange={e => setFormInput(p => ({ ...p, contactInfo: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50 outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="mb-6 flex justify-center">
                    <Turnstile
                        ref={turnstileRef}
                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                        onSuccess={(token) => setFormInput(prev => ({ ...prev, turnstileToken: token }))}
                        onError={() => setFormInput(prev => ({ ...prev, turnstileToken: undefined }))}
                        onExpire={() => setFormInput(prev => ({ ...prev, turnstileToken: undefined }))}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !formInput.turnstileToken}
                    className="w-full py-4 bg-button-glow text-app-bg font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить информацию'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8 animate-pop-in">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Принято!</h2>
                  <p className="text-slate-400 text-sm mb-4">Спасибо за ваш вклад. Данные успешно отправлены в Telegram.</p>
                </div>
              )}
            </div>
          </div>
          , document.body)}

      </div>
    </div>
  );
}