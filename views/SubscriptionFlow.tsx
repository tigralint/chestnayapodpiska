import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ClaimData } from '../types';
import { FileText, AlertCircle, ChevronDown } from '../components/icons';
import { generateSubscriptionClaim } from '../services/geminiService';
import { downloadWordDoc } from '../utils/downloadWord';
import { formatNumberSpace } from '../utils/format';
import { useClaimForm } from '../hooks/useClaimForm';
import { PageHeader } from '../components/layout/PageHeader';
import { ToneToggle } from '../components/ui/ToneToggle';
import { ClaimResultPanel } from '../components/ui/ClaimResultPanel';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { SEO } from '../components/ui/SEO';

const REASONS = [
  'Забыл отменить подписку после пробного периода',
  'Не планировал продлевать, случайно нажал',
  'Сервисом не пользовался, услуга не нужна',
  'Списание произошло без предупреждения'
];

export default function SubscriptionFlow() {
  const { service } = useParams<{ service?: string }>();
  const prefilledService = service ? decodeURIComponent(service) : '';

  const {
    data, setData,
    isGenerating, result, copied,
    fieldErrors, apiError,
    handleGenerate, clearFieldError, handleCopy
  } = useClaimForm<ClaimData>(
    {
      serviceName: prefilledService,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      reason: REASONS[0],
      tone: 'soft'
    },
    generateSubscriptionClaim,
    (d) => {
      const errors: Record<string, string> = {};
      if (!d.serviceName.trim()) errors.serviceName = 'Укажите название сервиса';
      if (!d.amount) errors.amount = 'Укажите сумму списания';
      else if (Number(d.amount) <= 0) errors.amount = 'Сумма должна быть больше 0';
      return errors;
    }
  );

  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = () => {
    handleGenerate(() => turnstileRef.current?.reset());
  };

  const handleDownloadWord = () => {
    const safeName = data.serviceName.replace(/[^a-zа-я0-9]/gi, '_');
    downloadWordDoc(
      `Претензия_${safeName}`,
      "В службу поддержки / Руководству",
      data.serviceName,
      "_________________________ (Email / Телефон: _________________)",
      "ДОСУДЕБНАЯ ПРЕТЕНЗИЯ",
      "",
      result
    );
  };

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12">
      <SEO
        title="Возврат средств за подписку | ЧестнаяПодписка"
        description="Сгенерируйте претензию для возврата денег за случайно продленную подписку. Полное соответствие Гражданскому кодексу и закону о защите прав потребителей."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto w-full">

        {/* Form Column */}
        <div className="space-y-8 relative">
          <PageHeader
            title="Возврат средств"
            subtitle="Юридически грамотная претензия с опорой на ст. 32 ЗоЗПП РФ. Сервисы часто возвращают деньги без споров, видя знание закона."
            accentColor="accent-cyan"
          />

          {apiError && (
            <div className="real-glass border-red-500/30 bg-red-500/10 p-5 rounded-[1.5rem] flex items-start gap-4 animate-pop-in shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-300 font-bold mb-1 text-sm uppercase tracking-wider">Ошибка</h3>
                <p className="text-red-200 text-sm leading-relaxed">{apiError}</p>
              </div>
            </div>
          )}

          <div className="space-y-6 real-glass-panel p-6 sm:p-8 rounded-[2.5rem] opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
            {/* Service Name */}
            <div className="group">
              <label htmlFor="serviceNameInput" className={`block text-sm font-semibold mb-3 ml-1 transition-colors ${fieldErrors.serviceName ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-cyan'}`}>Сервис, который списал деньги</label>
              <input
                id="serviceNameInput"
                type="text"
                placeholder="Например: Яндекс Плюс, ivi, VK"
                className={`w-full bg-white/5 rounded-2xl px-5 py-4 text-[17px] text-white outline-none transition-all shadow-inner placeholder-slate-600 focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.serviceName ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50'}`}
                value={data.serviceName}
                onChange={e => { setData({ ...data, serviceName: e.target.value }); clearFieldError('serviceName'); }}
              />
              {fieldErrors.serviceName && <p className="text-red-400 text-xs mt-2 ml-2 animate-fade-in font-medium">{fieldErrors.serviceName}</p>}
            </div>

            {/* Amount + Date */}
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1 group">
                <label htmlFor="amountInput" className={`block text-sm font-semibold mb-3 ml-1 transition-colors ${fieldErrors.amount ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-cyan'}`}>Сумма списания</label>
                <div className="relative">
                  <input
                    id="amountInput"
                    type="text"
                    placeholder="299"
                    className={`w-full bg-white/5 rounded-2xl pl-5 pr-10 py-4 text-[17px] text-white outline-none transition-all shadow-inner placeholder-slate-600 focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.amount ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50'}`}
                    value={data.amount ? formatNumberSpace(data.amount) : ''}
                    onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setData({ ...data, amount: raw }); clearFieldError('amount'); }}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-accent-cyan transition-colors">₽</span>
                </div>
                {fieldErrors.amount && <p className="text-red-400 text-xs mt-2 ml-2 animate-fade-in font-medium">{fieldErrors.amount}</p>}
              </div>
              <div className="flex-1 group">
                <label htmlFor="dateInput" className="block text-sm font-semibold text-slate-300 mb-3 ml-1 group-focus-within:text-accent-cyan transition-colors">Дата списания</label>
                <input
                  id="dateInput"
                  type="date"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[17px] text-white focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50 focus:bg-white/10 outline-none transition-all shadow-inner color-scheme-dark focus:scale-[1.01]"
                  style={{ colorScheme: 'dark' }}
                  value={data.date}
                  onChange={e => setData({ ...data, date: e.target.value })}
                />
              </div>
            </div>

            {/* Reason Dropdown */}
            <div className="group relative">
              <label className="block text-sm font-semibold text-slate-300 mb-3 ml-1 transition-colors group-focus-within:text-accent-cyan" id="reason-label">Причина (кратко)</label>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isReasonOpen}
                aria-labelledby="reason-label"
                className={`w-full text-left bg-white/5 rounded-2xl px-5 py-4 text-[17px] text-white outline-none transition-all shadow-inner flex justify-between items-center ${isReasonOpen ? 'border-2 border-accent-cyan/50 bg-white/10 ring-2 ring-accent-cyan/30 scale-[1.01]' : 'border border-white/10 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:border-accent-cyan/50'}`}
                onClick={() => setIsReasonOpen(!isReasonOpen)}
              >
                <span className="truncate pr-4">{data.reason}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isReasonOpen ? 'rotate-180 text-accent-cyan' : ''}`} />
              </button>
              {isReasonOpen && <div className="fixed inset-0 z-40" onClick={() => setIsReasonOpen(false)}></div>}
              <div
                role="listbox"
                className={`absolute z-50 w-full mt-2 real-glass-panel rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 origin-top ${isReasonOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
              >
                {REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="option"
                    aria-selected={data.reason === reason}
                    className={`w-full text-left px-5 py-4 cursor-pointer transition-colors border-b border-white/5 last:border-0 ${data.reason === reason ? 'bg-accent-cyan/20 text-accent-cyan font-bold' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                    onClick={() => { setData({ ...data, reason }); setIsReasonOpen(false); }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Toggle */}
            <ToneToggle
              tone={data.tone}
              onToneChange={(t) => setData({ ...data, tone: t })}
              accentColor="accent-cyan"
              softPreview="«...являюсь лояльным пользователем и надеюсь на мирное решение вопроса с возвратом...»"
              hardPreview="«...в противном случае буду вынужден(а) обратиться в суд со взысканием потребительского штрафа 50%...»"
            />

            {/* Turnstile Widget */}
            <div className="flex justify-center mt-6">
              <Turnstile
                ref={turnstileRef}
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => setData(prev => ({ ...prev, turnstileToken: token }))}
                onError={() => setData(prev => ({ ...prev, turnstileToken: undefined }))}
                onExpire={() => setData(prev => ({ ...prev, turnstileToken: undefined }))}
                options={{ theme: 'dark' }}
              />
            </div>

            {/* Generate Button */}
            <div className="sticky bottom-4 z-40 mt-8 pt-2 pb-2">
              <div className="absolute inset-0 bg-app-bg/50 blur-xl md:hidden rounded-full"></div>
              <button
                onClick={handleSubmit}
                disabled={isGenerating || !data.turnstileToken}
                className="relative w-full bg-button-glow hover:shadow-[0_0_30px_rgba(0,242,254,0.4)] disabled:opacity-50 disabled:hover:shadow-none text-app-bg font-bold text-lg rounded-2xl py-4 active:scale-[0.96] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-cyan/30"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-app-bg/30 border-t-app-bg rounded-full animate-spin"></div>
                    Создаем магию...
                  </>
                ) : (
                  <>
                    <FileText className="w-6 h-6" />
                    Сгенерировать претензию
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result Column */}
        <ClaimResultPanel
          isGenerating={isGenerating}
          result={result}
          onCopy={handleCopy}
          copied={copied}
          onDownload={handleDownloadWord}
          accentColor="accent-cyan"
          loadingTitle="Синтез правовой позиции"
          loadingSubtitle="Формирование документа..."
        />

      </div>
    </div>
  );
}