import { useState, useCallback, useRef } from 'react';

/** Maximum dimension (width or height) for image resize before sending to AI */
const IMAGE_RESIZE_MAX_PX = 1024;

/**
 * Handles image attachment for the chat: file reading, canvas resizing, and clipboard paste.
 */
export function useChatImage() {
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const MAX = IMAGE_RESIZE_MAX_PX;
                let w = img.width, h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) { if (import.meta.env.DEV) console.error('Failed to get canvas 2d context'); return; }
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setPendingImage(dataUrl);
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    }, []);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item) continue;
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) handleImageFile(file);
                e.preventDefault();
                return;
            }
        }
    }, [handleImageFile]);

    return { pendingImage, setPendingImage, handleImageFile, handlePaste, fileInputRef };
}
