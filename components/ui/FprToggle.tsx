import React from 'react';

interface FprToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function FprToggle({ label, checked, onChange }: FprToggleProps) {
    return (
        <button
            type="button"
            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-[1rem] cursor-pointer hover:bg-white/10 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/50 focus-visible:bg-white/10"
            onClick={() => onChange(!checked)}
        >
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors text-left">{label}</span>
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 shrink-0 ml-4 ${checked ? 'bg-accent-purple' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${checked ? 'left-7' : 'left-1'}`}></div>
            </div>
        </button>
    );
}
