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
        <div className="w-full relative mb-16 z-30 opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="relative group max-w-3xl mx-auto focus-within:scale-[1.02] transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-slate-400 group-focus-within:text-accent-cyan transition-colors duration-300" />
                </div>
                <input
                    type="text"
                    className="w-full pl-16 pr-14 py-6 real-glass rounded-[2rem] text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:bg-white/10 focus:shadow-[0_0_30px_rgba(0,242,254,0.15)] transition-all shadow-2xl"
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
                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-white transition-colors group-focus-within:text-slate-300"
                        aria-label="Очистить поиск"
                    >
                        <div className="p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
