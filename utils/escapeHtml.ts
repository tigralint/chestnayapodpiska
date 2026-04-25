/**
 * Escapes HTML special characters for safe embedding in Telegram HTML messages.
 * Must be applied to ALL user-provided strings before inserting them into
 * `parse_mode: 'HTML'` Telegram payloads.
 */
export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
