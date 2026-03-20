import { useNavigate } from 'react-router-dom';
import { Award } from '../icons';

interface SimulatorResultPanelProps {
    reset: () => void;
}

export function SimulatorResultPanel({ reset }: SimulatorResultPanelProps) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="real-glass-panel rounded-[3rem] p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden shadow-2xl border border-accent-pink/30 animate-pop-in">
                <div className="absolute inset-0 bg-gradient-to-b from-accent-pink/10 to-transparent"></div>
                <div className="relative z-10">
                    <div className="w-24 h-24 mx-auto bg-accent-pink/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(236,72,153,0.5)] outline-none" tabIndex={0} aria-label="Награда за прохождение">
                        <Award className="w-12 h-12 text-accent-pink" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Тренажер пройден!</h2>

                    <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                        Вы успешно проанализировали все интерфейсы. Теперь вы вооружены знаниями о корпоративных уловках!
                    </p>

                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8 text-left shadow-inner">
                        <p className="text-sm text-slate-400 leading-relaxed italic">
                            <span className="text-accent-cyan font-bold block mb-1 not-italic">Важно знать:</span> Манипулятивные техники (дарк-паттерны) ограничивают ваше право на свободный выбор. Помните, что доступность отмены и прозрачность условий — признаки добросовестного сервиса. В спорных ситуациях закон о защите прав потребителей помогает восстановить справедливость.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={reset}
                            className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 shadow-sm active:scale-95 focus:ring-2 focus:ring-white/20 outline-none"
                            aria-label="Пройти тренажер еще раз"
                        >
                            Пройти еще раз
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-8 py-4 bg-gradient-to-r from-accent-pink to-accent-purple text-white rounded-2xl font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all active:scale-95 hover:scale-[1.02] focus:ring-2 focus:ring-accent-pink/50 outline-none"
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
