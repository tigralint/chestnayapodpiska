import React, { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    animate?: boolean;
    style?: React.CSSProperties;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, animate = false, style }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "real-glass-panel p-6 sm:p-8 rounded-[2.5rem]",
                    animate && "opacity-0 animate-slide-up",
                    className
                )}
                style={style}
            >
                {children}
            </div>
        );
    }
);
GlassCard.displayName = 'GlassCard';
