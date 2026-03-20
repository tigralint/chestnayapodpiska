import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Radio, AlertCircle, X, CheckCircle } from '../components/icons';
import { ALERTS_SEED } from '../data/radar-seed';
import { SEO } from '../components/ui/SEO';
import { RadarCanvas } from '../components/ui/RadarCanvas';
import { ViewHeader } from '../components/layout/ViewHeader';
import { useRadar } from '../hooks/useRadar';
import { Turnstile } from '@marsidev/react-turnstile';
import { AlertCategory, RadarReport } from '../types';

export default function RadarView() {
  const { alerts, loading, error, categoryFilter, setCategoryFilter, submitReport } = useRadar();
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formInput, setFormInput] = useState<Partial<RadarReport>>({
    serviceName: '',
    city: '',
    amount: undefined,
    description: '',
    category: 'other',
    turnstileToken: undefined
  });
  const turnstileRef = useRef<any>(null);

  const displayAlerts = alerts.length > 0 ? alerts : (loading ? [] : ALERTS_SEED);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.turnstileToken || !formInput.serviceName || !formInput.city || !formInput.description || !formInput.category) return;
    
    setIsSubmitting(true);
    try {
       await submitReport(formInput as RadarReport);
       setModalState('success');
       setFormInput({ serviceName: '', city: '', amount: undefined, description: '', category: 'other', turnstileToken: undefined });
       turnstileRef.current?.reset();
       setTimeout(() => {
           setShowModal(false);
           setTimeout(() => setModalState('form'), 500);
       }, 2000);
    } catch(err: any) {
       console.error(err);
       alert(err.message === 'Server error' ? "Ошибка отправки." : err.message);
    } finally {
       setIsSubmitting(false);
       turnstileRef.current?.reset?.();
    }
  };

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12 relative min-h-screen">
      <SEO
        title="Народный Радар | ЧестнаяПодписка"
        description="Живая лента жалоб на скрытые подписки и уловки. Сообщите о проблеме и предупредите других."
      />
      <div className="max-w-5xl mx-auto w-full">

        <ViewHeader
          title="Народный радар"
          subtitle="Тепловая карта обмана: живая лента жалоб пользователей."
          icon={<Radio className="w-10 h-10 text-accent-purple animate-pulse" />}
        />

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
           <div className="flex flex-wrap gap-2 text-sm">
             {(['all', 'hidden_cancel', 'auto_renewal', 'refund_refused', 'phishing'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl transition-all font-semibold shadow-sm ${categoryFilter === cat ? 'bg-accent-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  {cat === 'all' ? 'Все' : 
                   cat === 'hidden_cancel' ? 'Скрытые отмены' : 
                   cat === 'auto_renewal' ? 'Автопродление' : 
                   cat === 'refund_refused' ? 'Отказ возврата' : 'Фишинг'}
                </button>
             ))}
           </div>
           
           <button 
             onClick={() => setShowModal(true)}
             className="px-5 py-2.5 rounded-xl bg-accent-purple/90 font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:bg-accent-purple active:scale-95 transition-all flex items-center gap-2"
           >
             <AlertCircle className="w-4 h-4" /> Сообщить о проблеме
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Radar Animation Graphic */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 real-glass-panel rounded-[3rem] relative overflow-hidden h-[400px] border border-accent-purple/20 opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="absolute inset-0 bg-accent-purple/5"></div>

            <div className="relative w-64 h-64 flex items-center justify-center">
              <RadarCanvas />
              <Radio className="w-8 h-8 text-accent-purple relative z-10" />
            </div>

            <div className="mt-8 text-center relative z-10">
              <p className="text-accent-purple font-mono uppercase tracking-widest text-sm mb-1 line-clamp-1">{loading ? "Соединение..." : "Live Feed"}</p>
              <p className="text-slate-300 font-medium text-sm">{loading ? "Загрузка алертов" : `Сканирование завершено. Сигналов: ${alerts.length}`}</p>
            </div>
          </div>

          {/* Alerts Feed */}
          <div className="lg:col-span-2 space-y-4">
            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-4 text-center">{error} — показаны старые записи</div>}
            
            {loading && alerts.length === 0 ? (
               // Skeletons
               [1,2,3].map(i => (
                 <div key={i} className="real-glass-panel rounded-[2rem] p-6 border border-white/5 animate-pulse h-[140px]">
                    <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                    <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3 mb-2"></div>
                 </div>
               ))
            ) : (
                displayAlerts.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 opacity-70 border border-dashed border-white/10 rounded-[2rem]">Новых сигналов по этой категории нет.</div>
                ) : (
                displayAlerts.map((alert, idx) => {
                  let colorClasses = "border-white/10 bg-white/5";
                  let iconColor = "text-slate-400";
                  let titleColor = "text-white";

                  if (alert.severity === 'critical') {
                    colorClasses = "border-red-500/30 bg-red-500/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]";
                    iconColor = "text-red-400";
                    titleColor = "text-red-200";
                  } else if (alert.severity === 'high') {
                    colorClasses = "border-orange-500/40 bg-orange-500/10";
                    iconColor = "text-orange-400";
                    titleColor = "text-orange-200";
                  } else if (alert.severity === 'success') {
                    colorClasses = "border-emerald-500/30 bg-emerald-500/5";
                    iconColor = "text-emerald-400";
                    titleColor = "text-emerald-200";
                  }

                  return (
                    <div
                      key={alert.id}
                      className={`real-glass-panel rounded-[2rem] p-6 border ${colorClasses} opacity-0 animate-slide-up hover:-translate-y-1 transition-transform cursor-default`}
                      style={{ animationDelay: `${200 + idx * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${iconColor}`} />
                          <span className={`font-bold text-sm tracking-wide ${titleColor}`}>{alert.location}</span>
                          <span className={`text-xs text-white/60 ml-2 py-[2px] px-2 bg-cover rounded-md border border-white/10 shrink-0 ${alert.severity === 'critical' ? 'bg-red-500/20' : 'bg-white/10'}`}>{alert.serviceName}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono shrink-0 pl-2">{alert.time}</span>
                      </div>

                      <div className="flex items-start gap-4 mt-2">
                        {alert.severity === 'critical' && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400 animate-pulse" />}
                        <p className="text-slate-200 text-sm leading-relaxed font-medium">
                          {alert.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>
      
      {/* Form Modal */}
      {showModal && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in py-10">
             <div className="absolute inset-0 bg-[#05050A]/95" onClick={() => setShowModal(false)}></div>
             <div className="w-full max-w-lg bg-[#0a0f1c] rounded-[2.5rem] p-8 relative z-10 border border-accent-purple/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] max-h-[95vh] overflow-y-auto custom-scrollbar">
               <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
               
               {modalState === 'form' ? (
                 <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex shrink-0 items-center justify-center text-accent-purple"><Radio className="w-5 h-5" /></div>
                      <h2 className="text-2xl font-bold text-white leading-tight">Новый сигнал</h2>
                   </div>
                   
                   <p className="text-sm text-slate-400 mb-2">Подайте сигнал на радар, чтобы помочь другим пользователям. Заявка отправится в бота юристам проекта.</p>

                   <input required type="text" placeholder="Название сервиса*" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-accent-purple/50 outline-none placeholder-slate-500" value={formInput.serviceName} onChange={e => setFormInput(p => ({...p, serviceName: e.target.value}))} />
                   
                   <div className="flex gap-4">
                       <input required type="text" placeholder="Город*" className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-accent-purple/50 outline-none placeholder-slate-500" value={formInput.city} onChange={e => setFormInput(p => ({...p, city: e.target.value}))} />
                       <input type="number" placeholder="Сумма (₽)" className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-accent-purple/50 outline-none placeholder-slate-500" value={formInput.amount || ''} onChange={e => setFormInput(p => ({...p, amount: Number(e.target.value)}))} />
                   </div>

                   <select required className="w-full bg-[#121827] border border-white/10 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-accent-purple/50 outline-none appearance-none cursor-pointer" value={formInput.category} onChange={e => setFormInput(p => ({...p, category: e.target.value as AlertCategory}))}>
                      <option value="hidden_cancel">Скрытая отмена</option>
                      <option value="auto_renewal">Неожиданное автопродление</option>
                      <option value="dark_pattern">Дарк-паттерн при отписке</option>
                      <option value="phishing">Фишинг или мошенничество</option>
                      <option value="refund_refused">Отказ в возврате</option>
                      <option value="other">Другое</option>
                   </select>

                   <textarea required placeholder="Опишите, что произошло?*" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-accent-purple/50 outline-none resize-none placeholder-slate-500" value={formInput.description} onChange={e => setFormInput(p => ({...p, description: e.target.value}))}></textarea>

                   <div className="flex justify-center my-2">
                       <Turnstile ref={turnstileRef} siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''} onSuccess={(t) => setFormInput(p => ({...p, turnstileToken: t}))} onError={() => setFormInput(p => ({...p, turnstileToken: undefined}))} onExpire={() => setFormInput(p => ({...p, turnstileToken: undefined}))} />
                   </div>

                   <button disabled={isSubmitting || !formInput.turnstileToken} type="submit" className="w-full py-4 text-white bg-accent-purple font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                       {isSubmitting ? 'Трансляция сигнала...' : 'Опубликовать на Радаре'}
                   </button>
                 </form>
               ) : (
                 <div className="text-center py-10 animate-pop-in">
                   <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6">
                     <CheckCircle className="w-10 h-10" />
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-2">Сигнал принят!</h2>
                   <p className="text-slate-400 text-sm">Ваш рапорт обработан и отправлен в Telegram. Скоро он появится на карте.</p>
                 </div>
               )}
             </div>
          </div>, document.body
      )}

    </div>
  );
}