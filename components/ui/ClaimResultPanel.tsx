import { FileText, CheckCircle, Copy, Download } from '../icons';

/**
 * Pre-built Tailwind class sets for each color theme.
 * Using literal strings ensures Tailwind JIT compiler can detect them.
 */
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
}

export function ClaimResultPanel({
    isGenerating,
    result,
    onCopy,
    copied,
    onDownload,
    theme,
    loadingTitle,
    loadingSubtitle
}: ClaimResultPanelProps) {
    const t = RESULT_THEMES[theme];

    if (isGenerating) {
        return (
            <div className={`flex-grow flex flex-col items-center justify-center real-glass-panel rounded-[2.5rem] p-8 border ${t.border} relative overflow-hidden animate-fade-in min-h-[400px]`}>
                <div className={`absolute inset-0 bg-gradient-to-tr ${t.gradient} animate-gradient-shift bg-[length:200%_200%]`}></div>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${t.bg} rounded-full blur-[80px] animate-magic-pulse`}></div>

                <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-32 h-32 mx-auto mb-8 relative flex items-center justify-center perspective-[1000px]">
                        <div className={`absolute inset-0 rounded-[40%] border ${t.spinnerBorder} animate-spin-slow`}></div>
                        <div className="absolute inset-2 rounded-full border-y-2 border-white/40 animate-[spin_4s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-5 rounded-[45%] border-x-2 border-white/60 animate-[spin_2s_linear_infinite]"></div>
                        <div className="relative z-10 bg-app-bg/80 backdrop-blur-md w-16 h-16 rounded-full flex items-center justify-center border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] animate-float">
                            <FileText className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-magic-pulse" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-3 animate-pulse">
                        {loadingTitle}
                    </h3>
                    <div className={`flex items-center gap-3 justify-center ${t.text} font-mono text-sm uppercase tracking-widest ${t.bg} bg-opacity-50 px-4 py-2 rounded-full border ${t.border}`}>
                        <span className={`w-2 h-2 rounded-full ${t.bg} animate-ping`}></span>
                        {loadingSubtitle}
                    </div>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="flex-grow flex flex-col h-full animate-pop-in pb-4">
                <div className="real-glass bg-emerald-500/10 border-emerald-500/20 text-emerald-200 p-5 rounded-[2rem] text-[15px] flex gap-4 items-start mb-6 shadow-lg shadow-emerald-500/5">
                    <CheckCircle className="w-6 h-6 shrink-0 mt-0.5 text-emerald-400" />
                    <p className="font-medium leading-relaxed">Документ готов! Вы можете скопировать текст в чат или скачать редактируемый Word-документ, чтобы вписать свои данные и распечатать.</p>
                </div>

                <div className="relative group flex-grow flex flex-col min-h-[400px]">
                    <textarea
                        readOnly
                        className={`flex-grow w-full real-glass-panel rounded-[2.5rem] p-6 md:p-8 text-[15px] leading-relaxed text-slate-200 focus:outline-none resize-none shadow-inner font-serif custom-scrollbar mb-4 focus:ring-2 ${t.focusRing}`}
                        value={result}
                    />
                    <div className="flex gap-4">
                        <button
                            onClick={onCopy}
                            className={`flex-1 py-4 rounded-[1.5rem] text-[16px] font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 ${copied ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white text-app-bg hover:bg-slate-200 hover:scale-[1.02]'}`}
                        >
                            {copied ? <CheckCircle className="w-5 h-5 animate-pop-in" /> : <Copy className="w-5 h-5" />}
                            {copied ? 'Скопировано!' : 'Копировать'}
                        </button>
                        <button
                            onClick={onDownload}
                            className="flex-1 py-4 rounded-[1.5rem] text-[16px] font-bold shadow-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        >
                            <Download className="w-5 h-5" />
                            Скачать Word
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Placeholder
    return (
        <div className="hidden lg:flex flex-col flex-grow real-glass-panel border-white/5 rounded-[2.5rem] p-10 opacity-50 select-none relative overflow-hidden shadow-2xl shimmer">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent"></div>

            <div className="flex flex-col items-end space-y-3 mb-12">
                <div className="w-48 h-3 bg-slate-600/40 rounded-full animate-pulse-slow"></div>
                <div className="w-32 h-3 bg-slate-600/40 rounded-full animate-pulse-slow" style={{ animationDelay: '100ms' }}></div>
                <div className="w-40 h-3 bg-slate-600/40 rounded-full animate-pulse-slow" style={{ animationDelay: '200ms' }}></div>
            </div>

            <div className="w-64 h-5 bg-slate-500/50 rounded-full mx-auto mb-12 animate-pulse-slow" style={{ animationDelay: '300ms' }}></div>

            <div className="space-y-5 mb-auto">
                <div className="w-full h-3 bg-slate-600/30 rounded-full animate-pulse-slow" style={{ animationDelay: '400ms' }}></div>
                <div className="w-[95%] h-3 bg-slate-600/30 rounded-full animate-pulse-slow" style={{ animationDelay: '500ms' }}></div>
                <div className="w-[90%] h-3 bg-slate-600/30 rounded-full animate-pulse-slow" style={{ animationDelay: '600ms' }}></div>
                <div className="w-3/4 h-3 bg-slate-600/30 rounded-full animate-pulse-slow" style={{ animationDelay: '700ms' }}></div>

                <div className="w-full h-3 bg-slate-600/30 rounded-full mt-8 animate-pulse-slow" style={{ animationDelay: '800ms' }}></div>
                <div className="w-[85%] h-3 bg-slate-600/30 rounded-full animate-pulse-slow" style={{ animationDelay: '900ms' }}></div>
            </div>

            <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
                <div className="w-32 h-3 bg-slate-600/40 rounded-full animate-pulse-slow" style={{ animationDelay: '1000ms' }}></div>
                <div className="w-40 h-3 bg-slate-600/40 rounded-full animate-pulse-slow" style={{ animationDelay: '1100ms' }}></div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`bg-app-bg/80 backdrop-blur-sm py-3 px-6 rounded-full border ${t.border} shadow-xl flex items-center gap-3 animate-float`}>
                    <FileText className={`w-5 h-5 ${t.text}`} />
                    <span className="font-bold text-white tracking-wide">Окно предпросмотра</span>
                </div>
            </div>
        </div>
    );
}
