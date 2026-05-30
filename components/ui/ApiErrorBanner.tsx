import { AlertCircle } from '../icons';
import { APP_LINKS } from '../../constants/links';

interface ApiErrorBannerProps {
    error: string;
}

export function ApiErrorBanner({ error }: ApiErrorBannerProps) {
    return (
        <div className="real-glass flex animate-pop-in items-start gap-4 rounded-[1.5rem] border-red-500/30 bg-red-500/10 p-5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
            <div>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-red-300">Ошибка</h3>
                <p className="text-sm leading-relaxed text-red-200">{error}</p>
                <p className="mt-2 text-xs text-red-300/60">
                    Проблема не уходит?{' '}
                    <a
                        href={APP_LINKS.VK_GROUP}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-cyan hover:underline"
                    >
                        Напишите нам
                    </a>
                </p>
            </div>
        </div>
    );
}
