import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 animate-fade-in">
            <div className="relative">
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full bg-accent-cyan/20 blur-xl animate-pulse-slow"></div>

                {/* Spinner */}
                <div className="relative w-16 h-16 rounded-full border-2 border-white/5 border-t-accent-cyan animate-spin"></div>

                {/* Center Dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent-cyan shadow-[0_0_10px_rgba(0,242,254,0.8)]"></div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white/90">Загрузка</span>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan/40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};
