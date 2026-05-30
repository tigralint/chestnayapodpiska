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
    loadingSubtitle,
}: GeneratingStateProps) {
    const themeStyles = RESULT_THEMES[theme];

    return (
        <GlassCard
            className={cn(
                'relative flex min-h-[400px] flex-grow animate-fade-in flex-col items-center justify-center overflow-hidden border',
                themeStyles.border
            )}
            aria-live="assertive"
            aria-busy="true"
            role="alert"
        >
            <span className="sr-only">
                {loadingTitle}. {loadingSubtitle}
            </span>
            <div
                className={cn(
                    'absolute inset-0 animate-gradient-shift bg-gradient-to-tr bg-[length:200%_200%]',
                    themeStyles.gradient
                )}
            ></div>
            <div
                className={cn(
                    'absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-magic-pulse rounded-full blur-[80px]',
                    themeStyles.bg
                )}
            ></div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="perspective-[1000px] relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
                    <div
                        className={`absolute inset-0 rounded-[40%] border ${themeStyles.spinnerBorder} animate-spin-slow`}
                    ></div>
                    <div className="absolute inset-2 animate-[spin_4s_linear_infinite_reverse] rounded-full border-y-2 border-white/40"></div>
                    <div className="absolute inset-5 animate-[spin_2s_linear_infinite] rounded-[45%] border-x-2 border-white/60"></div>
                    <div className="relative z-10 flex h-16 w-16 animate-float items-center justify-center rounded-full border border-white/10 bg-[#05050A]/95 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]">
                        <FileText className="h-8 w-8 animate-magic-pulse text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    </div>
                </div>

                <h3 className="mb-3 animate-pulse bg-gradient-to-r from-white to-slate-300 bg-clip-text text-2xl font-bold text-transparent">
                    {loadingTitle}
                </h3>
                <div
                    className={`flex items-center justify-center gap-3 ${themeStyles.text} font-mono text-sm uppercase tracking-widest ${themeStyles.bg} rounded-full border bg-opacity-50 px-4 py-2 ${themeStyles.border}`}
                >
                    <span className={`h-2 w-2 rounded-full ${themeStyles.bg} animate-ping`}></span>
                    {loadingSubtitle}
                </div>
            </div>
        </GlassCard>
    );
});
