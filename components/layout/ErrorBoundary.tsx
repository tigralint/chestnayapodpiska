import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from '../icons';
import { APP_LINKS } from '../../constants/links';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = { hasError: false };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (import.meta.env.DEV) console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-app-bg px-6 text-slate-200">
                    <div className="real-glass-panel w-full max-w-lg rounded-[2.5rem] border border-red-500/20 p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="mb-4 text-2xl font-bold text-white">Ой, что-то пошло не так</h1>
                        <p className="mb-8 leading-relaxed text-slate-400">
                            Компонент крашнулся из-за непредвиденной ошибки. Пожалуйста, перезагрузите страницу.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mb-4 rounded-xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-red-500/30 active:scale-95"
                        >
                            Перезагрузить страницу
                        </button>
                        <p className="text-sm text-slate-500">
                            Ошибка повторяется?{' '}
                            <a
                                href={APP_LINKS.VK_GROUP}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-cyan hover:underline"
                            >
                                Напишите нам в ВК
                            </a>
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
