import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle } from '../components/icons';
import { SEO } from '../components/ui/SEO';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
            <SEO
                title="Страница не найдена | ЧестнаяПодписка"
                description="Похоже, вы перешли по неверной ссылке. Вернитесь на главную страницу сервиса ЧестнаяПодписка."
            />
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className="real-glass-panel relative w-full max-w-lg animate-pop-in overflow-hidden rounded-[3rem] border border-red-500/20 p-8 text-center shadow-2xl md:p-12">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent"></div>
                <div className="relative z-10">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                        <AlertCircle className="h-12 w-12 text-red-400" />
                    </div>
                    <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-white md:text-6xl">404</h1>
                    <h2 className="mb-4 text-xl font-bold text-slate-300 md:text-2xl">Страница не найдена</h2>
                    <p className="mb-8 text-lg leading-relaxed text-slate-400">
                        Похоже, этой страницы не существует или она была перемещена.
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-blue px-8 py-4 font-bold text-white shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        На главную
                    </button>
                </div>
            </div>
        </div>
    );
}
