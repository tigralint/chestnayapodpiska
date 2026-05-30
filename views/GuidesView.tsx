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
        return () => {
            document.body.style.overflow = '';
        };
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
        turnstileToken: undefined as string | undefined,
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
                body: JSON.stringify(formInput),
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
            alert(message === 'Server error' ? 'Не удалось отправить форму. Пожалуйста, попробуйте позже.' : message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedGuide = GUIDES_DB.find((g) => g.id === selectedGuideId);

    const filteredGuides = useMemo(() => {
        return GUIDES_DB.filter((g) => {
            if (activeTab !== 'all' && g.type !== activeTab) return false;
            if (deferredQuery) {
                const query = deferredQuery.toLowerCase();
                return (
                    g.service.toLowerCase().includes(query) || g.aliases.some((a) => a.toLowerCase().includes(query))
                );
            }
            return true;
        });
    }, [deferredQuery, activeTab]);

    const guidesJsonLd = useMemo(
        () => ({
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
        }),
        []
    );

    return (
        <div className="relative flex h-full min-h-screen flex-col px-4 pb-12 sm:px-6">
            <SEO
                title="База знаний: инструкции по возврату средств | ЧестнаяПодписка"
                description="Пошаговые инструкции и лайфхаки по возврату денег от популярных сервисов (Яндекс Плюс, ivi, Skillbox, GeekBrains и др.). Умный поиск по базе."
                jsonLd={guidesJsonLd}
            />
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-8 animate-slide-up opacity-0" style={{ animationDelay: '50ms' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="-ml-2 mb-4 flex items-center rounded-full bg-white/10 p-2 text-sm text-white transition-colors active:scale-95 md:mb-6 md:ml-0 md:rounded-none md:bg-transparent md:p-0 md:font-semibold md:text-slate-400 md:hover:text-white md:active:scale-100"
                        aria-label="Вернуться на главную"
                    >
                        <ChevronLeft className="h-5 w-5 md:mr-1" />
                        <span className="hidden md:inline">Вернуться</span>
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight text-white md:mb-3 md:text-4xl md:font-extrabold">
                        <span className="md:hidden">База знаний</span>
                        <span className="hidden md:inline">Навигатор по отпискам</span>
                    </h1>
                    <p className="hidden text-lg text-slate-400 md:block">
                        Компании прячут кнопки отмены. Мы нашли все короткие пути сквозь дарк-паттерны.
                    </p>
                </div>

                {/* --- SEARCH AND FILTERS --- */}
                <div className="mb-8 animate-slide-up opacity-0" style={{ animationDelay: '100ms' }}>
                    <div className="relative mb-5 max-w-2xl">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
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
                            className="block w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-base font-medium text-white placeholder-slate-400 transition-all focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 sm:text-lg"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'all' ? 'bg-accent-cyan text-gray-900 shadow-[0_0_15px_rgba(0,242,254,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            Все ({GUIDES_DB.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'subscription' ? 'bg-accent-cyan text-gray-900 shadow-[0_0_15px_rgba(0,242,254,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            Подписки ({GUIDES_DB.filter((g) => g.type === 'subscription').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('course')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'course' ? 'bg-accent-cyan text-gray-900 shadow-[0_0_15px_rgba(0,242,254,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            Онлайн-курсы ({GUIDES_DB.filter((g) => g.type === 'course').length})
                        </button>
                    </div>
                </div>

                {/* --- GRID OF CARDS --- */}
                <div
                    className={`mb-8 grid w-full grid-cols-1 gap-5 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isPending ? 'opacity-60' : ''}`}
                >
                    {/* Add Pattern Button (First Item) */}
                    {!searchQuery && activeTab === 'all' && (
                        <div
                            className="real-glass-panel group flex h-[140px] animate-slide-up cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-5 text-center opacity-0 transition-all duration-300 hover:border-accent-cyan/30 hover:bg-white/10 active:scale-[0.98]"
                            style={{ animationDelay: '150ms' }}
                            onClick={() => setShowModal(true)}
                        >
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan transition-transform duration-300 group-hover:scale-110">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="mb-1 text-sm font-bold text-white">Новая уловка?</h3>
                            <p className="text-xs text-slate-400">Сообщить о дарк-паттерне</p>
                        </div>
                    )}

                    {/* Guide Cards */}
                    {filteredGuides.map((guide, idx) => (
                        <button
                            key={guide.id}
                            onClick={() => setSelectedGuideId(guide.id)}
                            className="real-glass-panel group flex h-[140px] animate-slide-up flex-col justify-between rounded-2xl border border-white/10 p-5 text-left opacity-0 transition-all duration-300 hover:border-white/30 hover:bg-white/5 active:scale-[0.98]"
                            style={{ animationDelay: `${150 + idx * 30}ms` }}
                        >
                            <div className="flex items-start justify-between">
                                <div
                                    className={`mt-1 h-3 w-3 shrink-0 rounded-full ${guide.iconColor} shadow-[0_0_10px_currentColor] transition-transform duration-300 group-hover:scale-125`}
                                ></div>
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                                    <ChevronLeft className="h-4 w-4 rotate-180" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold leading-tight text-white transition-colors group-hover:text-accent-cyan">
                                    {guide.service}
                                </h3>
                                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                                    {guide.steps.length} шагов отписки
                                </p>
                            </div>
                        </button>
                    ))}

                    {filteredGuides.length === 0 && (
                        <div className="col-span-1 animate-fade-in rounded-2xl border border-dashed border-white/10 py-12 text-center text-slate-400 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                            Нет инструкций по вашему запросу. Вы можете{' '}
                            <button
                                onClick={() => setShowModal(true)}
                                className="font-bold tracking-wide text-accent-cyan hover:underline"
                            >
                                сообщить об уловке
                            </button>{' '}
                            для этого сервиса!
                        </div>
                    )}
                </div>

                {/* --- GUIDE DETAILS MODAL (full-screen on mobile, centered on desktop) --- */}
                {selectedGuide &&
                    createPortal(
                        <div className="fixed inset-0 z-[150] flex items-end justify-center overflow-hidden md:items-center md:p-6">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 animate-fade-in bg-[#05050A]/95 transition-opacity"
                                onClick={() => setSelectedGuideId(null)}
                            ></div>

                            {/* Modal Panel – full height on mobile, max-h on desktop */}
                            <div
                                ref={guideModalRef}
                                className="relative flex max-h-[95vh] w-full max-w-2xl animate-pop-in flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#0a0f1c] shadow-[0_20px_60px_rgba(0,0,0,0.6)] md:max-h-[90vh] md:rounded-[2.5rem]"
                            >
                                {/* Header */}
                                <div className="z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-[#0a0f1c]/95 p-5 md:p-8">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black md:h-12 md:w-12 md:rounded-2xl md:text-xl ${selectedGuide.iconColor} border border-white/10 bg-opacity-20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]`}
                                        >
                                            <span className="text-white drop-shadow-md">
                                                {selectedGuide.service.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold leading-tight text-white md:text-2xl">
                                                {selectedGuide.service}
                                            </h2>
                                            <p className="text-xs text-slate-400 md:text-sm">Инструкция по отмене</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedGuideId(null)}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
                                    >
                                        <X className="h-5 w-5 text-slate-300" />
                                    </button>
                                </div>

                                {/* Content (Scrollable) */}
                                <div
                                    className="custom-scrollbar relative z-20 flex-1 overflow-y-auto overscroll-contain p-5 md:p-8"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    <div className="mb-6">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 md:text-sm">
                                                Пошаговый алгоритм
                                            </h3>
                                        </div>
                                        <div className="relative ml-4 space-y-5 border-l border-white/10 md:space-y-8">
                                            {selectedGuide.steps.map((step, stepIdx) => {
                                                const isDarkPattern =
                                                    step.includes('ДАРК-ПАТТЕРН') || step.includes('ВНИМАНИЕ');

                                                return (
                                                    <div key={stepIdx} className="relative ml-8">
                                                        {/* Timeline Dot */}
                                                        <div
                                                            className={`absolute -left-[48.5px] top-0 flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold shadow-lg ring-4 ring-[#0a0f1c] transition-transform hover:scale-110 ${isDarkPattern ? 'bg-orange-500 text-white shadow-orange-500/50' : 'border border-white/20 bg-white/10 text-slate-300'}`}
                                                        >
                                                            {stepIdx + 1}
                                                        </div>

                                                        {/* Step Content */}
                                                        <div
                                                            className={`rounded-2xl border p-5 transition-colors ${isDarkPattern ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
                                                        >
                                                            {isDarkPattern && (
                                                                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-400">
                                                                    Уловка
                                                                </div>
                                                            )}
                                                            <p
                                                                className={`text-[15px] leading-relaxed ${isDarkPattern ? 'font-medium text-orange-100' : 'text-slate-300'}`}
                                                            >
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
                                        <div className="mb-2 flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                                            <span className="mb-2 text-sm text-slate-400">
                                                Официальный контакт поддержки:
                                            </span>
                                            <a
                                                href={`mailto:${selectedGuide.contactEmail}`}
                                                className="flex items-center gap-2 font-mono text-lg font-bold tracking-wide text-accent-cyan transition-colors hover:text-white"
                                            >
                                                {selectedGuide.contactEmail}
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Action */}
                                <div className="shrink-0 border-t border-white/5 bg-[#0a0f1c] p-6 md:p-8">
                                    <div className="mb-4 text-center">
                                        <p className="text-sm text-slate-400">
                                            Нет кнопки отмены или поддержка игнорирует?
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            navigate(
                                                selectedGuide.type === 'course'
                                                    ? `/course/${encodeURIComponent(selectedGuide.service)}`
                                                    : `/claim/${encodeURIComponent(selectedGuide.service)}`
                                            )
                                        }
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-button-glow py-4 font-bold text-app-bg shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] active:scale-[0.98]"
                                    >
                                        <FileText className="h-5 w-5" />
                                        Сгенерировать досудебную претензию
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                {/* Global Modal Overlay (For New Pattern Form) */}
                {showModal &&
                    createPortal(
                        <div className="fixed inset-0 z-[200] flex animate-fade-in items-center justify-center px-4">
                            <div className="absolute inset-0 bg-[#05050A]/95" onClick={() => setShowModal(false)}></div>

                            <div
                                ref={formModalRef}
                                className="real-glass-panel relative z-10 w-full max-w-md animate-pop-in rounded-[2.5rem] border border-white/20 p-8 shadow-2xl"
                            >
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute right-6 top-6 rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10"
                                    aria-label="Закрыть модальное окно"
                                >
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>

                                {modalState === 'form' ? (
                                    <form onSubmit={handleSubmitPattern}>
                                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan">
                                            <Plus className="h-6 w-6" />
                                        </div>
                                        <h2 className="mb-2 text-2xl font-bold text-white">Сообщить об уловке</h2>
                                        <p className="mb-6 text-sm text-slate-400">
                                            Помогите нам пополнить базу. Мы проверим сервис и добавим инструкцию.
                                        </p>

                                        <div className="mb-6 space-y-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Название сервиса*"
                                                    value={formInput.serviceName}
                                                    onChange={(e) =>
                                                        setFormInput((p) => ({ ...p, serviceName: e.target.value }))
                                                    }
                                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/50"
                                                />
                                            </div>
                                            <div>
                                                <textarea
                                                    required
                                                    placeholder="Как они прячут кнопку? Опишите кратко...*"
                                                    rows={3}
                                                    value={formInput.description}
                                                    onChange={(e) =>
                                                        setFormInput((p) => ({ ...p, description: e.target.value }))
                                                    }
                                                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/50"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Ваши контакты (tg/email), опционально"
                                                    value={formInput.contactInfo}
                                                    onChange={(e) =>
                                                        setFormInput((p) => ({ ...p, contactInfo: e.target.value }))
                                                    }
                                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-slate-500 outline-none transition-all focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-6 flex justify-center">
                                            <Turnstile
                                                ref={turnstileRef}
                                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                                                onSuccess={(token) =>
                                                    setFormInput((prev) => ({ ...prev, turnstileToken: token }))
                                                }
                                                onError={() =>
                                                    setFormInput((prev) => ({ ...prev, turnstileToken: undefined }))
                                                }
                                                onExpire={() =>
                                                    setFormInput((prev) => ({ ...prev, turnstileToken: undefined }))
                                                }
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !formInput.turnstileToken}
                                            className="w-full rounded-2xl bg-button-glow py-4 font-bold text-app-bg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                                        >
                                            {isSubmitting ? 'Отправка...' : 'Отправить информацию'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="animate-pop-in py-8 text-center">
                                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                            <CheckCircle className="h-10 w-10" />
                                        </div>
                                        <h2 className="mb-2 text-2xl font-bold text-white">Принято!</h2>
                                        <p className="mb-4 text-sm text-slate-400">
                                            Спасибо за ваш вклад. Данные успешно отправлены в Telegram.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>,
                        document.body
                    )}
            </div>
        </div>
    );
}
