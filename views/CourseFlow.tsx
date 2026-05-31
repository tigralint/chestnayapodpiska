import { useState, useMemo, useEffect } from 'react';
import { FileText, Info } from '../components/icons';
import { formatNumberSpace } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { ToneToggle } from '../components/ui/ToneToggle';
import { ClaimResultPanel } from '../components/ui/ClaimResultPanel';
import { FprToggle } from '../components/ui/FprToggle';
import { ApiErrorBanner } from '../components/ui/ApiErrorBanner';
import { Turnstile } from '@marsidev/react-turnstile';
import { SEO } from '../components/ui/SEO';
import { ConsentCheckbox } from '../components/ui/ConsentCheckbox';
import { useCourseFlow } from '../hooks/useCourseFlow';

export default function CourseFlow() {
    const {
        data,
        setData,
        isGenerating,
        result,
        copied,
        fieldErrors,
        apiError,
        clearFieldError,
        handleCopy,
        handleSubmit,
        handleDownloadWord,
        calculatedRefund,
        turnstileRef,
    } = useCourseFlow();

    const [isConsentGiven, setIsConsentGiven] = useState(false);

    // Prefetch heavy docx library in the background so it's ready when the user clicks 'Download'
    useEffect(() => {
        import('docx').catch(() => {});
    }, []);

    return (
        <div className="flex h-full flex-col px-4 pb-12 sm:px-6">
            <SEO
                title="Отказ от онлайн-курса и возврат денег | ЧестнаяПодписка"
                description="Расторгните договор с онлайн-школой без незаконных штрафов. Рассчитайте сумму возврата и сгенерируйте юридическую претензию в 2 клика."
                jsonLd={useMemo(
                    () => ({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: 'Генератор претензий на возврат за онлайн-курс',
                        applicationCategory: 'UtilityApplication',
                        offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
                    }),
                    []
                )}
            />
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Form Column */}
                <div className="relative space-y-8">
                    <PageHeader
                        title="Отказ от онлайн-курса"
                        subtitle="Штрафы в договорах онлайн-школ незаконны. Оплачиваются только Фактически Понесенные Расходы (ФПР) за пройденный материал."
                        theme="purple"
                    />

                    {apiError ? <ApiErrorBanner error={apiError} /> : null}

                    <div
                        className="real-glass-panel animate-slide-up space-y-8 rounded-[2.5rem] p-6 opacity-0 sm:p-8"
                        style={{ animationDelay: '150ms' }}
                    >
                        {/* Justice Calculator Visual */}
                        <div className="real-glass rounded-[2rem] border border-accent-purple/30 bg-accent-purple/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300">
                            <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-accent-purple opacity-80">
                                Законная сумма к возврату
                                <div className="group/tooltip relative inline-flex cursor-help">
                                    <Info className="h-3.5 w-3.5 transition-colors hover:text-white" />
                                    <div className="real-glass-panel invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-white/20 p-3 text-xs font-normal normal-case tracking-normal text-slate-300 opacity-0 shadow-xl transition-all duration-300 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
                                        Сумма рассчитана математически: (общая стоимость) минус (доля пройденного
                                        материала). Школа обязана доказать документально, если ее фактические расходы
                                        больше этой суммы.
                                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="font-mono text-5xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-500">
                                {formatNumberSpace(calculatedRefund)}{' '}
                                <span className="text-3xl text-accent-purple">₽</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Course Name */}
                            <div className="group">
                                <label
                                    htmlFor="courseNameInput"
                                    className={`mb-3 ml-1 block text-sm font-semibold transition-colors ${fieldErrors.courseName ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-purple'}`}
                                >
                                    Название школы или курса
                                </label>
                                <input
                                    id="courseNameInput"
                                    type="text"
                                    placeholder="Например: Skillbox, GeekBrains"
                                    aria-invalid={!!fieldErrors.courseName}
                                    aria-describedby={fieldErrors.courseName ? 'courseNameError' : undefined}
                                    className={`w-full rounded-2xl bg-white/5 px-5 py-4 text-[17px] text-white placeholder-slate-500 shadow-inner outline-none transition-all duration-300 focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.courseName ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/50'}`}
                                    value={data.courseName}
                                    onChange={(e) => {
                                        setData({ ...data, courseName: e.target.value });
                                        clearFieldError('courseName');
                                    }}
                                />
                                {fieldErrors.courseName ? (
                                    <p
                                        id="courseNameError"
                                        role="alert"
                                        className="ml-2 mt-2 animate-fade-in text-xs font-medium text-red-400"
                                    >
                                        {fieldErrors.courseName}
                                    </p>
                                ) : null}
                            </div>

                            {/* Total Cost */}
                            <div className="group">
                                <label
                                    htmlFor="totalCostInput"
                                    className={`mb-3 ml-1 block text-sm font-semibold transition-colors ${fieldErrors.totalCost ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-purple'}`}
                                >
                                    Общая стоимость курса
                                </label>
                                <div className="relative">
                                    <input
                                        id="totalCostInput"
                                        type="text"
                                        aria-invalid={!!fieldErrors.totalCost}
                                        aria-describedby={fieldErrors.totalCost ? 'totalCostError' : undefined}
                                        className={`w-full rounded-2xl bg-white/5 py-4 pl-5 pr-10 font-mono text-[19px] text-accent-cyan shadow-inner outline-none transition-all duration-300 focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.totalCost ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/50'}`}
                                        value={data.totalCost ? formatNumberSpace(data.totalCost) : ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setData({ ...data, totalCost: raw ? Number(raw) : 0 });
                                            clearFieldError('totalCost');
                                        }}
                                    />
                                    <span
                                        className="absolute right-5 top-1/2 -translate-y-1/2 font-medium text-slate-400 transition-colors group-focus-within:text-accent-purple"
                                        aria-hidden="true"
                                    >
                                        ₽
                                    </span>
                                </div>
                                {fieldErrors.totalCost ? (
                                    <p
                                        id="totalCostError"
                                        role="alert"
                                        className="ml-2 mt-2 animate-fade-in text-xs font-medium text-red-400"
                                    >
                                        {fieldErrors.totalCost}
                                    </p>
                                ) : null}
                            </div>

                            {/* Percent Slider */}
                            <div className="group pt-2">
                                <div className="mb-4 ml-1 flex items-end justify-between">
                                    <label
                                        htmlFor="percentInput"
                                        className="block text-sm font-semibold text-slate-300 transition-colors group-hover:text-accent-purple"
                                    >
                                        Пройдено материала
                                    </label>
                                    <span className="rounded-full border border-white/10 bg-white/10 px-4 py-1.5 font-bold text-white shadow-inner transition-colors group-hover:border-accent-purple/30 group-hover:bg-accent-purple/20">
                                        {data.percentCompleted}%
                                    </span>
                                </div>
                                <div className="relative mb-2 h-4 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 transition-transform duration-300 focus-within:ring-2 focus-within:ring-accent-purple/50 focus-within:ring-offset-2 focus-within:ring-offset-app-bg group-hover:scale-[1.02]">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-200 ease-out"
                                        style={{ width: `${data.percentCompleted}%` }}
                                    ></div>
                                    <input
                                        id="percentInput"
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        value={data.percentCompleted}
                                        onChange={(e) => setData({ ...data, percentCompleted: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Smart FPR Builder */}
                        <div className="pt-2">
                            <label className="mb-3 ml-1 flex items-center text-sm font-semibold text-slate-300">
                                Умный расчет ФПР
                                <div className="group/tooltip relative ml-2 inline-flex cursor-help">
                                    <Info className="h-4 w-4 text-slate-400 transition-colors hover:text-accent-purple" />
                                    <div className="real-glass-panel invisible absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border border-white/20 p-4 text-xs font-normal text-slate-300 opacity-0 shadow-xl transition-all duration-300 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
                                        <span className="mb-1 block font-bold text-white">
                                            Фактически Понесенные Расходы (ст. 32 ЗоЗПП)
                                        </span>
                                        Школа имеет право удержать только те суммы, которые реально потратила ИМЕННО на
                                        ваше обучение (например, оплата работы проверяющего ваши ДЗ). Затраты на
                                        маркетинг, комиссии банка или запись видеоуроков сюда не входят.
                                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
                                    </div>
                                </div>
                            </label>
                            <div className="space-y-3">
                                <FprToggle
                                    label="Вам открыли доступ ко всей IT-платформе?"
                                    checked={data.hasPlatformAccess}
                                    onChange={(v) => setData({ ...data, hasPlatformAccess: v })}
                                />
                                <FprToggle
                                    label="У вас были личные проверки домашних заданий?"
                                    checked={data.hasConsultations}
                                    onChange={(v) => setData({ ...data, hasConsultations: v })}
                                />
                                <FprToggle
                                    label="Вам выдали сертификат об окончании?"
                                    checked={data.hasCertificate}
                                    onChange={(v) => setData({ ...data, hasCertificate: v })}
                                />
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
                        <div className="mt-6 flex justify-center">
                            <Turnstile
                                ref={turnstileRef}
                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                                onSuccess={(token) => setData((prev) => ({ ...prev, turnstileToken: token }))}
                                onError={() => setData((prev) => ({ ...prev, turnstileToken: undefined }))}
                                onExpire={() => setData((prev) => ({ ...prev, turnstileToken: undefined }))}
                                options={{ theme: 'dark' }}
                            />
                        </div>

                        {/* Generate Button */}
                        <div className="sticky bottom-4 z-40 mt-8 pb-2 pt-2">
                            <div className="absolute inset-0 rounded-full bg-app-bg/50 blur-xl md:hidden"></div>
                            <button
                                onClick={handleSubmit}
                                disabled={isGenerating || !data.turnstileToken || !isConsentGiven}
                                className="relative flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-accent-purple to-accent-blue py-4 text-lg font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-purple/30 active:scale-[0.96] disabled:opacity-50 disabled:hover:shadow-none"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                        Анализируем...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-6 w-6" />
                                        Сгенерировать претензию
                                    </>
                                )}
                            </button>
                            {/* Checkbox 152-ФЗ */}
                            <ConsentCheckbox checked={isConsentGiven} onChange={setIsConsentGiven} />
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
