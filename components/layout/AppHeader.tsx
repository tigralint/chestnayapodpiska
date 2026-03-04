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
        <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hidden md:block pt-6 px-6 ${scrolled ? 'translate-y-[-120%]' : 'translate-y-0'}`}>
            <div className="max-w-6xl mx-auto h-16 real-glass rounded-[2rem] px-6 flex items-center justify-between shadow-2xl">
                <button onClick={() => navigate('/')} className="flex items-center gap-3 group shrink-0 transition-transform active:scale-95">
                    <div className="relative w-10 h-6 rounded-full bg-white/5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center px-1 group-hover:bg-white/10 transition-all">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue shadow-[0_0_10px_rgba(0,242,254,0.5)] group-hover:translate-x-4 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"></div>
                        <div className="absolute inset-0 rounded-full bg-accent-cyan/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">
                        Честная<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-blue">Подписка</span>
                    </span>
                </button>
                <div className="flex gap-1 text-[14px] font-semibold tracking-wide overflow-x-auto no-scrollbar">
                    {NAV_ITEMS.map(item => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onMouseEnter={() => preloadRoute(item.path)}
                                className={`whitespace-nowrap relative px-3 py-1 rounded-xl transition-all duration-300 hover:text-white hover:bg-white/5 ${isActive ? `${item.activeColor} bg-white/5` : 'text-slate-400'
                                    }`}
                            >
                                {item.label}
                                {isActive && (
                                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 ${item.barColor} rounded-full shadow-[0_0_6px_currentColor]`}></span>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
