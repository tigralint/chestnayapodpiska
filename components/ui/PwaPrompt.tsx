import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { cn } from '../../utils/cn';

export function PwaPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            if (import.meta.env.DEV) console.warn('SW Registered:', r);
        },
        onRegisterError(error: Error) {
            if (import.meta.env.DEV) console.error('SW registration error', error);
        },
    });

    const [isVisible, setIsVisible] = useState(false);
    // Added a state to physically unmount the component AFTER the animation
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (needRefresh) {
            setShouldRender(true);
            // Give react time to mount before triggering animation
            requestAnimationFrame(() => setIsVisible(true));
        }
    }, [needRefresh]);

    const closePrompt = () => {
        setIsVisible(false); // trigger exit animation
    };

    const handleTransitionEnd = () => {
        if (!isVisible) {
            setNeedRefresh(false);
            setShouldRender(false);
        }
    };

    if (!shouldRender) return null;

    return (
        <div
            onTransitionEnd={handleTransitionEnd}
            className={cn(
                "fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[100] max-w-sm real-glass-panel border-accent-cyan/30 shadow-[0_0_40px_rgba(0,242,254,0.15)] p-5 rounded-2xl transition-all duration-300 transform",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            )}
        >
            <div className="mb-4">
                <h3 className="text-white font-bold text-lg mb-1">Доступно обновление 🚀</h3>
                <p className="text-slate-300 text-sm">Мы выкатили новую версию платформы. Обновите страницу, чтобы получить последние фичи.</p>
            </div>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={closePrompt}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold"
                >
                    Позже
                </button>
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="px-5 py-2 bg-button-glow text-app-bg rounded-xl font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] transition-shadow text-sm"
                >
                    Обновить сейчас
                </button>
            </div>
        </div>
    );
}
