import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, ChevronDown } from '../components/icons';
import { FAQ_ITEMS } from '../data/faq';
import { SEO } from '../components/ui/SEO';
import { cn } from '../utils/cn';

export default function FaqView() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<number | null>(1);

  const toggleItem = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const faqJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }), []);

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12">
      <SEO
        title="О проекте (FAQ) | ЧестнаяПодписка"
        description="Ответы на главные вопросы о бесплатном правовом навигаторе для возврата денег за подписки и онлайн-курсы."
        jsonLd={faqJsonLd}
      />
      <div className="max-w-4xl mx-auto w-full">

        <div className="md:hidden flex items-center mb-8 mt-2 opacity-0 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white bg-white/10 rounded-full mr-4 active:scale-95 transition-transform">
            <ChevronLeft />
          </button>
          <h1 className="text-2xl font-bold text-white">Что это и зачем?</h1>
        </div>

        <div className="hidden md:block mb-12 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white font-semibold text-sm flex items-center transition-colors mb-6 active:scale-95">
            <ChevronLeft className="w-5 h-5 mr-1" /> Вернуться
          </button>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight flex items-center gap-4">
            <HelpCircle className="w-10 h-10 text-accent-cyan" />
            О проекте (FAQ)
          </h1>
          <p className="text-slate-400 text-lg">Ответы на главные вопросы о вашей цифровой безопасности.</p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "real-glass-panel rounded-[2rem] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] border opacity-0 animate-slide-up",
                  isOpen ? "border-accent-cyan/30 shadow-[0_0_30px_rgba(0,242,254,0.1)] bg-white/10" : "border-white/10 hover:bg-white/5"
                )}
                style={{ animationDelay: `${100 + idx * 50}ms` }}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex justify-between items-center p-6 sm:p-8 text-left active:scale-[0.99] transition-transform"
                >
                  <h3 className={cn(
                    "font-bold text-lg sm:text-xl pr-6 transition-colors duration-300",
                    isOpen ? "text-white" : "text-slate-200 group-hover:text-white"
                  )}>
                    {item.question}
                  </h3>
                  <div className={cn(
                    "shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] border border-white/10",
                    isOpen ? "rotate-180 bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30" : "text-slate-400"
                  )}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                <div
                  className={cn(
                    "transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden",
                    isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-6 pb-8 sm:px-8 sm:pb-8 pt-0">
                    <p className="text-[16px] text-slate-300 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}