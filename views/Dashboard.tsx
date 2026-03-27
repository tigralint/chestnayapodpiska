import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, GraduationCap, ArrowRight, BookOpen, Gamepad, Radio } from '../components/icons';
import { GUIDES_DB } from '../data/guides';
import { fuzzyMatch } from '../utils/fuzzyMatch';
import { SearchInput } from '../components/ui/SearchInput';
import { SEO } from '../components/ui/SEO';
import { cn } from '../utils/cn';
import { APP_CONTENT } from '../constants/text';
import { HeroBlobCanvas } from '../components/ui/HeroBlobCanvas';
import { FeatureCard } from '../components/ui/FeatureCard';
import { ToolCard } from '../components/ui/ToolCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const navigateTo = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Performance Optimization: Search results are strictly recalculated only when query changes.
  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (query === '') return [];

    return [
      ...GUIDES_DB.filter(g => fuzzyMatch(query, g.service) || g.aliases.some(a => fuzzyMatch(query, a))),
    ].slice(0, 5);
  }, [searchQuery]);

  const appJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Честная Подписка',
    url: 'https://chestnayapodpiska.vercel.app',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
    description: 'Бесплатный ИИ-сервис для генерации юридически грамотных претензий на возврат средств за подписки и онлайн-курсы.',
  }), []);

  return (
    <div className="w-full flex flex-col items-center">
      <SEO
        title="Честная Подписка — Верните свои деньги"
        description="Бесплатный ИИ-сервис для генерации юридически грамотных претензий на возврат средств за подписки и онлайн-курсы."
        jsonLd={appJsonLd}
      />

      {/* Hero Section */}
      <div className="relative z-20 w-full text-center md:text-left md:flex justify-between items-center mb-16 mt-8 md:mt-0 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="max-w-3xl">
          <div className="md:hidden inline-flex items-center justify-center w-16 h-10 rounded-full real-glass mb-6 px-1.5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden">
            <HeroBlobCanvas />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            {APP_CONTENT.hero.titlePrefix}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple animate-gradient-x">{APP_CONTENT.hero.titleHighlight}</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            {APP_CONTENT.hero.subtitle}
          </p>

          {/* Search Bar */}
          <div className="relative group max-w-2xl z-50">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={APP_CONTENT.hero.searchPlaceholder}
            />

            {/* Quick Search Results */}
            {searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-[#0a0f1c]/98 rounded-3xl p-2 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-fade-in overflow-hidden">
                {searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <div
                      key={result.id}
                      className={cn("flex items-center justify-between p-4 rounded-2xl transition-colors group/item", idx % 2 === 0 ? "bg-white/5" : "hover:bg-white/5")}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent-cyan">
                          {result.type === 'course' ? <GraduationCap className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-white">{result.service}</div>
                          <div className="text-xs text-slate-500">{result.type === 'course' ? APP_CONTENT.search.courseBadge : APP_CONTENT.search.subscriptionBadge}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigateTo(`/guides/${result.id}`)}
                          className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                        >
                          {APP_CONTENT.search.guideBtn}
                        </button>
                        <button
                          onClick={() => navigateTo(result.type === 'course' ? `/course/${encodeURIComponent(result.service)}` : `/claim/${encodeURIComponent(result.service)}`)}
                          className={cn(
                            "px-5 py-3 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all active:scale-95",
                            result.type === 'course' ? "bg-accent-purple text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]" : "bg-button-glow text-app-bg hover:shadow-[0_0_30px_rgba(0,242,254,0.5)]"
                          )}
                        >
                          {APP_CONTENT.search.claimBtn}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center animate-fade-in">
                    <p className="text-slate-300 text-lg mb-6">{APP_CONTENT.search.emptyTitle}</p>
                    <button
                      onClick={() => navigateTo(`/claim/${encodeURIComponent(searchQuery)}`)}
                      className="px-8 py-4 bg-button-glow text-app-bg rounded-2xl font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] transition-all inline-flex items-center gap-2 active:scale-95 hover:scale-[1.02]"
                    >
                      {APP_CONTENT.search.createUniversalBtn} «{searchQuery}»
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          title={APP_CONTENT.features.subscriptions.title}
          description={APP_CONTENT.features.subscriptions.desc}
          icon={<CreditCard className="w-7 h-7 text-accent-blue" />}
          path="/claim"
          accent="blue"
          delay="200ms"
        />
        <FeatureCard
          title={APP_CONTENT.features.courses.title}
          description={APP_CONTENT.features.courses.desc}
          icon={<GraduationCap className="w-7 h-7 text-accent-purple" />}
          path="/course"
          accent="purple"
          delay="300ms"
        />
        <FeatureCard
          title={APP_CONTENT.features.guides.title}
          description={APP_CONTENT.features.guides.desc}
          icon={<BookOpen className="w-7 h-7 text-accent-cyan" />}
          path="/guides"
          accent="cyan"
          delay="400ms"
        />
      </div>

      {/* Interactive Tools */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 shadow-2xl overflow-visible">
        <ToolCard
          title={APP_CONTENT.tools.simulator.title}
          description={APP_CONTENT.tools.simulator.desc}
          icon={<Gamepad className="w-8 h-8 text-accent-pink" />}
          path="/simulator"
          accent="pink"
          delay="500ms"
        />
        <ToolCard
          title={APP_CONTENT.tools.radar.title}
          description={APP_CONTENT.tools.radar.desc}
          icon={<Radio className="w-8 h-8 text-accent-purple" />}
          path="/radar"
          accent="purple"
          delay="600ms"
        />
      </div>
    </div>
  );
}