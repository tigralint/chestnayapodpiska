import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, GraduationCap, ArrowRight, BookOpen, Gamepad, Radio, Folder } from '../components/icons';
import { GUIDES_DB } from '../data/guides';
import { fuzzyMatch } from '../utils/fuzzyMatch';
import { SearchInput } from '../components/ui/SearchInput';
import { SEO } from '../components/ui/SEO';
import { cn } from '../utils/cn';
import { APP_CONTENT } from '../constants/text';
import { HeroBlobCanvas } from '../components/ui/HeroBlobCanvas';
import { FeatureCard } from '../components/ui/FeatureCard';
import { ToolCard } from '../components/ui/ToolCard';
import { useClaimHistory } from '../hooks/useClaimHistory';
import { ClaimHistoryList } from '../components/ui/ClaimHistoryList';

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeResultIdx, setActiveResultIdx] = useState(-1);
    const { history, updateClaimStatus, deleteClaim } = useClaimHistory();

    const navigateTo = useCallback(
        (path: string) => {
            navigate(path);
        },
        [navigate]
    );

    // Performance Optimization: Search results are strictly recalculated only when query changes.
    const searchResults = useMemo(() => {
        const query = searchQuery.trim();
        if (query === '') return [];

        return [
            ...GUIDES_DB.filter((g) => fuzzyMatch(query, g.service) || g.aliases.some((a) => fuzzyMatch(query, a))),
        ].slice(0, 5);
    }, [searchQuery]);

    const appJsonLd = useMemo(
        () => ({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Честная Подписка',
            url: 'https://chestnayapodpiska.vercel.app',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'All',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
            description:
                'Бесплатный ИИ-сервис для генерации юридически грамотных претензий на возврат средств за подписки и онлайн-курсы.',
        }),
        []
    );

    /** Handle keyboard navigation in search dropdown */
    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (searchQuery.trim() === '') return;
            const total = searchResults.length;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveResultIdx((prev) => (prev < total - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveResultIdx((prev) => (prev > 0 ? prev - 1 : total - 1));
            } else if (e.key === 'Enter' && activeResultIdx >= 0 && activeResultIdx < total) {
                e.preventDefault();
                const result = searchResults[activeResultIdx];
                if (result) {
                    navigateTo(
                        result.type === 'course'
                            ? `/course/${encodeURIComponent(result.service)}`
                            : `/claim/${encodeURIComponent(result.service)}`
                    );
                }
            } else if (e.key === 'Escape') {
                setSearchQuery('');
                setActiveResultIdx(-1);
            }
        },
        [searchQuery, searchResults, activeResultIdx, navigateTo]
    );

    return (
        <div className="flex w-full flex-col items-center">
            <SEO
                title="Честная Подписка – Верните свои деньги"
                description="Бесплатный ИИ-сервис для генерации юридически грамотных претензий на возврат средств за подписки и онлайн-курсы."
                jsonLd={appJsonLd}
            />

            {/* Hero Section */}
            <div
                className="relative z-20 mb-16 mt-8 w-full animate-slide-up items-center justify-between text-center opacity-0 md:mt-0 md:flex md:text-left"
                style={{ animationDelay: '50ms' }}
            >
                <div className="max-w-3xl">
                    <div className="real-glass mb-6 inline-flex h-10 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 px-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] md:hidden">
                        <HeroBlobCanvas />
                    </div>
                    <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
                        {APP_CONTENT.hero.titlePrefix}
                        <br />
                        <span className="animate-gradient-x bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple bg-clip-text text-transparent">
                            {APP_CONTENT.hero.titleHighlight}
                        </span>
                    </h1>
                    <p className="mb-10 max-w-2xl text-xl leading-relaxed text-slate-400 md:text-2xl">
                        {APP_CONTENT.hero.subtitle}
                    </p>

                    {/* Search Bar */}
                    <div className="group relative z-50 max-w-2xl" onKeyDown={handleSearchKeyDown}>
                        <SearchInput
                            value={searchQuery}
                            onChange={(v) => {
                                setSearchQuery(v);
                                setActiveResultIdx(-1);
                            }}
                            placeholder={APP_CONTENT.hero.searchPlaceholder}
                        />

                        {/* Quick Search Results */}
                        {searchQuery.trim() !== '' && (
                            <div
                                role="listbox"
                                aria-label="Результаты поиска"
                                className="bg-[#0a0f1c]/98 absolute left-0 right-0 top-full z-50 mt-4 animate-fade-in overflow-hidden rounded-3xl border border-white/20 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            >
                                {searchResults.length > 0 ? (
                                    searchResults.map((result, idx) => (
                                        <div
                                            key={result.id}
                                            id={`search-result-${idx}`}
                                            role="option"
                                            aria-selected={activeResultIdx === idx}
                                            className={cn(
                                                'group/item flex items-center justify-between rounded-2xl p-4 transition-colors',
                                                activeResultIdx === idx
                                                    ? 'bg-white/10 ring-1 ring-accent-cyan/30'
                                                    : idx % 2 === 0
                                                      ? 'bg-white/5'
                                                      : 'hover:bg-white/5'
                                            )}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-accent-cyan">
                                                    {result.type === 'course' ? (
                                                        <GraduationCap className="h-5 w-5" />
                                                    ) : (
                                                        <CreditCard className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{result.service}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {result.type === 'course'
                                                            ? APP_CONTENT.search.courseBadge
                                                            : APP_CONTENT.search.subscriptionBadge}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover/item:opacity-100">
                                                <button
                                                    onClick={() => navigateTo(`/guides/${result.id}`)}
                                                    className="px-4 py-2 text-xs font-bold text-slate-400 transition-colors hover:text-white"
                                                >
                                                    {APP_CONTENT.search.guideBtn}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        navigateTo(
                                                            result.type === 'course'
                                                                ? `/course/${encodeURIComponent(result.service)}`
                                                                : `/claim/${encodeURIComponent(result.service)}`
                                                        )
                                                    }
                                                    className={cn(
                                                        'rounded-xl px-5 py-3 text-sm font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all active:scale-95',
                                                        result.type === 'course'
                                                            ? 'bg-accent-purple text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]'
                                                            : 'bg-button-glow text-app-bg hover:shadow-[0_0_30px_rgba(0,242,254,0.5)]'
                                                    )}
                                                >
                                                    {APP_CONTENT.search.claimBtn}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="animate-fade-in p-8 text-center">
                                        <p className="mb-6 text-lg text-slate-300">{APP_CONTENT.search.emptyTitle}</p>
                                        <button
                                            onClick={() => navigateTo(`/claim/${encodeURIComponent(searchQuery)}`)}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-button-glow px-8 py-4 font-bold text-app-bg shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] active:scale-95"
                                        >
                                            {APP_CONTENT.search.createUniversalBtn} «{searchQuery}»
                                            <ArrowRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick jump to history if exists */}
                    {history.length > 0 && (
                        <div className="mb-8 mt-6 flex w-full max-w-fit animate-fade-in items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <span className="flex items-center text-slate-300">
                                <Folder className="mr-2 h-4 w-4" /> У вас есть сохраненные претензии: {history.length}
                            </span>
                            <button
                                onClick={() => {
                                    document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="ml-auto rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-accent-cyan shadow-sm transition-transform hover:underline active:scale-95"
                            >
                                Посмотреть
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Core Features Grid */}
            <div className="mb-12 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                <FeatureCard
                    title={APP_CONTENT.features.subscriptions.title}
                    description={APP_CONTENT.features.subscriptions.desc}
                    icon={<CreditCard className="h-7 w-7 text-accent-blue" />}
                    path="/claim"
                    accent="blue"
                    delay="200ms"
                />
                <FeatureCard
                    title={APP_CONTENT.features.courses.title}
                    description={APP_CONTENT.features.courses.desc}
                    icon={<GraduationCap className="h-7 w-7 text-accent-purple" />}
                    path="/course"
                    accent="purple"
                    delay="300ms"
                />
                <FeatureCard
                    title={APP_CONTENT.features.guides.title}
                    description={APP_CONTENT.features.guides.desc}
                    icon={<BookOpen className="h-7 w-7 text-accent-cyan" />}
                    path="/guides"
                    accent="cyan"
                    delay="400ms"
                />
            </div>

            {/* Interactive Tools */}
            <div className="mb-16 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                <ToolCard
                    title={APP_CONTENT.tools.simulator.title}
                    description={APP_CONTENT.tools.simulator.desc}
                    icon={<Gamepad className="h-8 w-8 text-accent-pink" />}
                    path="/simulator"
                    accent="pink"
                    delay="500ms"
                />
                <ToolCard
                    title={APP_CONTENT.tools.radar.title}
                    description={APP_CONTENT.tools.radar.desc}
                    icon={<Radio className="h-8 w-8 text-accent-purple" />}
                    path="/radar"
                    accent="purple"
                    delay="600ms"
                />
            </div>

            {history.length > 0 && (
                <ClaimHistoryList history={history} onUpdateStatus={updateClaimStatus} onDelete={deleteClaim} />
            )}
        </div>
    );
}
