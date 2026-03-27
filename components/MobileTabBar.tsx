import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, GraduationCap, Gamepad, BookOpen } from './icons';
import { preloadRoute } from '../utils/preload';

const TABS: { path: string; label: string; icon: (cls: string) => React.ReactNode; activeColor: string; glowBg: string }[] = [
    {
        path: '/',
        label: 'Главная',
        icon: (_cls) => (
            <div className="relative w-8 h-4.5 rounded-full bg-white/10 border border-white/10 flex items-center px-0.5">
                <div className="w-3 h-3 rounded-full bg-accent-cyan shadow-[0_0_8px_rgba(0,242,254,0.6)]"></div>
            </div>
        ),
        activeColor: 'text-[#00f2fe]',
        glowBg: 'bg-[#00f2fe]/15',
    },
    {
        path: '/claim',
        label: 'Подписки',
        icon: (cls) => <CreditCard className={cls} />,
        activeColor: 'text-[#4facfe]',
        glowBg: 'bg-[#4facfe]/15',
    },
    {
        path: '/course',
        label: 'Курсы',
        icon: (cls) => <GraduationCap className={cls} />,
        activeColor: 'text-[#8b5cf6]',
        glowBg: 'bg-[#8b5cf6]/15',
    },
    {
        path: '/simulator',
        label: 'Тренажер',
        icon: (cls) => <Gamepad className={cls} />,
        activeColor: 'text-[#ec4899]',
        glowBg: 'bg-[#ec4899]/15',
    },
    {
        path: '/guides',
        label: 'Гиды',
        icon: (cls) => <BookOpen className={cls} />,
        activeColor: 'text-[#00f2fe]',
        glowBg: 'bg-[#00f2fe]/15',
    },
];

const MobileTabBar = React.memo(function MobileTabBar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
            <nav aria-label="Основная навигация" className="mx-3 mb-3 real-glass rounded-[1.6rem] border border-white/15 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] px-1 py-1.5">
                <div className="flex justify-around items-center">
                    {TABS.map((tab) => {
                        const isActive = tab.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(tab.path);

                        return (
                            <button
                                key={tab.path}
                                onClick={() => navigate(tab.path)}
                                onMouseEnter={() => preloadRoute(tab.path)}
                                aria-current={isActive ? 'page' : undefined}
                                aria-label={tab.label}
                                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 relative ${isActive ? 'text-white' : 'text-slate-500 active:scale-90'
                                    }`}
                            >
                                {/* Active glow */}
                                {isActive && (
                                    <div className={`absolute inset-0 ${tab.glowBg} rounded-2xl blur-sm`}></div>
                                )}
                                <div className="relative z-10">
                                    {tab.icon(`w-5 h-5 transition-colors duration-300 ${isActive ? tab.activeColor : ''}`)}
                                </div>
                                <span className={`text-[10px] font-semibold tracking-wide relative z-10 transition-colors duration-300 ${isActive ? tab.activeColor : ''}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
});

export default MobileTabBar;
