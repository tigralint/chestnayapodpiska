import { useState, useEffect } from 'react';
import { Search, X } from '../icons';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
    const [localValue, setLocalValue] = useState(value);

    // Sync external value updates to local
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Debounce logic
    useEffect(() => {
        const handler = setTimeout(() => {
            onChange(localValue);
        }, 300);
        return () => clearTimeout(handler);
    }, [localValue, onChange]);

    return (
        <div className="relative z-30 mb-16 w-full animate-slide-up opacity-0" style={{ animationDelay: '150ms' }}>
            <div className="group relative mx-auto max-w-3xl transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-within:scale-[1.02]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
                    <Search className="h-6 w-6 text-slate-400 transition-colors duration-300 group-focus-within:text-accent-cyan" />
                </div>
                <input
                    type="text"
                    aria-label="Поиск по сервисам"
                    className="real-glass w-full rounded-[2rem] py-6 pl-16 pr-14 text-lg text-white placeholder-slate-500 shadow-2xl transition-all focus:bg-white/10 focus:shadow-[0_0_30px_rgba(0,242,254,0.15)] focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                    placeholder={placeholder}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                />
                {localValue && (
                    <button
                        onClick={() => {
                            setLocalValue('');
                            onChange('');
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-500 transition-colors hover:text-white group-focus-within:text-slate-300"
                        aria-label="Очистить поиск"
                    >
                        <div className="rounded-full bg-white/5 p-1 transition-colors hover:bg-white/10">
                            <X className="h-5 w-5" />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
