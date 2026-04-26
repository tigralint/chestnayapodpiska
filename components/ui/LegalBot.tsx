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
        isOpen, setIsOpen,
        messages, input, setInput,
        isLoading, errorMsg,
        captchaToken, setCaptchaToken,
        limits, isRequestingLimit,
        pendingImage, setPendingImage,
        handleSubmit, handleClearChat,
        handleRequestMoreLimits,
        handleImageFile, handlePaste,
        cleanText,
        messagesEndRef, fileInputRef, turnstileRef,
    } = useLegalBot();

    return (
        <div className="fixed bottom-28 md:bottom-8 right-4 md:right-8 z-50">
            {/* The Chat Window */}
            {isOpen && (
                <div role="dialog" aria-modal="true" aria-label="Юридический ИИ-ассистент" className="mb-4 w-[calc(100vw-2rem)] md:w-96 max-w-sm h-[500px] max-h-[70vh] flex flex-col bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(6,182,212,0.15)] animate-slide-up origin-bottom-right ring-1 ring-white/10">

                    <ChatHeader
                        limits={limits}
                        onClear={handleClearChat}
                        onClose={() => setIsOpen(false)}
                    />

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" aria-live="polite">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 mt-10 text-sm">
                                <div className="p-3 bg-white/5 rounded-2xl inline-block mt-3 border border-white/5">
                                    <BotIcon />
                                </div>
                                <p className="mt-3 text-white font-medium text-[15px]">Юридический ИИ-ассистент</p>
                                <p className="mt-1.5 opacity-70">Задайте мне вопрос о возврате за курсы или скрытые подписки.</p>
                                {limits && (
                                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                        <span className="text-[11px] font-medium tracking-wide uppercase">Осталось запросов: {limits.remaining}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {messages.map((msg) => (
                            <ChatMessage
                                key={msg.id}
                                message={msg}
                                isLoading={isLoading}
                                cleanText={cleanText}
                            />
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
                    className="flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all duration-300 bg-accent-cyan text-slate-900 w-14 h-14 rounded-full hover:scale-110 hover:shadow-cyan-500/40"
                    aria-label="Открыть юридический ИИ-ассистент"
                >
                    <BotIcon />
                </button>
            )}
        </div>
    );
}
