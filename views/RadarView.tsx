import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Radio, AlertCircle, X, CheckCircle } from '../components/icons';
import { ALERTS_SEED } from '../data/radar-seed';
import { SEO } from '../components/ui/SEO';
import { RadarCanvas } from '../components/ui/RadarCanvas';
import { ViewHeader } from '../components/layout/ViewHeader';
import { ConsentCheckbox } from '../components/ui/ConsentCheckbox';
import { useRadar } from '../hooks/useRadar';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { AlertCategory, RadarReport } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAppContext } from '../context/AppContext';

export default function RadarView() {
    const { alerts, loading, error, categoryFilter, setCategoryFilter, submitReport } = useRadar();
    const { addToast } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [modalState, setModalState] = useState<'form' | 'success'>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConsentGiven, setIsConsentGiven] = useState(false);

    const [formInput, setFormInput] = useState<Partial<RadarReport>>({
        serviceName: '',
        city: '',
        amount: undefined,
        description: '',
        category: 'other',
        turnstileToken: undefined,
    });
    const turnstileRef = useRef<TurnstileInstance | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const closeModal = useCallback(() => setShowModal(false), []);
    useFocusTrap(modalRef, showModal, closeModal);

    const displayAlerts = alerts.length > 0 ? alerts : loading ? [] : ALERTS_SEED;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !formInput.turnstileToken ||
            !formInput.serviceName ||
            !formInput.city ||
            !formInput.description ||
            !formInput.category
        )
            return;

        setIsSubmitting(true);
        try {
            await submitReport(formInput as RadarReport);
            setModalState('success');
            setFormInput({
                serviceName: '',
                city: '',
                amount: undefined,
                description: '',
                category: 'other',
                turnstileToken: undefined,
            });
            setIsConsentGiven(false);
            turnstileRef.current?.reset();
            setTimeout(() => {
                setShowModal(false);
                setTimeout(() => setModalState('form'), 500);
            }, 2000);
        } catch (err: unknown) {
            if (import.meta.env.DEV) console.error(err);
            const message = err instanceof Error ? err.message : 'Ошибка отправки';
            addToast(message === 'Server error' ? 'Ошибка отправки. Попробуйте позже.' : message, 'error');
        } finally {
            setIsSubmitting(false);
            turnstileRef.current?.reset();
        }
    };

    return (
        <div className="relative flex h-full min-h-screen flex-col px-4 pb-12 sm:px-6">
            <SEO
                title="Народный Радар | ЧестнаяПодписка"
                description="Живая лента жалоб на скрытые подписки и уловки. Сообщите о проблеме и предупредите других."
            />
            <div className="mx-auto w-full max-w-5xl">
                <ViewHeader
                    title="Народный радар"
                    subtitle="Тепловая карта обмана: живая лента жалоб пользователей."
                    icon={<Radio className="h-10 w-10 animate-pulse text-accent-purple" />}
                />

                {/* Filters Panel */}
                <div
                    className="mb-8 flex animate-slide-up flex-wrap items-center justify-between gap-4 opacity-0"
                    style={{ animationDelay: '100ms' }}
                >
                    <div className="flex flex-wrap gap-2 text-sm">
                        {(['all', 'hidden_cancel', 'auto_renewal', 'refund_refused', 'phishing'] as const).map(
                            (cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`rounded-xl px-4 py-2.5 font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050A] ${categoryFilter === cat ? 'bg-accent-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {cat === 'all'
                                        ? 'Все'
                                        : cat === 'hidden_cancel'
                                          ? 'Скрытые отмены'
                                          : cat === 'auto_renewal'
                                            ? 'Автопродление'
                                            : cat === 'refund_refused'
                                              ? 'Отказ возврата'
                                              : 'Фишинг'}
                                </button>
                            )
                        )}
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-accent-purple/90 px-5 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:bg-accent-purple hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] active:scale-95"
                    >
                        <AlertCircle className="h-4 w-4" /> Сообщить о проблеме
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Radar Animation Graphic */}
                    <div
                        className="real-glass-panel relative flex h-[400px] animate-slide-up flex-col items-center justify-center overflow-hidden rounded-[3rem] border border-accent-purple/20 p-8 opacity-0 lg:col-span-1"
                        style={{ animationDelay: '150ms' }}
                    >
                        <div className="absolute inset-0 bg-accent-purple/5"></div>

                        <div className="relative h-[256px] w-[256px] flex-shrink-0">
                            <RadarCanvas />
                        </div>

                        <div className="relative z-10 mt-8 text-center">
                            <p className="mb-1 line-clamp-1 font-mono text-sm uppercase tracking-widest text-accent-purple">
                                {loading ? 'Соединение...' : 'Live Feed'}
                            </p>
                            <p className="text-sm font-medium text-slate-300">
                                {loading ? 'Загрузка алертов' : `Сканирование завершено. Сигналов: ${alerts.length}`}
                            </p>
                        </div>
                    </div>

                    {/* Alerts Feed */}
                    <div className="space-y-4 lg:col-span-2">
                        {error ? (
                            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-red-400">
                                {error} – показаны старые записи
                            </div>
                        ) : null}

                        {loading && alerts.length === 0 ? (
                            // Skeletons
                            [1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="real-glass-panel h-[140px] animate-pulse rounded-[2rem] border border-white/5 p-6"
                                >
                                    <div className="mb-4 h-4 w-1/3 rounded bg-white/10"></div>
                                    <div className="mb-2 h-3 w-full rounded bg-white/10"></div>
                                    <div className="mb-2 h-3 w-2/3 rounded bg-white/10"></div>
                                </div>
                            ))
                        ) : displayAlerts.length === 0 ? (
                            <div className="rounded-[2rem] border border-dashed border-white/10 py-10 text-center text-slate-400 opacity-70">
                                Новых сигналов по этой категории нет.
                            </div>
                        ) : (
                            displayAlerts.map((alert, idx) => {
                                let colorClasses = 'border-white/10 bg-white/5';
                                let iconColor = 'text-slate-400';
                                let titleColor = 'text-white';

                                if (alert.severity === 'critical') {
                                    colorClasses =
                                        'border-red-500/30 bg-red-500/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]';
                                    iconColor = 'text-red-400';
                                    titleColor = 'text-red-200';
                                } else if (alert.severity === 'high') {
                                    colorClasses = 'border-orange-500/40 bg-orange-500/10';
                                    iconColor = 'text-orange-400';
                                    titleColor = 'text-orange-200';
                                } else if (alert.severity === 'success') {
                                    colorClasses = 'border-emerald-500/30 bg-emerald-500/5';
                                    iconColor = 'text-emerald-400';
                                    titleColor = 'text-emerald-200';
                                }

                                return (
                                    <div
                                        key={alert.id}
                                        className={`real-glass-panel rounded-[2rem] border p-6 ${colorClasses} animate-slide-up cursor-default opacity-0 transition-transform hover:-translate-y-1`}
                                        style={{ animationDelay: `${200 + idx * 100}ms` }}
                                    >
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <MapPin className={`h-4 w-4 ${iconColor}`} />
                                                <span className={`text-sm font-bold tracking-wide ${titleColor}`}>
                                                    {alert.location}
                                                </span>
                                                <span
                                                    className={`ml-2 shrink-0 rounded-md border border-white/10 bg-cover px-2 py-[2px] text-xs text-white/60 ${alert.severity === 'critical' ? 'bg-red-500/20' : 'bg-white/10'}`}
                                                >
                                                    {alert.serviceName}
                                                </span>
                                            </div>
                                            <span className="shrink-0 pl-2 font-mono text-xs text-slate-500">
                                                {alert.time}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-start gap-4">
                                            {alert.severity === 'critical' ? (
                                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 animate-pulse text-red-400" />
                                            ) : null}
                                            <p className="text-sm font-medium leading-relaxed text-slate-200">
                                                {alert.text}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {showModal &&
                createPortal(
                    <div className="fixed inset-0 z-[200] flex animate-fade-in items-center justify-center px-4 py-10">
                        <div className="absolute inset-0 bg-[#05050A]/95" onClick={closeModal}></div>
                        <div
                            ref={modalRef}
                            className="custom-scrollbar relative z-10 max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-[2.5rem] border border-accent-purple/30 bg-[#0a0f1c] p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)]"
                        >
                            <button
                                onClick={closeModal}
                                className="absolute right-6 top-6 rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10"
                                aria-label="Закрыть модальное окно"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {modalState === 'form' ? (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-purple/20 text-accent-purple">
                                            <Radio className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-2xl font-bold leading-tight text-white">Новый сигнал</h2>
                                    </div>

                                    <p className="mb-2 text-sm text-slate-400">
                                        Подайте сигнал на радар, чтобы помочь другим пользователям. Заявка отправится в
                                        бота юристам проекта.
                                    </p>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="serviceName"
                                            className="ml-1 text-sm font-semibold text-slate-300"
                                        >
                                            Название сервиса<span className="ml-1 text-red-400">*</span>
                                        </label>
                                        <input
                                            id="serviceName"
                                            required
                                            type="text"
                                            placeholder="Например: Яндекс.Плюс"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-accent-purple/50"
                                            value={formInput.serviceName}
                                            onChange={(e) =>
                                                setFormInput((p) => ({ ...p, serviceName: e.target.value }))
                                            }
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex w-1/2 flex-col gap-1.5">
                                            <label htmlFor="city" className="ml-1 text-sm font-semibold text-slate-300">
                                                Город<span className="ml-1 text-red-400">*</span>
                                            </label>
                                            <input
                                                id="city"
                                                required
                                                type="text"
                                                placeholder="Например: Москва"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-accent-purple/50"
                                                value={formInput.city}
                                                onChange={(e) => setFormInput((p) => ({ ...p, city: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex w-1/2 flex-col gap-1.5">
                                            <label
                                                htmlFor="amount"
                                                className="ml-1 text-sm font-semibold text-slate-300"
                                            >
                                                Сумма (₽)
                                            </label>
                                            <input
                                                id="amount"
                                                type="number"
                                                placeholder="299"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-accent-purple/50"
                                                value={formInput.amount || ''}
                                                onChange={(e) =>
                                                    setFormInput((p) => ({ ...p, amount: Number(e.target.value) }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="category" className="ml-1 text-sm font-semibold text-slate-300">
                                            Категория нарушения<span className="ml-1 text-red-400">*</span>
                                        </label>
                                        <select
                                            id="category"
                                            required
                                            className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#121827] px-4 py-3 text-slate-300 outline-none focus:ring-2 focus:ring-accent-purple/50"
                                            value={formInput.category}
                                            onChange={(e) =>
                                                setFormInput((p) => ({
                                                    ...p,
                                                    category: e.target.value as AlertCategory,
                                                }))
                                            }
                                        >
                                            <option value="hidden_cancel">Скрытая отмена</option>
                                            <option value="auto_renewal">Неожиданное автопродление</option>
                                            <option value="dark_pattern">Дарк-паттерн при отписке</option>
                                            <option value="phishing">Фишинг или мошенничество</option>
                                            <option value="refund_refused">Отказ в возврате</option>
                                            <option value="other">Другое</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="description"
                                            className="ml-1 text-sm font-semibold text-slate-300"
                                        >
                                            Описание ситуации<span className="ml-1 text-red-400">*</span>
                                        </label>
                                        <textarea
                                            id="description"
                                            required
                                            placeholder="Опишите, что произошло?"
                                            rows={3}
                                            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-accent-purple/50"
                                            value={formInput.description}
                                            onChange={(e) =>
                                                setFormInput((p) => ({ ...p, description: e.target.value }))
                                            }
                                        ></textarea>
                                    </div>

                                    <div className="my-2 flex justify-center">
                                        <Turnstile
                                            ref={turnstileRef}
                                            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                                            onSuccess={(t) => setFormInput((p) => ({ ...p, turnstileToken: t }))}
                                            onError={() => setFormInput((p) => ({ ...p, turnstileToken: undefined }))}
                                            onExpire={() => setFormInput((p) => ({ ...p, turnstileToken: undefined }))}
                                        />
                                    </div>

                                    <ConsentCheckbox checked={isConsentGiven} onChange={setIsConsentGiven}>
                                        Я подтверждаю достоверность информации и осознаю ответственность за клевету.
                                        Согласен(на) с{' '}
                                        <a
                                            href="/privacy"
                                            target="_blank"
                                            className="text-accent-purple hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Политикой
                                        </a>
                                        .
                                    </ConsentCheckbox>

                                    <button
                                        disabled={isSubmitting || !formInput.turnstileToken || !isConsentGiven}
                                        type="submit"
                                        className="mt-2 w-full rounded-xl bg-accent-purple py-4 font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Трансляция сигнала...' : 'Опубликовать на Радаре'}
                                    </button>
                                </form>
                            ) : (
                                <div className="animate-pop-in py-10 text-center">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                        <CheckCircle className="h-10 w-10" />
                                    </div>
                                    <h2 className="mb-2 text-2xl font-bold text-white">Сигнал принят!</h2>
                                    <p className="text-sm text-slate-400">
                                        Ваш рапорт обработан и отправлен в Telegram. Скоро он появится на карте.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
