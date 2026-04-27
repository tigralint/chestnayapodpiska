import { useState, useMemo, useEffect } from 'react';
import { FileText, ChevronDown, Info } from '../components/icons';
import { formatNumberSpace } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { ToneToggle } from '../components/ui/ToneToggle';
import { ClaimResultPanel } from '../components/ui/ClaimResultPanel';
import { ApiErrorBanner } from '../components/ui/ApiErrorBanner';
import { DatePicker } from '../components/ui/DatePicker';
import { Turnstile } from '@marsidev/react-turnstile';
import { Link } from 'react-router-dom';
import { SEO } from '../components/ui/SEO';
import { useClaimFlow, REASONS, CUSTOM_REASON_LABEL, CUSTOM_REASON_VALUE } from '../hooks/useClaimFlow';

export default function SubscriptionFlow() {
  const {
    data, setData,
    isGenerating, result, copied,
    fieldErrors, apiError,
    clearFieldError, handleCopy,
    handleSubmit, handleDownloadWord,
    isReasonOpen, setIsReasonOpen,
    turnstileRef,
    isCustomReason, isRefusal
  } = useClaimFlow();

  const [isConsentGiven, setIsConsentGiven] = useState(false);

  // Prefetch heavy docx library in the background so it's ready when the user clicks 'Download'
  useEffect(() => {
    import('docx').catch(() => {});
  }, []);

  /** All dropdown options: preset reasons + custom */
  const allReasons = [...REASONS, CUSTOM_REASON_LABEL];

  /** Display text for current selection in the dropdown trigger */
  const reasonDisplayText = isCustomReason ? CUSTOM_REASON_LABEL : data.reason;

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12">
      <SEO
        title="Возврат средств за подписку | ЧестнаяПодписка"
        description="Сгенерируйте претензию для возврата денег за случайно продленную подписку. Полное соответствие Гражданскому кодексу и закону о защите прав потребителей."
        jsonLd={useMemo(() => ({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Генератор претензий на возврат подписки',
          applicationCategory: 'UtilityApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
        }), [])}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto w-full">

        {/* Form Column */}
        <div className="space-y-8 relative">
          <PageHeader
            title="Возврат средств"
            subtitle="Юридически грамотная претензия с опорой на ст. 32 ЗоЗПП РФ. Сервисы часто возвращают деньги без споров, видя знание закона."
            theme="cyan"
          />

          {apiError && <ApiErrorBanner error={apiError} />}

          <div className="space-y-6 real-glass-panel p-6 sm:p-8 rounded-[2.5rem] opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
            {/* Service Name */}
            <div className="group">
              <label htmlFor="serviceNameInput" className={`block text-sm font-semibold mb-3 ml-1 transition-colors ${fieldErrors.serviceName ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-cyan'}`}>Сервис, который списал деньги</label>
              <input
                id="serviceNameInput"
                type="text"
                placeholder="Например: Яндекс Плюс, ivi, VK"
                aria-invalid={!!fieldErrors.serviceName}
                aria-describedby={fieldErrors.serviceName ? 'serviceNameError' : undefined}
                className={`w-full bg-white/5 rounded-2xl px-5 py-4 text-[17px] text-white outline-none transition-all shadow-inner placeholder-slate-500 focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.serviceName ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50'}`}
                value={data.serviceName}
                onChange={e => { setData({ ...data, serviceName: e.target.value }); clearFieldError('serviceName'); }}
              />
              {fieldErrors.serviceName && <p id="serviceNameError" role="alert" className="text-red-400 text-xs mt-2 ml-2 animate-fade-in font-medium">{fieldErrors.serviceName}</p>}
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
                    aria-invalid={!!fieldErrors.amount}
                    aria-describedby={fieldErrors.amount ? 'amountError' : undefined}
                    className={`w-full bg-white/5 rounded-2xl pl-5 pr-10 py-4 text-[17px] text-white outline-none transition-all shadow-inner placeholder-slate-500 focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.amount ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50'}`}
                    value={data.amount ? formatNumberSpace(data.amount) : ''}
                    onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setData({ ...data, amount: raw }); clearFieldError('amount'); }}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-accent-cyan transition-colors" aria-hidden="true">₽</span>
                </div>
                {fieldErrors.amount && <p id="amountError" role="alert" className="text-red-400 text-xs mt-2 ml-2 animate-fade-in font-medium">{fieldErrors.amount}</p>}
              </div>

              {/* Custom Date Picker */}
              <DatePicker
                id="dateInput"
                label="Дата списания"
                value={data.date}
                onChange={date => setData({ ...data, date })}
              />
            </div>

            {/* Reason Dropdown with Keyboard Navigation */}
            <div className="group relative">
              <label className="flex items-center text-sm font-semibold text-slate-300 mb-3 ml-1 transition-colors group-focus-within:text-accent-cyan" id="reason-label">
                Причина (кратко)
                <div className="group/tooltip relative inline-flex ml-2 cursor-help">
                  <Info className="w-4 h-4 text-slate-400 hover:text-accent-cyan transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 real-glass-panel rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 shadow-xl z-50 text-xs text-slate-300 font-normal border border-white/20">
                    <span className="text-white font-bold mb-1 block">Основание для возврата (ст. 32 ЗоЗПП)</span>
                    Если вы забыли отключить автопродление, но фактически не пользовались сервисом в новом периоде, закон в большинстве случаев на вашей стороне. Выбирайте вариант, максимально близкий к вашей ситуации, или опишите свою причину.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
                  </div>
                </div>
              </label>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isReasonOpen}
                aria-labelledby="reason-label"
                className={`w-full text-left bg-white/5 rounded-2xl px-5 py-4 text-[17px] text-white outline-none transition-all shadow-inner flex justify-between items-center ${isReasonOpen ? 'border-2 border-accent-cyan/50 bg-white/10 ring-2 ring-accent-cyan/30 scale-[1.01]' : 'border border-white/10 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:border-accent-cyan/50'}`}
                onClick={() => setIsReasonOpen(!isReasonOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!isReasonOpen) setIsReasonOpen(true);
                    const currentIdx = allReasons.indexOf(reasonDisplayText);
                    const nextIdx = e.key === 'ArrowDown'
                      ? Math.min(currentIdx + 1, allReasons.length - 1)
                      : Math.max(currentIdx - 1, 0);
                    const selected = allReasons[nextIdx] ?? '';
                    if (selected === CUSTOM_REASON_LABEL) {
                      setData({ ...data, reason: CUSTOM_REASON_VALUE });
                    } else {
                      setData({ ...data, reason: selected, customReason: undefined });
                    }
                  } else if (e.key === 'Escape' && isReasonOpen) {
                    e.preventDefault();
                    setIsReasonOpen(false);
                  } else if (e.key === 'Enter' && isReasonOpen) {
                    e.preventDefault();
                    setIsReasonOpen(false);
                  }
                }}
              >
                <span className="truncate pr-4">{reasonDisplayText}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isReasonOpen ? 'rotate-180 text-accent-cyan' : ''}`} />
              </button>
              {isReasonOpen && <div className="fixed inset-0 z-40" onClick={() => setIsReasonOpen(false)}></div>}
              <div
                role="listbox"
                aria-labelledby="reason-label"
                className={`absolute z-50 w-full mt-2 real-glass-panel rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 origin-top ${isReasonOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
              >
                {allReasons.map((reason, idx) => {
                  const isCustomOption = reason === CUSTOM_REASON_LABEL;
                  const isSelected = isCustomOption ? isCustomReason : data.reason === reason;

                  return (
                    <button
                      key={idx}
                      id={`reason-option-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`w-full text-left px-5 py-4 cursor-pointer transition-colors border-b border-white/5 last:border-0 ${isSelected ? 'bg-accent-cyan/20 text-accent-cyan font-bold' : 'text-slate-200 hover:bg-white/10 hover:text-white'} ${isCustomOption ? 'border-t border-white/10' : ''}`}
                      onClick={() => {
                        if (isCustomOption) {
                          setData({ ...data, reason: CUSTOM_REASON_VALUE });
                        } else {
                          setData({ ...data, reason, customReason: undefined });
                        }
                        setIsReasonOpen(false);
                      }}
                    >
                      {isCustomOption && <span className="mr-2 text-accent-cyan">✏️</span>}
                      {reason}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Reason Textarea – shown when "Другое" is selected */}
            {isCustomReason && (
              <div className="group animate-slide-up">
                <label htmlFor="customReasonInput" className={`block text-sm font-semibold mb-3 ml-1 transition-colors ${fieldErrors.customReason ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-cyan'}`}>
                  Опишите свою причину
                </label>
                <textarea
                  id="customReasonInput"
                  placeholder="Например: Мне не пришло уведомление о списании, я не пользовался сервисом с момента подписки..."
                  maxLength={500}
                  rows={3}
                  aria-invalid={!!fieldErrors.customReason}
                  aria-describedby={fieldErrors.customReason ? 'customReasonError' : undefined}
                  className={`w-full bg-white/5 rounded-2xl px-5 py-4 text-[17px] text-white outline-none transition-all shadow-inner placeholder-slate-500 resize-none focus:scale-[1.005] focus:bg-white/10 ${fieldErrors.customReason ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50'}`}
                  value={data.customReason || ''}
                  onChange={e => { setData({ ...data, customReason: e.target.value }); clearFieldError('customReason'); }}
                />
                <div className="flex justify-between mt-1.5 px-2">
                  {fieldErrors.customReason ? (
                    <p id="customReasonError" role="alert" className="text-red-400 text-xs animate-fade-in font-medium">{fieldErrors.customReason}</p>
                  ) : (
                    <p className="text-slate-500 text-xs">ИИ оценит причину и решит, можно ли составить претензию</p>
                  )}
                  <span className={`text-xs ${(data.customReason?.length || 0) > 450 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {data.customReason?.length || 0}/500
                  </span>
                </div>
              </div>
            )}

            {/* Tone Toggle */}
            <ToneToggle
              tone={data.tone}
              onToneChange={(t) => setData({ ...data, tone: t })}
              theme="cyan"
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
                disabled={isGenerating || !data.turnstileToken || !isConsentGiven}
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
              
              {/* Checkbox 152-ФЗ */}
              <label className="flex items-start gap-3 mt-4 px-1 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={isConsentGiven}
                    onChange={(e) => setIsConsentGiven(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded-md bg-white/5 checked:bg-accent-cyan checked:border-accent-cyan transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer"
                  />
                  <svg className="absolute w-3.5 h-3.5 text-app-bg pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                  Я согласен(на) с{' '}
                  <Link to="/privacy" className="text-accent-cyan hover:underline transition-colors" onClick={(e) => e.stopPropagation()}>Политикой конфиденциальности</Link>{' '}
                  и{' '}
                  <Link to="/terms" className="text-accent-cyan hover:underline transition-colors" onClick={(e) => e.stopPropagation()}>Пользовательским соглашением</Link>.
                </span>
              </label>
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
          theme="cyan"
          loadingTitle="Синтез правовой позиции"
          loadingSubtitle="Формирование документа..."
          isRefusal={isRefusal}
        />

      </div>
    </div>
  );
}