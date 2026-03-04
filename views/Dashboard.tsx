import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, GraduationCap, ShieldAlert, ArrowRight, BookOpen, Gamepad, Radio, HelpCircle } from '../components/icons';
import { GUIDES_DB } from '../data/guides';
import { fuzzyMatch } from '../utils/fuzzyMatch';
import { SearchInput } from '../components/ui/SearchInput';
import { SEO } from '../components/ui/SEO';

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

    return GUIDES_DB.filter(guide =>
      fuzzyMatch(query, guide.service) ||
      guide.aliases.some(alias => fuzzyMatch(query, alias))
    );
  }, [searchQuery]);

  return (
    <div className="px-4 sm:px-6 flex flex-col items-center max-w-5xl mx-auto">
      <SEO
        title="ЧестнаяПодписка — Возврат денег за подписки и онлайн-курсы по закону"
        description="Бесплатный сервис генерации юридически грамотных досудебных претензий. Верните деньги за нежелательные подписки и навязанные онлайн-курсы по ст. 32 ЗоЗПП РФ."
      />

      {/* Hero Section */}
      <div className="w-full text-center md:text-left md:flex justify-between items-center mb-16 mt-8 md:mt-0 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="max-w-3xl">
          <div className="md:hidden inline-flex items-center justify-center w-16 h-10 rounded-full real-glass mb-6 px-1.5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue shadow-[0_0_15px_rgba(0,242,254,0.6)] animate-pulse-slow"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Отменяйте подписки и возвращайте деньги<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple">по закону.</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg md:text-xl leading-relaxed max-w-2xl mx-auto md:mx-0">
            Бесплатный правовой навигатор и образовательная платформа. Формируем цифровую самооборону для всех: от школьников до пенсионеров.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center md:justify-start">
            <button
              onClick={() => navigateTo('/faq')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-[1.2rem] font-bold transition-all border border-white/10 shadow-sm flex items-center justify-center gap-3 active:scale-95 w-fit mx-auto md:mx-0"
            >
              <HelpCircle className="w-5 h-5 text-accent-cyan" />
              Что это и зачем? (FAQ)
            </button>
          </div>
        </div>
      </div>

      {/* Triage Search - VisionOS style command palette */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Какой сервис списал деньги? (например, Яндекс или Skillbox)"
      />

      <div className="w-full relative -mt-12 mb-16 z-20">
        {/* Dropdown Results */}
        {searchQuery && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl real-glass-panel rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden p-3 animate-pop-in border border-white/10 transform-gpu">
            {searchResults.length > 0 ? (
              searchResults.map(result => (
                <div key={result.id} className="p-4 hover:bg-white/5 rounded-[1.5rem] transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[1rem] ${result.iconColor} bg-opacity-20 flex items-center justify-center text-white font-bold shrink-0 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]`}>
                      <span className="drop-shadow-md">{result.service.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{result.service}</h4>
                      <p className="text-sm text-slate-400 font-medium">Есть пошаговая инструкция</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateTo('/guides')}
                      className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/5 active:scale-95"
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

      {/* Core Features Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <button
          onClick={() => navigateTo('/claim')}
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
            <h2 className="text-2xl font-bold mb-3 text-white">Возврат за подписку</h2>
            <p className="text-slate-400 leading-relaxed text-sm">Скрытое автопродление или забытый триал. Сформируйте юридически точное требование.</p>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/course')}
          className="group relative text-left real-glass rounded-[2.5rem] p-8 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden opacity-0 animate-slide-up"
          style={{ animationDelay: '250ms' }}
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
            <h2 className="text-2xl font-bold mb-3 text-white">Отказ от курса</h2>
            <p className="text-slate-400 leading-relaxed text-sm">Рассчитайте справедливую сумму возврата без незаконных штрафов EdTech школ.</p>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/guides')}
          className="group relative text-left real-glass rounded-[2.5rem] p-8 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,242,254,0.12)] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden opacity-0 animate-slide-up"
          style={{ animationDelay: '300ms' }}
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
            <h2 className="text-2xl font-bold mb-3 text-white">База знаний</h2>
            <p className="text-slate-400 leading-relaxed text-sm">Сборник инструкций: как найти запрятанную кнопку отписки в популярных экосистемах.</p>
          </div>
        </button>
      </div>

      {/* Educational Environment Modules */}
      <div className="w-full text-left mb-6 ml-2 opacity-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <h3 className="text-2xl font-bold text-white tracking-tight">Образовательная среда</h3>
        <p className="text-slate-400">Прокачай свои навыки противостояния корпорациям.</p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity">
        <button
          onClick={() => navigateTo('/simulator')}
          className="bg-white/5 hover:bg-white/10 rounded-[2rem] p-6 border border-white/5 hover:border-accent-pink/30 hover:shadow-[0_0_25px_rgba(236,72,153,0.12)] active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-start gap-5 group text-left opacity-0 animate-slide-up"
          style={{ animationDelay: '450ms' }}
        >
          <div className="w-14 h-14 rounded-[1.2rem] bg-accent-pink/10 flex items-center justify-center text-accent-pink shrink-0 border border-accent-pink/20 shadow-[0_0_15px_rgba(236,72,153,0.2)] group-hover:scale-110 transition-transform duration-500">
            <Gamepad className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1 text-lg group-hover:text-accent-pink transition-colors duration-300">Тренажер самообороны</h3>
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">Геймифицированный тест. Научись визуально находить спрятанные кнопки отмены подписок на мок-экранах.</p>
            <span className="text-sm font-bold text-accent-pink flex items-center gap-1 group-hover:gap-2 transition-all">Пройти тест <ArrowRight className="w-4 h-4" /></span>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/radar')}
          className="bg-white/5 hover:bg-white/10 rounded-[2rem] p-6 border border-white/5 hover:border-accent-purple/30 hover:shadow-[0_0_25px_rgba(139,92,246,0.12)] active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-start gap-5 group text-left relative overflow-hidden opacity-0 animate-slide-up"
          style={{ animationDelay: '500ms' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/10 blur-[50px] rounded-full group-hover:bg-accent-purple/20 transition-all duration-700"></div>
          <div className="w-14 h-14 rounded-[1.2rem] bg-accent-purple/10 flex items-center justify-center text-accent-purple shrink-0 border border-accent-purple/20 relative group-hover:scale-110 transition-transform duration-500">
            <Radio className="w-7 h-7 relative z-10" />
            <div className="absolute inset-0 rounded-[1.2rem] border border-accent-purple animate-ping opacity-20"></div>
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-white mb-1 text-lg group-hover:text-accent-purple transition-colors duration-300">Народный радар</h3>
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">Посмотри, какие сервисы прямо сейчас массово списывают деньги у пользователей.</p>
            <span className="text-sm font-bold text-accent-purple flex items-center gap-1 group-hover:gap-2 transition-all">Открыть карту <ArrowRight className="w-4 h-4" /></span>
          </div>
        </button>
      </div>
    </div>
  );
}