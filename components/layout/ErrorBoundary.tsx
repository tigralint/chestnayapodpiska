import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from '../icons';

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
                <div className="flex items-center justify-center min-h-screen bg-app-bg text-slate-200 px-6">
                    <div className="real-glass-panel p-8 rounded-[2.5rem] max-w-lg w-full text-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">Ой, что-то пошло не так</h1>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Компонент крашнулся из-за непредвиденной ошибки. Пожалуйста, перезагрузите страницу.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-red-500/30 active:scale-95 transition-all mb-4"
                        >
                            Перезагрузить страницу
                        </button>
                        <p className="text-slate-500 text-sm">
                            Ошибка повторяется?{' '}
                            <a href="https://vk.com/fairsubs" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">
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
