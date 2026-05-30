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

type ToneThemeKey = keyof typeof TONE_THEMES;

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
            <label className="mb-3 ml-1 flex items-center text-sm font-semibold text-slate-300">
                Тональность документа
                <div className="group/tooltip relative z-50 ml-2 inline-flex cursor-help">
                    <Info className="h-4 w-4 text-slate-400 transition-colors hover:text-white" />
                    <div className="real-glass-panel invisible absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border border-white/20 p-4 text-xs font-normal text-slate-300 opacity-0 shadow-xl transition-all duration-300 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
                        <span className="mb-1 block font-bold text-white">Заявление или Претензия?</span>
                        <span className="font-semibold text-white">Заявление (мягко)</span> – вежливая просьба о
                        возврате, хорошо работает для адекватных сервисов.
                        <br />
                        <br />
                        <span className="font-semibold text-white">Претензия (жестко)</span> – официальное досудебное
                        требование со ссылками на КоАП и ЗоЗПП. Применяйте, если вам уже отказали или проигнорировали.
                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
                    </div>
                </div>
            </label>
            <div className="relative flex rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                    type="button"
                    onClick={() => onToneChange('soft')}
                    className={`z-10 flex-1 rounded-xl py-3 text-sm font-bold transition-colors focus-visible:outline-none ${t.focusRing} ${tone === 'soft' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Заявление на возврат
                </button>
                <button
                    type="button"
                    onClick={() => onToneChange('hard')}
                    className={`z-10 flex-1 rounded-xl py-3 text-sm font-bold transition-colors focus-visible:outline-none ${t.focusRing} ${tone === 'hard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Досудебная претензия
                </button>
                <div
                    className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl border border-white/10 bg-white/10 shadow-md transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${tone === 'soft' ? 'translate-x-0' : 'translate-x-full'}`}
                ></div>
            </div>

            {/* Live Tone Preview */}
            <div className={`mt-4 border-l-2 px-3 ${t.borderLeft}`}>
                <p className="flex min-h-[40px] items-center text-[13px] italic text-slate-400 transition-all duration-300">
                    {tone === 'soft' ? softPreview : hardPreview}
                </p>
            </div>
        </div>
    );
}
