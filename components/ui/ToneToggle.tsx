import { Tone } from '../../types';
import { Info } from '../icons';

const TONE_THEMES = {
    cyan: {
        focusRing: 'focus-visible:ring-accent-cyan/50',
        borderLeft: 'border-accent-cyan/40',
    },
    purple: {
        focusRing: 'focus-visible:ring-accent-purple/50',
        borderLeft: 'border-accent-purple/40',
    },
} as const;

export type ToneThemeKey = keyof typeof TONE_THEMES;

interface ToneToggleProps {
    tone: Tone;
    onToneChange: (t: Tone) => void;
    theme: ToneThemeKey;
    softPreview: string;
    hardPreview: string;
}

export function ToneToggle({ tone, onToneChange, theme, softPreview, hardPreview }: ToneToggleProps) {
    const t = TONE_THEMES[theme];
    return (
        <div className="pt-2">
            <label className="flex items-center text-sm font-semibold text-slate-300 mb-3 ml-1">
                Тональность документа
                <div className="group/tooltip relative inline-flex ml-2 cursor-help z-50">
                    <Info className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 real-glass-panel rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 shadow-xl z-50 text-xs text-slate-300 font-normal border border-white/20">
                        <span className="text-white font-bold mb-1 block">Заявление или Претензия?</span>
                        <span className="text-white font-semibold">Заявление (мягко)</span> – вежливая просьба о возврате, хорошо работает для адекватных сервисов.
                        <br/><br/>
                        <span className="text-white font-semibold">Претензия (жестко)</span> – официальное досудебное требование со ссылками на КоАП и ЗоЗПП. Применяйте, если вам уже отказали или проигнорировали.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
                    </div>
                </div>
            </label>
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 relative">
                <button
                    type="button"
                    onClick={() => onToneChange('soft')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl z-10 transition-colors focus-visible:outline-none ${t.focusRing} ${tone === 'soft' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Заявление на возврат
                </button>
                <button
                    type="button"
                    onClick={() => onToneChange('hard')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl z-10 transition-colors focus-visible:outline-none ${t.focusRing} ${tone === 'hard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Досудебная претензия
                </button>
                <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-xl shadow-md border border-white/10 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${tone === 'soft' ? 'translate-x-0' : 'translate-x-full'}`}
                ></div>
            </div>

            {/* Live Tone Preview */}
            <div className={`mt-4 px-3 border-l-2 ${t.borderLeft}`}>
                <p className="text-[13px] text-slate-400 italic transition-all duration-300 min-h-[40px] flex items-center">
                    {tone === 'soft' ? softPreview : hardPreview}
                </p>
            </div>
        </div>
    );
}
