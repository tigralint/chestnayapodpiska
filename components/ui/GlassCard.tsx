import React, { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    animate?: boolean;
    style?: React.CSSProperties;
}

export function GlassCard({ children, className = '', animate = false, style }: GlassCardProps) {
    return (
        <div
            className={`real-glass-panel p-6 sm:p-8 rounded-[2.5rem] ${animate ? 'opacity-0 animate-slide-up' : ''} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}
