import React from 'react';
import { CheckCircle, Copy, Download, AlertCircle } from '../icons';
import { cn } from '../../utils/cn';
import { ResultThemeKey, RESULT_THEMES } from './ClaimResultPanel';

interface ResultSuccessCardProps {
    result: string;
    theme: ResultThemeKey;
    onCopy: () => void;
    copied: boolean;
    onDownload: () => void;
    isRefusal?: boolean;
}

export const ResultSuccessCard = React.memo(function ResultSuccessCard({
    result,
    theme,
    onCopy,
    copied,
    onDownload,
    isRefusal = false
}: ResultSuccessCardProps) {
    const themeStyles = RESULT_THEMES[theme];

    return (
        <div className="flex-grow flex flex-col h-full animate-pop-in pb-4">
            {/* Status banner: green for success, amber for refusal */}
            {isRefusal ? (
                <div className="real-glass bg-amber-500/10 border-amber-500/20 text-amber-200 p-5 rounded-[2rem] text-[15px] flex gap-4 items-start mb-6 shadow-lg shadow-amber-500/5">
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-amber-400" />
                    <p className="font-medium leading-relaxed">К сожалению, указанная причина не является достаточным основанием для претензии. Ознакомьтесь с пояснением ниже.</p>
                </div>
            ) : (
                <div className="real-glass bg-emerald-500/10 border-emerald-500/20 text-emerald-200 p-5 rounded-[2rem] text-[15px] flex gap-4 items-start mb-6 shadow-lg shadow-emerald-500/5">
                    <CheckCircle className="w-6 h-6 shrink-0 mt-0.5 text-emerald-400" />
                    <p className="font-medium leading-relaxed">Документ готов! Вы можете скопировать текст в чат или скачать редактируемый Word-документ, чтобы вписать свои данные и распечатать.</p>
                </div>
            )}

            <div className="relative group flex-grow flex flex-col min-h-[400px]">
                <textarea
                    readOnly
                    className={cn("flex-grow w-full real-glass-panel rounded-[2.5rem] p-6 md:p-8 text-[15px] leading-relaxed text-slate-200 focus:outline-none resize-none shadow-inner font-serif custom-scrollbar mb-4 focus:ring-2", themeStyles.focusRing)}
                    value={result}
                />

                <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 p-4 rounded-[1.5rem] mb-4">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] leading-relaxed text-slate-400">
                        <strong className="text-red-400 font-semibold">Внимание:</strong> Документ сгенерирован ИИ. Обязательно проверьте текст, даты, суммы и нормативные ссылки перед отправкой. Сервис не несет ответственности за возможные ошибки.
                    </p>
                </div>

                {/* Hide action buttons when AI refused the reason */}
                {!isRefusal && (
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
                )}
            </div>
        </div>
    );
});
