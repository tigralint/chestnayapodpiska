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
    isRefusal = false,
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
            <div ref={panelRef} className="flex h-full w-full flex-col" aria-busy="true">
                <GeneratingState theme={theme} loadingTitle={loadingTitle} loadingSubtitle={loadingSubtitle} />
            </div>
        );
    }

    if (result) {
        return (
            <div ref={panelRef} className="flex h-full w-full flex-col" aria-live="polite">
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
        <GlassCard className="relative hidden flex-grow select-none flex-col overflow-hidden border-white/5 p-10 opacity-50 shadow-2xl lg:flex">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent"></div>

            {/* Header Skeleton */}
            <div className="mb-12 flex flex-col items-end space-y-3">
                <div className="h-3 w-48 rounded-full bg-slate-600/40"></div>
                <div className="h-3 w-32 rounded-full bg-slate-600/40"></div>
                <div className="h-3 w-40 rounded-full bg-slate-600/40"></div>
            </div>

            {/* Title Skeleton */}
            <div className="mx-auto mb-12 h-5 w-64 rounded-full bg-slate-500/50"></div>

            {/* Body Skeleton */}
            <div className="mb-auto flex w-full flex-col items-start space-y-5">
                <div className="h-3 w-full rounded-full bg-slate-600/30"></div>
                <div className="h-3 w-[95%] rounded-full bg-slate-600/30"></div>
                <div className="h-3 w-[90%] rounded-full bg-slate-600/30"></div>
                <div className="h-3 w-[75%] rounded-full bg-slate-600/30"></div>
                <div className="mt-8 h-3 w-full rounded-full bg-slate-600/30"></div>
                <div className="h-3 w-[85%] rounded-full bg-slate-600/30"></div>
            </div>

            {/* Footer Skeleton */}
            <div className="mt-12 flex justify-between border-t border-white/5 pt-8">
                <div className="h-3 w-32 rounded-full bg-slate-600/40"></div>
                <div className="h-3 w-40 rounded-full bg-slate-600/40"></div>
            </div>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                    className={`rounded-full border bg-[#05050A]/95 px-6 py-3 ${themeStyles.border} flex animate-float items-center gap-3 shadow-xl`}
                >
                    <FileText className={`h-5 w-5 ${themeStyles.text}`} />
                    <span className="font-bold tracking-wide text-white">Окно предпросмотра</span>
                </div>
            </div>
        </GlassCard>
    );
});
