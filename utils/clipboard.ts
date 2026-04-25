export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e: unknown) {
        if (import.meta.env.DEV) console.error('Failed to copy text: ', e);
        return false;
    }
};
