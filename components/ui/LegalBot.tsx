import { useEffect, useRef, useCallback } from 'react';
import { useLegalBot } from '../../hooks/useLegalBot';
import { ChatHeader, BotIcon } from './chat/ChatHeader';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';

/**
 * Floating AI Legal Assistant chat widget.
 *
 * Refactored from a 525-line monolith into a thin composition layer:
 * - Business logic → useLegalBot hook
 * - UI → ChatHeader, ChatMessage, ChatInput subcomponents
 */
export function LegalBot() {
    const {
        isOpen,
        setIsOpen,
        messages,
        input,
        setInput,
        isLoading,
        errorMsg,
        captchaToken,
        setCaptchaToken,
        limits,
        isRequestingLimit,
        pendingImage,
        setPendingImage,
        handleSubmit,
        handleClearChat,
        handleRequestMoreLimits,
        handleImageFile,
        handlePaste,
        cleanText,
        messagesEndRef,
        fileInputRef,
        turnstileRef,
    } = useLegalBot();

    const dialogRef = useRef<HTMLDivElement>(null);

    // Focus trap: move focus into dialog on open, close on Escape
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                return;
            }
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (!first || !last) return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        },
        [setIsOpen]
    );

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', handleKeyDown);
        // Focus the dialog on open
        requestAnimationFrame(() => dialogRef.current?.focus());
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    return (
        <div className="fixed bottom-28 right-4 z-50 md:bottom-8 md:right-8">
            {/* The Chat Window */}
            {isOpen && (
                <div
                    ref={dialogRef}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Юридический ИИ-ассистент"
                    className="mb-4 flex h-[500px] max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm origin-bottom-right animate-slide-up flex-col overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40 shadow-[0_8px_32px_rgba(6,182,212,0.15)] outline-none ring-1 ring-white/10 backdrop-blur-3xl md:w-96"
                >
                    <ChatHeader limits={limits} onClear={handleClearChat} onClose={() => setIsOpen(false)} />

                    {/* Messages Area */}
                    <div
                        className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1 space-y-4 overflow-y-auto p-4"
                        aria-live="polite"
                    >
                        {messages.length === 0 && (
                            <div className="mt-10 text-center text-sm text-slate-400">
                                <div className="mt-3 inline-block rounded-2xl border border-white/5 bg-white/5 p-3">
                                    <BotIcon />
                                </div>
                                <p className="mt-3 text-[15px] font-medium text-white">Юридический ИИ-ассистент</p>
                                <p className="mt-1.5 opacity-70">
                                    Задайте мне вопрос о возврате за курсы или скрытые подписки.
                                </p>
                                {limits && (
                                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
                                        <span className="text-[11px] font-medium uppercase tracking-wide">
                                            Осталось запросов: {limits.remaining}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-6 rounded-2xl border border-red-500/10 bg-red-500/5 p-3 text-left">
                                    <p className="text-[11px] leading-relaxed text-slate-400">
                                        <strong className="font-semibold text-red-400/80">Внимание:</strong> Бот
                                        использует ИИ и может ошибаться. Он не заменяет профессионального юриста.
                                    </p>
                                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                                        Отправляя сообщение, вы соглашаетесь с{' '}
                                        <a href="/privacy" target="_blank" className="text-cyan-400/80 hover:underline">
                                            Политикой конфиденциальности
                                        </a>
                                        . Пожалуйста, <strong>не присылайте</strong> персональные данные (паспорта,
                                        номера карт, ФИО).
                                    </p>
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} isLoading={isLoading} cleanText={cleanText} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <ChatInput
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        captchaToken={captchaToken}
                        setCaptchaToken={setCaptchaToken}
                        pendingImage={pendingImage}
                        setPendingImage={setPendingImage}
                        errorMsg={errorMsg}
                        isRequestingLimit={isRequestingLimit}
                        onSubmit={handleSubmit}
                        onRequestMoreLimits={handleRequestMoreLimits}
                        onImageFile={handleImageFile}
                        onPaste={handlePaste}
                        fileInputRef={fileInputRef}
                        turnstileRef={turnstileRef}
                        onSetError={() => {}}
                    />
                </div>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-cyan text-slate-900 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/40"
                    aria-label="Открыть юридический ИИ-ассистент"
                >
                    <BotIcon />
                </button>
            )}
        </div>
    );
}
