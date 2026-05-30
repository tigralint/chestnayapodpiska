import React from 'react';
import { Radio } from '../icons';

export const RadarCanvas = React.memo(function RadarCanvas() {
    // 3 static alert dots configuration
    const alerts = [
        { top: '25%', left: '25%', color: 'bg-red-500', pingColor: 'bg-red-500/30', delay: '0s' },
        { top: '66%', left: '75%', color: 'bg-emerald-400', pingColor: 'bg-emerald-400/30', delay: '1s' },
        { top: '50%', left: '75%', color: 'bg-orange-400', pingColor: 'bg-orange-400/30', delay: '2s' },
    ];

    return (
        <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden rounded-full">
            {/* 1. Static Radar Rings - concentric and centered using fixed pixels to prevent subpixel wobble */}
            <div className="absolute inset-0 m-auto h-[230px] w-[230px] rounded-full border border-accent-purple/10"></div>
            <div className="absolute inset-0 m-auto h-[166px] w-[166px] rounded-full border border-accent-purple/15"></div>
            <div className="absolute inset-0 m-auto h-[102px] w-[102px] rounded-full border border-accent-purple/20"></div>
            <div className="absolute inset-0 m-auto h-[38px] w-[38px] rounded-full border border-accent-purple/35"></div>

            {/* 2. Grid Crosshairs - using 2px width/height to align perfectly to the even pixel grid */}
            <div className="absolute inset-0 m-auto h-[230px] w-[2px] bg-accent-purple/10"></div>
            <div className="absolute inset-0 m-auto h-[2px] w-[230px] bg-accent-purple/10"></div>

            {/* Diagonal Grid Lines matching the 230px diameter */}
            <div className="absolute inset-0 m-auto h-[230px] w-[2px] rotate-45 transform bg-accent-purple/5"></div>
            <div className="absolute inset-0 m-auto h-[230px] w-[2px] -rotate-45 transform bg-accent-purple/5"></div>

            {/* 3. Static Clip Wrapper for the Sweep to prevent subpixel edge repaints during rotation */}
            <div className="pointer-events-none absolute inset-0 m-auto h-[230px] w-[230px] overflow-hidden rounded-full">
                {/* Rotating Sweep Container (Square, no border-radius to optimize GPU texture rotation) */}
                <div
                    className="h-full w-full origin-center"
                    style={{
                        background:
                            'conic-gradient(from 0deg at 50% 50%, rgba(139, 92, 246, 0.18) 0deg, rgba(139, 92, 246, 0) 240deg)',
                        animation: 'spin 4s linear infinite',
                        willChange: 'transform',
                    }}
                >
                    {/* Thin bright radial line matching the 0deg of the gradient */}
                    <div className="absolute left-1/2 top-0 h-1/2 w-[2px] origin-bottom -translate-x-1/2 bg-gradient-to-b from-accent-purple/60 to-transparent"></div>
                </div>
            </div>

            {/* 4. Pulsing Alert Blips */}
            {alerts.map((alert, idx) => (
                <div
                    key={idx}
                    className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                    style={{
                        top: alert.top,
                        left: alert.left,
                    }}
                >
                    {/* Pulsing Outer Wave - with willChange to offload completely to GPU compositor layers */}
                    <div
                        className={`absolute h-full w-full rounded-full ${alert.pingColor} animate-ping`}
                        style={{
                            animationDuration: '2.5s',
                            animationDelay: alert.delay,
                            willChange: 'transform, opacity',
                        }}
                    ></div>
                    {/* Inner Glowing Core */}
                    <div
                        className={`absolute h-2 w-2 rounded-full ${alert.color} shadow-[0_0_8px_rgba(255,255,255,0.8)]`}
                    ></div>
                </div>
            ))}

            {/* 5. Center Radio Icon - positioned using the exact same absolute inset-0 m-auto system to guarantee perfect alignment */}
            <Radio className="absolute inset-0 z-10 m-auto h-[32px] w-[32px] text-accent-purple" />
        </div>
    );
});
