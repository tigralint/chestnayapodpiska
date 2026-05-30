import { useState, useMemo } from 'react';
import { ChevronDown, HelpCircle } from '../components/icons';
import { FAQ_ITEMS } from '../data/faq';
import { SEO } from '../components/ui/SEO';
import { cn } from '../utils/cn';
import { ViewHeader } from '../components/layout/ViewHeader';

export default function FaqView() {
    const [openId, setOpenId] = useState<number | null>(1);

    const toggleItem = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    const faqJsonLd = useMemo(
        () => ({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
        }),
        []
    );

    return (
        <div className="flex h-full flex-col px-4 pb-12 sm:px-6">
            <SEO
                title="О проекте (FAQ) | ЧестнаяПодписка"
                description="Ответы на главные вопросы о бесплатном правовом навигаторе для возврата денег за подписки и онлайн-курсы."
                jsonLd={faqJsonLd}
            />
            <div className="mx-auto w-full max-w-3xl">
                <ViewHeader
                    title="О проекте (FAQ)"
                    subtitle="Ответы на главные вопросы о вашей цифровой безопасности."
                    icon={<HelpCircle className="h-10 w-10 text-accent-cyan" />}
                />

                <div className="space-y-4">
                    {FAQ_ITEMS.map((item, idx) => {
                        const isOpen = openId === item.id;
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    'real-glass-panel animate-slide-up overflow-hidden rounded-[2rem] border opacity-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                                    isOpen
                                        ? 'border-accent-cyan/30 bg-white/10 shadow-[0_0_30px_rgba(0,242,254,0.1)]'
                                        : 'border-white/10 hover:bg-white/5'
                                )}
                                style={{ animationDelay: `${100 + idx * 50}ms` }}
                            >
                                <button
                                    onClick={() => toggleItem(item.id)}
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-panel-${item.id}`}
                                    className="flex w-full items-center justify-between p-6 text-left transition-transform focus-visible:rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-cyan/50 active:scale-[0.99] sm:p-8"
                                >
                                    <h3
                                        className={cn(
                                            'pr-6 text-lg font-bold transition-colors duration-300 sm:text-xl',
                                            isOpen ? 'text-white' : 'text-slate-200 group-hover:text-white'
                                        )}
                                    >
                                        {item.question}
                                    </h3>
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                                            isOpen
                                                ? 'rotate-180 border-accent-cyan/30 bg-accent-cyan/20 text-accent-cyan'
                                                : 'text-slate-400'
                                        )}
                                    >
                                        <ChevronDown className="h-5 w-5" />
                                    </div>
                                </button>

                                <div
                                    id={`faq-panel-${item.id}`}
                                    role="region"
                                    aria-labelledby={`faq-btn-${item.id}`}
                                    hidden={!isOpen}
                                    className={cn(
                                        'overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                                        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                    )}
                                >
                                    <div className="px-6 pb-8 pt-0 sm:px-8 sm:pb-8">
                                        <p className="text-[16px] leading-relaxed text-slate-300">{item.answer}</p>
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
