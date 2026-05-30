import { useNavigate } from 'react-router-dom';
import { Award } from '../icons';

interface SimulatorResultPanelProps {
    reset: () => void;
}

export function SimulatorResultPanel({ reset }: SimulatorResultPanelProps) {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
            <div className="real-glass-panel relative w-full max-w-lg animate-pop-in overflow-hidden rounded-[3rem] border border-accent-pink/30 p-8 text-center shadow-2xl md:p-12">
                <div className="absolute inset-0 bg-gradient-to-b from-accent-pink/10 to-transparent"></div>
                <div className="relative z-10">
                    <div
                        className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent-pink/20 shadow-[0_0_40px_rgba(236,72,153,0.5)] outline-none"
                        tabIndex={0}
                        aria-label="Награда за прохождение"
                    >
                        <Award className="h-12 w-12 text-accent-pink" />
                    </div>
                    <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                        Тренажер пройден!
                    </h2>

                    <p className="mb-8 text-lg leading-relaxed text-slate-300">
                        Вы успешно проанализировали все интерфейсы. Теперь вы вооружены знаниями о корпоративных
                        уловках!
                    </p>

                    <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-inner">
                        <p className="text-sm italic leading-relaxed text-slate-400">
                            <span className="mb-1 block font-bold not-italic text-accent-cyan">Важно знать:</span>{' '}
                            Манипулятивные техники (дарк-паттерны) ограничивают ваше право на свободный выбор. Помните,
                            что доступность отмены и прозрачность условий – признаки добросовестного сервиса. В спорных
                            ситуациях закон о защите прав потребителей помогает восстановить справедливость.
                        </p>
                    </div>

                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <button
                            onClick={reset}
                            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white shadow-sm outline-none transition-all hover:bg-white/10 focus:ring-2 focus:ring-white/20 active:scale-95"
                            aria-label="Пройти тренажер еще раз"
                        >
                            Пройти еще раз
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple px-8 py-4 font-bold text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] outline-none transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] focus:ring-2 focus:ring-accent-pink/50 active:scale-95"
                            aria-label="Вернуться на главную страницу"
                        >
                            Вернуться домой
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
