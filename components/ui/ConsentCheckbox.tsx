import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ConsentCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children?: ReactNode;
}

export function ConsentCheckbox({ checked, onChange, children }: ConsentCheckboxProps) {
    return (
        <label className="group mt-4 flex cursor-pointer items-start gap-3 px-1">
            <div className="relative mt-0.5 flex items-center justify-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-white/20 bg-white/5 outline-none transition-all checked:border-accent-cyan checked:bg-accent-cyan focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                />
                <svg
                    className="pointer-events-none absolute h-3.5 w-3.5 text-app-bg opacity-0 transition-opacity peer-checked:opacity-100"
                    viewBox="0 0 14 10"
                    fill="none"
                >
                    <path
                        d="M1 5L4.5 8.5L13 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <span className="text-xs font-medium leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300">
                {children || (
                    <>
                        Я согласен(на) с{' '}
                        <Link
                            to="/privacy"
                            className="text-accent-cyan transition-colors hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Политикой конфиденциальности
                        </Link>{' '}
                        и{' '}
                        <Link
                            to="/terms"
                            className="text-accent-cyan transition-colors hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Пользовательским соглашением
                        </Link>
                        .
                    </>
                )}
            </span>
        </label>
    );
}
