import { useState, useMemo, useEffect } from 'react';
import { Info, FileText, Pencil, ChevronDown } from '../components/icons';
import { formatNumberSpace } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { ToneToggle } from '../components/ui/ToneToggle';
import { ClaimResultPanel } from '../components/ui/ClaimResultPanel';
import { ApiErrorBanner } from '../components/ui/ApiErrorBanner';
import { DatePicker } from '../components/ui/DatePicker';
import { Turnstile } from '@marsidev/react-turnstile';
import { SEO } from '../components/ui/SEO';
import { ConsentCheckbox } from '../components/ui/ConsentCheckbox';
import { useClaimFlow, REASONS, CUSTOM_REASON_LABEL, CUSTOM_REASON_VALUE } from '../hooks/useClaimFlow';

export default function SubscriptionFlow() {
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
        isReasonOpen,
        setIsReasonOpen,
        turnstileRef,
        isCustomReason,
        isRefusal,
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
        <div className="flex h-full flex-col px-4 pb-12 sm:px-6">
            <SEO
                title="Возврат средств за подписку | ЧестнаяПодписка"
                description="Сгенерируйте претензию для возврата денег за случайно продленную подписку. Полное соответствие Гражданскому кодексу и закону о защите прав потребителей."
                jsonLd={useMemo(
                    () => ({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: 'Генератор претензий на возврат подписки',
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
                        title="Возврат средств"
                        subtitle="Юридически грамотная претензия с опорой на ст. 32 ЗоЗПП РФ. Сервисы часто возвращают деньги без споров, видя знание закона."
                        theme="cyan"
                    />

                    {apiError ? <ApiErrorBanner error={apiError} /> : null}

                    <div
                        className="real-glass-panel animate-slide-up space-y-6 rounded-[2.5rem] p-6 opacity-0 sm:p-8"
                        style={{ animationDelay: '150ms' }}
                    >
                        {/* Service Name */}
                        <div className="group">
                            <label
                                htmlFor="serviceNameInput"
                                className={`mb-3 ml-1 block text-sm font-semibold transition-colors ${fieldErrors.serviceName ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-cyan'}`}
                            >
                                Сервис, который списал деньги
                            </label>
                            <input
                                id="serviceNameInput"
                                type="text"
                                placeholder="Например: Яндекс Плюс, ivi, VK"
                                aria-invalid={!!fieldErrors.serviceName}
                                aria-describedby={fieldErrors.serviceName ? 'serviceNameError' : undefined}
                                className={`w-full rounded-2xl bg-white/5 px-5 py-4 text-[17px] text-white placeholder-slate-500 shadow-inner outline-none transition-all focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.serviceName ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/50'}`}
                                value={data.serviceName}
                                onChange={(e) => {
                                    setData({ ...data, serviceName: e.target.value });
                                    clearFieldError('serviceName');
                                }}
                            />
                            {fieldErrors.serviceName ? (
                                <p
                                    id="serviceNameError"
                                    role="alert"
                                    className="ml-2 mt-2 animate-fade-in text-xs font-medium text-red-400"
                                >
                                    {fieldErrors.serviceName}
                                </p>
                            ) : null}
                        </div>

                        {/* Amount + Date */}
                        <div className="flex flex-col gap-5 sm:flex-row">
                            <div className="group flex-1">
                                <label
                                    htmlFor="amountInput"
                                    className={`mb-3 ml-1 block text-sm font-semibold transition-colors ${fieldErrors.amount ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-cyan'}`}
                                >
                                    Сумма списания
                                </label>
                                <div className="relative">
                                    <input
                                        id="amountInput"
                                        type="text"
                                        placeholder="299"
                                        aria-invalid={!!fieldErrors.amount}
                                        aria-describedby={fieldErrors.amount ? 'amountError' : undefined}
                                        className={`w-full rounded-2xl bg-white/5 py-4 pl-5 pr-10 text-[17px] text-white placeholder-slate-500 shadow-inner outline-none transition-all focus:scale-[1.01] focus:bg-white/10 ${fieldErrors.amount ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/50'}`}
                                        value={data.amount ? formatNumberSpace(data.amount) : ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setData({ ...data, amount: raw });
                                            clearFieldError('amount');
                                        }}
                                    />
                                    <span
                                        className="absolute right-5 top-1/2 -translate-y-1/2 font-medium text-slate-400 transition-colors group-focus-within:text-accent-cyan"
                                        aria-hidden="true"
                                    >
                                        ₽
                                    </span>
                                </div>
                                {fieldErrors.amount ? (
                                    <p
                                        id="amountError"
                                        role="alert"
                                        className="ml-2 mt-2 animate-fade-in text-xs font-medium text-red-400"
                                    >
                                        {fieldErrors.amount}
                                    </p>
                                ) : null}
                            </div>

                            {/* Custom Date Picker */}
                            <DatePicker
                                id="dateInput"
                                label="Дата списания"
                                value={data.date}
                                onChange={(date) => setData({ ...data, date })}
                            />
                        </div>

                        {/* Reason Dropdown with Keyboard Navigation */}
                        <div className="group relative">
                            <label
                                className="mb-3 ml-1 flex items-center text-sm font-semibold text-slate-300 transition-colors group-focus-within:text-accent-cyan"
                                id="reason-label"
                            >
                                Причина (кратко)
                                <div className="group/tooltip relative ml-2 inline-flex cursor-help">
                                    <Info className="h-4 w-4 text-slate-400 transition-colors hover:text-accent-cyan" />
                                    <div className="real-glass-panel invisible absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border border-white/20 p-4 text-xs font-normal text-slate-300 opacity-0 shadow-xl transition-all duration-300 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
                                        <span className="mb-1 block font-bold text-white">
                                            Основание для возврата (ст. 32 ЗоЗПП)
                                        </span>
                                        Если вы забыли отключить автопродление, но фактически не пользовались сервисом в
                                        новом периоде, закон в большинстве случаев на вашей стороне. Выбирайте вариант,
                                        максимально близкий к вашей ситуации, или опишите свою причину.
                                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
                                    </div>
                                </div>
                            </label>
                            <button
                                type="button"
                                aria-haspopup="listbox"
                                aria-expanded={isReasonOpen}
                                aria-labelledby="reason-label"
                                className={`flex w-full items-center justify-between rounded-2xl bg-white/5 px-5 py-4 text-left text-[17px] text-white shadow-inner outline-none transition-all ${isReasonOpen ? 'scale-[1.01] border-2 border-accent-cyan/50 bg-white/10 ring-2 ring-accent-cyan/30' : 'border border-white/10 hover:bg-white/10 focus-visible:border-accent-cyan/50 focus-visible:ring-2 focus-visible:ring-accent-cyan/50'}`}
                                onClick={() => setIsReasonOpen(!isReasonOpen)}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        if (!isReasonOpen) setIsReasonOpen(true);
                                        const currentIdx = allReasons.indexOf(reasonDisplayText);
                                        const nextIdx =
                                            e.key === 'ArrowDown'
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
                                <ChevronDown
                                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${isReasonOpen ? 'rotate-180 text-accent-cyan' : ''}`}
                                />
                            </button>
                            {isReasonOpen ? (
                                <div className="fixed inset-0 z-40" onClick={() => setIsReasonOpen(false)}></div>
                            ) : null}
                            <div
                                role="listbox"
                                aria-labelledby="reason-label"
                                className={`real-glass-panel absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ${isReasonOpen ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'}`}
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
                                            className={`w-full cursor-pointer border-b border-white/5 px-5 py-4 text-left transition-colors last:border-0 ${isSelected ? 'bg-accent-cyan/20 font-bold text-accent-cyan' : 'text-slate-200 hover:bg-white/10 hover:text-white'} ${isCustomOption ? 'border-t border-white/10' : ''}`}
                                            onClick={() => {
                                                if (isCustomOption) {
                                                    setData({ ...data, reason: CUSTOM_REASON_VALUE });
                                                } else {
                                                    setData({ ...data, reason, customReason: undefined });
                                                }
                                                setIsReasonOpen(false);
                                            }}
                                        >
                                            {isCustomOption ? (
                                                <Pencil className="mr-2 h-4 w-4 text-accent-cyan" />
                                            ) : null}
                                            {reason}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Reason Textarea – shown when "Другое" is selected */}
                        {isCustomReason && (
                            <div className="group animate-slide-up">
                                <label
                                    htmlFor="customReasonInput"
                                    className={`mb-3 ml-1 block text-sm font-semibold transition-colors ${fieldErrors.customReason ? 'text-red-400' : 'text-slate-300 group-focus-within:text-accent-cyan'}`}
                                >
                                    Опишите свою причину
                                </label>
                                <textarea
                                    id="customReasonInput"
                                    placeholder="Например: Мне не пришло уведомление о списании, я не пользовался сервисом с момента подписки..."
                                    maxLength={500}
                                    rows={3}
                                    aria-invalid={!!fieldErrors.customReason}
                                    aria-describedby={fieldErrors.customReason ? 'customReasonError' : undefined}
                                    className={`w-full resize-none rounded-2xl bg-white/5 px-5 py-4 text-[17px] text-white placeholder-slate-500 shadow-inner outline-none transition-all focus:scale-[1.005] focus:bg-white/10 ${fieldErrors.customReason ? 'border-2 border-red-500/50 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30' : 'border border-white/10 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/50'}`}
                                    value={data.customReason || ''}
                                    onChange={(e) => {
                                        setData({ ...data, customReason: e.target.value });
                                        clearFieldError('customReason');
                                    }}
                                />
                                <div className="mt-1.5 flex justify-between px-2">
                                    {fieldErrors.customReason ? (
                                        <p
                                            id="customReasonError"
                                            role="alert"
                                            className="animate-fade-in text-xs font-medium text-red-400"
                                        >
                                            {fieldErrors.customReason}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-500">
                                            ИИ оценит причину и решит, можно ли составить претензию
                                        </p>
                                    )}
                                    <span
                                        className={`text-xs ${(data.customReason?.length || 0) > 450 ? 'text-amber-400' : 'text-slate-500'}`}
                                    >
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
                                className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-button-glow py-4 text-lg font-bold text-app-bg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,242,254,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-cyan/30 active:scale-[0.96] disabled:opacity-50 disabled:hover:shadow-none"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-app-bg/30 border-t-app-bg"></div>
                                        Создаем магию...
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
                    theme="cyan"
                    loadingTitle="Синтез правовой позиции"
                    loadingSubtitle="Формирование документа..."
                    isRefusal={isRefusal}
                />
            </div>
        </div>
    );
}
