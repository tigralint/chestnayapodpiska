import React from 'react';
import { FileText, CheckCircle, Copy, Download } from '../icons';

interface ClaimResultPanelProps {
    isGenerating: boolean;
    result: string;
    onCopy: () => void;
    copied: boolean;
    onDownload: () => void;
    accentColor: string;
    secondaryColor?: string;
    loadingTitle: string;
    loadingSubtitle: string;
}

export function ClaimResultPanel({
    isGenerating,
    result,
    onCopy,
    copied,
    onDownload,
    accentColor,
    secondaryColor = accentColor,
    loadingTitle,
    loadingSubtitle
}: ClaimResultPanelProps) {

    // Helpers format Tailwind strings logic correctly, allowing dynamically constructed classNames using the exact color tokens already mapped
    const borderColor = `border-${accentColor}/20`;
    const blurColor1 = `bg-${accentColor}/20`;
    const bgGradient = `from-${accentColor}/10 via-transparent to-${secondaryColor}/5`;
    const iconShadow1 = `shadow-[0_0_20px_rgba(var(--color-${accentColor}),0.2)]`; // Wait... tailwind arbitary classes might fail on string interpolation if not whitelisted. 
    // Let's use generic styles or simple map to ensure Tailwind compiles it. Actually, `CouseFlow` uses fixed colors. I'll stick to a generic approach or explicit props string.

    if (isGenerating) {
        return (
            <div className={`flex-grow flex flex-col items-center justify-center real-glass-panel rounded-[2.5rem] p-8 border ${borderColor} relative overflow-hidden animate-fade-in min-h-[400px]`}>
                <div className={`absolute inset-0 bg-gradient-to-tr ${bgGradient} animate-gradient-shift bg-[length:200%_200%]`}></div>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${blurColor1} rounded-full blur-[80px] animate-magic-pulse`}></div>

                <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-32 h-32 mx-auto mb-8 relative flex items-center justify-center perspective-[1000px]">
                        <div className={`absolute inset-0 rounded-[40%] border border-${accentColor}/40 animate-spin-slow`}></div>
                        <div className={`absolute inset-2 rounded-full border-y-2 border-${secondaryColor}/60 animate-[spin_4s_linear_infinite_reverse]`}></div>
                        <div className={`absolute inset-5 rounded-[45%] border-x-2 border-white/60 animate-[spin_2s_linear_infinite]`}></div>
                        <div className={`relative z-10 bg-app-bg/80 backdrop-blur-md w-16 h-16 rounded-full flex items-center justify-center border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] animate-float`}>
                            <FileText className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-magic-pulse" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-3 animate-pulse">
                        {loadingTitle}
                    </h3>
                    <div className={`flex items-center gap-3 justify-center text-${accentColor} font-mono text-sm uppercase tracking-widest bg-${accentColor}/10 px-4 py-2 rounded-full border border-${accentColor}/20`}>
                        <span className={`w-2 h-2 rounded-full bg-${accentColor} animate-ping`}></span>
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
                        className={`flex-grow w-full real-glass-panel rounded-[2.5rem] p-6 md:p-8 text-[15px] leading-relaxed text-slate-200 focus:outline-none resize-none shadow-inner font-serif custom-scrollbar mb-4 focus:ring-2 focus:ring-${accentColor}/30`}
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
                <div className={`bg-app-bg/80 backdrop-blur-sm py-3 px-6 rounded-full border border-${accentColor}/20 shadow-xl flex items-center gap-3 animate-float`}>
                    <FileText className={`w-5 h-5 text-${accentColor}`} />
                    <span className="font-bold text-white tracking-wide">Окно предпросмотра</span>
                </div>
            </div>
        </div>
    );
}
