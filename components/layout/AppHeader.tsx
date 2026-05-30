import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { preloadRoute } from '../../utils/preload';

const NAV_ITEMS = [
    { path: '/claim', label: 'Претензии', activeColor: 'text-accent-cyan', barColor: 'bg-accent-cyan' },
    { path: '/course', label: 'Курсы', activeColor: 'text-accent-cyan', barColor: 'bg-accent-cyan' },
    { path: '/simulator', label: 'Тренажер', activeColor: 'text-accent-pink', barColor: 'bg-accent-pink' },
    { path: '/radar', label: 'Радар', activeColor: 'text-accent-purple', barColor: 'bg-accent-purple' },
    { path: '/guides', label: 'База знаний', activeColor: 'text-accent-cyan', barColor: 'bg-accent-cyan' },
    { path: '/faq', label: 'FAQ', activeColor: 'text-accent-cyan', barColor: 'bg-accent-cyan' },
];

export const AppHeader = React.memo(function AppHeader() {
    const location = useLocation();
    const navigate = useNavigate();
    const { scrolled } = useAppContext();

    return (
        <header
            className={`fixed left-0 right-0 top-0 z-50 hidden px-6 pt-6 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:block ${scrolled ? 'translate-y-[-120%]' : 'translate-y-0'}`}
        >
            <div className="real-glass mx-auto flex h-16 max-w-6xl items-center justify-between rounded-[2rem] px-6 shadow-2xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/')}
                        aria-label="На главную"
                        className="group flex shrink-0 items-center gap-3 transition-transform active:scale-95"
                    >
                        <div className="relative flex h-6 w-10 items-center rounded-full border border-white/10 bg-white/5 px-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all group-hover:bg-white/10">
                            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue shadow-[0_0_10px_rgba(0,242,254,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-4"></div>
                            <div className="absolute inset-0 rounded-full bg-accent-cyan/10 opacity-0 blur-md transition-opacity group-hover:opacity-100"></div>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            Честная
                            <span className="bg-gradient-to-r from-accent-cyan to-accent-blue bg-clip-text text-transparent">
                                Подписка
                            </span>
                        </span>
                    </button>
                </div>
                <nav
                    aria-label="Основная навигация"
                    className="no-scrollbar flex gap-1 overflow-x-auto text-[14px] font-semibold tracking-wide"
                >
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onMouseEnter={() => preloadRoute(item.path)}
                                className={`relative whitespace-nowrap rounded-xl px-3 py-1 transition-all duration-300 hover:bg-white/5 hover:text-white ${
                                    isActive ? `${item.activeColor} bg-white/5` : 'text-slate-400'
                                }`}
                            >
                                {item.label}
                                {isActive && (
                                    <span
                                        className={`absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 ${item.barColor} rounded-full shadow-[0_0_6px_currentColor]`}
                                    ></span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
});
