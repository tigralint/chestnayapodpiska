import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Утилита для элегантного объединения классов Tailwind CSS.
 * Решает проблему конфликтов классов и условного рендеринга.
 * 
 * @param inputs - Массив классов, объектов или условий (совместимо с clsx)
 * @returns Отфильтрованная и объединенная строка классов Tailwind
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
