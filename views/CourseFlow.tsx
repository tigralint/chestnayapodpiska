import { useMemo } from 'react';
import { FileText, Info } from '../components/icons';
import { formatNumberSpace } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { ToneToggle } from '../components/ui/ToneToggle';
import { ClaimResultPanel } from '../components/ui/ClaimResultPanel';
import { FprToggle } from '../components/ui/FprToggle';
import { ApiErrorBanner } from '../components/ui/ApiErrorBanner';
import { Turnstile } from '@marsidev/react-turnstile';
import { Link } from 'react-router-dom';
import { SEO } from '../components/ui/SEO';
import { useCourseFlow } from '../hooks/useCourseFlow';

export default function CourseFlow() {
  const {
    data, setData,
    isGenerating, result, copied,
    fieldErrors, apiError,
    clearFieldError, handleCopy,
    handleSubmit, handleDownloadWord,
    calculatedRefund, turnstileRef
  } = useCourseFlow();

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12">
      <SEO
        title="Отказ от онлайн-курса и возврат денег | ЧестнаяПодписка"
        description="Расторгните договор с онлайн-школой без незаконных штрафов. Рассчитайте сумму возврата и сгенерируйте юридическую претензию в 2 клика."
        jsonLd={useMemo(() => ({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Генератор претензий на возврат за онлайн-курс',
          applicationCategory: 'UtilityApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
        }), [])}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto w-full">

        {/* Form Column */}
        <div className="space-y-8 relative">
          <PageHeader
            title="Отказ от онлайн-курса"
            subtitle="Штрафы в договорах онлайн-школ незаконны. Оплачиваются только Фактически Понесенные Расходы (ФПР) за пройденный материал."
            theme="purple"
          />

          {apiError && <ApiErrorBanner error={apiError} />}

          <div className="space-y-8 real-glass-panel p-6 sm:p-8 rounded-[2.5rem] opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>

            {/* Justice Calculator Visual */}
            <div className="real-glass border border-accent-purple/30 bg-accent-purple/10 p-6 rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300">
              <div className="text-[12px] font-bold text-accent-purple uppercase tracking-widest mb-2 opacity-80 flex items-center gap-2">
                Законная сумма к возврату
                <div className="group/tooltip relative inline-flex cursor-help">
                  <Info className="w-3.5 h-3.5 hover:text-white transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 real-glass-panel rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 shadow-xl z-50 text-xs text-slate-300 font-normal border border-white/20 normal-case tracking-normal">
                    Сумма рассчитана математически: (общая стоимость) минус (доля пройденного материала). Школа обязана доказать документально, если ее фактические расходы больше этой суммы.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
                  </div>
                </div>
              </div>
              <div className="text-5xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-500">
                {formatNumberSpace(calculatedRefund)} <span className="text-3xl text-accent-purple">₽</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Course Name */}
              <div className="group">
                <label htmlFor="courseNameInput" className={`block text-sm font-semibold mb-3 ml-1 transition-colors ${fieldErrors.courseName ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-purple'}`}>Название школы или курса</label>
                <input
                  id="courseNameInput"
                  type="text"
                  placeholder="Например: Skillbox, GeekBrains"
                  className={`w-full bg-white/5 rounded-2xl px-5 py-4 text-[17px] text-white outline-none transition-all duration-300 shadow-inner placeholder-slate-600 focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.courseName ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50'}`}
                  value={data.courseName}
                  onChange={e => { setData({ ...data, courseName: e.target.value }); clearFieldError('courseName'); }}
                />
                {fieldErrors.courseName && <p className="text-red-400 text-xs mt-2 ml-2 animate-fade-in font-medium">{fieldErrors.courseName}</p>}
              </div>

              {/* Total Cost */}
              <div className="group">
                <label htmlFor="totalCostInput" className={`block text-sm font-semibold mb-3 ml-1 transition-colors ${fieldErrors.totalCost ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-purple'}`}>Общая стоимость курса</label>
                <div className="relative">
                  <input
                    id="totalCostInput"
                    type="text"
                    className={`w-full bg-white/5 rounded-2xl pl-5 pr-10 py-4 text-[19px] font-mono text-accent-cyan outline-none transition-all duration-300 shadow-inner focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.totalCost ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50'}`}
                    value={data.totalCost ? formatNumberSpace(data.totalCost) : ''}
                    onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setData({ ...data, totalCost: raw ? Number(raw) : 0 }); clearFieldError('totalCost'); }}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-accent-purple transition-colors">₽</span>
                </div>
                {fieldErrors.totalCost && <p className="text-red-400 text-xs mt-2 ml-2 animate-fade-in font-medium">{fieldErrors.totalCost}</p>}
              </div>

              {/* Percent Slider */}
              <div className="pt-2 group">
                <div className="flex justify-between items-end mb-4 ml-1">
                  <label htmlFor="percentInput" className="block text-sm font-semibold text-slate-300 group-hover:text-accent-purple transition-colors">Пройдено материала</label>
                  <span className="text-white font-bold bg-white/10 px-4 py-1.5 rounded-full border border-white/10 shadow-inner transition-colors group-hover:bg-accent-purple/20 group-hover:border-accent-purple/30">{data.percentCompleted}%</span>
                </div>
                <div className="relative w-full h-4 rounded-full bg-white/5 border border-white/10 overflow-hidden mb-2 group-hover:scale-[1.02] transition-transform duration-300 focus-within:ring-2 focus-within:ring-accent-purple/50 focus-within:ring-offset-2 focus-within:ring-offset-app-bg">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-200 ease-out"
                    style={{ width: `${data.percentCompleted}%` }}
                  ></div>
                  <input
                    id="percentInput"
                    type="range"
                    min="0" max="100" step="1"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={data.percentCompleted}
                    onChange={e => setData({ ...data, percentCompleted: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Smart FPR Builder */}
            <div className="pt-2">
              <label className="flex items-center text-sm font-semibold text-slate-300 mb-3 ml-1">
                Умный расчет ФПР
                <div className="group/tooltip relative inline-flex ml-2 cursor-help">
                  <Info className="w-4 h-4 text-slate-400 hover:text-accent-purple transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 real-glass-panel rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 shadow-xl z-50 text-xs text-slate-300 font-normal border border-white/20">
                    <span className="text-white font-bold mb-1 block">Фактически Понесенные Расходы (ст. 32 ЗоЗПП)</span>
                    Школа имеет право удержать только те суммы, которые реально потратила ИМЕННО на ваше обучение (например, оплата работы проверяющего ваши ДЗ). Затраты на маркетинг, комиссии банка или запись видеоуроков сюда не входят.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
                  </div>
                </div>
              </label>
              <div className="space-y-3">
                <FprToggle label="Вам открыли доступ ко всей IT-платформе?" checked={data.hasPlatformAccess} onChange={(v) => setData({ ...data, hasPlatformAccess: v })} />
                <FprToggle label="У вас были личные проверки домашних заданий?" checked={data.hasConsultations} onChange={(v) => setData({ ...data, hasConsultations: v })} />
                <FprToggle label="Вам выдали сертификат об окончании?" checked={data.hasCertificate} onChange={(v) => setData({ ...data, hasCertificate: v })} />
              </div>
            </div>

            {/* Tone Toggle */}
            <ToneToggle
              tone={data.tone}
              onToneChange={(t) => setData({ ...data, tone: t })}
              theme="purple"
              softPreview="«...надеюсь на конструктивный диалог с отделом качества и урегулирование вопроса в досудебном порядке...»"
              hardPreview="«...иначе буду вынужден(а) подать жалобу в Роспотребнадзор и взыскать в суде дополнительный штраф 50%...»"
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
                className="relative w-full bg-gradient-to-r from-accent-purple to-accent-blue hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:hover:shadow-none text-white font-bold text-lg rounded-2xl py-4 hover:scale-[1.02] active:scale-[0.96] transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-purple/30"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Анализируем...
                  </>
                ) : (
                  <>
                    <FileText className="w-6 h-6" />
                    Сгенерировать претензию
                  </>
                )}
              </button>
              <p className="text-center mt-3 text-xs text-slate-400 font-medium">
                Нажимая на кнопку, вы принимаете условия{' '}
                <Link to="/terms" className="text-accent-purple hover:underline transition-colors">Пользовательского соглашения</Link>
              </p>
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
          theme="purple"
          loadingTitle="Анализ договора-оферты"
          loadingSubtitle="Разбор на ст. 16 ЗоЗПП..."
        />

      </div>
    </div>
  );
}