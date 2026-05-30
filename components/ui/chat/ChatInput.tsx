import { FormEvent, RefObject } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const SendIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
    </svg>
);

const ImageIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
);

const XIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

interface ChatInputProps {
    input: string;
    setInput: (v: string) => void;
    isLoading: boolean;
    captchaToken: string | null;
    setCaptchaToken: (v: string | null) => void;
    pendingImage: string | null;
    setPendingImage: (v: string | null) => void;
    errorMsg: string | null;
    isRequestingLimit: boolean;
    onSubmit: (e: FormEvent) => void;
    onRequestMoreLimits: () => void;
    onImageFile: (file: File) => void;
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    turnstileRef: RefObject<TurnstileInstance | null>;
    onSetError: (msg: string) => void;
}

export function ChatInput({
    input,
    setInput,
    isLoading,
    captchaToken,
    setCaptchaToken,
    pendingImage,
    setPendingImage,
    errorMsg,
    isRequestingLimit,
    onSubmit,
    onRequestMoreLimits,
    onImageFile,
    onPaste,
    fileInputRef,
    turnstileRef,
    onSetError,
}: ChatInputProps) {
    return (
        <>
            {/* Error Banner */}
            {errorMsg && (
                <div className="flex flex-col gap-2 border-t border-rose-500/20 bg-rose-500/10 px-4 py-3">
                    <span className="text-center text-xs text-rose-400">{errorMsg}</span>
                    {(errorMsg.toLowerCase().includes('лимит') || errorMsg.toLowerCase().includes('много')) && (
                        <button
                            onClick={onRequestMoreLimits}
                            disabled={isRequestingLimit}
                            className="w-full rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
                        >
                            {isRequestingLimit ? 'Отправка...' : 'Запросить больше запросов'}
                        </button>
                    )}
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-white/5 bg-slate-950/60 p-3 backdrop-blur-md">
                {/* Image Preview Strip */}
                {pendingImage && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                        <img src={pendingImage} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
                        <span className="flex-1 truncate text-xs text-slate-400">Изображение прикреплено</span>
                        <button
                            onClick={() => setPendingImage(null)}
                            className="p-1 text-slate-400 transition-colors hover:text-rose-400"
                            title="Убрать изображение"
                        >
                            <XIcon />
                        </button>
                    </div>
                )}
                <form onSubmit={onSubmit} className="relative flex gap-2">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onImageFile(file);
                            e.target.value = '';
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="p-2 text-slate-400 transition-colors hover:text-accent-cyan disabled:opacity-50"
                        title="Прикрепить изображение"
                    >
                        <ImageIcon />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={onPaste}
                        disabled={isLoading || !captchaToken}
                        placeholder={
                            isLoading
                                ? 'Ассистент печатает...'
                                : !captchaToken
                                  ? 'Проверка защиты от ботов...'
                                  : 'Опишите вашу ситуацию...'
                        }
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white placeholder-slate-400 shadow-inner transition-all focus:border-accent-cyan/50 focus:bg-white/10 focus:outline-none disabled:opacity-50 sm:text-sm"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || (!input.trim() && !pendingImage) || !captchaToken}
                        className="flex w-[50px] items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan to-cyan-400 text-slate-900 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:hover:shadow-none"
                    >
                        <SendIcon />
                    </button>
                </form>

                {/* Turnstile for Bot Protection */}
                <div className={captchaToken ? 'hidden' : 'mt-3 flex w-full justify-center'}>
                    <Turnstile
                        ref={turnstileRef}
                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                        onSuccess={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken('')}
                        onError={() => onSetError('Ошибка при проверке капчи. Обновите страницу.')}
                        options={{
                            action: 'chat',
                            theme: 'dark',
                            refreshExpired: 'manual',
                        }}
                    />
                </div>
            </div>
        </>
    );
}
