import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, GraduationCap, ArrowRight, BookOpen, Gamepad, Radio } from '../components/icons';
import { GUIDES_DB } from '../data/guides';
import { fuzzyMatch } from '../utils/fuzzyMatch';
import { SearchInput } from '../components/ui/SearchInput';
import { SEO } from '../components/ui/SEO';
import { preloadRoute } from '../utils/preload';

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

  return (
    <div className="w-full flex flex-col items-center">
      <SEO
        title="Честная Подписка — Верните свои деньги"
        description="Бесплатный ИИ-сервис для генерации юридически грамотных претензий на возврат средств за подписки и онлайн-курсы."
      />

      {/* Hero Section */}
      <div className="relative z-20 w-full text-center md:text-left md:flex justify-between items-center mb-16 mt-8 md:mt-0 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="max-w-3xl">
          <div className="md:hidden inline-flex items-center justify-center w-16 h-10 rounded-full real-glass mb-6 px-1.5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue shadow-[0_0_15px_rgba(0,242,254,0.6)] animate-pulse-slow"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Отменяйте подписки и возвращайте деньги<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple animate-gradient-x">без лишней головной боли</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            Помогаем составить юридически грамотную претензию за 2 минуты. Бесплатно. Навсегда.
          </p>

          {/* Search Bar */}
          <div className="relative group max-w-2xl z-50">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Введите название сервиса (например, VK Музыка, Skypro...)"
            />

            {/* Quick Search Results */}
            {searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-[#0a0f1c]/95 backdrop-blur-2xl rounded-3xl p-2 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-fade-in overflow-hidden">
                {searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors group/item"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent-cyan">
                          {result.type === 'course' ? <GraduationCap className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-white">{result.service}</div>
                          <div className="text-xs text-slate-500">{result.type === 'course' ? 'Онлайн-курс' : 'Подписка'}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigateTo(`/guides/${result.id}`)}
                          className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                        >
                          Инструкция
                        </button>
                        <button
                          onClick={() => navigateTo(result.type === 'course' ? `/course/${encodeURIComponent(result.service)}` : `/claim/${encodeURIComponent(result.service)}`)}
                          className="px-5 py-3 bg-button-glow text-app-bg rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] transition-all active:scale-95"
                        >
                          Претензия
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center animate-fade-in">
                    <p className="text-slate-300 text-lg mb-6">Мы пока не добавили инструкцию для этого сервиса, но можем составить универсальную претензию.</p>
                    <button
                      onClick={() => navigateTo(`/claim/${encodeURIComponent(searchQuery)}`)}
                      className="px-8 py-4 bg-button-glow text-app-bg rounded-2xl font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] transition-all inline-flex items-center gap-2 active:scale-95 hover:scale-[1.02]"
                    >
                      Создать документ для «{searchQuery}»
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
        <button
          onClick={() => navigateTo('/claim')}
          onMouseEnter={() => preloadRoute('/claim')}
          className="group relative text-left real-glass rounded-[2.5rem] p-8 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(79,172,254,0.15)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden opacity-0 animate-slide-up"
          style={{ animationDelay: '200ms' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:bg-accent-blue/20 transition-colors duration-500">
                <CreditCard className="w-7 h-7 text-accent-blue" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-app-bg transition-colors duration-300">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Возврат подписок</h3>
            <p className="text-slate-400 leading-relaxed">Вернем деньги за музыку, кинотеатры и любые сервисы, которые списали лишнее.</p>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/course')}
          onMouseEnter={() => preloadRoute('/course')}
          className="group relative text-left real-glass rounded-[2.5rem] p-8 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden opacity-0 animate-slide-up"
          style={{ animationDelay: '300ms' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:bg-accent-purple/20 transition-colors duration-500">
                <GraduationCap className="w-7 h-7 text-accent-purple" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-app-bg transition-colors duration-300">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Обучающие курсы</h3>
            <p className="text-slate-400 leading-relaxed">Помогаем расторгнуть договор с онлайн-школами и вернуть деньги за не пройденные уроки.</p>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/guides')}
          onMouseEnter={() => preloadRoute('/guides')}
          className="group relative text-left real-glass rounded-[2.5rem] p-8 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden opacity-0 animate-slide-up"
          style={{ animationDelay: '400ms' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:bg-accent-cyan/20 transition-colors duration-500">
                <BookOpen className="w-7 h-7 text-accent-cyan" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-app-bg transition-colors duration-300">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">База знаний</h3>
            <p className="text-slate-400 leading-relaxed">Пошаговые инструкции по возврату средств для популярных сервисов и юридические советы.</p>
          </div>
        </button>
      </div>

      {/* Interactive Tools */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 shadow-2xl overflow-visible">
        <div
          className="group relative real-glass-panel rounded-[2rem] p-4 flex items-center gap-6 border border-white/5 hover:border-accent-pink/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] transition-all cursor-pointer opacity-0 animate-slide-up"
          onClick={() => navigateTo('/simulator')}
          onMouseEnter={() => preloadRoute('/simulator')}
          style={{ animationDelay: '500ms' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-pink/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
            <Gamepad className="w-8 h-8 text-accent-pink" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white mb-1">Тренажер отписки</h4>
            <p className="text-sm text-slate-400">Попробуйте найти кнопку отмены в самых хитрых интерфейсах.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-600 ml-auto mr-4 group-hover:text-white transition-colors" />
        </div>

        <div
          className="group relative real-glass-panel rounded-[2rem] p-4 flex items-center gap-6 border border-white/5 hover:border-accent-purple/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all cursor-pointer opacity-0 animate-slide-up"
          onClick={() => navigateTo('/radar')}
          onMouseEnter={() => preloadRoute('/radar')}
          style={{ animationDelay: '600ms' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
            <Radio className="w-8 h-8 text-accent-purple" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white mb-1">Народный радар</h4>
            <p className="text-sm text-slate-400">Узнайте, на какие сервисы сейчас жалуются чаще всего.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-600 ml-auto mr-4 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  );
}