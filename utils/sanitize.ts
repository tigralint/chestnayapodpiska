/**
 * Shared sanitization utilities for user input across API endpoints.
 * 
 * Two variants:
 * - sanitizeForPrompt(): aggressive stripping for LLM prompt injection defense
 * - sanitizeForStorage(): lightweight stripping for data stored in Redis/Telegram
 */

/**
 * Strips characters that could be used for prompt injection.
 * Removes XML/HTML tags, instruction-like patterns, bracket characters,
 * Unicode fullwidth equivalents, markdown heading injections, and delimiter patterns.
 * 
 * This is a defense-in-depth layer — the primary protection is prompt structure
 * (e.g. <user_input> tags in promptBuilder.ts).
 */
export function sanitizeForPrompt(input: string, maxLength = 200): string {
    return input
        .slice(0, maxLength)
        .replace(/\n/g, ' ')                                      // Flatten newlines
        .replace(/<\/?[a-z_][a-z0-9_]*>/gi, '')                    // Strip XML/HTML tags
        .replace(/\b(SYSTEM|ASSISTANT|INSTRUCTION|IGNORE|PROMPT|USER|HUMAN)\b/gi, '')  // Strip instruction keywords
        .replace(/[\uFF00-\uFFEF]/g, '')                           // Strip fullwidth Unicode characters (bypass attempts)
        .replace(/^#{1,6}\s/gm, '')                                // Strip markdown headings (injection via # NEW INSTRUCTIONS)
        .replace(/^-{3,}$/gm, '')                                  // Strip markdown horizontal rules (delimiter injection)
        .replace(/[{}[\]<>]/g, '')                                  // Remove brackets
        .replace(/\s{2,}/g, ' ')                                   // Collapse multiple spaces
        .trim();
}

/**
 * Lightweight sanitization for user data stored in Redis or sent to Telegram.
 * Only strips HTML/XML tags to prevent markup injection.
 */
export function sanitizeForStorage(input: string, maxLength = 2000): string {
    return input
        .slice(0, maxLength)
        .replace(/<\/?[a-z_][a-z0-9_]*>/gi, '') // Strip XML/HTML tags
        .trim();
}
