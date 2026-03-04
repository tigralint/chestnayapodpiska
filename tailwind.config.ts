import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './index.html',
        './*.{ts,tsx}',
        './views/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './components/**/**/*.{ts,tsx}',
        './hooks/**/*.{ts,tsx}',
        './data/**/*.{ts,tsx}',
        './context/**/*.{ts,tsx}',
    ],
    safelist: [
        'bg-accent-cyan/10', 'bg-accent-cyan/20', 'bg-accent-purple/10', 'bg-accent-purple/20',
        'border-accent-cyan/20', 'border-accent-purple/20', 'border-accent-cyan/40', 'border-accent-purple/40', 'border-accent-cyan/50', 'border-accent-purple/50',
        'from-accent-cyan/10', 'from-accent-purple/10', 'to-accent-cyan/5', 'to-accent-blue/5', 'to-accent-purple/5',
        'focus:ring-accent-cyan/30', 'focus:ring-accent-purple/30', 'focus:ring-accent-cyan/50', 'focus:ring-accent-purple/50',
        'text-accent-cyan', 'text-accent-purple', 'border-y-2', 'border-x-2'
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
                mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
            },
            colors: {
                app: {
                    bg: '#05050A',
                },
                glass: {
                    50: 'rgba(255, 255, 255, 0.01)',
                    100: 'rgba(255, 255, 255, 0.03)',
                    200: 'rgba(255, 255, 255, 0.05)',
                    300: 'rgba(255, 255, 255, 0.08)',
                    border: 'rgba(255, 255, 255, 0.1)',
                    borderHighlight: 'rgba(255, 255, 255, 0.2)',
                },
                accent: {
                    cyan: '#00f2fe',
                    blue: '#4facfe',
                    purple: '#8b5cf6',
                    pink: '#ec4899',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                'button-glow': 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
            },
            animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                'slide-up': 'slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                'pop-in': 'popIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                'blob': 'blob 40s infinite alternate cubic-bezier(0.4, 0, 0.6, 1)',
                'spin-slow': 'spin 8s linear infinite',
                'spin-reverse': 'spin 3s linear infinite reverse',
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                'gradient-shift': 'gradientShift 5s ease infinite',
                'float': 'float 3s ease-in-out infinite',
                'magic-pulse': 'magicPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'scale(0.97) translateY(10px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(40px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                popIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '50%': { transform: 'scale(1.02)', opacity: '1' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(15px, -20px) scale(1.05)' },
                    '66%': { transform: 'translate(-10px, 10px) scale(0.95)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                shake: {
                    '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(4px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-8px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(8px, 0, 0)' },
                },
                gradientShift: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                magicPulse: {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '.8', transform: 'scale(1.1)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
