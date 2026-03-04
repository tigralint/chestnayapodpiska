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
        <div className="fixed bottom-20 md:bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm" role="status" aria-live="polite">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`real-glass-panel rounded-2xl px-5 py-4 border shadow-xl animate-slide-in-right flex items-start gap-3 ${TYPE_STYLES[toast.type]}`}
                >
                    <p className="text-sm font-medium flex-1">{toast.message}</p>
                    <button
                        onClick={() => onRemove(toast.id)}
                        className="shrink-0 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Закрыть уведомление"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
