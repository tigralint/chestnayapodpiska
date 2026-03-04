import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle } from '../components/icons';
import { SEO } from '../components/ui/SEO';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <SEO
                title="Страница не найдена | ЧестнаяПодписка"
                description="Похоже, вы перешли по неверной ссылке. Вернитесь на главную страницу сервиса ЧестнаяПодписка."
            />
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className="real-glass-panel rounded-[3rem] p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden shadow-2xl border border-red-500/20 animate-pop-in">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent"></div>
                <div className="relative z-10">
                    <div className="w-24 h-24 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-3 tracking-tight">404</h1>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-300 mb-4">Страница не найдена</h2>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        Похоже, этой страницы не существует или она была перемещена.
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-cyan to-accent-blue text-white rounded-2xl font-bold shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] transition-all active:scale-95 hover:scale-[1.02]"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        На главную
                    </button>
                </div>
            </div>
        </div>
    );
}
