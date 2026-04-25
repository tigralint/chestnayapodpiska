export const fuzzyMatch = (query: string, text: string): boolean => {
    const q = query.toLowerCase().trim();
    const t = text.toLowerCase();

    if (!q) return false;
    if (t.includes(q)) return true; // Direct substring

    // Subsequence match check
    let qIdx = 0;
    for (let i = 0; i < t.length; i++) {
        if (t[i] === q[qIdx]) qIdx++;
        if (qIdx === q.length) return true;
    }

    // Levenshtein distance against individual words to allow 1-2 typos
    const words = t.split(/[\s-]+/);
    for (const word of words) {
        if (Math.abs(word.length - q.length) > 2) continue;
        const dp: number[][] = Array.from({ length: word.length + 1 }, () =>
            Array.from({ length: q.length + 1 }, () => 0)
        );
        for (let i = 0; i <= word.length; i++) (dp[i] as number[])[0] = i;
        for (let j = 0; j <= q.length; j++) (dp[0] as number[])[j] = j;
        for (let i = 1; i <= word.length; i++) {
            for (let j = 1; j <= q.length; j++) {
                const cost = word[i - 1] === q[j - 1] ? 0 : 1;
                (dp[i] as number[])[j] = Math.min(
                    ((dp[i - 1] as number[])[j] ?? 0) + 1,
                    ((dp[i] as number[])[j - 1] ?? 0) + 1,
                    ((dp[i - 1] as number[])[j - 1] ?? 0) + cost
                );
            }
        }
        const dist = (dp[word.length] as number[])[q.length] ?? Infinity;
        if (dist <= (q.length > 4 ? 2 : 1)) return true;
    }
    return false;
};
