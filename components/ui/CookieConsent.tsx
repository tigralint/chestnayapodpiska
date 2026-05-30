import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Info } from '../icons';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user already consented
        const hasConsented = localStorage.getItem('cookieConsent');
        if (!hasConsented) {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up p-4 sm:p-6">
            <div className="real-glass relative mx-auto flex max-w-4xl flex-col items-center gap-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:flex-row sm:gap-6">
                {/* Decorative gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent-cyan/10 via-transparent to-accent-purple/10" />

                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-300 sm:flex">
                    <Info className="h-5 w-5" />
                </div>

                <div className="relative z-10 flex-1 text-center text-[13px] leading-relaxed text-slate-300 sm:text-left sm:text-sm">
                    Мы используем файлы cookie и локальное хранилище браузера (localStorage) для защиты от спама и сбора
                    анонимной аналитики. Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
                    <Link
                        to="/privacy"
                        className="font-medium text-white underline decoration-white/30 underline-offset-2 transition-colors hover:text-accent-cyan"
                    >
                        Политикой конфиденциальности
                    </Link>
                    .
                </div>

                <div className="relative z-10 flex w-full shrink-0 sm:w-auto">
                    <button
                        onClick={handleAccept}
                        className="w-full rounded-2xl bg-white px-8 py-3 font-bold text-slate-900 shadow-lg transition-all hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 active:scale-95 sm:w-auto"
                    >
                        Понятно
                    </button>
                    <button
                        onClick={handleAccept}
                        className="absolute -right-3 -top-3 p-2 text-slate-400 hover:text-white sm:hidden"
                        aria-label="Закрыть"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
