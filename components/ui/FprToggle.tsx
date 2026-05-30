interface FprToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function FprToggle({ label, checked, onChange }: FprToggleProps) {
    return (
        <button
            type="button"
            className="group flex w-full cursor-pointer items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/50"
            onClick={() => onChange(!checked)}
        >
            <span className="text-left text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
                {label}
            </span>
            <div
                className={`relative ml-4 h-6 w-12 shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-accent-purple' : 'bg-slate-700'}`}
            >
                <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${checked ? 'left-7' : 'left-1'}`}
                ></div>
            </div>
        </button>
    );
}
