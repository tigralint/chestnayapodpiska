import React, { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    animate?: boolean;
    style?: React.CSSProperties;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, animate = false, style, ...rest }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'real-glass-panel rounded-[2.5rem] p-6 sm:p-8',
                    animate && 'animate-slide-up opacity-0',
                    className
                )}
                style={style}
                {...rest}
            >
                {children}
            </div>
        );
    }
);
GlassCard.displayName = 'GlassCard';
