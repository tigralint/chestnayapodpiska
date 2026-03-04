import { AlertCircle } from '../icons';

interface ApiErrorBannerProps {
    error: string;
}

export function ApiErrorBanner({ error }: ApiErrorBannerProps) {
    return (
        <div className="real-glass border-red-500/30 bg-red-500/10 p-5 rounded-[1.5rem] flex items-start gap-4 animate-pop-in shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
                <h3 className="text-red-300 font-bold mb-1 text-sm uppercase tracking-wider">Ошибка</h3>
                <p className="text-red-200 text-sm leading-relaxed">{error}</p>
                <p className="text-red-300/60 text-xs mt-2">
                    Проблема не уходит? <a href="https://vk.com/fairsubs" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">Напишите нам</a>
                </p>
            </div>
        </div>
    );
}
