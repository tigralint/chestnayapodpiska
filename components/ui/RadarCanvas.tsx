import { useEffect, useRef } from 'react';

export function RadarCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Use alpha: true because this sits on top of other content
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let rafId: number;
        let isRunning = true;
        let timeGlobal = 0;
        let lastRenderTime = performance.now();
        const TARGET_FPS = 20;
        const FRAME_TIME = 1000 / TARGET_FPS;

        // Setup high-dpi canvas
        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            const rect = parent.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            ctx.scale(dpr, dpr);
        };

        // Dots/Alerts configuration
        const alerts = [
            { cx: 0.25, cy: 0.25, r: 6, baser: 6, color: '239, 68, 68', phase: 0 }, // Red
            { cx: 0.75, cy: 0.66, r: 4, baser: 4, color: '52, 211, 153', phase: Math.PI }, // Emerald
            { cx: 0.75, cy: 0.50, r: 4, baser: 4, color: '251, 146, 60', phase: Math.PI / 2 }, // Orange
        ];

        const render = (time: number) => {
            if (!isRunning) return;
            rafId = requestAnimationFrame(render);

            if (time - lastRenderTime < FRAME_TIME) return;
            lastRenderTime = time;

            timeGlobal += 0.05; // Approx step for 20fps

            // We use rect from style width/height because we scaled ctx
            const w = parseInt(canvas.style.width || '0');
            const h = parseInt(canvas.style.height || '0');
            const cx = w / 2;
            const cy = h / 2;
            const maxR = Math.min(w, h) / 2;

            ctx.clearRect(0, 0, w, h);

            // 1. Draw Static Rings
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)'; // accent-purple / 20
            ctx.lineWidth = 1;

            ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2); ctx.stroke();

            ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.beginPath(); ctx.arc(cx, cy, maxR * 0.75, 0, Math.PI * 2); ctx.stroke();

            ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
            ctx.beginPath(); ctx.arc(cx, cy, maxR * 0.5, 0, Math.PI * 2); ctx.stroke();

            // 2. Draw animated pinging inner ring
            const pingProgress = (timeGlobal % 2) / 2; // loops every 2 seconds
            const pingR = (maxR * 0.25) + (pingProgress * maxR * 0.25);
            const pingAlpha = Math.max(0, 1 - (pingProgress * 2));

            ctx.fillStyle = `rgba(139, 92, 246, ${pingAlpha * 0.2})`; // bg-accent-purple/20
            ctx.beginPath();
            ctx.arc(cx, cy, pingR, 0, Math.PI * 2);
            ctx.fill();

            // 3. Draw pulsing alert dots
            for (const alert of alerts) {
                // Sine wave for pulsing size / opacity
                const pulse = (Math.sin(timeGlobal * 3 + alert.phase) + 1) / 2; // 0 to 1

                const px = alert.cx * w;
                const py = alert.cy * h;

                // Glow layer
                ctx.fillStyle = `rgba(${alert.color}, ${0.2 + pulse * 0.4})`;
                ctx.beginPath();
                ctx.arc(px, py, alert.baser * (1 + pulse * 1.5), 0, Math.PI * 2);
                ctx.fill();

                // Core dot
                ctx.fillStyle = `rgb(${alert.color})`;
                ctx.beginPath();
                ctx.arc(px, py, alert.baser, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        let isTabVisible = !document.hidden;
        let isIntersecting = true;

        const updateRunningState = () => {
            const shouldRun = isTabVisible && isIntersecting;
            if (shouldRun && !isRunning) {
                isRunning = true;
                lastRenderTime = performance.now();
                render(performance.now());
            } else if (!shouldRun && isRunning) {
                isRunning = false;
                cancelAnimationFrame(rafId);
            }
        };

        const handleVisibility = () => {
            isTabVisible = !document.hidden;
            updateRunningState();
        };

        const io = new IntersectionObserver(([entry]) => {
            if (entry) {
                isIntersecting = entry.isIntersecting;
                updateRunningState();
            }
        }, { threshold: 0 });
        io.observe(canvas);

        // Watch for containing element resize
        const observer = new ResizeObserver(() => resize());
        if (canvas.parentElement) observer.observe(canvas.parentElement);

        document.addEventListener('visibilitychange', handleVisibility);

        resize();
        render(performance.now());

        return () => {
            isRunning = false;
            cancelAnimationFrame(rafId);
            observer.disconnect();
            io.disconnect();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
        />
    );
}
