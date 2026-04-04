import React from 'react';
import { FileText } from '../icons';
import { GlassCard } from './GlassCard';
import { GeneratingState } from './GeneratingState';
import { ResultSuccessCard } from './ResultSuccessCard';

export interface ResultPanelTheme {
    border: string;
    bg: string;
    text: string;
    gradient: string;
    spinnerBorder: string;
    focusRing: string;
}

export const RESULT_THEMES = {
    cyan: {
        border: 'border-accent-cyan/20',
        bg: 'bg-accent-cyan/20',
        text: 'text-accent-cyan',
        gradient: 'from-accent-cyan/10 via-transparent to-accent-cyan/5',
        spinnerBorder: 'border-accent-cyan/40',
        focusRing: 'focus:ring-accent-cyan/30',
    },
    purple: {
        border: 'border-accent-purple/20',
        bg: 'bg-accent-purple/20',
        text: 'text-accent-purple',
        gradient: 'from-accent-purple/10 via-transparent to-accent-blue/5',
        spinnerBorder: 'border-accent-purple/40',
        focusRing: 'focus:ring-accent-purple/30',
    },
} as const satisfies Record<string, ResultPanelTheme>;

export type ResultThemeKey = keyof typeof RESULT_THEMES;

interface ClaimResultPanelProps {
    isGenerating: boolean;
    result: string;
    onCopy: () => void;
    copied: boolean;
    onDownload: () => void;
    theme: ResultThemeKey;
    loadingTitle: string;
    loadingSubtitle: string;
    isRefusal?: boolean;
}

export const ClaimResultPanel = React.memo(function ClaimResultPanel({
    isGenerating,
    result,
    onCopy,
    copied,
    onDownload,
    theme,
    loadingTitle,
    loadingSubtitle,
    isRefusal = false
}: ClaimResultPanelProps) {
    const themeStyles = RESULT_THEMES[theme];
    const panelRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Scroll into view on mobile/tablet when generation starts or result appears
        if (isGenerating || result) {
            // Small delay to ensure render is complete
            const timeoutId = setTimeout(() => {
                panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [isGenerating, result]);

    if (isGenerating) {
        return (
            <div ref={panelRef} className="w-full h-full flex flex-col">
                <GeneratingState
                    theme={theme}
                    loadingTitle={loadingTitle}
                    loadingSubtitle={loadingSubtitle}
                />
            </div>
        );
    }

    if (result) {
        return (
            <div ref={panelRef} className="w-full h-full flex flex-col">
                <ResultSuccessCard
                    result={result}
                    theme={theme}
                    onCopy={onCopy}
                    copied={copied}
                    onDownload={onDownload}
                    isRefusal={isRefusal}
                />
            </div>
        );
    }

    // Placeholder

    return (
        <GlassCard className="hidden lg:flex flex-col flex-grow border-white/5 p-10 opacity-50 select-none relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent"></div>

            {/* Header Skeleton */}
            <div className="flex flex-col items-end space-y-3 mb-12">
                <div className="w-48 h-3 bg-slate-600/40 rounded-full"></div>
                <div className="w-32 h-3 bg-slate-600/40 rounded-full"></div>
                <div className="w-40 h-3 bg-slate-600/40 rounded-full"></div>
            </div>

            {/* Title Skeleton */}
            <div className="w-64 h-5 bg-slate-500/50 rounded-full mx-auto mb-12"></div>

            {/* Body Skeleton */}
            <div className="space-y-5 mb-auto flex flex-col items-start w-full">
                <div className="w-full h-3 bg-slate-600/30 rounded-full"></div>
                <div className="w-[95%] h-3 bg-slate-600/30 rounded-full"></div>
                <div className="w-[90%] h-3 bg-slate-600/30 rounded-full"></div>
                <div className="w-[75%] h-3 bg-slate-600/30 rounded-full"></div>
                <div className="w-full h-3 bg-slate-600/30 rounded-full mt-8"></div>
                <div className="w-[85%] h-3 bg-slate-600/30 rounded-full"></div>
            </div>

            {/* Footer Skeleton */}
            <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
                <div className="w-32 h-3 bg-slate-600/40 rounded-full"></div>
                <div className="w-40 h-3 bg-slate-600/40 rounded-full"></div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`bg-[#05050A]/95 py-3 px-6 rounded-full border ${themeStyles.border} shadow-xl flex items-center gap-3 animate-float`}>
                    <FileText className={`w-5 h-5 ${themeStyles.text}`} />
                    <span className="font-bold text-white tracking-wide">Окно предпросмотра</span>
                </div>
            </div>
        </GlassCard>
    );
});
