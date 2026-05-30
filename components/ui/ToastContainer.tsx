import { Toast } from '../../hooks/useToast';
import { X } from '../icons';

const TYPE_STYLES = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
    info: 'border-accent-cyan/30 bg-accent-cyan/10 text-cyan-200',
} as const;

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-20 right-6 z-[200] flex max-w-sm flex-col gap-3 md:bottom-6"
            role="status"
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`real-glass-panel flex animate-slide-in-right items-start gap-3 rounded-2xl border px-5 py-4 shadow-xl ${TYPE_STYLES[toast.type]}`}
                >
                    <p className="flex-1 text-sm font-medium">{toast.message}</p>
                    <button
                        onClick={() => onRemove(toast.id)}
                        className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/10"
                        aria-label="Закрыть уведомление"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
