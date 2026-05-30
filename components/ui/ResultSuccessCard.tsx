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
    isRefusal = false,
}: ResultSuccessCardProps) {
    const themeStyles = RESULT_THEMES[theme];

    return (
        <div className="flex h-full flex-grow animate-pop-in flex-col pb-4">
            {/* Status banner: green for success, amber for refusal */}
            {isRefusal ? (
                <div className="real-glass mb-6 flex items-start gap-4 rounded-[2rem] border-amber-500/20 bg-amber-500/10 p-5 text-[15px] text-amber-200 shadow-lg shadow-amber-500/5">
                    <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
                    <p className="font-medium leading-relaxed">
                        К сожалению, указанная причина не является достаточным основанием для претензии. Ознакомьтесь с
                        пояснением ниже.
                    </p>
                </div>
            ) : (
                <div className="real-glass mb-6 flex items-start gap-4 rounded-[2rem] border-emerald-500/20 bg-emerald-500/10 p-5 text-[15px] text-emerald-200 shadow-lg shadow-emerald-500/5">
                    <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                    <p className="font-medium leading-relaxed">
                        Документ готов! Вы можете скопировать текст в чат или скачать редактируемый Word-документ, чтобы
                        вписать свои данные и распечатать.
                    </p>
                </div>
            )}

            <div className="group relative flex min-h-[400px] flex-grow flex-col">
                <textarea
                    readOnly
                    className={cn(
                        'real-glass-panel custom-scrollbar mb-4 w-full flex-grow resize-none rounded-[2.5rem] p-6 font-serif text-[15px] leading-relaxed text-slate-200 shadow-inner focus:outline-none focus:ring-2 md:p-8',
                        themeStyles.focusRing
                    )}
                    value={result}
                />

                <div className="mb-4 flex items-start gap-3 rounded-[1.5rem] border border-red-500/10 bg-red-500/5 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    <p className="text-[12px] leading-relaxed text-slate-400">
                        <strong className="font-semibold text-red-400">Внимание:</strong> Документ сгенерирован ИИ.
                        Обязательно проверьте текст, даты, суммы и нормативные ссылки перед отправкой. Сервис не несет
                        ответственности за возможные ошибки.
                    </p>
                </div>

                {/* Hide action buttons when AI refused the reason */}
                {!isRefusal && (
                    <div className="flex gap-4">
                        <button
                            onClick={onCopy}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-[1.5rem] py-4 text-[16px] font-bold shadow-xl transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:scale-95 ${copied ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white text-app-bg hover:scale-[1.02] hover:bg-slate-200'}`}
                        >
                            {copied ? <CheckCircle className="h-5 w-5 animate-pop-in" /> : <Copy className="h-5 w-5" />}
                            {copied ? 'Скопировано!' : 'Копировать'}
                        </button>
                        <button
                            onClick={onDownload}
                            className="flex flex-1 items-center justify-center gap-2 rounded-[1.5rem] border border-white/10 bg-white/10 py-4 text-[16px] font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
                        >
                            <Download className="h-5 w-5" />
                            Скачать Word
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});
