import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft } from '../icons';

interface DatePickerProps {
    value: string;           // ISO date string: YYYY-MM-DD
    onChange: (value: string) => void;
    id?: string;
    label?: string;
}

const MONTHS_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** 0 = Monday, 6 = Sunday  (ISO weekday) */
function getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDate(iso: string): { year: number; month: number; day: number } {
    const [y, m, d] = iso.split('-').map(Number);
    return { year: y!, month: m! - 1, day: d! };
}

/** Use native date picker on mobile (< 768px) for better UX */
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}

export function DatePicker({ value, onChange, id, label }: DatePickerProps) {
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = useState(false);
    const parsed = parseDate(value || new Date().toISOString().split('T')[0]!);
    const [viewYear, setViewYear] = useState(parsed.year);
    const [viewMonth, setViewMonth] = useState(parsed.month);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const prevMonth = useCallback(() => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    }, [viewMonth]);

    const nextMonth = useCallback(() => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    }, [viewMonth]);

    const selectDay = useCallback((day: number) => {
        onChange(formatDate(viewYear, viewMonth, day));
        setIsOpen(false);
    }, [viewYear, viewMonth, onChange]);

    // Format display value as "DD.MM.YYYY"
    const displayValue = value
        ? `${parsed.day.toString().padStart(2, '0')}.${(parsed.month + 1).toString().padStart(2, '0')}.${parsed.year}`
        : '';

    // On mobile, render native input
    if (isMobile) {
        return (
            <div className="flex-1 group">
                {label && <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-3 ml-1 group-focus-within:text-accent-cyan transition-colors">{label}</label>}
                <input
                    id={id}
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[17px] text-white focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/50 focus:bg-white/10 outline-none transition-all shadow-inner color-scheme-dark focus:scale-[1.01]"
                    style={{ colorScheme: 'dark' }}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        );
    }

    // Desktop: custom glassmorphism calendar
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const today = new Date();
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return (
        <div className="flex-1 group relative" ref={containerRef}>
            {label && <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-3 ml-1 group-focus-within:text-accent-cyan transition-colors">{label}</label>}
            
            {/* Trigger button */}
            <button
                id={id}
                type="button"
                onClick={() => { setIsOpen(!isOpen); setViewYear(parsed.year); setViewMonth(parsed.month); }}
                className={`w-full text-left bg-white/5 rounded-2xl px-5 py-4 text-[17px] text-white outline-none transition-all shadow-inner flex justify-between items-center ${isOpen ? 'border-2 border-accent-cyan/50 bg-white/10 ring-2 ring-accent-cyan/30 scale-[1.01]' : 'border border-white/10 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:border-accent-cyan/50'}`}
            >
                <span>{displayValue || 'Выберите дату'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 transition-colors ${isOpen ? 'text-accent-cyan' : ''}`}>
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                </svg>
            </button>

            {/* Calendar dropdown */}
            <div
                className={`absolute z-50 w-[320px] mt-2 real-glass-panel rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'}`}
            >
                {/* Month/Year navigation */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                        aria-label="Предыдущий месяц"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white font-bold text-[15px] select-none">
                        {MONTHS_RU[viewMonth]} {viewYear}
                    </span>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                        aria-label="Следующий месяц"
                    >
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {WEEKDAYS_RU.map(wd => (
                        <div key={wd} className="text-center text-xs font-semibold text-slate-500 py-1 select-none">{wd}</div>
                    ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
                    {days.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} />;
                        const dateStr = formatDate(viewYear, viewMonth, day);
                        const isSelected = dateStr === value;
                        const isToday = dateStr === todayStr;

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => selectDay(day)}
                                className={`
                                    w-10 h-10 mx-auto rounded-xl text-sm font-medium transition-all duration-200 
                                    flex items-center justify-center
                                    ${isSelected
                                        ? 'bg-accent-cyan text-app-bg font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] scale-110'
                                        : isToday
                                            ? 'bg-white/10 text-accent-cyan ring-1 ring-accent-cyan/30 hover:bg-accent-cyan/20'
                                            : 'text-slate-300 hover:bg-white/10 hover:text-white hover:scale-105'
                                    }
                                    active:scale-95
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
