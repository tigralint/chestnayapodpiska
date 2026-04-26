import React from 'react';
import { FileText } from '../icons';
import { cn } from '../../utils/cn';
import { GlassCard } from './GlassCard';
import { ResultThemeKey, RESULT_THEMES } from './ClaimResultPanel';

interface GeneratingStateProps {
    theme: ResultThemeKey;
    loadingTitle: string;
    loadingSubtitle: string;
}

export const GeneratingState = React.memo(function GeneratingState({
    theme,
    loadingTitle,
    loadingSubtitle
}: GeneratingStateProps) {
    const themeStyles = RESULT_THEMES[theme];

    return (
        <GlassCard className={cn("flex-grow flex flex-col items-center justify-center border relative overflow-hidden animate-fade-in min-h-[400px]", themeStyles.border)} aria-live="assertive" role="alert">
            <div className={cn("absolute inset-0 bg-gradient-to-tr animate-gradient-shift bg-[length:200%_200%]", themeStyles.gradient)}></div>
            <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] animate-magic-pulse", themeStyles.bg)}></div>

            <div className="relative z-10 text-center flex flex-col items-center">
                <div className="w-32 h-32 mx-auto mb-8 relative flex items-center justify-center perspective-[1000px]">
                    <div className={`absolute inset-0 rounded-[40%] border ${themeStyles.spinnerBorder} animate-spin-slow`}></div>
                    <div className="absolute inset-2 rounded-full border-y-2 border-white/40 animate-[spin_4s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-5 rounded-[45%] border-x-2 border-white/60 animate-[spin_2s_linear_infinite]"></div>
                    <div className="relative z-10 bg-[#05050A]/95 w-16 h-16 rounded-full flex items-center justify-center border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] animate-float">
                        <FileText className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-magic-pulse" />
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-3 animate-pulse">
                    {loadingTitle}
                </h3>
                <div className={`flex items-center gap-3 justify-center ${themeStyles.text} font-mono text-sm uppercase tracking-widest ${themeStyles.bg} bg-opacity-50 px-4 py-2 rounded-full border ${themeStyles.border}`}>
                    <span className={`w-2 h-2 rounded-full ${themeStyles.bg} animate-ping`}></span>
                    {loadingSubtitle}
                </div>
            </div>
        </GlassCard>
    );
});
