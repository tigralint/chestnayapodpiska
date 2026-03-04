import { Tone } from '../../types';

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
            <label className="block text-sm font-semibold text-slate-300 mb-3 ml-1">Тональность документа</label>
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
