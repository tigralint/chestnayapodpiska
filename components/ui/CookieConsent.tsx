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
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 animate-slide-up">
            <div className="max-w-4xl mx-auto real-glass bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/10 via-transparent to-accent-purple/10 pointer-events-none" />
                
                <div className="shrink-0 hidden sm:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center text-slate-300">
                    <Info className="w-5 h-5" />
                </div>

                <div className="flex-1 text-[13px] sm:text-sm text-slate-300 leading-relaxed text-center sm:text-left relative z-10">
                    Мы используем файлы cookie и локальное хранилище браузера (localStorage) для защиты от спама и сбора анонимной аналитики. 
                    Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
                    <Link to="/privacy" className="text-white font-medium hover:text-accent-cyan underline decoration-white/30 underline-offset-2 transition-colors">
                        Политикой конфиденциальности
                    </Link>.
                </div>

                <div className="flex shrink-0 w-full sm:w-auto relative z-10">
                    <button
                        onClick={handleAccept}
                        className="w-full sm:w-auto px-8 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-200 active:scale-95 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                    >
                        Понятно
                    </button>
                    <button 
                        onClick={handleAccept}
                        className="absolute -top-3 -right-3 sm:hidden p-2 text-slate-400 hover:text-white"
                        aria-label="Закрыть"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
