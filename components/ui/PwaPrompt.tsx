import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { cn } from '../../utils/cn';
import { Rocket } from '../icons';

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
                'real-glass-panel fixed bottom-24 right-4 z-[100] max-w-sm transform rounded-2xl border-accent-cyan/30 p-5 shadow-[0_0_40px_rgba(0,242,254,0.15)] transition-all duration-300 sm:bottom-6 sm:right-6',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            )}
        >
            <div className="mb-4">
                <h3 className="mb-1 flex items-center text-lg font-bold text-white">
                    Доступно обновление <Rocket className="ml-2 h-5 w-5 text-accent-cyan" />
                </h3>
                <p className="text-sm text-slate-300">
                    Мы выкатили новую версию платформы. Обновите страницу, чтобы получить последние фичи.
                </p>
            </div>
            <div className="flex justify-end gap-3">
                <button
                    onClick={closePrompt}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                    Позже
                </button>
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="rounded-xl bg-button-glow px-5 py-2 text-sm font-bold text-app-bg shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-shadow hover:shadow-[0_0_30px_rgba(0,242,254,0.5)]"
                >
                    Обновить сейчас
                </button>
            </div>
        </div>
    );
}
